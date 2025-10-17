"use client"

import { useState } from "react"
import NavBar from "@/components/NavBar"
import { useTheme } from "@/context/ThemeContext"
import useActivities from "@/hooks/useActivities"
import { ActivityListSkeleton } from "@/components/ActivitySkeleton"
import { Code, Trophy, Star, Clock, CheckCircle, XCircle, TrendingUp, Award, Target, Zap, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const ActivityFeedPage = () => {
    const { theme } = useTheme()
    const [activeFilter, setActiveFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    
    const { 
        activities, 
        pagination, 
        statistics, 
        loading, 
        error, 
        setPage, 
        setFilter,
        refetch
    } = useActivities({
        page: currentPage,
        limit: 8,
        type: activeFilter
    })

    // Fallback stats for when data is loading
    const defaultStats = {
        totalPoints: 0,
        problemsSolved: 0,
        currentStreak: 0,
        contestsParticipated: 0,
        achievements: 0,
        averageRating: 0,
    }

    const stats = statistics ? {
        totalPoints: statistics.totalPoints,
        problemsSolved: statistics.typeBreakdown.CHALLENGE || 0,
        currentStreak: 7, // This would come from user profile
        contestsParticipated: statistics.typeBreakdown.CONTEST || 0,
        achievements: statistics.typeBreakdown.BADGE || 0,
        averageRating: 1456, // This would come from user profile
    } : defaultStats

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "CHALLENGE":
                return <Code className="w-5 h-5 text-green-500" />
            case "CONTEST":
                return <Trophy className="w-5 h-5 text-purple-500" />
            case "BADGE":
                return <Award className="w-5 h-5 text-yellow-500" />
            case "DISCUSSION":
                return <Target className="w-5 h-5 text-blue-500" />
            default:
                return <Target className="w-5 h-5 text-gray-500" />
        }
    }

    const getDifficultyColor = (result: string) => {
        switch (result.toLowerCase()) {
            case "accepted":
            case "completed":
            case "success":
                return "bg-green-500/20 text-green-400 border-green-500/30"
            case "wrong_answer":
            case "failed":
                return "bg-red-500/20 text-red-400 border-red-500/30"
            case "time_limit_exceeded":
            case "memory_limit_exceeded":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            case "pending":
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

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter)
        setFilter(filter)
        setCurrentPage(1)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        setPage(page)
    }

    const filters = [
        { key: "all", label: "All Activity", count: statistics?.totalActivities || 0 },
        {
            key: "CHALLENGE",
            label: "Challenges",
            count: statistics?.typeBreakdown.CHALLENGE || 0,
        },
        {
            key: "CONTEST",
            label: "Contests",
            count: statistics?.typeBreakdown.CONTEST || 0,
        },
        {
            key: "BADGE",
            label: "Achievements",
            count: statistics?.typeBreakdown.BADGE || 0,
        },
    ]

    if (error) {
        return (
            <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="container mx-auto px-6 py-8">
                    <div className="text-center">
                        <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-4`}>
                            Error Loading Activity Feed
                        </h1>
                        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>{error}</p>
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="mt-4"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

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
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-fit">
                            {filters.map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => handleFilterChange(filter.key)}
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
                        
                        {/* Refresh Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refetch}
                            className="flex items-center gap-2"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && <ActivityListSkeleton theme={theme} />}

                {/* Activity Feed */}
                {!loading && (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
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
                                        <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-1`}>
                                                        {activity.name}
                                                    </h3>
                                                    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                        {activity.result}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Badge className={`${getDifficultyColor(activity.result)} border text-xs`}>
                                                        {activity.result}
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
                                                            {formatTimeAgo(activity.createdAt)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                            Duration: {activity.time}
                                                        </span>
                                                        <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                            Type: {activity.type}
                                                        </span>
                                                    </div>
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
                )}

                {/* Empty State */}
                {!loading && activities.length === 0 && (
                    <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No activity found</h3>
                        <p>Start solving challenges to see your activity here!</p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8">
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                            {pagination.totalItems} activities
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!pagination.hasPrevPage}
                                className="flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else {
                                        const start = Math.max(1, pagination.currentPage - 2);
                                        const end = Math.min(pagination.totalPages, start + 4);
                                        pageNum = start + i;
                                        if (pageNum > end) return null;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === pagination.currentPage ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-10 h-10 p-0 ${
                                                pageNum === pagination.currentPage 
                                                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" 
                                                    : ""
                                            }`}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!pagination.hasNextPage}
                                className="flex items-center gap-1"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ActivityFeedPage
