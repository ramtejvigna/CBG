"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Split from "react-split"
import { toast } from "react-hot-toast"
import { useTheme } from "@/context/ThemeContext"
import {
    ChevronLeft,
    Share,
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
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useChallenge from "@/hooks/useChallenge"
import useCodeExecution from "@/hooks/useCodeExecution"
import useLanguages from "@/hooks/useLanguages"

// Types
interface TestCase {
    id: string
    input: string
    output: string
    isHidden: boolean
    explanation?: string
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
    userLikeStatus?: boolean | null
}

interface TestResult {
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
    runtime?: number
    memory?: number
    error?: string
}

const ChallengePage = () => {
    const { slug } = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { theme } = useTheme()
    const { data: session, status } = useSession()

    const challengeData = useChallenge(slug as string);
    const { executeCode, isExecuting } = useCodeExecution();
    const { languages } = useLanguages();

    // Get contest ID from URL parameters if present
    const contestId = searchParams.get('contest')

    const isDark = theme === "dark"
    // State
    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedLanguage, setSelectedLanguage] = useState<string>('Java')
    const [code, setCode] = useState<string>("")
    const [testResults, setTestResults] = useState<TestResult[] | null>(null)
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
    const [runtime, setRuntime] = useState<number | null>(null)
    const [memory, setMemory] = useState<number | null>(null)
    const [activeConsoleTab, setActiveConsoleTab] = useState("testcase")
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [submissionsLoading, setSubmissionsLoading] = useState(false)
    const [contestInfo, setContestInfo] = useState<{ title: string, status: string } | null>(null)
    const [userLikeStatus, setUserLikeStatus] = useState<boolean | null>(null)
    const [likesCount, setLikesCount] = useState<number>(0)
    const [dislikesCount, setDislikesCount] = useState<number>(0)
    const [isLikeLoading, setIsLikeLoading] = useState(false)

    // Determine if challenge is solved (accepted submission exists or current submission accepted)
    const hasAcceptedSubmission = submissions.some((s) => s.status === "ACCEPTED")
    const isSolved = submissionStatus === "ACCEPTED" || hasAcceptedSubmission

    // Fetch challenge data
    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const challenge = challengeData?.challenge;
                setChallenge(challenge || null);
                
                if (challenge) {
                    // Initialize likes and dislikes from challenge data
                    setLikesCount(challenge._count?.likes || 0);
                    setDislikesCount(challenge.dislikes || 0);
                    
                    // Fetch user-specific like status if authenticated
                    if (session?.user?.id) {
                        await fetchChallengeStats(challenge.id);
                    }
                }
            } catch (error) {
                console.error("Error fetching challenge:", error)
                toast.error("Failed to load challenge")
            } finally {
                setLoading(false)
            }
        }

        if(challengeData) {
            fetchChallenge()
        }
    }, [challengeData, slug, session?.user?.id])

    // Fetch contest information if contest ID is present
    useEffect(() => {
        const fetchContestInfo = async () => {
            if (!contestId) return
            
            try {
                const token = localStorage.getItem('auth-token')
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                }
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${contestId}`, {
                    headers
                })

                if (response.ok) {
                    const contest = await response.json()
                    setContestInfo({
                        title: contest.title,
                        status: contest.status
                    })
                }
            } catch (error) {
                console.error('Error fetching contest info:', error)
            }
        }

        fetchContestInfo()
    }, [contestId])

    // Set default language when languages are loaded
    useEffect(() => {
        if (languages && languages.length > 0 && !selectedLanguage) {
            // Set first available language as default
            setSelectedLanguage(languages[0].name);
        }
    }, [languages, selectedLanguage]);

    // Fetch submissions for this challenge
    const fetchSubmissions = useCallback(async () => {
        if (!challenge || !session?.user?.id) return

        setSubmissionsLoading(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/submissions?challengeId=${challenge.id}&userId=${session.user.id}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success && Array.isArray(data.submissions)) {
                setSubmissions(data.submissions)
            } else {
                throw new Error("Invalid submissions data received")
            }
        } catch (error) {
            console.error("Error fetching submissions:", error)
            toast.error("Failed to load submissions")
        } finally {
            setSubmissionsLoading(false)
        }
    }, [challenge, session?.user?.id])

    // Handle language change
    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const langName = e.target.value
        setSelectedLanguage(langName)
        setCode("")
    }

    // Run code
    const handleRunCode = async () => {
        if (!challenge || !selectedLanguage) return

        setTestResults(null)
        setRuntime(null)
        setMemory(null)
        setActiveConsoleTab("result")

        try {
            const result = await executeCode(code, selectedLanguage, challenge.id, false, undefined, contestId || undefined);

            if (result.success) {
                setTestResults(result.testResults || []);
                setRuntime(result.runtime || null);
                setMemory(result.memory || null);
                
                if (result.compilationError) {
                    toast.error("Code compiled with warnings")
                }
            } else {
                if (result.compilationError) {
                    toast.error("Compilation Error")
                } else {
                    toast.error(result.message || "Failed to run code")
                }
            }
        } catch (error) {
            console.error("Error running code:", error)
            toast.error("Failed to run code")
        }
    }

    // Submit solution
    const handleSubmitSolution = async () => {
        if (!challenge || !selectedLanguage || !session?.user?.id) {
            if (!session?.user?.id) {
                toast.error("Please sign in to submit solutions")
                router.push("/login")
                return
            }
            return
        }

        setSubmissionStatus(null)
        setActiveConsoleTab("result")

        try {
            const result = await executeCode(code, selectedLanguage, challenge.id, true, undefined, contestId || undefined);

            if (result.success) {
                setTestResults(result.testResults || []);
                setRuntime(result.runtime || null);
                setMemory(result.memory || null);
                setSubmissionStatus(result.allPassed ? "ACCEPTED" : "FAILED");

                if (result.allPassed) {
                    if (contestId) {
                        toast.success(`Contest submission accepted! All ${result.totalTests} test cases passed.`)
                    } else {
                        toast.success(`Solution accepted! All ${result.totalTests} test cases passed.`)
                    }
                } else {
                    toast.error(`Solution failed. ${result.passedTests}/${result.totalTests} test cases passed.`)
                }

                // Refresh submissions list after submission
                await fetchSubmissions()
            } else {
                if (result.compilationError) {
                    toast.error("Compilation Error: " + (result.message || "Unknown compilation error"))
                    setSubmissionStatus("COMPILATION_ERROR")
                } else {
                    toast.error(result.message || "Failed to submit solution")
                    setSubmissionStatus("FAILED")
                }
            }
        } catch (error) {
            console.error("Error submitting solution:", error)
            toast.error("Failed to submit solution")
            setSubmissionStatus("FAILED")
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

    // Fetch challenge stats (likes/dislikes and user status)
    const fetchChallengeStats = useCallback(async (challengeId: string) => {
        try {
            const token = localStorage.getItem('auth-token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challengeId}/stats`, {
                headers
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setLikesCount(data.likes)
                    setDislikesCount(data.dislikes)
                    setUserLikeStatus(data.userLikeStatus)
                }
            }
        } catch (error) {
            console.error("Error fetching challenge stats:", error)
        }
    }, [])

    // Handle like/dislike action
    const handleLikeToggle = async (isLike: boolean) => {
        if (!session?.user?.id) {
            toast.error("Please sign in to like challenges")
            router.push("/login")
            return
        }

        if (!challenge) return

        setIsLikeLoading(true)
        try {
            const token = localStorage.getItem('auth-token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challenge.id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isLike })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setLikesCount(data.likes)
                    setDislikesCount(data.dislikes)
                    setUserLikeStatus(data.userLikeStatus)
                    
                    const action = data.userLikeStatus === true ? 'liked' : data.userLikeStatus === false ? 'disliked' : 'removed your reaction from'
                    toast.success(`You ${action} this challenge`)
                }
            } else {
                const error = await response.json()
                toast.error(error.message || "Failed to update like status")
            }
        } catch (error) {
            console.error("Error toggling like:", error)
            toast.error("Failed to update like status")
        } finally {
            setIsLikeLoading(false)
        }
    }

    // Fetch submissions when user session is available
    useEffect(() => {
        if (session?.user?.id && challenge) {
            fetchSubmissions()
        }
    }, [session, challenge])

    if (loading || status === "loading") {
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
                                        {contestInfo && (
                                            <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                                                Contest: {contestInfo.title}
                                            </span>
                                        )}
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
                                            className={`border-b-2 border-transparent data-[state=active]:border-b-blue-500 rounded-none px-4 py-3 text-sm font-medium duration-200 ${isDark
                                                ? "text-gray-300 bg-gray-800 data-[state=active]:text-blue-400 data-[state=active]:bg-gray-800"
                                                : "text-gray-600 bg-white data-[state=active]:text-blue-600 data-[state=active]:bg-white"
                                                }`}
                                        >
                                            Description
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="solutions"
                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-b-blue-500 rounded-none px-4 py-3 text-sm font-medium duration-200 ${isDark
                                                ? "text-gray-300 bg-gray-800 data-[state=active]:text-blue-400 data-[state=active]:bg-gray-800"
                                                : "text-gray-600 bg-white data-[state=active]:text-blue-600 data-[state=active]:bg-white"
                                                }`}
                                        >
                                            Solutions
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="submissions"
                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-b-blue-500 rounded-none px-4 py-3 text-sm font-medium duration-200 ${isDark
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
                                            <button
                                                onClick={() => handleLikeToggle(true)}
                                                disabled={isLikeLoading}
                                                className={`flex items-center space-x-1 transition-colors duration-200 hover:text-green-500 disabled:opacity-50 ${
                                                    userLikeStatus === true 
                                                        ? "text-green-500" 
                                                        : isDark ? "text-gray-400 hover:text-green-400" : "text-gray-600 hover:text-green-500"
                                                }`}
                                                title={userLikeStatus === true ? "Remove like" : "Like this challenge"}
                                            >
                                                <ThumbsUp className={`w-4 h-4 ${userLikeStatus === true ? "fill-current" : ""}`} />
                                                <span>{likesCount}</span>
                                            </button>
                                            <button
                                                onClick={() => handleLikeToggle(false)}
                                                disabled={isLikeLoading}
                                                className={`flex items-center space-x-1 transition-colors duration-200 hover:text-red-500 disabled:opacity-50 ${
                                                    userLikeStatus === false 
                                                        ? "text-red-500" 
                                                        : isDark ? "text-gray-400 hover:text-red-400" : "text-gray-600 hover:text-red-500"
                                                }`}
                                                title={userLikeStatus === false ? "Remove dislike" : "Dislike this challenge"}
                                            >
                                                <ThumbsDown className={`w-4 h-4 ${userLikeStatus === false ? "fill-current" : ""}`} />
                                                <span>{dislikesCount}</span>
                                            </button>
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
                                            dangerouslySetInnerHTML={{ __html: challenge.description }}
                                        />
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
                                                            <pre
                                                                className={`text-sm font-mono transition-colors duration-200 ${isDark ? "text-gray-100" : "text-gray-900"
                                                                    }`}
                                                            >
                                                                {testCase.input}
                                                            </pre>
                                                        </div>
                                                        <div className="space-x-2">
                                                            <span
                                                                className={`font-medium transition-colors duration-200 ${isDark ? "text-gray-300" : "text-gray-700"
                                                                    }`}
                                                            >
                                                                Output:
                                                            </span>
                                                            <pre
                                                                className={`text-sm font-mono transition-colors duration-200 ${isDark ? "text-gray-100" : "text-gray-900"
                                                                    }`}
                                                            >
                                                                {testCase.output}
                                                            </pre>
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
                                    {languages.map((lang) => (
                                        <option key={lang.id} value={lang.name}>
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
                                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent rounded-none px-0 py-1 text-xs font-medium transition-colors duration-200 ${isDark
                                                                ? "text-gray-300 data-[state=active]:text-blue-400"
                                                                : "text-gray-600 data-[state=active]:text-blue-600"
                                                                }`}
                                                        >
                                                            Testcase
                                                        </TabsTrigger>
                                                        <TabsTrigger
                                                            value="result"
                                                            className={`bg-transparent border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent rounded-none px-0 py-1 text-xs font-medium transition-colors duration-200 ${isDark
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
                                                            disabled={isExecuting || !code.trim()}
                                                            size="sm"
                                                            className={`h-7 px-3 text-xs transition-colors duration-200 ${isDark
                                                                ? "bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:bg-gray-800 disabled:text-gray-500"
                                                                : "bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                                                                }`}
                                                        >
                                                            {isExecuting ? (
                                                                <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Play className="w-3 h-3 mr-1" />
                                                            )}
                                                            Run
                                                        </Button>
                                                        <Button
                                                            onClick={handleSubmitSolution}
                                                            disabled={isExecuting || !code.trim()}
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs disabled:bg-green-400 transition-colors duration-200"
                                                        >
                                                            {isExecuting ? (
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
                                                                    <pre>{testCase.input}</pre>
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
                                                                    <pre>{testCase.output}</pre>
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
                                                                                    {result.actualOutput || result.error}
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
