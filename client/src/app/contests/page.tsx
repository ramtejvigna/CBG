"use client"

import { useState } from "react"
import NavBar from "@/components/NavBar"
import { useThemeStore } from "@/lib/store/themeStore"
import { Calendar, Clock, Users, Trophy, Star, ChevronRight, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ContestsPage = () => {
    const { theme } = useThemeStore()
    const [activeTab, setActiveTab] = useState("upcoming")
    const [searchQuery, setSearchQuery] = useState("")

    const contests = {
        upcoming: [
            {
                id: 1,
                title: "Weekly Algorithm Challenge #47",
                description: "Test your skills with advanced data structures and algorithms",
                startTime: "2024-01-20T14:00:00Z",
                duration: "2 hours",
                participants: 1247,
                difficulty: "Medium",
                prize: "$500",
                tags: ["Algorithms", "Data Structures"],
                status: "upcoming",
            },
            {
                id: 2,
                title: "Dynamic Programming Marathon",
                description: "Master the art of dynamic programming with challenging problems",
                startTime: "2024-01-22T10:00:00Z",
                duration: "3 hours",
                participants: 892,
                difficulty: "Hard",
                prize: "$1000",
                tags: ["Dynamic Programming", "Optimization"],
                status: "upcoming",
            },
        ],
        live: [
            {
                id: 3,
                title: "Binary Tree Mastery Contest",
                description: "Solve complex binary tree problems under time pressure",
                startTime: "2024-01-18T16:00:00Z",
                duration: "90 minutes",
                participants: 2156,
                difficulty: "Medium",
                prize: "$750",
                tags: ["Trees", "Recursion"],
                status: "live",
                timeLeft: "45 minutes",
            },
        ],
        past: [
            {
                id: 4,
                title: "Graph Theory Championship",
                description: "Navigate through complex graph algorithms and shortest paths",
                startTime: "2024-01-15T12:00:00Z",
                duration: "2.5 hours",
                participants: 1834,
                difficulty: "Hard",
                prize: "$1200",
                tags: ["Graphs", "Shortest Path"],
                status: "completed",
                winner: "AlgoMaster2024",
            },
            {
                id: 5,
                title: "String Manipulation Sprint",
                description: "Fast-paced string processing and pattern matching challenges",
                startTime: "2024-01-12T18:00:00Z",
                duration: "1.5 hours",
                participants: 967,
                difficulty: "Easy",
                prize: "$300",
                tags: ["Strings", "Pattern Matching"],
                status: "completed",
                winner: "StringNinja",
            },
        ],
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case "easy":
                return "bg-green-500/20 text-green-400 border-green-500/30"
            case "medium":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            case "hard":
                return "bg-red-500/20 text-red-400 border-red-500/30"
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30"
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const filteredContests = contests[activeTab as keyof typeof contests].filter(
        (contest) =>
            contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contest.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
            <div className="container mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8 animate-fade-in-up">
                    {/* Tab Navigation */}
                    <div className="flex justify-end p-2 rounded-lg">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            className="px-6 py-2 rounded-md font-medium transition-all duration-300 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            {[
                                { key: "upcoming", label: "Upcoming", count: contests.upcoming.length },
                                { key: "live", label: "Live", count: contests.live.length },
                                { key: "past", label: "Past", count: contests.past.length },
                            ].map((tab) => (
                                <option key={tab.key} value={tab.key}>
                                    {tab.label} ({tab.count})
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Contests Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredContests.map((contest, index) => (
                        <Card
                            key={contest.id}
                            className={`${theme === "dark"
                                ? "bg-gray-800 border-gray-700 hover:border-orange-500/50"
                                : "bg-white border-gray-200 hover:border-orange-500/50"
                                } transition-all duration-300 hover:shadow-xl cursor-pointer group animate-slide-in-right`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle
                                            className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} group-hover:text-orange-500 transition-colors`}
                                        >
                                            {contest.title}
                                        </CardTitle>
                                        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-2`}>
                                            {contest.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {contest.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="space-y-4">
                                    {/* Contest Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-orange-500" />
                                            <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                {formatDate(contest.startTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                {contest.duration}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-orange-500" />
                                            <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                {contest.participants.toLocaleString()} participants
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-4 h-4 text-orange-500" />
                                            <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                {contest.prize}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status and Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                        {/* <div className="flex items-center gap-3">
                                            <Badge className={`${getDifficultyColor(contest.difficulty)} border`}>{contest.difficulty}</Badge>

                                            {contest.status === "live" && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span className="text-sm text-red-500 font-medium">{contest.timeLeft} left</span>
                                                </div>
                                            )}

                                            {contest.status === "completed" && contest.winner && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm text-yellow-500 font-medium">Won by {contest.winner}</span>
                                                </div>
                                            )}
                                        </div> */}

                                        <Button
                                            size="sm"
                                            className={
                                                contest.status === "live"
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : contest.status === "upcoming"
                                                        ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                                                        : "bg-gray-500 hover:bg-gray-600 text-white"
                                            }
                                        >
                                            {contest.status === "live"
                                                ? "Join Now"
                                                : contest.status === "upcoming"
                                                    ? "Register"
                                                    : "View Results"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredContests.length === 0 && (
                    <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No contests found</h3>
                        <p>Try adjusting your search or check back later for new contests.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ContestsPage
