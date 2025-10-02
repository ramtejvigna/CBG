"use client";

import { Key, useEffect, useState } from "react";
import { Award, Medal, Search, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useThemeStore } from "@/lib/store/themeStore";
import { Skeleton } from "@/components/ui/skeleton"; 

interface User {
    points: number;
    solved?: number;
    user: {
        id: string;
        username: string;
        name?: string;
        image?: string;
    };
    badges?: { id: string; name: string; }[];
}

export default function RankingsPage() {
    const { theme } = useThemeStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [topUsers, setTopUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRankings = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`);
            if (!response.ok) {
                throw new Error('Failed to fetch rankings');
            }
            const data = await response.json();
            setTopUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-8 px-24 py-12 animate-in fade-in-50 duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>

                <Skeleton className="h-10 w-full sm:w-96" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[0, 1, 2].map((index) => (
                        <Skeleton key={index} className="h-96 rounded-lg" />
                    ))}
                </div>

                <Skeleton className="h-[500px] rounded-lg" />
            </div>
        );
    }

    return (
        <div className={`space-y-8 py-12 px-24 animate-in fade-in-50 duration-500 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
                    <p className={theme === 'dark' ? "text-gray-400" : "text-gray-600"}>
                        See the top coders on our platform and their achievements
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                    <Input
                        type="search"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-9 ${theme === 'dark'
                                ? 'bg-gray-800/50 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                    />
                </div>
            </div>

            {error && (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {topUsers
                    .filter(user => 
                        user.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (user.user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 3)
                    .map((user, index) => (
                    <div
                        key={user.user.id}
                        className={`rounded-lg p-6 flex flex-col items-center text-center transition-all ${theme === 'dark'
                                ? (index === 0
                                    ? "border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent border"
                                    : index === 1
                                        ? "border-gray-400/30 bg-gradient-to-b from-gray-400/10 to-transparent border"
                                        : "border-amber-700/30 bg-gradient-to-b from-amber-700/10 to-transparent border")
                                : (index === 0
                                    ? "bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 shadow-sm"
                                    : index === 1
                                        ? "bg-gradient-to-b from-gray-50 to-white border border-gray-200 shadow-sm"
                                        : "bg-gradient-to-b from-amber-50 to-white border border-amber-200 shadow-sm")
                            }`}
                    >
                        {index === 0 ? (
                            <Trophy className={`h-10 w-10 mb-4 ${theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'}`} />
                        ) : index === 1 ? (
                            <Medal className={`h-10 w-10 mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        ) : (
                            <Award className={`h-10 w-10 mb-4 ${theme === 'dark' ? 'text-amber-700' : 'text-amber-600'}`} />
                        )}
                        <Avatar className={`h-20 w-20 mb-4 border-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <AvatarImage src={user.user.image || ""} alt={user.user.name || ""} />
                            <AvatarFallback className={`text-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                {user.user.name?.charAt(0) || user.user.username.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold">{user.user.name || user.user.username}</h3>
                        <p className={theme === 'dark' ? "text-gray-400 mb-2" : "text-gray-500 mb-2"}>@{user.user.username}</p>
                        <div className="flex gap-1 mb-4">
                            {user.badges?.map((badge: { id: string; name: string; }) => (
                                <Badge
                                    key={badge.id}
                                    variant="outline"
                                    className={
                                        theme === 'dark'
                                            ? "bg-gray-700/50 text-gray-300 border-gray-600"
                                            : "bg-gray-100 text-gray-700 border-gray-200"
                                    }
                                >
                                    {badge.name}
                                </Badge>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                                <p className={theme === 'dark' ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>Points</p>
                                <p className="text-xl font-bold">{user.points}</p>
                            </div>
                            <div className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                                <p className={theme === 'dark' ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>Solved</p>
                                <p className="text-xl font-bold">{user.solved}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`rounded-lg overflow-hidden border ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                <Table>
                    <TableHeader>
                        <TableRow className={`${theme === 'dark' ? 'hover:bg-gray-800/60 border-gray-700' : 'hover:bg-gray-50 border-gray-200'}`}>
                            <TableHead className="w-16 text-center">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-center">Points</TableHead>
                            <TableHead className="text-center">Solved</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topUsers.map((user, index) => (
                            <TableRow key={user.user.id} className={`${theme === 'dark' ? 'hover:bg-gray-800/60 border-gray-700' : 'hover:bg-gray-50 border-gray-200'}`}>
                                <TableCell className="font-medium text-center">{index + 1}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className={`h-8 w-8 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <AvatarImage src={user.user.image || ""} alt={user.user.name || ""} />
                                            <AvatarFallback>{user.user.name?.charAt(0) || user.user.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.user.name || user.user.username}</div>
                                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>@{user.user.username}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                
                                <TableCell className="text-center font-medium">{user.points}</TableCell>
                                <TableCell className="text-center">{user.solved || 0}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}