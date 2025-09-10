"use client"

import { useState } from "react"
import NavBar from "@/components/NavBar"
import { useTheme } from "@/context/ThemeContext"
import { Code, Trophy, Star, Clock, CheckCircle, XCircle, TrendingUp, Award, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const ActivityFeedPage = () => {
    const { theme } = useTheme()
    const [activeFilter, setActiveFilter] = useState("all")

    const activities = [
        {
            id: 1,
            type: "challenge_completed",
            title: 'Completed "Two Sum Problem"',
            description: "Solved in 12 minutes with optimal O(n) solution",
            timestamp: "2024-01-18T14:30:00Z",
            points: 100,
            difficulty: "Easy",
            status: "success",
            details: {
                runtime: "12ms",
                memory: "14.2MB",
                language: "JavaScript",
                attempts: 1,
            },
        },
        {
            id: 2,
            type: "contest_participated",
            title: "Participated in Weekly Algorithm Challenge #46",
            description: "Ranked 47th out of 1,247 participants",
            timestamp: "2024-01-17T16:45:00Z",
            points: 350,
            difficulty: "Medium",
            status: "success",
            details: {
                rank: 47,
                totalParticipants: 1247,
                problemsSolved: 3,
                totalProblems: 4,
            },
        },
        {
            id: 3,
            type: "challenge_attempted",
            title: 'Attempted "Merge k Sorted Lists"',
            description: "Time limit exceeded on test case 15/20",
            timestamp: "2024-01-17T10:15:00Z",
            points: 0,
            difficulty: "Hard",
            status: "failed",
            details: {
                runtime: "TLE",
                memory: "45.6MB",
                language: "Python",
                attempts: 3,
            },
        },
        {
            id: 4,
            type: "achievement_unlocked",
            title: 'Unlocked "Speed Demon" Achievement',
            description: "Solved 5 easy problems in under 10 minutes each",
            timestamp: "2024-01-16T20:22:00Z",
            points: 50,
            difficulty: "Achievement",
            status: "achievement",
            details: {
                category: "Speed",
                rarity: "Rare",
                progress: "5/5",
            },
        },
        {
            id: 5,
            type: "challenge_completed",
            title: 'Completed "Binary Tree Inorder Traversal"',
            description: "Implemented both recursive and iterative solutions",
            timestamp: "2024-01-16T15:45:00Z",
            points: 200,
            difficulty: "Medium",
            status: "success",
            details: {
                runtime: "8ms",
                memory: "12.1MB",
                language: "Java",
                attempts: 2,
            },
        },
        {
            id: 6,
            type: "streak_milestone",
            title: "Reached 7-day Coding Streak!",
            description: "Solved at least one problem every day for a week",
            timestamp: "2024-01-15T23:59:00Z",
            points: 100,
            difficulty: "Milestone",
            status: "milestone",
            details: {
                streakDays: 7,
                totalProblems: 12,
                averageTime: "25 minutes",
            },
        },
    ]

    const stats = {
        totalPoints: 1247,
        problemsSolved: 89,
        currentStreak: 7,
        contestsParticipated: 12,
        achievements: 15,
        averageRating: 1456,
    }

    const getActivityIcon = (type: string, status: string) => {
        switch (type) {
            case "challenge_completed":
                return status === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                )
            case "challenge_attempted":
                return <Code className="w-5 h-5 text-orange-500" />
            case "contest_participated":
                return <Trophy className="w-5 h-5 text-purple-500" />
            case "achievement_unlocked":
                return <Award className="w-5 h-5 text-yellow-500" />
            case "streak_milestone":
                return <Zap className="w-5 h-5 text-blue-500" />
            default:
                return <Target className="w-5 h-5 text-gray-500" />
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case "easy":
                return "bg-green-500/20 text-green-400 border-green-500/30"
            case "medium":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            case "hard":
                return "bg-red-500/20 text-red-400 border-red-500/30"
            case "achievement":
                return "bg-purple-500/20 text-purple-400 border-purple-500/30"
            case "milestone":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30"
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30"
        }
    }

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "Just now"
        if (diffInHours < 24) return `${diffInHours}h ago`
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays}d ago`
    }

    const filteredActivities = activities.filter((activity) => {
        if (activeFilter === "all") return true
        return activity.type === activeFilter
    })

    const filters = [
        { key: "all", label: "All Activity", count: activities.length },
        {
            key: "challenge_completed",
            label: "Challenges",
            count: activities.filter((a) => a.type === "challenge_completed").length,
        },
        {
            key: "contest_participated",
            label: "Contests",
            count: activities.filter((a) => a.type === "contest_participated").length,
        },
        {
            key: "achievement_unlocked",
            label: "Achievements",
            count: activities.filter((a) => a.type === "achievement_unlocked").length,
        },
    ]

    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
            <div className="container mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8 animate-fade-in-up">
                    <h1 className={`text-4xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-2`}>
                        Activity Feed
                    </h1>
                    <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}>
                        Track your coding journey and achievements
                    </p>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                        {[
                            { label: "Total Points", value: stats.totalPoints, icon: <Star className="w-5 h-5 text-yellow-500" /> },
                            {
                                label: "Problems Solved",
                                value: stats.problemsSolved,
                                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                            },
                            {
                                label: "Current Streak",
                                value: `${stats.currentStreak} days`,
                                icon: <Zap className="w-5 h-5 text-blue-500" />,
                            },
                            {
                                label: "Contests",
                                value: stats.contestsParticipated,
                                icon: <Trophy className="w-5 h-5 text-purple-500" />,
                            },
                            { label: "Achievements", value: stats.achievements, icon: <Award className="w-5 h-5 text-orange-500" /> },
                            { label: "Rating", value: stats.averageRating, icon: <TrendingUp className="w-5 h-5 text-red-500" /> },
                        ].map((stat, index) => (
                            <Card
                                key={stat.label}
                                className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                                    } animate-slide-in-right`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-1`}>
                                                {stat.label}
                                            </p>
                                            <p className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                {stat.value}
                                            </p>
                                        </div>
                                        {stat.icon}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-fit">
                        {filters.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm ${activeFilter === filter.key
                                        ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                                        : theme === "dark"
                                            ? "text-gray-400 hover:text-white hover:bg-gray-700"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                            >
                                {filter.label} ({filter.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                    {filteredActivities.map((activity, index) => (
                        <Card
                            key={activity.id}
                            className={`${theme === "dark"
                                    ? "bg-gray-800 border-gray-700 hover:border-orange-500/50"
                                    : "bg-white border-gray-200 hover:border-orange-500/50"
                                } transition-all duration-300 hover:shadow-lg animate-slide-in-right`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type, activity.status)}</div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-1`}>
                                                    {activity.title}
                                                </h3>
                                                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                    {activity.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <Badge className={`${getDifficultyColor(activity.difficulty)} border text-xs`}>
                                                    {activity.difficulty}
                                                </Badge>
                                                {activity.points > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{activity.points} pts
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                                                        {formatTimeAgo(activity.timestamp)}
                                                    </span>
                                                </div>

                                                {activity.details && (
                                                    <div className="flex items-center gap-4">
                                                        {activity.details.runtime && (
                                                            <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                                Runtime: {activity.details.runtime}
                                                            </span>
                                                        )}
                                                        {activity.details.language && (
                                                            <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                                {activity.details.language}
                                                            </span>
                                                        )}
                                                        {activity.details.rank && (
                                                            <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                                Rank: {activity.details.rank}/{activity.details.totalParticipants}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredActivities.length === 0 && (
                    <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No activity found</h3>
                        <p>Start solving challenges to see your activity here!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ActivityFeedPage
