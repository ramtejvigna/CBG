"use client"

import { useState } from "react"
import { useTheme } from "@/context/ThemeContext"
import { Search, Filter, Code, Clock, Users, Star, Tag, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Challenge {
    id: number
    title: string
    description: string
    difficulty: string
    category: string
    submissions: number
    successRate: number
    likes: number
    tags: string[]
    points: number
}

type SortableField = keyof Challenge

const ChallengesPage = () => {
    const { theme } = useTheme()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedDifficulty, setSelectedDifficulty] = useState("all")
    const [sortBy, setSortBy] = useState<SortableField>("title")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

    const challenges = [
        {
            id: 1,
            title: "Two Sum Problem",
            description: "Find two numbers in an array that add up to a target sum",
            difficulty: "Easy",
            category: "Arrays",
            submissions: 15420,
            successRate: 85,
            likes: 1247,
            tags: ["Hash Table", "Array"],
            points: 100,
        },
        {
            id: 2,
            title: "Binary Tree Inorder Traversal",
            description: "Traverse a binary tree using inorder traversal method",
            difficulty: "Medium",
            category: "Trees",
            submissions: 8934,
            successRate: 72,
            likes: 892,
            tags: ["Tree", "Recursion", "Stack"],
            points: 200,
        },
        {
            id: 3,
            title: "Longest Palindromic Substring",
            description: "Find the longest palindromic substring in a given string",
            difficulty: "Medium",
            category: "Strings",
            submissions: 12567,
            successRate: 68,
            likes: 1156,
            tags: ["String", "Dynamic Programming"],
            points: 250,
        },
        {
            id: 4,
            title: "Merge k Sorted Lists",
            description: "Merge k sorted linked lists and return it as one sorted list",
            difficulty: "Hard",
            category: "Linked Lists",
            submissions: 5432,
            successRate: 45,
            likes: 743,
            tags: ["Linked List", "Divide and Conquer", "Heap"],
            points: 400,
        },
        {
            id: 5,
            title: "Valid Parentheses",
            description: "Determine if the input string has valid parentheses",
            difficulty: "Easy",
            category: "Stacks",
            submissions: 18765,
            successRate: 91,
            likes: 1534,
            tags: ["Stack", "String"],
            points: 80,
        },
        {
            id: 6,
            title: "Dijkstra's Shortest Path",
            description: "Implement Dijkstra's algorithm to find shortest paths",
            difficulty: "Hard",
            category: "Graphs",
            submissions: 3421,
            successRate: 38,
            likes: 567,
            tags: ["Graph", "Shortest Path", "Priority Queue"],
            points: 500,
        },
        {
            id: 7,
            title: "Maximum Subarray",
            description: "Find the contiguous subarray with the largest sum",
            difficulty: "Easy",
            category: "Arrays",
            submissions: 14523,
            successRate: 78,
            likes: 1089,
            tags: ["Array", "Dynamic Programming"],
            points: 120,
        },
        {
            id: 8,
            title: "LRU Cache",
            description: "Design and implement a Least Recently Used (LRU) cache",
            difficulty: "Medium",
            category: "Design",
            submissions: 7834,
            successRate: 62,
            likes: 934,
            tags: ["Hash Table", "Linked List", "Design"],
            points: 300,
        },
    ]

    const categories = ["all", "Arrays", "Trees", "Strings", "Linked Lists", "Stacks", "Graphs", "Design", "Dynamic Programming"]
    const difficulties = ["all", "Easy", "Medium", "Hard"]

    const getDifficultyColor = (difficulty: string): string => {
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

    const getSuccessRateColor = (rate: number): string => {
        if (rate >= 80) return "text-green-500"
        if (rate >= 60) return "text-yellow-500"
        return "text-red-500"
    }

    const handleSort = (field: SortableField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
    }

    const filteredChallenges = challenges
        .filter((challenge) => {
            const matchesSearch =
                challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === "all" || challenge.category === selectedCategory
            const matchesDifficulty = selectedDifficulty === "all" || challenge.difficulty === selectedDifficulty

            return matchesSearch && matchesCategory && matchesDifficulty
        })
        .sort((a, b) => {
            const aValue = a[sortBy]
            const bValue = b[sortBy]

            if (typeof aValue === "string" && typeof bValue === "string") {
                const aLower = aValue.toLowerCase()
                const bLower = bValue.toLowerCase()
                return sortOrder === "asc" ?
                    aLower.localeCompare(bLower) :
                    bLower.localeCompare(aLower)
            }

            if (sortOrder === "asc") {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
            }
        })

    const SortIcon = ({ field }: { field: SortableField }) => {
        if (sortBy !== field) return null
        return sortOrder === "asc" ?
            <ChevronUp className="w-4 h-4 inline ml-1" /> :
            <ChevronDown className="w-4 h-4 inline ml-1" />
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
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category === "all" ? "All Categories" : category}
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
                                    {difficulties.map((difficulty) => (
                                        <option key={difficulty} value={difficulty}>
                                            {difficulty === "all" ? "All Difficulties" : difficulty}
                                        </option>
                                    ))}
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

                {/* Challenges Table */}
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
                                    <th
                                        className={`px-6 py-4 text-left text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                        onClick={() => handleSort("category")}
                                    >
                                        Category <SortIcon field="category" />
                                    </th>
                                    <th
                                        className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                        onClick={() => handleSort("successRate")}
                                    >
                                        Success Rate <SortIcon field="successRate" />
                                    </th>
                                    <th
                                        className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                        onClick={() => handleSort("submissions")}
                                    >
                                        Submissions <SortIcon field="submissions" />
                                    </th>
                                    <th
                                        className={`px-6 py-4 text-center text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-900"} cursor-pointer hover:bg-opacity-80`}
                                        onClick={() => handleSort("likes")}
                                    >
                                        Likes <SortIcon field="likes" />
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
                                {filteredChallenges.map((challenge, index) => (
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
                                                <div className="flex flex-wrap gap-1">
                                                    {challenge.tags.map((tag) => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
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
                                                {challenge.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-semibold ${getSuccessRateColor(challenge.successRate)}`}>
                                                {challenge.successRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="w-4 h-4 text-orange-500" />
                                                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                    {challenge.submissions.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                    {challenge.likes}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                {challenge.points}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Button className="cursor-pointer bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                                                <Code className="w-4 h-4" />
                                                <Link
                                                    href={`/challenges/${challenge.title.toLowerCase().replace(/\s+/g, '-')}`}
                                                >
                                                    Solve
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* No Results Message */}
                {filteredChallenges.length === 0 && (
                    <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No challenges found</h3>
                        <p>Try adjusting your filters or search terms.</p>
                    </div>
                )}

                {/* Summary Stats */}
                {filteredChallenges.length > 0 && (
                    <div className={`mt-6 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-center`}>
                        Showing {filteredChallenges.length} of {challenges.length} challenges
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChallengesPage