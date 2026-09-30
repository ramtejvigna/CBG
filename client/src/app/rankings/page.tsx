"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Crown, Flame, Search, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
    rank: number;
    id: string;
    username: string;
    name?: string;
    image?: string;
    points: number;
    solved: number;
    level: number;
    streakDays: number;
}

const podiumStyles = {
    1: { ring: "ring-amber-400", text: "text-amber-400", glow: "from-amber-400/25", label: "Champion" },
    2: { ring: "ring-gray-300", text: "text-gray-400", glow: "from-gray-300/20", label: "Runner-up" },
    3: { ring: "ring-orange-700", text: "text-orange-600", glow: "from-orange-700/25", label: "Third place" },
} as const;

export default function RankingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard?limit=100`);
                if (!response.ok) {
                    throw new Error('Failed to fetch rankings');
                }
                const data = await response.json();
                setUsers(data.leaderboard || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRankings();
    }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) => u.username.toLowerCase().includes(q) || (u.name?.toLowerCase() || "").includes(q)
        );
    }, [users, searchQuery]);

    const podium = users.slice(0, 3);

    return (
        <div className="relative isolate">
            <div className="aurora -z-10 opacity-70" />
            <div className="bg-grid mask-fade-b absolute inset-0 -z-10" />

            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <header className="mb-12 text-center">
                    <span className="eyebrow mb-4">
                        <BarChart3 className="h-3.5 w-3.5" /> Global leaderboard
                    </span>
                    <h1 className="text-4xl font-bold sm:text-5xl">
                        Top coders, <span className="text-gradient">ranked.</span>
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                        Every accepted solution earns points. Solve more, keep your streak alive and climb.
                    </p>
                </header>

                {error && (
                    <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">Couldn&apos;t load the leaderboard right now. Please try again in a moment.</div>
                )}

                {/* Podium */}
                {isLoading ? (
                    <div className="mb-12 grid gap-5 md:grid-cols-3">
                        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                    </div>
                ) : podium.length > 0 && (
                    <div className="mb-12 grid gap-5 md:grid-cols-3 md:items-end">
                        {[podium[1], podium[0], podium[2]].map((player, i) => {
                            if (!player) return <div key={`empty-${i}`} className="hidden md:block" />;
                            const style = podiumStyles[player.rank as 1 | 2 | 3];
                            const first = player.rank === 1;
                            return (
                                <Link
                                    key={player.id}
                                    href={`/profile/${player.username}`}
                                    className={cn(
                                        "surface surface-hover group relative flex flex-col items-center overflow-hidden px-6 pb-6 text-center",
                                        first ? "order-first pt-12 md:order-none md:pb-10" : "pt-8"
                                    )}
                                >
                                    <div className={cn("absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent", style.glow)} />
                                    <div className="relative">
                                        {first && <Crown className="absolute -top-8 left-1/2 h-7 w-7 -translate-x-1/2 fill-amber-400 text-amber-400" />}
                                        <UserAvatar
                                            userId={player.id}
                                            userName={player.name || player.username}
                                            hasImage={!!player.image}
                                            size="xl"
                                            showSkeleton={false}
                                            className={cn("ring-4 ring-offset-4 ring-offset-card", style.ring, first && "h-20 w-20")}
                                        />
                                    </div>
                                    <span className={cn("relative mt-4 text-xs font-semibold uppercase tracking-wider", style.text)}>
                                        #{player.rank} · {style.label}
                                    </span>
                                    <h3 className="relative mt-1 max-w-full truncate text-xl font-bold group-hover:text-primary">
                                        {player.name || player.username}
                                    </h3>
                                    <p className="relative text-sm text-muted-foreground">@{player.username}</p>
                                    <div className="relative mt-5 grid w-full grid-cols-3 gap-2">
                                        <Stat label="Points" value={player.points.toLocaleString()} highlight />
                                        <Stat label="Solved" value={player.solved} />
                                        <Stat label="Streak" value={`${player.streakDays}d`} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Table */}
                <div className="surface overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <Trophy className="h-5 w-5 text-primary" /> All rankings
                        </h2>
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search coders…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border bg-muted/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/15"
                            />
                        </div>
                    </div>

                    <div className="hidden grid-cols-[4rem_1fr_7rem_6rem_6rem] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
                        <span>Rank</span>
                        <span>Coder</span>
                        <span className="text-right">Points</span>
                        <span className="text-right">Solved</span>
                        <span className="text-right">Streak</span>
                    </div>

                    {isLoading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-sm text-muted-foreground">
                            {searchQuery ? "No coders match your search." : "No rankings yet. Solve a problem to be the first!"}
                        </div>
                    ) : (
                        filtered.map((player) => (
                            <Link
                                key={player.id}
                                href={`/profile/${player.username}`}
                                className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/50 sm:grid-cols-[4rem_1fr_7rem_6rem_6rem]"
                            >
                                <span
                                    className={cn(
                                        "grid h-8 w-8 place-items-center rounded-lg font-mono text-sm font-semibold",
                                        player.rank <= 3 ? "bg-primary/15 text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {player.rank}
                                </span>
                                <div className="flex min-w-0 items-center gap-3">
                                    <UserAvatar
                                        userId={player.id}
                                        userName={player.name || player.username}
                                        hasImage={!!player.image}
                                        size="sm"
                                        showSkeleton={false}
                                    />
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">{player.name || player.username}</div>
                                        <div className="truncate text-xs text-muted-foreground">@{player.username} · Lvl {player.level}</div>
                                    </div>
                                </div>
                                <span className="text-right font-mono text-sm font-semibold text-primary">{player.points.toLocaleString()}</span>
                                <span className="hidden text-right text-sm sm:block">{player.solved}</span>
                                <span className="hidden items-center justify-end gap-1 text-sm sm:flex">
                                    {player.streakDays > 0 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                                    {player.streakDays}d
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

const Stat = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="rounded-xl bg-muted/60 px-2 py-2.5">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className={cn("font-display text-base font-bold", highlight && "text-primary")}>{value}</div>
    </div>
);
