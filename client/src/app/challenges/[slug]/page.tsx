"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Split from "react-split"
import { useTheme } from "@/context/ThemeContext"
import { useProfileStore } from "@/lib/store/profileStore"
import {
    ChevronLeft,
    Share,
    Star,
    ThumbsUp,
    ThumbsDown,
    Play,
    Upload,
    RotateCcw,
    CheckCircle,
    XCircle,
    Clock,
    Database,
} from "lucide-react"
import Loader from "@/components/Loader"
import CodeEditor from "@/components/CodeEditor"
import Link from "next/link"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types
interface TestCase {
    id: string
    input: string
    output: string
    isHidden: boolean
    explanation?: string
}

interface Language {
    id: string
    name: string
}

interface Submission {
    id: string
    code: string
    status: string
    runtime: number | null
    memory: number | null
    score: number
    createdAt: string
    language: {
        name: string
    }
}

interface Challenge {
    id: string
    title: string
    slug: string
    description: string
    difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT"
    points: number
    category: { name: string }
    testCases: TestCase[]
    likes: number
    dislikes: number
    submissions: number
    timeLimit: number
    memoryLimit: number
    creator: {
        id: string
        username: string
        image?: string
    }
    submissionStats: {
        avgRuntime: number
        avgMemory: number
    }
}

interface TestResult {
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
    runtime?: number
    memory?: number
}

// Helper function to extract ID from slug
const extractIdFromSlug = (slug: string): string => {
    // Assuming slug format is "challenge-title-slug-{id}"
    const parts = slug.split("-")
    const lastPart = parts[parts.length - 1]

    return lastPart
}

const MOCK_LANGUAGES = [
    { name: "javascript", displayName: "JavaScript" },
    { name: "python", displayName: "Python" },
    { name: "java", displayName: "Java" },
    { name: "cpp", displayName: "C++" },
]

const MOCK_CHALLENGE = {
    id: "1",
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]

**Example 3:**
Input: nums = [3,3], target = 6
Output: [0,1]`,
    testCases: [
        {
            id: "1",
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            isHidden: false,
        },
        {
            id: "2",
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            isHidden: false,
        },
        {
            id: "3",
            input: "nums = [3,3], target = 6",
            output: "[0,1]",
            isHidden: true,
        },
    ],
}

const MOCK_SUBMISSIONS = [
    {
        id: "1",
        code: "// Mock code",
        status: "WRONG_ANSWER",
        language: { name: "javascript" },
        createdAt: "2024-01-15T10:30:00Z",
        runtime: 85,
        memory: 42.1,
        score: 0,
    },
    {
        id: "2",
        code: "// Mock code",
        status: "ACCEPTED",
        language: { name: "python" },
        createdAt: "2024-01-15T11:15:00Z",
        runtime: 68,
        memory: 38.9,
        score: 100,
    },
]

const ChallengePage = () => {
    const { slug } = useParams()
    const { theme } = useTheme()
    const { userData } = useProfileStore()

    // Extract ID from slug
    const challengeId = slug ? extractIdFromSlug(slug as string) : null

    const isDark = theme === "dark"
    // State
    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedLanguage, setSelectedLanguage] = useState<string>()
    const [code, setCode] = useState<string>("")
    const [languages, setLanguages] = useState<Language[]>([])
    const [testResults, setTestResults] = useState<TestResult[] | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
    const [runtime, setRuntime] = useState<number | null>(null)
    const [memory, setMemory] = useState<number | null>(null)
    const [consoleHeight, setConsoleHeight] = useState(200)
    const [isConsoleExpanded, setIsConsoleExpanded] = useState(false)
    const [activeConsoleTab, setActiveConsoleTab] = useState("testcase")
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [submissionsLoading, setSubmissionsLoading] = useState(false)

    // Determine if challenge is solved (accepted submission exists or current submission accepted)
    const hasAcceptedSubmission = submissions.some((s) => s.status === "ACCEPTED")
    const isSolved = submissionStatus === "ACCEPTED" || hasAcceptedSubmission

    useEffect(() => {
        const loadStaticData = () => {
            if (!challengeId) return

            setLoading(true)

            // Simulate API delay
            setTimeout(() => {
                setChallenge(MOCK_CHALLENGE as any)
                setLanguages(MOCK_LANGUAGES as any)
                setSubmissions(MOCK_SUBMISSIONS as any)

                if (MOCK_LANGUAGES.length > 0) {
                    setSelectedLanguage(MOCK_LANGUAGES[0].name)
                }

                // Verify the slug matches the challenge
                if (MOCK_CHALLENGE.slug && slug !== MOCK_CHALLENGE.slug) {
                    window.history.replaceState(null, "", `/challenge/${MOCK_CHALLENGE.slug}`)
                }

                setLoading(false)
            }, 500)
        }

        if (challengeId) {
            loadStaticData()
        }
    }, [challengeId, slug])

    const fetchSubmissions = async () => {
        if (!challengeId || !userData) return

        setSubmissionsLoading(true)

        // Simulate API delay
        setTimeout(() => {
            setSubmissions(MOCK_SUBMISSIONS as any)
            setSubmissionsLoading(false)
        }, 300)
    }

    // Handle language change
    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const langName = e.target.value
        setSelectedLanguage(langName)
        setCode("")
    }

    const handleRunCode = async () => {
        if (!challenge || !selectedLanguage) return

        setIsRunning(true)
        setTestResults(null)
        setRuntime(null)
        setMemory(null)
        setActiveConsoleTab("testcase")

        try {
            const testCase = challenge.testCases?.[0]
            if (!testCase) {
                toast.error("No test cases available to run")
                return
            }

            // Simulate API delay and mock results
            setTimeout(() => {
                const mockResults = [
                    {
                        input: "nums = [2,7,11,15], target = 9",
                        expectedOutput: "[0,1]",
                        actualOutput: "[0,1]",
                        passed: true,
                        runtime: 45,
                        memory: 10,
                    },
                    {
                        input: "nums = [3,2,4], target = 6",
                        expectedOutput: "[1,2]",
                        actualOutput: "[2,1]",
                        passed: false,
                        runtime: 52,
                        memory: 12,
                    },
                ]

                setTestResults(mockResults as any)
                setRuntime(Math.floor(Math.random() * 100) + 50)
                setMemory(Math.floor(Math.random() * 20) + 30)
                setIsRunning(false)

                toast.success("Code executed successfully")
            }, 1500)
        } catch (error) {
            console.error("Error running code:", error)
            toast.error("Failed to run code")
            setIsRunning(false)
        }
    }

    const handleSubmitSolution = async () => {
        if (!challenge || !selectedLanguage || !userData) return

        setIsSubmitting(true)
        setSubmissionStatus(null)
        setActiveConsoleTab("result")

        try {
            // Simulate submission processing
            setTimeout(() => {
                const isAccepted = Math.random() > 0.3 // 70% chance of acceptance
                const status = isAccepted ? "ACCEPTED" : "WRONG_ANSWER"

                setSubmissionStatus(status)
                setRuntime(Math.floor(Math.random() * 100) + 40)
                setMemory(Math.floor(Math.random() * 25) + 25)

                // Add new submission to list
                const newSubmission = {
                    id: Date.now().toString(),
                    code: "// Mock code",
                    status,
                    language: { name: selectedLanguage },
                    createdAt: new Date().toISOString(),
                    runtime: Math.floor(Math.random() * 100) + 40,
                    memory: Math.floor(Math.random() * 25) + 25,
                    score: 0,
                }

                setSubmissions((prev) => [newSubmission, ...prev])
                setIsSubmitting(false)

                if (isAccepted) {
                    toast.success("Solution accepted!")
                } else {
                    toast.error("Wrong answer - try again")
                }
            }, 2000)
        } catch (error) {
            console.error("Error submitting solution:", error)
            toast.error("Failed to submit solution")
            setIsSubmitting(false)
        }
    }

    // Difficulty badge color
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY":
                return "text-green-600"
            case "MEDIUM":
                return "text-yellow-600"
            case "HARD":
                return "text-red-600"
            case "EXPERT":
                return "text-purple-600"
            default:
                return "text-gray-600"
        }
    }

    // Get submission status color and icon
    const getSubmissionStatusStyles = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return {
                    color: "text-green-600",
                    bg: isDark ? "bg-green-900/20" : "bg-green-50",
                    border: isDark ? "border-green-700" : "border-green-200",
                    icon: <CheckCircle className="w-4 h-4" />,
                }
            case "WRONG_ANSWER":
            case "FAILED":
                return {
                    color: "text-red-600",
                    bg: isDark ? "bg-red-900/20" : "bg-red-50",
                    border: isDark ? "border-red-700" : "border-red-200",
                    icon: <XCircle className="w-4 h-4" />,
                }
            case "TIME_LIMIT_EXCEEDED":
                return {
                    color: "text-yellow-600",
                    bg: isDark ? "bg-yellow-900/20" : "bg-yellow-50",
                    border: isDark ? "border-yellow-700" : "border-yellow-200",
                    icon: <Clock className="w-4 h-4" />,
                }
            default:
                return {
                    color: isDark ? "text-gray-400" : "text-gray-600",
                    bg: isDark ? "bg-gray-800" : "bg-gray-50",
                    border: isDark ? "border-gray-700" : "border-gray-200",
                    icon: <XCircle className="w-4 h-4" />,
                }
        }
    }

    // Format submission status for display
    const formatSubmissionStatus = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return "Accepted"
            case "WRONG_ANSWER":
                return "Wrong Answer"
            case "FAILED":
                return "Failed"
            case "TIME_LIMIT_EXCEEDED":
                return "Time Limit Exceeded"
            case "MEMORY_LIMIT_EXCEEDED":
                return "Memory Limit Exceeded"
            case "RUNTIME_ERROR":
                return "Runtime Error"
            case "COMPILATION_ERROR":
                return "Compilation Error"
            default:
                return status
        }
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Get language-specific template code
    const getLanguageTemplate = (language: string) => {
        // Provide basic templates for common languages
        switch (language.toLowerCase()) {
            case "javascript":
                return `
// Write your JavaScript solution here
// Example:

function solution(input) {
  // Your code here
  return output;
}
  `

            case "python":
                return `
# Write your Python solution here
# Example:

def solution(input):
    # Your code here
    return output
  `

            case "java":
                return `
// Write your Java solution here
// Example:

public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}
  `

            case "c++":
            case "cpp":
                return `
// Write your C++ solution here
// Example:

#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}
  `

            default:
                return `// Write your solution here`
        }
    }

    // Set template code when language changes
    useEffect(() => {
        if (selectedLanguage && code === "") {
            setCode(getLanguageTemplate(selectedLanguage))
        }
    }, [selectedLanguage, code])

    // Fetch submissions when user data is available
    useEffect(() => {
        if (userData && challengeId) {
            fetchSubmissions()
        }
    }, [userData, challengeId])

    if (loading) {
        return (
            <div
                className={`flex justify-center items-center h-screen transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gray-50"
                    }`}
            >
                <Loader />
            </div>
        )
    }

    if (!challenge) {
        return (
            <div className={`min-h-screen transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="container mx-auto px-4 py-16 text-center">
                    <XCircle size={64} className="mx-auto mb-4 text-red-500" />
                    <h1
                        className={`text-3xl font-bold mb-4 transition-colors duration-200 ${isDark ? "text-white" : "text-gray-800"
                            }`}
                    >
                        Challenge Not Found
                    </h1>
                    <p className={`mb-8 transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        The challenge you're looking for doesn't exist or has been removed.
                    </p>
                    <Link
                        href="/challenges"
                        className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        Back to Challenges
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`h-screen flex flex-col transition-colors duration-200 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
                }`}
        >
            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <Split
                    sizes={[50, 50]}
                    minSize={[400, 400]}
                    gutterSize={10}
                    direction="horizontal"
                    className="flex h-full relative"
                    gutterStyle={() => ({
                        background: "linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.3) 50%, transparent 100%)",
                        width: "10px",
                        cursor: "col-resize",
                        border: "none",
                        outline: "none",
                        zIndex: "1",
                        transition: "all 0.2s ease",
                    })}
                >
                    {/* Left Panel - Problem Description */}
                    <div
                        className={`overflow-hidden flex flex-col transition-colors duration-200 ${isDark ? "bg-gray-800" : "bg-white"
                            }`}
                    >
                        {/* Header */}
                        <div
                            className={`border-b transition-colors duration-200 px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Link
                                        href="/challenges"
                                        className={`transition-colors duration-200 ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"
                                            }`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Link>
                                    <div className="flex items-center space-x-3">
                                        <h1
                                            className={`text-lg font-medium transition-colors duration-200 ${isDark ? "text-white" : "text-gray-900"
                                                }`}
                                        >
                                            {challenge.title}
                                        </h1>
                                        <span className={`text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                            {challenge.difficulty}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <Tabs defaultValue="description" className="w-full">
                                <div
                                    className={`border-b px-4 transition-colors duration-200 ${isDark ? "border-gray-700" : "border-gray-200"
                                        }`}
                                >
                                    <TabsList className="bg-transparent h-12 p-0 space-x-1">
                                        <TabsTrigger
                                            value="description"
                                            className={`border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none px-4 py-3 text-sm font-medium duration-200 ${isDark
                                                    ? "text-gray-300 bg-gray-800 data-[state=active]:text-blue-400 data-[state=active]:bg-gray-800"
                                                    : "text-gray-600 bg-white data-[state=active]:text-blue-600 data-[state=active]:bg-white"
                                                }`}
                                        >
                                            Description
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="solutions"
                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none px-4 py-3 text-sm font-medium duration-200 ${isDark
                                                    ? "text-gray-300 bg-gray-800 data-[state=active]:text-blue-400 data-[state=active]:bg-gray-800"
                                                    : "text-gray-600 bg-white data-[state=active]:text-blue-600 data-[state=active]:bg-white"
                                                }`}
                                        >
                                            Solutions
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="submissions"
                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none px-4 py-3 text-sm font-medium duration-200 ${isDark
                                                    ? "text-gray-300 bg-gray-800 data-[state=active]:text-blue-400 data-[state=active]:bg-gray-800"
                                                    : "text-gray-600 bg-white data-[state=active]:text-blue-600 data-[state=active]:bg-white"
                                                }`}
                                        >
                                            Submissions
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="description" className="p-4 space-y-6">
                                    {/* Problem Stats */}
                                    <div
                                        className={`flex items-center justify-between space-x-6 text-sm transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center space-x-1">
                                                <ThumbsUp className="w-4 h-4" />
                                                <span>{challenge.likes}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <ThumbsDown className="w-4 h-4" />
                                                <span>{challenge.dislikes || 0}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Star className="w-4 h-4" />
                                                <span>Add to List</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Share className="w-4 h-4" />
                                                <span>Share</span>
                                            </div>
                                        </div>
                                        <div>
                                            {isSolved && (
                                                <span
                                                    className={`inline-flex items-center justify-center rounded-full w-5 h-5 `}
                                                    title="Solved"
                                                    aria-label="Solved"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Problem Description */}
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                        <div
                                            className={`leading-relaxed transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                }`}
                                        >
                                            {challenge.description}
                                        </div>
                                    </div>

                                    {/* Examples */}
                                    <div className="space-y-4">
                                        {challenge.testCases
                                            .filter((tc) => !tc.isHidden)
                                            .map((testCase, index) => (
                                                <div key={testCase.id} className="space-y-2">
                                                    <h4
                                                        className={`font-medium transition-colors duration-200 ${isDark ? "text-white" : "text-gray-900"
                                                            }`}
                                                    >
                                                        Example {index + 1}:
                                                    </h4>
                                                    <div
                                                        className={`rounded-lg p-3 space-y-2 transition-colors duration-200 ${isDark ? "bg-gray-700" : "bg-gray-50"
                                                            }`}
                                                    >
                                                        <div className="space-x-2">
                                                            <span
                                                                className={`font-medium transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                                    }`}
                                                            >
                                                                Input:
                                                            </span>
                                                            <code
                                                                className={`text-sm font-mono transition-colors duration-200 ${isDark ? "text-gray-100" : "text-gray-900"
                                                                    }`}
                                                            >
                                                                {testCase.input}
                                                            </code>
                                                        </div>
                                                        <div className="space-x-2">
                                                            <span
                                                                className={`font-medium transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                                    }`}
                                                            >
                                                                Output:
                                                            </span>
                                                            <code
                                                                className={`text-sm font-mono transition-colors duration-200 ${isDark ? "text-gray-100" : "text-gray-900"
                                                                    }`}
                                                            >
                                                                {testCase.output}
                                                            </code>
                                                        </div>
                                                        {testCase.explanation && (
                                                            <div className="space-x-2">
                                                                <span
                                                                    className={`font-medium transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                                        }`}
                                                                >
                                                                    Explanation:
                                                                </span>
                                                                <span
                                                                    className={`text-sm transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                                        }`}
                                                                >
                                                                    {testCase.explanation}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    {/* Constraints */}
                                    <div className="space-y-2">
                                        <h4
                                            className={`font-medium transition-colors duration-200 ${isDark ? "text-white" : "text-gray-900"
                                                }`}
                                        >
                                            Constraints:
                                        </h4>
                                        <ul
                                            className={`text-sm space-y-1 transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                }`}
                                        >
                                            <li>• Time limit: {challenge.timeLimit}ms</li>
                                            <li>• Memory limit: {challenge.memoryLimit}MB</li>
                                            <li>• 1 ≤ input.length ≤ 10^4</li>
                                        </ul>
                                    </div>
                                </TabsContent>

                                <TabsContent value="editorial" className="p-4">
                                    <div
                                        className={`text-center py-8 transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-500"
                                            }`}
                                    >
                                        Editorial content coming soon...
                                    </div>
                                </TabsContent>

                                <TabsContent value="solutions" className="p-4">
                                    <div
                                        className={`text-center py-8 transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-500"
                                            }`}
                                    >
                                        Community solutions coming soon...
                                    </div>
                                </TabsContent>

                                <TabsContent value="submissions" className="p-4">
                                    {submissionsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <RotateCcw
                                                className={`w-6 h-6 animate-spin transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-500"
                                                    }`}
                                            />
                                        </div>
                                    ) : submissions.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3
                                                    className={`text-lg font-medium transition-colors duration-200 ${isDark ? "text-white" : "text-gray-900"
                                                        }`}
                                                >
                                                    Your Submissions ({submissions.length})
                                                </h3>
                                                <Button
                                                    onClick={fetchSubmissions}
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`transition-colors duration-200 ${isDark
                                                            ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                                                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    <RotateCcw className="w-4 h-4 mr-1" />
                                                    Refresh
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {submissions.map((submission) => {
                                                    const statusStyles = getSubmissionStatusStyles(submission.status)
                                                    return (
                                                        <div
                                                            key={submission.id}
                                                            className={`border rounded-lg p-4 transition-colors duration-200 ${statusStyles.border} ${statusStyles.bg}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        {statusStyles.icon}
                                                                        <span className={`font-medium ${statusStyles.color}`}>
                                                                            {formatSubmissionStatus(submission.status)}
                                                                        </span>
                                                                    </div>
                                                                    <span
                                                                        className={`text-sm transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"
                                                                            }`}
                                                                    >
                                                                        {submission.language.name}
                                                                    </span>
                                                                </div>
                                                                <span
                                                                    className={`text-xs transition-colors duration-200 ${isDark ? "text-gray-500" : "text-gray-500"
                                                                        }`}
                                                                >
                                                                    {formatDate(submission.createdAt)}
                                                                </span>
                                                            </div>

                                                            {(submission.runtime !== null || submission.memory !== null) && (
                                                                <div
                                                                    className={`flex items-center space-x-6 text-sm mb-3 transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"
                                                                        }`}
                                                                >
                                                                    {submission.runtime !== null && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Clock className="w-4 h-4" />
                                                                            <span>Runtime: {submission.runtime}ms</span>
                                                                        </div>
                                                                    )}
                                                                    {submission.memory !== null && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Database className="w-4 h-4" />
                                                                            <span>Memory: {submission.memory}MB</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <details className="group">
                                                                <summary
                                                                    className={`cursor-pointer text-sm font-medium transition-colors duration-200 ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"
                                                                        }`}
                                                                >
                                                                    View Code
                                                                </summary>
                                                                <div
                                                                    className={`mt-3 p-3 rounded border transition-colors duration-200 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                                                                        }`}
                                                                >
                                                                    <pre
                                                                        className={`text-xs font-mono overflow-x-auto whitespace-pre-wrap transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                                            }`}
                                                                    >
                                                                        {submission.code}
                                                                    </pre>
                                                                </div>
                                                            </details>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Upload
                                                className={`w-12 h-12 mx-auto mb-4 transition-colors duration-200 ${isDark ? "text-gray-500" : "text-gray-400"
                                                    }`}
                                            />
                                            <h3
                                                className={`text-lg font-medium mb-2 transition-colors duration-200 ${isDark ? "text-white" : "text-gray-900"
                                                    }`}
                                            >
                                                No Submissions Yet
                                            </h3>
                                            <p
                                                className={`mb-4 transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                            >
                                                Submit your solution to see your submission history here.
                                            </p>
                                            <Button
                                                onClick={() =>
                                                    document.querySelector('[data-tab="code"]')?.scrollIntoView({ behavior: "smooth" })
                                                }
                                                className={`transition-colors duration-200 ${isDark
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                                    }`}
                                            >
                                                Start Coding
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Right Panel - Code Editor */}
                    <div
                        className={`overflow-hidden flex flex-col transition-colors duration-200 ${isDark ? "bg-gray-800" : "bg-white"
                            }`}
                    >
                        {/* Code Editor Header */}
                        <div
                            className={`border-b px-4 py-3 transition-colors duration-200 ${isDark ? "border-gray-700" : "border-gray-200"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <select
                                    value={selectedLanguage}
                                    onChange={handleLanguageChange}
                                    className={`px-3 py-1 border rounded text-sm transition-colors duration-200 ${isDark
                                            ? "border-gray-600 bg-gray-700 text-white focus:border-blue-500"
                                            : "border-gray-300 bg-white text-gray-900 focus:border-blue-500"
                                        }`}
                                >
                                    {languages.map((lang: any) => (
                                        <option key={lang.name} value={lang.name}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 overflow-hidden w-full h-full">
                            <Split
                                sizes={[50, 50]}
                                direction="vertical"
                                minSize={[200, 150]}
                                gutterSize={10}
                                className="flex flex-col h-full relative"
                                gutterStyle={() => ({
                                    background: "linear-gradient(0deg, transparent 0%, rgba(148, 163, 184, 0.3) 50%, transparent 100%)",
                                    height: "10px",
                                    cursor: "row-resize",
                                    border: "none",
                                    outline: "none",
                                    zIndex: "1",
                                    transition: "all 0.2s ease",
                                })}
                            >
                                {/* Code Editor Pane */}
                                <div className="overflow-hidden">
                                    <CodeEditor
                                        value={code}
                                        onChange={setCode}
                                        language={selectedLanguage?.toLowerCase() || "javascript"}
                                        theme={theme === "dark" ? "vs-dark" : "vs-light"}
                                        height="100%"
                                    />
                                </div>

                                {/* Console */}
                                <div
                                    className={`border-t flex flex-col transition-colors duration-200 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                                        }`}
                                >
                                    {/* Console Header */}
                                    <div
                                        className={`border-b px-4 py-2 transition-colors duration-200 ${isDark ? "border-gray-700" : "border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Tabs value={activeConsoleTab} onValueChange={setActiveConsoleTab} className="w-full">
                                                <div className="flex items-center justify-between">
                                                    <TabsList className="bg-transparent h-8 p-0 space-x-4">
                                                        <TabsTrigger
                                                            value="testcase"
                                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 py-1 text-xs font-medium transition-colors duration-200 ${isDark
                                                                    ? "text-gray-300 data-[state=active]:text-blue-400"
                                                                    : "text-gray-600 data-[state=active]:text-blue-600"
                                                                }`}
                                                        >
                                                            Testcase
                                                        </TabsTrigger>
                                                        <TabsTrigger
                                                            value="result"
                                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 py-1 text-xs font-medium transition-colors duration-200 ${isDark
                                                                    ? "text-gray-300 data-[state=active]:text-blue-400"
                                                                    : "text-gray-600 data-[state=active]:text-blue-600"
                                                                }`}
                                                        >
                                                            Test Result
                                                        </TabsTrigger>
                                                    </TabsList>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            onClick={handleRunCode}
                                                            disabled={isRunning || !code.trim()}
                                                            size="sm"
                                                            className={`h-7 px-3 text-xs transition-colors duration-200 ${isDark
                                                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:bg-gray-800 disabled:text-gray-500"
                                                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                                                                }`}
                                                        >
                                                            {isRunning ? (
                                                                <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Play className="w-3 h-3 mr-1" />
                                                            )}
                                                            Run
                                                        </Button>
                                                        <Button
                                                            onClick={handleSubmitSolution}
                                                            disabled={isSubmitting || !code.trim()}
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs disabled:bg-green-400 transition-colors duration-200"
                                                        >
                                                            {isSubmitting ? (
                                                                <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Upload className="w-3 h-3 mr-1" />
                                                            )}
                                                            Submit
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Tabs>
                                        </div>
                                    </div>

                                    {/* Console Content */}
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <Tabs value={activeConsoleTab} className="w-full">
                                            <TabsContent value="testcase" className="mt-0">
                                                {challenge.testCases
                                                    .filter((tc) => !tc.isHidden)
                                                    .slice(0, 1)
                                                    .map((testCase, index) => (
                                                        <div key={testCase.id} className="space-y-3">
                                                            <div>
                                                                <label
                                                                    className={`text-xs font-medium transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"
                                                                        }`}
                                                                >
                                                                    Input:
                                                                </label>
                                                                <div
                                                                    className={`mt-1 p-2 rounded text-sm font-mono transition-colors duration-200 ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-800"
                                                                        }`}
                                                                >
                                                                    {testCase.input}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label
                                                                    className={`text-xs font-medium transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"
                                                                        }`}
                                                                >
                                                                    Expected Output:
                                                                </label>
                                                                <div
                                                                    className={`mt-1 p-2 rounded text-sm font-mono transition-colors duration-200 ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-800"
                                                                        }`}
                                                                >
                                                                    {testCase.output}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </TabsContent>

                                            <TabsContent value="result" className="mt-0">
                                                {submissionStatus && (
                                                    <div
                                                        className={`mb-4 p-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${submissionStatus === "ACCEPTED"
                                                                ? isDark
                                                                    ? "bg-green-900/30 text-green-300 border border-green-700"
                                                                    : "bg-green-50 text-green-800 border border-green-200"
                                                                : isDark
                                                                    ? "bg-red-900/30 text-red-300 border border-red-700"
                                                                    : "bg-red-50 text-red-800 border border-red-200"
                                                            }`}
                                                    >
                                                        {submissionStatus === "ACCEPTED" ? (
                                                            <CheckCircle className="w-5 h-5" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5" />
                                                        )}
                                                        <span className="font-medium">
                                                            {submissionStatus === "ACCEPTED" ? "Accepted" : "Wrong Answer"}
                                                        </span>
                                                    </div>
                                                )}

                                                {testResults && (
                                                    <div className="space-y-4">
                                                        {runtime !== null && memory !== null && (
                                                            <div
                                                                className={`flex items-center space-x-6 text-sm transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"
                                                                    }`}
                                                            >
                                                                <div className="flex items-center space-x-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>Runtime: {runtime}ms</span>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <Database className="w-4 h-4" />
                                                                    <span>Memory: {memory}MB</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            {testResults.map((result, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`p-3 rounded border-l-4 transition-colors duration-200 ${result.passed
                                                                            ? isDark
                                                                                ? "border-l-green-500 bg-green-900/20 text-green-300"
                                                                                : "border-l-green-500 bg-green-50 text-green-800"
                                                                            : isDark
                                                                                ? "border-l-red-500 bg-red-900/20 text-red-300"
                                                                                : "border-l-red-500 bg-red-50 text-red-800"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        {result.passed ? (
                                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                                        ) : (
                                                                            <XCircle className="w-4 h-4 text-red-600" />
                                                                        )}
                                                                        <span className="text-sm font-medium">Test Case {index + 1}</span>
                                                                    </div>
                                                                    {!result.passed && (
                                                                        <div className="space-y-2 text-xs">
                                                                            <div>
                                                                                <span className="font-medium">Input: </span>
                                                                                <code
                                                                                    className={`px-1 rounded transition-colors duration-200 ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"
                                                                                        }`}
                                                                                >
                                                                                    {result.input}
                                                                                </code>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium">Expected: </span>
                                                                                <code
                                                                                    className={`px-1 rounded transition-colors duration-200 ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"
                                                                                        }`}
                                                                                >
                                                                                    {result.expectedOutput}
                                                                                </code>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium">Actual: </span>
                                                                                <code
                                                                                    className={`px-1 rounded transition-colors duration-200 ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"
                                                                                        }`}
                                                                                >
                                                                                    {result.actualOutput}
                                                                                </code>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {!testResults && !submissionStatus && (
                                                    <div
                                                        className={`text-center py-8 text-sm transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-500"
                                                            }`}
                                                    >
                                                        Run your code to see results here
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </div>
                            </Split>
                        </div>
                    </div>
                </Split>
            </div>
        </div>
    )
}

export default ChallengePage
