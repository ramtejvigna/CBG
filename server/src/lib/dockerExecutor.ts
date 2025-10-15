import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import { SubmissionStatus } from '@prisma/client';

const execPromise = promisify(exec);

// Define supported languages and their configurations
interface LanguageConfig {
    extension: string;
    compileCommand?: string; // Optional for interpreted languages
    executeCommand: string;
    versionCommand: string;
    timeout: number; // In seconds
}

interface ExecutionResult {
    status: SubmissionStatus;
    output: string;
    error?: string | undefined;
    runtime?: number | undefined; // in ms
    memory?: number | undefined; // in KB
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
const TMP_DIR = process.env.DOCKER_CONTAINER == 'true' ? '/app/tmp' : path.join(process.cwd(), 'tmp');

// Ensure tmp directory exists
async function ensureTmpDir() {
    try {
        await fs.mkdir(TMP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating tmp directory:', error);
        throw error;
    }
}

export class DockerExecutor {
    private async createExecutionDirectory(
        language: string,
        code: string,
        input: string
    ): Promise<string> {
        // Create a unique ID for this execution
        const executionId = crypto.randomBytes(16).toString('hex');
        const executionDir = path.join(TMP_DIR, executionId);

        // Create the execution directory
        await fs.mkdir(executionDir, { recursive: true });

        // Get the language configuration
        const langConfig = LANGUAGES[language.toLowerCase()];
        if (!langConfig) {
            throw new Error(`Unsupported language: ${language}`);
        }

        // Determine the appropriate filename
        const extension = langConfig.extension;

        // Special case for Java as the class name must match the filename
        let filename = `solution.${extension}`;
        let className = 'Solution';

        if (language.toLowerCase() === 'java') {
            // Extract the public class name from the code
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            if (classMatch && classMatch[1]) {
                className = classMatch[1];
                filename = `${className}.java`;
            } else {
                // If no public class is found, use Solution as default
                code = code.replace(/class\s+\w+/, `class ${className}`);
            }
        }

        // Write the code file
        await fs.writeFile(path.join(executionDir, filename), code);

        // Write the input file
        await fs.writeFile(path.join(executionDir, 'input.txt'), input);

        // Debug: List files in the execution directory
        const files = await fs.readdir(executionDir);
        console.log(`Files in execution directory ${executionDir}:`, files);

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
        timeLimit: number = 10, // seconds
        memoryLimit: number = 512 // MB
    ): Promise<ExecutionResult> {
        // Ensure tmp directory exists
        await ensureTmpDir();

        // Start measuring execution time
        const startTime = Date.now();

        // Create a directory for this execution
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

        // Get the language configuration
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
            // Determine the container name based on execution directory
            const containerId = path.basename(executionDir);

            // Handle Docker-in-Docker scenario and path mapping
            let hostPath: string;
            const isInDockerContainer = process.env.DOCKER_CONTAINER == 'true';

            if (isInDockerContainer) {
                // Use the actual executionDir inside the container
                hostPath = executionDir;
            } else {
                // For direct host execution, use the original path for Windows
                // Windows Docker Desktop handles Windows paths natively
                hostPath = executionDir;
            }

            // Build the Docker command with resource constraints
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

            // Execute the code in Docker
            const { stdout, stderr } = await execPromise(dockerCommand);

            // Calculate execution time
            const endTime = Date.now();
            const runtime = endTime - startTime;

            // Parse the output
            const output = stdout.trim();

            // Check if the output matches the expected output
            const passed = output === expectedOutput.trim();

            // Determine the status
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

            // Return the result
            return {
                status,
                output,
                error: stderr || undefined,
                runtime,
                memory: Math.floor(Math.random() * 50) + 10, // Mock memory usage
                passed
            };
        } catch (error) {
            let errorMessage: string;
            if (error && typeof error === 'object' && 'stderr' in error) {
                errorMessage = String(error.stderr);
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }

            // Determine if it's a compilation error or runtime error
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

// Create and export an instance of the Docker executor
export const dockerExecutor = new DockerExecutor();
