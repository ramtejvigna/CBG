import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Mock code execution service - in a real app, you'd integrate with a code execution service
// like Judge0, Sphere Engine, or build your own sandboxed execution environment
export const executeCode = async (req: Request, res: Response) => {
    try {
        const { 
            code, 
            language, 
            challengeId, 
            testCaseId, 
            isSubmission, 
            userId 
        } = req.body;

        // Validate required fields
        if (!code || !language || !challengeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: code, language, challengeId' 
            });
        }

        // Get challenge with test cases
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
            include: {
                testCases: true,
                languages: true
            }
        });

        if (!challenge) {
            return res.status(404).json({ 
                success: false, 
                message: 'Challenge not found' 
            });
        }

        // Find language
        const challengeLanguage = challenge.languages.find(
            lang => lang.name.toLowerCase() === language.toLowerCase()
        );

        if (!challengeLanguage) {
            return res.status(400).json({ 
                success: false, 
                message: `Language ${language} is not supported for this challenge` 
            });
        }

        let testCases;
        
        if (isSubmission) {
            // For submissions, test against all test cases
            testCases = challenge.testCases;
        } else {
            // For running code, test against specific test case or first visible one
            if (testCaseId) {
                testCases = challenge.testCases.filter(tc => tc.id === testCaseId);
            } else {
                testCases = challenge.testCases.filter(tc => !tc.isHidden).slice(0, 1);
            }
        }

        if (testCases.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No test cases available' 
            });
        }

        // Simulate code execution (replace this with actual execution logic)
        const testResults = testCases.map(testCase => {
            // Mock execution logic
            const mockResult = simulateCodeExecution(code, language, testCase.input, testCase.output);
            return {
                input: testCase.input,
                expectedOutput: testCase.output,
                actualOutput: mockResult.output,
                passed: mockResult.passed,
                runtime: mockResult.runtime,
                memory: mockResult.memory,
                testCaseId: testCase.id
            };
        });

        // Calculate overall results
        const passedTests = testResults.filter(result => result.passed).length;
        const totalTests = testResults.length;
        const allPassed = passedTests === totalTests;
        const avgRuntime = Math.round(testResults.reduce((sum, result) => sum + (result.runtime || 0), 0) / testResults.length);
        const avgMemory = Math.round(testResults.reduce((sum, result) => sum + (result.memory || 0), 0) / testResults.length);

        // If this is a submission and user is provided, save it
        if (isSubmission && userId && allPassed) {
            try {
                await prisma.submission.create({
                    data: {
                        userId: userId,
                        challengeId: challengeId,
                        code: code,
                        languageId: challengeLanguage.id,
                        status: allPassed ? 'ACCEPTED' : 'WRONG_ANSWER',
                        runtime: avgRuntime,
                        memory: avgMemory,
                        testResults: testResults
                    }
                });
            } catch (dbError) {
                console.error('Error saving submission:', dbError);
                // Don't fail the request if submission saving fails
            }
        }

        res.json({
            success: true,
            testResults,
            runtime: avgRuntime,
            memory: avgMemory,
            allPassed,
            passedTests,
            totalTests,
            compilationError: false
        });

    } catch (error) {
        console.error('Error executing code:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Mock code execution function - replace with actual execution service
function simulateCodeExecution(code: string, language: string, input: string, expectedOutput: string) {
    
    const mockRuntime = Math.floor(Math.random() * 100) + 10; // 10-110ms
    const mockMemory = Math.floor(Math.random() * 50) + 10; // 10-60MB
    
    // Simple mock logic - in real implementation, this would be actual code execution
    const codeLength = code.length;
    const inputLength = input.length;
    
    // Mock some basic success/failure logic
    const mockSuccess = codeLength > 50 && !code.includes('error') && !code.includes('throw');
    
    return {
        output: mockSuccess ? expectedOutput : `Mock output for input: ${input}`,
        passed: mockSuccess,
        runtime: mockRuntime,
        memory: mockMemory,
        error: null
    };
}