import { useState } from 'react';
import { authenticatedApiRequest } from '../lib/config';

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
}

export const useCodeExecution = (): UseCodeExecutionReturn => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCode = async (
    code: string,
    language: string,
    challengeId: string,
    isSubmission: boolean = false,
    testCaseId?: string
  ): Promise<ExecutionResult> => {
    setIsExecuting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth-token');
      let userId = null;

      // Get user ID from token if available for submissions
      if (token && isSubmission) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
        } catch (err) {
          console.warn('Could not extract user ID from token');
        }
      }

      const requestBody = {
        code,
        language,
        challengeId,
        isSubmission,
        ...(testCaseId && { testCaseId }),
        ...(userId && { userId })
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Execution failed');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code execution failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    executeCode,
    isExecuting,
    error
  };
};

export default useCodeExecution;