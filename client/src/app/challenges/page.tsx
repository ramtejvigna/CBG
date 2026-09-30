"use client"

import { useState, useMemo, type ReactNode } from "react"
import { Search, Code2, Users, Heart, ChevronUp, ChevronDown, ArrowRight, Layers, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { generateChallengeUrl } from "@/lib/challengeUtils"
import useChallenges from "@/hooks/useChallenges"

type SortableField = 'title' | 'difficulty' | 'points' | '_count'

const ChallengesPage = () => {
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
                return "bg-foreground/5 text-foreground/80 ring-foreground/15"
            case "medium":
                return "bg-orange-500/10 text-orange-300 ring-orange-400/25"
            case "hard":
                return "bg-orange-500/20 text-orange-500 ring-orange-500/45"
            case "expert":
                return "bg-orange-500 text-white ring-orange-500"
            default:
                return "bg-muted text-muted-foreground ring-border"
        }
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

    const difficulties = ["all", "EASY", "MEDIUM", "HARD", "EXPERT"]

    const counts = useMemo(() => {
        const byDifficulty: Record<string, number> = {}
        challenges.forEach((c) => {
            byDifficulty[c.difficulty] = (byDifficulty[c.difficulty] || 0) + 1
        })
        return byDifficulty
    }, [challenges])

    const SortHeader = ({ field, children, className = "" }: { field: SortableField; children: ReactNode; className?: string }) => (
        <button
            onClick={() => handleSort(field)}
            className={`inline-flex items-center gap-0.5 uppercase tracking-wider transition-colors hover:text-foreground ${sortBy === field ? "text-foreground" : ""} ${className}`}
        >
            {children}
            <SortIcon field={field} />
        </button>
    )

    if (error) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="surface max-w-md p-10 text-center">
                    <Code2 className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <h3 className="mb-2 text-xl font-semibold">Couldn&apos;t load challenges</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative isolate">
            <div className="aurora -z-10 opacity-60" />
            <div className="bg-grid mask-fade-b absolute inset-0 -z-10" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <span className="eyebrow mb-4">
                            <Layers className="h-3.5 w-3.5" /> Problem set
                        </span>
                        <h1 className="text-4xl font-bold sm:text-5xl">
                            Pick your <span className="text-gradient">next battle</span>
                        </h1>
                        <p className="mt-3 max-w-xl text-muted-foreground">
                            Hand-picked problems from easy warm-ups to expert brain-benders. Every solve earns points.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {["EASY", "MEDIUM", "HARD"].map((d) => (
                            <div key={d} className="surface min-w-20 px-4 py-3 text-center">
                                <div className="font-display text-2xl font-bold">{counts[d] || 0}</div>
                                <div className={`text-[11px] font-semibold uppercase tracking-wide ${getDifficultyColor(d).split(" ")[1]}`}>{d.toLowerCase()}</div>
                            </div>
                        ))}
                    </div>
                </header>

                {/* Filters */}
                <div className="surface mb-6 flex flex-col gap-4 p-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by title or description…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-xl border border-border bg-muted/60 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/15"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/60 p-1">
                        {difficulties.map((d) => (
                            <button
                                key={d}
                                onClick={() => setSelectedDifficulty(d)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                                    selectedDifficulty === d
                                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {d === "all" ? "All" : d.toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-11 w-full appearance-none rounded-xl border border-border bg-muted/60 pl-9 pr-9 text-sm focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/15 lg:w-52"
                        >
                            <option value="all">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>

                {/* List */}
                <div className="surface overflow-hidden">
                    <div className="hidden grid-cols-[1fr_7rem_10rem_8rem_5rem_5rem_7rem] items-center gap-4 border-b border-border px-5 py-3 text-xs font-semibold text-muted-foreground md:grid">
                        <SortHeader field="title">Problem</SortHeader>
                        <SortHeader field="difficulty">Difficulty</SortHeader>
                        <span className="uppercase tracking-wider">Category</span>
                        <SortHeader field="_count" className="justify-end">Submissions</SortHeader>
                        <span className="text-right uppercase tracking-wider">Likes</span>
                        <SortHeader field="points" className="justify-end">Points</SortHeader>
                        <span />
                    </div>

                    {loading ? (
                        <div className="divide-y divide-border">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 px-5 py-4">
                                    <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                                    <div className="hidden h-4 w-24 animate-pulse rounded bg-muted md:block" />
                                </div>
                            ))}
                        </div>
                    ) : filteredAndSortedChallenges.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                                <Code2 className="h-7 w-7" />
                            </span>
                            <h3 className="mt-4 text-lg font-semibold">No challenges found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {filteredAndSortedChallenges.map((challenge, index) => (
                                <li key={index}>
                                    <Link
                                        href={generateChallengeUrl(challenge.title)}
                                        className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-muted/50 md:grid-cols-[1fr_7rem_10rem_8rem_5rem_5rem_7rem]"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="hidden w-6 shrink-0 font-mono text-xs text-muted-foreground sm:block">{index + 1}</span>
                                            <span className="truncate font-semibold transition-colors group-hover:text-primary">{challenge.title}</span>
                                        </div>
                                        <span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${getDifficultyColor(challenge.difficulty)}`}>
                                                {challenge.difficulty.toLowerCase()}
                                            </span>
                                        </span>
                                        <span className="hidden truncate text-sm text-muted-foreground md:block">{challenge.category.name}</span>
                                        <span className="hidden items-center justify-end gap-1.5 text-sm text-muted-foreground md:flex">
                                            <Users className="h-3.5 w-3.5" />
                                            {(challenge._count?.submissions ?? 0).toLocaleString()}
                                        </span>
                                        <span className="hidden items-center justify-end gap-1.5 text-sm text-muted-foreground md:flex">
                                            <Heart className="h-3.5 w-3.5" />
                                            {challenge._count?.likes ?? 0}
                                        </span>
                                        <span className="hidden text-right font-display font-bold md:block">{challenge.points}</span>
                                        <span className="hidden justify-end md:flex">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-all group-hover:border-transparent group-hover:bg-brand group-hover:text-white">
                                                Solve <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {!loading && filteredAndSortedChallenges.length > 0 && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Showing {filteredAndSortedChallenges.length} of {challenges.length} challenges
                    </p>
                )}
            </div>
        </div>
    )
}

export default ChallengesPage

