"use client"

import { useState, useEffect } from "react"
import { useThemeStore } from "@/lib/store/themeStore"
import { useAuthStore } from "@/lib/store"
import useActivities, { Activity } from "@/hooks/useActivities"
import { ActivityListSkeleton } from "@/components/ActivitySkeleton"
import { Code, Trophy, Star, Clock, CheckCircle, TrendingUp, Award, Target, Zap, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ActivityFeedPage = () => {
    const { theme } = useThemeStore()
    const { user, loading: authLoading } = useAuthStore()
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
        type: activeFilter === "all" ? undefined : activeFilter
    })

    // Show loading if auth is still loading
    if (authLoading) {
        return (
            <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="container mx-auto px-6 py-8">
                    <ActivityListSkeleton theme={theme} />
                </div>
            </div>
        )
    }

    // Show login prompt if no user
    if (!user) {
        return (
            <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="container mx-auto px-6 py-8">
                    <div className="text-center">
                        <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-4`}>
                            Please log in to view your activity feed
                        </h1>
                    </div>
                </div>
            </div>
        )
    }

    // Get user profile data for stats
    const userProfile = user?.userProfile
    
    // Combine activity statistics with user profile data for comprehensive stats
    const stats = {
        // Total points from user profile (accumulated over time)
        totalPoints: userProfile?.points || 0,
        // Problems solved from user profile (total count)
        problemsSolved: userProfile?.solved || 0,
        // Current streak from user profile
        currentStreak: userProfile?.streakDays || 0,
        // Contest activities from activity statistics (activity-based count)
        contestsParticipated: statistics?.typeBreakdown?.CONTEST || 0,
        // Rating calculated from user rank
        averageRating: userProfile?.rank ? Math.max(800, 2000 - userProfile.rank * 5) : 1200,
    }

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

    const getResultColor = (result: string) => {
        if (!result) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        const lowerResult = result.toLowerCase();
        
        // Success states
        if (lowerResult.includes('accepted') || 
            lowerResult.includes('completed') || 
            lowerResult.includes('success') ||
            lowerResult.includes('solved') ||
            lowerResult === 'earned' ||
            lowerResult === 'achieved') {
            return "bg-green-500/20 text-green-400 border-green-500/30"
        }
        
        // Error states
        if (lowerResult.includes('wrong') || 
            lowerResult.includes('failed') ||
            lowerResult.includes('error') ||
            lowerResult.includes('rejected')) {
            return "bg-red-500/20 text-red-400 border-red-500/30"
        }
        
        // Warning states
        if (lowerResult.includes('time_limit') || 
            lowerResult.includes('memory_limit') ||
            lowerResult.includes('timeout') ||
            lowerResult.includes('partial')) {
            return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        }
        
        // Processing states
        if (lowerResult.includes('pending') || 
            lowerResult.includes('running') ||
            lowerResult.includes('in_progress') ||
            lowerResult.includes('submitted')) {
            return "bg-blue-500/20 text-blue-400 border-blue-500/30"
        }
        
        // Contest states
        if (lowerResult.includes('participated') ||
            lowerResult.includes('joined') ||
            lowerResult.includes('registered')) {
            return "bg-purple-500/20 text-purple-400 border-purple-500/30"
        }
        
        // Default
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }

    const formatActivityDescription = (activity: Activity) => {
        if (!activity || !activity.result) {
            return 'No description available';
        }
        
        const baseDescription = activity.result;
        
        try {
            switch (activity.type) {
                case "CHALLENGE":
                    return `Challenge ${baseDescription.toLowerCase()}`;
                case "CONTEST":
                    return `Contest ${baseDescription.toLowerCase()}`;
                case "DISCUSSION":
                    return `Discussion ${baseDescription.toLowerCase()}`;
                default:
                    return baseDescription;
            }
        } catch (error) {
            console.error('Error formatting activity description:', error);
            return baseDescription || 'No description available';
        }
    }

    const formatActivityTime = (time: string) => {
        // If time is in format like "00:02:30" (duration), format it nicely
        if (time && typeof time === 'string' && time.includes(':')) {
            const parts = time.split(':');
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            const seconds = parseInt(parts[2]);
            
            if (hours > 0) {
                return `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${seconds}s`;
            } else {
                return `${seconds}s`;
            }
        }
        
        // If it's a different format, return as is
        return time || 'N/A';
    }

    const formatTimeAgo = (timestamp: string) => {
        if (!timestamp) return "Unknown time";
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
        setFilter(filter === "all" ? "all" : filter)
        setCurrentPage(1)
        setPage(1)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        setPage(page)
    }

    const filters = [
        { 
            key: "all", 
            label: "All Activity", 
            count: statistics?.totalActivities || 0 
        },
        {
            key: "CHALLENGE",
            label: "Challenges",
            count: statistics?.typeBreakdown?.CHALLENGE || 0,
        },
        {
            key: "CONTEST",
            label: "Contests", 
            count: statistics?.typeBreakdown?.CONTEST || 0,
        },
        {
            key: "DISCUSSION",
            label: "Discussions",
            count: statistics?.typeBreakdown?.DISCUSSION || 0,
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
                            className="mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
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
                            { 
                                label: "Total Points", 
                                value: stats.totalPoints.toLocaleString(), 
                                icon: <Star className="w-5 h-5 text-yellow-500" /> 
                            },
                            {
                                label: "Problems Solved",
                                value: stats.problemsSolved.toLocaleString(),
                                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                            },
                            {
                                label: "Current Streak",
                                value: `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`,
                                icon: <Zap className="w-5 h-5 text-blue-500" />,
                            },
                            {
                                label: "Contest Activities",
                                value: stats.contestsParticipated.toLocaleString(),
                                icon: <Trophy className="w-5 h-5 text-purple-500" />,
                            },
                            { 
                                label: "Current Rating", 
                                value: stats.averageRating.toLocaleString(), 
                                icon: <TrendingUp className="w-5 h-5 text-red-500" /> 
                            },
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
                                                {loading && !stat.value ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    stat.value
                                                )}
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
                    <div className={`flex space-x-1 p-1 rounded-lg w-fit ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                    }`}>
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
                                {filter.label} {loading ? (
                                    <Loader2 className="w-3 h-3 inline ml-1 animate-spin" />
                                ) : (
                                    `(${filter.count})`
                                )}
                            </button>
                        ))}
                    </div>                        {/* Refresh Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refetch}
                            className={`flex items-center gap-2 ${
                                theme === "dark" 
                                    ? "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700" 
                                    : "border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
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
                {!loading && activities && activities.length > 0 && (
                    <div className="space-y-4">
                        {activities.filter(activity => activity && activity.id).map((activity, index) => (
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
                                        <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type || "")}</div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-1`}>
                                                        {activity.name || "Unknown Activity"}
                                                    </h3>
                                                    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                        {formatActivityDescription(activity)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Badge className={`${getResultColor(activity.result)} border text-xs`}>
                                                        {activity.result || "No result"}
                                                    </Badge>
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
                                                            Type: {activity.type || "Unknown"}
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
                {!loading && (!activities || activities.length === 0) && (
                    <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {getActivityIcon(activeFilter === "all" ? "CHALLENGE" : activeFilter)}
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            {activeFilter === "all" ? (
                                <Target className="w-16 h-16 opacity-50" />
                            ) : activeFilter === "CHALLENGE" ? (
                                <Code className="w-16 h-16 opacity-50" />
                            ) : activeFilter === "CONTEST" ? (
                                <Trophy className="w-16 h-16 opacity-50" />
                            ) : (
                                <Target className="w-16 h-16 opacity-50" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            {activeFilter === "all" 
                                ? "No activity found" 
                                : `No ${activeFilter.toLowerCase()} activities found`
                            }
                        </h3>
                        <p>
                            {activeFilter === "all" 
                                ? "Start solving challenges to see your activity here!" 
                                : activeFilter === "CHALLENGE"
                                ? "Start solving challenges to see your challenge activities!"
                                : activeFilter === "CONTEST"
                                ? "Participate in contests to see your contest activities!"
                                : "Start participating to see your activities!"
                            }
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && pagination && pagination.totalPages > 1 && activities && activities.length > 0 && (
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
                                className={`flex items-center gap-1 ${
                                    theme === "dark" 
                                        ? "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700" 
                                        : "border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
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
                                                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white border-0" 
                                                    : theme === "dark"
                                                        ? "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
                                                        : "border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                                className={`flex items-center gap-1 ${
                                    theme === "dark" 
                                        ? "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700" 
                                        : "border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
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
