import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSessionToken } from '../auth'

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

interface CodeExecutionState {
  isExecuting: boolean
  lastResult: ExecutionResult | null
  error: string | null
  setIsExecuting: (isExecuting: boolean) => void
  setLastResult: (result: ExecutionResult | null) => void
  setError: (error: string | null) => void
  executeCode: (code: string, language: string, challengeId: string, isSubmission?: boolean, testCaseId?: string, contestId?: string) => Promise<ExecutionResult>
  clearResult: () => void
}

export const useCodeExecutionStore = create<CodeExecutionState>()(
  persist(
    (set, get) => ({
      isExecuting: false,
      lastResult: null,
      error: null,
      setIsExecuting: (isExecuting: boolean) => set({ isExecuting }),
      setLastResult: (result: ExecutionResult | null) => set({ lastResult: result }),
      setError: (error: string | null) => set({ error }),
      clearResult: () => set({ lastResult: null, error: null }),

      executeCode: async (
        code: string,
        language: string,
        challengeId: string,
        isSubmission: boolean = false,
        testCaseId?: string,
        contestId?: string
      ): Promise<ExecutionResult> => {
        const { setIsExecuting, setError, setLastResult } = get()
        
        setIsExecuting(true)
        setError(null)

        try {
          const token = getSessionToken()
          let userId = null

          // Get user ID from token if available for submissions
          if (token && isSubmission) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]))
              console.log(payload.userId)
              userId = payload.userId
            } catch {
              console.warn('Could not extract user ID from token')
            }
          }

          const requestBody = {
            code,
            language,
            challengeId,
            isSubmission,
            ...(testCaseId && { testCaseId }),
            ...(userId && { userId }),
            ...(contestId && { contestId })
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(requestBody)
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || 'Execution failed')
          }

          setLastResult(data)
          return data
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Code execution failed'
          setError(errorMessage)
          throw new Error(errorMessage)
        } finally {
          setIsExecuting(false)
        }
      },
    }),
    {
      name: 'code-execution-storage',
      partialize: (state) => ({ 
        lastResult: state.lastResult 
      }),
    }
  )
)