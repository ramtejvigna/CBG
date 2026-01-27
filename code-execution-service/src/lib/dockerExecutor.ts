import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execPromise = promisify(exec);

// Submission status enum (matching Prisma)
export enum SubmissionStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    WRONG_ANSWER = 'WRONG_ANSWER',
    TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
    MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
    RUNTIME_ERROR = 'RUNTIME_ERROR',
    COMPILATION_ERROR = 'COMPILATION_ERROR'
}

// Define supported languages and their configurations
interface LanguageConfig {
    extension: string;
    compileCommand?: string;
    executeCommand: string;
    versionCommand: string;
    timeout: number;
}

interface ExecutionResult {
    status: SubmissionStatus;
    output: string;
    error?: string | undefined;
    runtime?: number | undefined;
    memory?: number | undefined;
    passed?: boolean | undefined;
}

const LANGUAGES: Record<string, LanguageConfig> = {
    'javascript': {
        extension: 'js',
        executeCommand: 'node',
        versionCommand: 'node --version',
        timeout: 10,
    },
    'typescript': {
        extension: 'ts',
        compileCommand: 'tsc',
        executeCommand: 'node',
        versionCommand: 'node --version && tsc --version',
        timeout: 10,
    },
    'python': {
        extension: 'py',
        executeCommand: 'python3',
        versionCommand: 'python3 --version',
        timeout: 10,
    },
    'java': {
        extension: 'java',
        compileCommand: 'javac',
        executeCommand: 'java',
        versionCommand: 'java -version',
        timeout: 15,
    },
    'c++': {
        extension: 'cpp',
        compileCommand: 'g++',
        executeCommand: './',
        versionCommand: 'g++ --version',
        timeout: 10,
    },
    'c': {
        extension: 'c',
        compileCommand: 'gcc',
        executeCommand: './',
        versionCommand: 'gcc --version',
        timeout: 10,
    },
    'go': {
        extension: 'go',
        compileCommand: 'go build',
        executeCommand: './',
        versionCommand: 'go version',
        timeout: 10,
    },
    'rust': {
        extension: 'rs',
        compileCommand: 'rustc',
        executeCommand: './',
        versionCommand: 'rustc --version',
        timeout: 10,
    },
    'ruby': {
        extension: 'rb',
        executeCommand: 'ruby',
        versionCommand: 'ruby --version',
        timeout: 10,
    },
};

// Create temporary directories for code execution
const TMP_DIR = process.env.TMP_DIR || path.join(process.cwd(), 'tmp');

// Ensure tmp directory exists
async function ensureTmpDir() {
    try {
        await fs.mkdir(TMP_DIR, { recursive: true });
        await fs.chmod(TMP_DIR, 0o777);
    } catch (error) {
        console.error('Error creating tmp directory:', error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'EACCES') {
            throw new Error(`Permission denied: Cannot create or access directory '${TMP_DIR}'.`);
        }
        throw error;
    }
}

export class DockerExecutor {
    private async createExecutionDirectory(
        language: string,
        code: string,
        input: string
    ): Promise<string> {
        const executionId = crypto.randomBytes(16).toString('hex');
        const executionDir = path.join(TMP_DIR, executionId);

        await fs.mkdir(executionDir, { recursive: true });

        const langConfig = LANGUAGES[language.toLowerCase()];
        if (!langConfig) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const extension = langConfig.extension;

        // Special case for Java
        let filename = `solution.${extension}`;
        let className = 'Solution';

        if (language.toLowerCase() === 'java') {
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            if (classMatch && classMatch[1]) {
                className = classMatch[1];
                filename = `${className}.java`;
            } else {
                code = code.replace(/class\s+\w+/, `class ${className}`);
            }
        }

        await fs.writeFile(path.join(executionDir, filename), code);
        await fs.writeFile(path.join(executionDir, 'input.txt'), input);

        return executionDir;
    }

    private async cleanupDirectory(directory: string): Promise<void> {
        try {
            await fs.rm(directory, { recursive: true, force: true });
        } catch (error) {
            console.error(`Error cleaning up directory ${directory}:`, error);
        }
    }

    public async execute(
        code: string,
        language: string,
        input: string,
        expectedOutput: string,
        timeLimit: number = 10,
        memoryLimit: number = 512
    ): Promise<ExecutionResult> {
        await ensureTmpDir();

        const startTime = Date.now();

        let executionDir: string;
        try {
            executionDir = await this.createExecutionDirectory(language, code, input);
        } catch (error) {
            return {
                status: SubmissionStatus.COMPILATION_ERROR,
                output: '',
                error: `Error creating execution directory: ${error instanceof Error ? error.message : String(error)}`,
                runtime: 0,
                memory: 0,
                passed: false
            };
        }

        const langConfig = LANGUAGES[language.toLowerCase()];
        if (!langConfig) {
            await this.cleanupDirectory(executionDir);
            return {
                status: SubmissionStatus.COMPILATION_ERROR,
                output: '',
                error: `Unsupported language: ${language}`,
                runtime: 0,
                memory: 0,
                passed: false
            };
        }

        try {
            const containerId = path.basename(executionDir);
            const hostPath = executionDir;

            // Build Docker command with resource constraints
            const dockerCommand = `docker run --rm --name code-exec-${containerId} \
        --network none \
        --cpus=1 \
        --memory=${memoryLimit}m \
        --memory-swap=${memoryLimit}m \
        --pids-limit=50 \
        --security-opt=no-new-privileges \
        -v "${hostPath}:/code" \
        -w /code \
        --user 1000:1000 \
        code-execution-sandbox:latest \
        /bin/bash -c "timeout ${langConfig.timeout}s /execute-${language.toLowerCase()}.sh"`;

            const { stdout, stderr } = await execPromise(dockerCommand, {
                timeout: (timeLimit + 5) * 1000 // Add buffer for Docker overhead
            });

            const endTime = Date.now();
            const runtime = endTime - startTime;

            const output = stdout.trim();
            const passed = output === expectedOutput.trim();

            let status: SubmissionStatus;
            if (stderr && stderr.includes('timeout')) {
                status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
            } else if (stderr && stderr.includes('memory')) {
                status = SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
            } else if (stderr && (stderr.includes('error:') || stderr.includes('Error:') || stderr.includes('cannot find symbol') || stderr.includes('expected'))) {
                status = SubmissionStatus.COMPILATION_ERROR;
            } else if (stderr) {
                status = SubmissionStatus.RUNTIME_ERROR;
            } else {
                status = passed ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;
            }

            return {
                status,
                output,
                error: stderr || undefined,
                runtime,
                memory: Math.floor(Math.random() * 50) + 10, // TODO: Actual memory tracking
                passed
            };
        } catch (error) {
            let errorMessage: string;
            if (error && typeof error === 'object' && 'stderr' in error) {
                errorMessage = String((error as any).stderr);
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }

            const isCompilationError = errorMessage.includes('compile') ||
                errorMessage.includes('syntax') ||
                errorMessage.includes('Cannot find') ||
                errorMessage.includes('not found') ||
                errorMessage.includes('error:') ||
                errorMessage.includes('Error:') ||
                errorMessage.includes('cannot find symbol') ||
                errorMessage.includes('expected');

            return {
                status: isCompilationError ? SubmissionStatus.COMPILATION_ERROR : SubmissionStatus.RUNTIME_ERROR,
                output: '',
                error: errorMessage,
                runtime: Date.now() - startTime,
                memory: 0,
                passed: false
            };
        } finally {
            await this.cleanupDirectory(executionDir);
        }
    }
}

export const dockerExecutor = new DockerExecutor();
