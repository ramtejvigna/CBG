import { useCodeExecutionStore } from '../lib/store/codeExecutionStore';

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  runtime: number;
  memory: number;
  error?: string;
  status: string;
  testCaseId: string;
}

interface ExecutionResult {
  success: boolean;
  testResults: TestResult[];
  runtime: number;
  memory: number;
  allPassed: boolean;
  passedTests: number;
  totalTests: number;
  compilationError: boolean;
  status: string;
  message?: string;
}

interface UseCodeExecutionReturn {
  executeCode: (code: string, language: string, challengeId: string, isSubmission?: boolean, testCaseId?: string) => Promise<ExecutionResult>;
  isExecuting: boolean;
  error: string | null;
  lastResult: ExecutionResult | null;
  clearResult: () => void;
}

export const useCodeExecution = (): UseCodeExecutionReturn => {
  const {
    isExecuting,
    error,
    lastResult,
    executeCode,
    clearResult
  } = useCodeExecutionStore();

  return {
    executeCode,
    isExecuting,
    error,
    lastResult,
    clearResult
  };
};

export default useCodeExecution;