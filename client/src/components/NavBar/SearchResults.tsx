import React from 'react';
import Link from 'next/link';
import { User, Book, Trophy } from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { generateSlug } from '@/lib/challengeUtils';

interface SearchResult {
    challenges: {
        id: string;
        title: string;
        difficulty: string;
        category: {
            name: string;
        };
    }[];
    contests: {
        id: string;
        title: string;
        description: string;
        status: string;
        startsAt: string;
        endsAt: string;
    }[];
    users: {
        id: string;
        username: string;
        name: string;
        image: string | null;
        hasImage?: boolean;
    }[];
}

interface SearchResultsProps {
    results: SearchResult | null;
    loading: boolean;
    onResultClick: () => void;
}

const SearchResults = ({ results, loading, onResultClick }: SearchResultsProps) => {
    const { theme } = useThemeStore();

    if (!results && !loading) return null;

    return (
        <div className={`absolute top-full left-0 right-0 mt-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200`}>
            {loading ? (
                <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Searching...
                    </p>
                </div>
            ) : (
                <>
                    {results && (results.challenges.length > 0 || results.contests.length > 0 || results.users.length > 0) ? (
                        <div>
                            {results.challenges.length > 0 && (
                                <div className="p-2">
                                    <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} px-3 py-1`}>
                                        Challenges
                                    </div>
                                    {results.challenges.map((challenge) => (
                                        <Link
                                            key={challenge.id}
                                            href={`/challenges/${generateSlug(challenge.title)}`}
                                            onClick={onResultClick}
                                            className={`flex items-center px-3 py-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-md transition-colors`}
                                        >
                                            <Book className="w-4 h-4 mr-2 text-orange-500" />
                                            <div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    {challenge.title}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {challenge.category.name} · {challenge.difficulty}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {results.contests.length > 0 && (
                                <div className="p-2">
                                    <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} px-3 py-1`}>
                                        Contests
                                    </div>
                                    {results.contests.map((contest) => (
                                        <Link
                                            key={contest.id}
                                            href={`/contests/${generateSlug(contest.title)}`}
                                            onClick={onResultClick}
                                            className={`flex items-center px-3 py-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-md transition-colors`}
                                        >
                                            <Trophy className="w-4 h-4 mr-2 text-orange-500" />
                                            <div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    {contest.title}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {contest.status} · {new Date(contest.startsAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {results.users.length > 0 && (
                                <div className="p-2">
                                    <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} px-3 py-1`}>
                                        Users
                                    </div>
                                    {results.users.map((user) => (
                                        <Link
                                            key={user.id}
                                            href={`/profile/${user.username}`}
                                            onClick={onResultClick}
                                            className={`flex items-center px-3 py-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-md transition-colors`}
                                        >
                                            <User className="w-4 h-4 mr-2 text-orange-500" />
                                            <div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    {user.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    @{user.username}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            No results found
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchResults;
