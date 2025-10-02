"use client"

import { useState, useMemo } from "react"
import { useTheme } from "@/context/ThemeContext"
import { Search, Filter, Code, Users, Star, Tag, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { generateChallengeUrl } from "@/lib/challengeUtils"
import useChallenges from "@/hooks/useChallenges"
import { Challenge } from "@/lib/store/challengesStore"

type SortableField = 'title' | 'difficulty' | 'points' | '_count'

const ChallengesPage = () => {
    const { theme } = useTheme()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedDifficulty, setSelectedDifficulty] = useState("all")
    const [sortBy, setSortBy] = useState<SortableField>("title")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

    const { challenges, categories, loading, error } = useChallenges({
        category: selectedCategory,
        difficulty: selectedDifficulty
    })

    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty.toLowerCase()) {
            case "easy":
                return "bg-green-500/20 text-green-400 border-green-500/30"
            case "medium":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            case "hard":
                return "bg-red-500/20 text-red-400 border-red-500/30"
            case "expert":
                return "bg-purple-500/20 text-purple-400 border-purple-500/30"
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30"
        }
    }

    const getSuccessRateColor = (rate: number): string => {
        if (rate >= 80) return "text-green-500"
        if (rate >= 60) return "text-yellow-500"
        return "text-red-500"
    }

    const calculateSuccessRate = (challenge: Challenge): number => {
        // Mock calculation - you might want to add this field to your API response
        return Math.floor(Math.random() * 40) + 60; // Random between 60-100
    }

    const handleSort = (field: SortableField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
    }

    const filteredAndSortedChallenges = useMemo(() => {
        const filtered = challenges.filter((challenge) => {
            const matchesSearch =
                challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                challenge.description.toLowerCase().includes(searchQuery.toLowerCase())

            return matchesSearch
        })

        return filtered.sort((a, b) => {
            let aValue: string | number, bValue: string | number

            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase()
                    bValue = b.title.toLowerCase()
                    break
                case 'difficulty':
                    const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3, 'EXPERT': 4 }
                    aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder]
                    bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
                    break
                case 'points':
                    aValue = a.points
                    bValue = b.points
                    break
                case '_count':
                    aValue = a._count?.submissions ?? 0
                    bValue = b._count?.submissions ?? 0
                    break
                default:
                    aValue = a.title.toLowerCase()
                    bValue = b.title.toLowerCase()
            }

            if (sortOrder === "asc") {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
            }
        })
    }, [challenges, searchQuery, sortBy, sortOrder])

    const SortIcon = ({ field }: { field: SortableField }) => {
        if (sortBy !== field) return null
        return sortOrder === "asc" ?
            <ChevronUp className="w-4 h-4 inline ml-1" /> :
            <ChevronDown className="w-4 h-4 inline ml-1" />
    }

    if (error) {
        return (
            <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
                <div className="text-center">
                    <Code className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-semibold mb-2 text-red-500">Error loading challenges</h3>
                    <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
            <div className="container mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className={`text-4xl font-bold text-transparent pb-2 bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-2`}>
                                Coding Challenges
                            </h1>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                Sharpen your programming skills with our curated challenges
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap justify-between gap-4 mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-500" />
                                <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                    Category:
                                </span>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className={`px-3 py-1 rounded-md border ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                                        } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                    Difficulty:
                                </span>
                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className={`px-3 py-1 rounded-md border ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                                        } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                                >
                                    <option value="all">All Difficulties</option>
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                    <option value="EXPERT">Expert</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search challenges..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-10 pr-4 py-2 rounded-lg border ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                        } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <Code className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                        <h3 className="text-xl font-semibold mb-2">Loading challenges...</h3>
                        <p>Please wait while we fetch the latest coding challenges.</p>
                    </div>
                )}

                {/* Challenges Table */}
                {!loading && (
                    <div className={`rounded-lg overflow-hidden shadow-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                                    <tr>
                                        <th
                                            className={`px-6 py-4 text-left text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                            onClick={() => handleSort("title")}
                                        >
                                            Problem <SortIcon field="title" />
                                        </th>
                                        <th
                                            className={`px-6 py-4 text-left text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                            onClick={() => handleSort("difficulty")}
                                        >
                                            Difficulty <SortIcon field="difficulty" />
                                        </th>
                                        <th className={`px-6 py-4 text-left text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
                                            Category
                                        </th>
                                        <th className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
                                            Success Rate
                                        </th>
                                        <th
                                            className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                            onClick={() => handleSort("_count")}
                                        >
                                            Submissions <SortIcon field="_count" />
                                        </th>
                                        <th className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
                                            Likes
                                        </th>
                                        <th
                                            className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                            onClick={() => handleSort("points")}
                                        >
                                            Points <SortIcon field="points" />
                                        </th>
                                        <th className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedChallenges.map((challenge, index) => {
                                        const successRate = calculateSuccessRate(challenge);
                                        return (
                                            <tr
                                                key={challenge.id}
                                                className={`border-t transition-colors duration-200 py-4 ${theme === "dark"
                                                    ? "border-gray-700 hover:bg-gray-700/50"
                                                    : "border-gray-200 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-4`}>
                                                            {challenge.title}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`${getDifficultyColor(challenge.difficulty)} border text-xs`}>
                                                        {challenge.difficulty}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                        {challenge.category.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-semibold ${getSuccessRateColor(successRate)}`}>
                                                        {successRate}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="w-4 h-4 text-orange-500" />
                                                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                            {challenge._count?.submissions.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                            {challenge._count?.likes}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                        {challenge.points}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={generateChallengeUrl(challenge.title)}
                                                    >
                                                        <Button className="cursor-pointer bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                                                            <Code className="w-4 h-4 mr-2" />
                                                            Solve
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* No Results Message */}
                {!loading && filteredAndSortedChallenges.length === 0 && (
                    <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No challenges found</h3>
                        <p>Try adjusting your filters or search terms.</p>
                    </div>
                )}

                {/* Summary Stats */}
                {!loading && filteredAndSortedChallenges.length > 0 && (
                    <div className={`mt-6 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-center`}>
                        Showing {filteredAndSortedChallenges.length} of {challenges.length} challenges
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChallengesPage