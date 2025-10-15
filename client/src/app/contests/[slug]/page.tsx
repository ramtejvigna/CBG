"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { generateSlug } from '@/lib/challengeUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Trophy,
    Calendar,
    Clock,
    Users,
    Target,
    PlayCircle,
    AlertCircle,
    CheckCircle,
    XCircle,
    Timer,
    ArrowLeft,
    Zap
} from 'lucide-react'

interface Challenge {
    id: string
    contestId: string
    challengeId: string
    points: number
    order: number
    challenge: {
        title: string
        difficulty: "EASY" | "MEDIUM" | "HARD"
        description: string
    }
}

interface Contest {
    id: string
    title: string
    description: string
    createdAt: string
    startsAt: string
    endsAt: string
    registrationEnd: string
    status: "UPCOMING" | "REGISTRATION_OPEN" | "ONGOING" | "FINISHED"
    creatorId: string
    tags: string[]
    maxParticipants: number | null
    updatedAt: string
    points: number
    _count: {
        participants: number
    }
    challenges: Challenge[]
}

const ContestPage = () => {
    const { slug } = useParams()
    const router = useRouter()
    const { user } = useAuth()

    const [contest, setContest] = useState<Contest | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRegistered, setIsRegistered] = useState(false)
    const [registering, setRegistering] = useState(false)

    useEffect(() => {
        const fetchContestDetails = async () => {
            try {
                setLoading(true)
                setError(null)

                // First, we need to get the contest by title slug
                // Since we don't have a direct slug-to-ID endpoint, we'll get all contests
                // and find the one with matching slug
                const token = localStorage.getItem('auth-token')
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                }
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`
                }

                const contestsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests`, {
                    headers
                })

                if (!contestsResponse.ok) {
                    throw new Error('Failed to fetch contests')
                }

                const contests = await contestsResponse.json()
                const foundContest = contests.find((c: Contest) => generateSlug(c.title) === slug)

                if (!foundContest) {
                    throw new Error('Contest not found')
                }

                // Now get the detailed contest information
                const detailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${foundContest.id}`, {
                    headers
                })

                if (!detailResponse.ok) {
                    throw new Error('Failed to fetch contest details')
                }

                const contestDetails = await detailResponse.json()
                setContest(contestDetails)

                // Check registration status if user is logged in
                if (user && token) {
                    try {
                        const regResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${foundContest.id}/registration-status`, {
                            headers
                        })
                        if (regResponse.ok) {
                            const regData = await regResponse.json()
                            setIsRegistered(regData.isRegistered)
                        }
                    } catch (regError) {
                        console.error('Error checking registration status:', regError)
                    }
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
                console.error('Error fetching contest details:', err)
            } finally {
                setLoading(false)
            }
        }

        if (slug) {
            fetchContestDetails()
        }
    }, [slug, user])

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case "easy":
                return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            case "medium":
                return "bg-amber-500/20 text-amber-400 border-amber-500/30"
            case "hard":
                return "bg-rose-500/20 text-rose-400 border-rose-500/30"
            default:
                return "bg-slate-500/20 text-slate-400 border-slate-500/30"
        }
    }

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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ONGOING":
                return <PlayCircle className="w-4 h-4" />
            case "REGISTRATION_OPEN":
                return <Timer className="w-4 h-4" />
            case "UPCOMING":
                return <Clock className="w-4 h-4" />
            case "FINISHED":
                return <CheckCircle className="w-4 h-4" />
            default:
                return <AlertCircle className="w-4 h-4" />
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

    const handleRegistration = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (!contest) return

        try {
            setRegistering(true)
            setError(null)

            const token = localStorage.getItem('auth-token')
            if (!token) {
                router.push('/login')
                return
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${contest.id}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed')
            }

            setIsRegistered(true)
            setContest(prev => prev ? {
                ...prev,
                _count: { participants: prev._count.participants + 1 }
            } : null)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed')
        } finally {
            setRegistering(false)
        }
    }

    const handleChallengeClick = (challenge: Challenge) => {
        if (contest?.status === "ONGOING" && isRegistered) {
            // Navigate to challenge page with contest context
            const challengeSlug = generateSlug(challenge.challenge.title)
            router.push(`/challenges/${challengeSlug}?contest=${contest.id}`)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
                    <div className="mb-6">
                        <Skeleton className="h-8 w-32 bg-slate-700 mb-4" />
                        <Skeleton className="h-12 w-3/4 bg-slate-700 mb-2" />
                        <Skeleton className="h-6 w-full bg-slate-700" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Skeleton className="h-96 bg-slate-700" />
                        </div>
                        <div>
                            <Skeleton className="h-64 bg-slate-700" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !contest) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        className="mb-6 text-slate-300 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <Alert className="bg-red-500/10 border-red-500/30">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-400">
                            {error || 'Contest not found'}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
                {/* Back Button */}
                <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    className="mb-6 text-slate-300 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Contests
                </Button>

                {/* Contest Header */}
                <div className="mb-8">
                    <div className='flex justify-between gap-8 w-full'>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Trophy className="w-8 h-8 text-orange-500" />
                                <h1 className="text-3xl md:text-4xl font-bold text-white">{contest.title}</h1>
                            </div>

                            <p className="text-slate-300 text-lg mb-6">{contest.description}</p>

                            <div className="flex flex-wrap gap-3 mb-6">
                                <Badge variant="outline" className={`${getStatusColor(contest.status)} border flex items-center gap-1`}>
                                    {getStatusIcon(contest.status)}
                                    {contest.status === "REGISTRATION_OPEN"
                                        ? "Registration Open"
                                        : contest.status === "ONGOING"
                                            ? "Live Now"
                                            : contest.status === "FINISHED"
                                                ? "Completed"
                                                : "Upcoming"}
                                </Badge>

                                {contest.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="bg-slate-700 text-slate-300 capitalize">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            {contest.status === "REGISTRATION_OPEN" ? (
                                isRegistered ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Registered!</span>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleRegistration}
                                        disabled={registering}
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                                    >
                                        {registering ? "Registering..." : "Register for Contest"}
                                    </Button>
                                )
                            ) : contest.status === "ONGOING" ? (
                                isRegistered ? (
                                    <div className="text-center">
                                        <div className="flex items-center gap-2 text-green-400 mb-2">
                                            <PlayCircle className="w-5 h-5" />
                                            <span className="font-medium">Contest Active</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <XCircle className="w-5 h-5 mx-auto mb-2" />
                                        <p className="text-sm">Registration period has ended</p>
                                    </div>
                                )
                            ) : contest.status === "FINISHED" ? (
                                <div className="text-center text-slate-400">
                                    <CheckCircle className="w-5 h-5 mx-auto mb-2" />
                                    <p className="text-sm">Contest has ended</p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Timer className="w-5 h-5 mx-auto mb-2" />
                                    <p className="text-sm">Registration opens soon</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Contest Stats */}
                        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Contest Information</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-8 space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                                    <Calendar className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-slate-300 text-sm">Start Time</div>
                                        <div className="text-white font-medium text-sm">
                                            {formatDate(contest.startsAt)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                                    <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-slate-300 text-sm">
                                            {contest.status === "ONGOING" ? "Time Remaining" : "End Time"}
                                        </div>
                                        <div className="text-white font-medium text-sm">
                                            {contest.status === "ONGOING"
                                                ? getTimeRemaining(contest.endsAt)
                                                : formatDate(contest.endsAt)
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                                    <Users className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-slate-300 text-sm">Participants</div>
                                        <div className="text-white font-medium">
                                            {contest._count.participants}
                                            {contest.maxParticipants && ` / ${contest.maxParticipants}`}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                                    <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-slate-300 text-sm">Total Points</div>
                                        <div className="text-orange-400 font-bold">
                                            {contest.challenges?.reduce((sum, c) => sum + c.points, 0) || contest.points}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert className="mb-6 bg-red-500/10 border-red-500/30">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex items-center flex-wrap gap-8">
                    {/* Main Content - Challenges Table */}
                    <div className="lg:col-span-2">
                        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Target className="w-5 h-5 text-orange-500" />
                                    Contest Challenges ({contest.challenges?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {contest.challenges && contest.challenges.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-700 hover:bg-transparent">
                                                <TableHead className="text-slate-300 font-semibold">#</TableHead>
                                                <TableHead className="text-slate-300 font-semibold">Challenge</TableHead>
                                                <TableHead className="text-slate-300 font-semibold">Difficulty</TableHead>
                                                <TableHead className="text-slate-300 font-semibold text-right">Points</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {contest.challenges.map((challenge, index) => (
                                                <TableRow
                                                    key={challenge.id}
                                                    className={`border-slate-700 ${contest.status === "ONGOING" && isRegistered
                                                        ? "hover:bg-slate-700/50 cursor-pointer"
                                                        : "hover:bg-transparent"
                                                        }`}
                                                    onClick={() => handleChallengeClick(challenge)}
                                                >
                                                    <TableCell className="text-slate-400 font-mono">
                                                        {challenge.order}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="text-white font-medium mb-1">
                                                                {challenge.challenge.title}
                                                            </div>
                                                            <div className="text-slate-400 text-sm line-clamp-2">
                                                                {challenge.challenge.description}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getDifficultyColor(challenge.challenge.difficulty)} border text-xs`}
                                                        >
                                                            {challenge.challenge.difficulty}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Zap className="w-4 h-4 text-orange-500" />
                                                            <span className="text-orange-400 font-semibold">
                                                                {challenge.points}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8">
                                        <Target className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Challenges Available</h3>
                                        <p className="text-slate-500">
                                            {contest.status === "ONGOING" || contest.status === "FINISHED"
                                                ? "This contest doesn't have any challenges yet."
                                                : "Challenges will be revealed when the contest starts."}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ContestPage