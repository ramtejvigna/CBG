"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Users, Trophy, Star, ChevronRight, Zap, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { generateSlug } from "@/lib/challengeUtils"
import { Contest } from "@/lib/store"
import { useContests } from "@/hooks/useContests"

const ContestsPage = () => {
    const [activeTab, setActiveTab] = useState("upcoming")
    const [searchQuery, setSearchQuery] = useState("")
    
    const { user } = useAuth()
    const router = useRouter()

    // Use custom hook for contests management
    const {
        contests,
        isLoading: loading,
        error,
        registering,
        registrationSuccess,
        lastFetched,
        refreshContests,
        handleRegistration,
        getFilteredContests,
        clearError
    } = useContests()

    // const getDifficultyColor = (difficulty: string) => {
    //     switch (difficulty?.toLowerCase()) {
    //         case "easy":
    //             return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    //         case "medium":
    //             return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    //         case "hard":
    //             return "bg-rose-500/20 text-rose-400 border-rose-500/30"
    //         default:
    //             return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    //     }
    // }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ONGOING":
                return "bg-red-500/20 text-red-400 border-red-500/30"
            case "REGISTRATION_OPEN":
                return "bg-orange-500/20 text-orange-400 border-orange-500/30"
            case "UPCOMING":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30"
            case "FINISHED":
                return "bg-slate-500/20 text-slate-400 border-slate-500/30"
            default:
                return "bg-slate-500/20 text-slate-400 border-slate-500/30"
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

    const getTimeRemaining = (endDate: string) => {
        const now = new Date()
        const end = new Date(endDate)
        const diff = end.getTime() - now.getTime()

        if (diff < 0) return "Ended"

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (days > 0) return `${days}d ${hours}h left`
        if (hours > 0) return `${hours}h ${minutes}m left`
        return `${minutes}m left`
    }

    const handleContestRegistration = async (contestId: string) => {
        console.log(user)
        // if (!user) {
        //     router.push('/login')
        //     return
        // }

        // Use hook method for registration
        const success = await handleRegistration(contestId)
        if (!success) {
            // Error handling is already done in the store
            return
        }
    }

    const handleContestAction = (contest: Contest) => {
        if (contest.status === "REGISTRATION_OPEN") {
            if (contest.isRegistered) {
                // User is already registered, maybe show contest details or wait for contest to start
                return
            } else {
                handleContestRegistration(contest.id)
            }
        } else if (contest.status === "ONGOING") {
            const slug = generateSlug(contest.title);
            router.push(`/contests/${slug}`)
        } else if (contest.status === "FINISHED") {
            // Navigate to contest results leaderboard page using slug
            const slug = generateSlug(contest.title);
            router.push(`/contests/${slug}`)
        }
    }

    // Use hook methods for filtering
    const filteredContests = getFilteredContests(
        activeTab as 'upcoming' | 'live' | 'past',
        searchQuery
    )

    const ContestSkeleton = () => (
        <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 bg-slate-700" />
                <Skeleton className="h-4 w-full mt-2 bg-slate-700" />
                <div className="flex gap-2 mt-3">
                    <Skeleton className="h-6 w-16 bg-slate-700" />
                    <Skeleton className="h-6 w-16 bg-slate-700" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-4 w-full bg-slate-700" />
                        <Skeleton className="h-4 w-full bg-slate-700" />
                        <Skeleton className="h-4 w-full bg-slate-700" />
                        <Skeleton className="h-4 w-full bg-slate-700" />
                    </div>
                    <Skeleton className="h-10 w-24 bg-slate-700" />
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
                {/* Header Section */}
                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-orange-500" />
                            <h1 className="text-3xl md:text-4xl font-bold text-white">Contests</h1>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refreshContests()}
                            disabled={loading}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                    <p className="text-slate-400 text-lg">Compete with others, solve challenges, and climb the leaderboard</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search contests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>

                {/* Loading indicator for background refresh */}
                {loading && contests.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        Refreshing contests...
                    </div>
                )}

                {/* Cache info - show last updated time when data is available */}
                {contests.length > 0 && !loading && lastFetched > 0 && (
                    <div className="mb-4 text-xs text-slate-500">
                        Last updated: {new Date(lastFetched).toLocaleTimeString()}
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert className="mb-6 bg-red-500/10 border-red-500/30 relative">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-400 pr-8">{error}</AlertDescription>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearError}
                            className="absolute top-2 right-2 h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                            ×
                        </Button>
                    </Alert>
                )}

                {/* Success Alert */}
                {registrationSuccess && (
                    <Alert className="mb-6 bg-green-500/10 border-green-500/30">
                        <AlertCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-400">
                            Successfully registered for the contest!
                        </AlertDescription>
                    </Alert>
                )}

                {/* Tabs Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
                        <TabsTrigger
                            value="upcoming"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
                        >
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger
                            value="live"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
                        >
                            Live
                        </TabsTrigger>
                        <TabsTrigger
                            value="past"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
                        >
                            Past
                        </TabsTrigger>
                    </TabsList>

                    {/* Contests Grid */}
                    <TabsContent value={activeTab} className="mt-8">
                        {loading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <ContestSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredContests.length === 0 ? (
                            <div className="text-center py-16">
                                <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                                <h3 className="text-xl font-semibold text-slate-300 mb-2">No contests found</h3>
                                <p className="text-slate-500">
                                    {searchQuery ? "Try adjusting your search query" : "Check back later for new contests"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {filteredContests.map((contest: Contest, index: number) => (
                                    <Card
                                        key={contest.id}
                                        className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer group flex flex-col h-full"
                                        style={{
                                            animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
                                        }}
                                    >
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                                                        {contest.title}
                                                    </CardTitle>
                                                    <p className="text-sm text-slate-400 mt-2 line-clamp-2">{contest.description}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <Badge variant="outline" className={`${getStatusColor(contest.status)} border`}>
                                                    {contest.status === "REGISTRATION_OPEN"
                                                        ? "Registration Open"
                                                        : contest.status === "ONGOING"
                                                            ? "Live Now"
                                                            : contest.status === "FINISHED"
                                                                ? "Completed"
                                                                : "Upcoming"}
                                                </Badge>
                                                {contest.tags.slice(0, 2).map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs bg-slate-700 text-slate-300 capitalize">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-0 flex flex-col flex-1">
                                            <div className="flex-1 space-y-4">
                                                {/* Contest Stats Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-2 p-2 rounded bg-slate-700/50">
                                                        <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                        <span className="text-sm text-slate-300 truncate">{formatDate(contest.startsAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-2 rounded bg-slate-700/50">
                                                        <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                        <span className="text-sm text-slate-300 truncate">{getTimeRemaining(contest.endsAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-2 rounded bg-slate-700/50">
                                                        <Users className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                        <span className="text-sm text-slate-300">{contest._count.participants} participants</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-2 rounded bg-slate-700/50">
                                                        <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                        <span className="text-sm text-slate-300">{contest.points} points</span>
                                                    </div>
                                                </div>

                                                {/* Leaderboard Preview for Finished Contests */}
                                                {contest.status === "FINISHED" && contest.participants && contest.participants.length > 0 && (
                                                    <div className="pt-2 border-t border-slate-700">
                                                        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-yellow-500" />
                                                            Top Performers
                                                        </p>
                                                        <div className="space-y-1">
                                                            {contest.participants.slice(0, 3).map((participant: { user: { username: string; name: string; image: string | null } }, idx: number) => (
                                                                <div key={idx} className="flex items-center justify-between text-xs text-slate-400">
                                                                    <span className="flex items-center gap-2">
                                                                        <span className="text-yellow-500 font-bold">#{idx + 1}</span>
                                                                        {participant.user.name}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Button - Always at bottom */}
                                            <div className="pt-4 border-t border-slate-700 mt-auto">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleContestAction(contest)}
                                                    disabled={registering === contest.id}
                                                    className={`w-full font-semibold transition-all cursor-pointer ${
                                                        contest.status === "ONGOING"
                                                            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                                            : contest.status === "REGISTRATION_OPEN"
                                                                ? contest.isRegistered
                                                                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                                                    : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                                                                : contest.status === "UPCOMING"
                                                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                                                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                                                    }`}
                                                >
                                                    {registering === contest.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            Registering...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {contest.status === "ONGOING"
                                                                ? "Join Now"
                                                                : contest.status === "REGISTRATION_OPEN"
                                                                    ? contest.isRegistered
                                                                        ? "✓ Registered"
                                                                        : user
                                                                            ? "Register"
                                                                            : "Login to Register"
                                                                    : contest.status === "UPCOMING"
                                                                        ? contest.isRegistered
                                                                            ? "✓ Registered"
                                                                            : "Coming Soon"
                                                                        : "View Results"}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    )
}

export default ContestsPage
