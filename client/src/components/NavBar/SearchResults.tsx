import React from 'react';
import Link from 'next/link';
import { User, Code2, Trophy, SearchX } from 'lucide-react';
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

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="p-1.5">
        <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
        </div>
        {children}
    </div>
);

const Row = ({
    href,
    icon,
    title,
    meta,
    onClick,
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    meta: string;
    onClick: () => void;
}) => (
    <Link
        href={href}
        onClick={onClick}
        className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted"
    >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{title}</div>
            <div className="truncate text-xs text-muted-foreground">{meta}</div>
        </div>
    </Link>
);

const SearchResults = ({ results, loading, onResultClick }: SearchResultsProps) => {
    if (!results && !loading) return null;

    const hasResults =
        results && (results.challenges.length > 0 || results.contests.length > 0 || results.users.length > 0);

    return (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-popover shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {loading ? (
                <div className="p-6 text-center">
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-2 text-xs text-muted-foreground">Searching…</p>
                </div>
            ) : hasResults ? (
                <div className="divide-y divide-border">
                    {results.challenges.length > 0 && (
                        <Group label="Problems">
                            {results.challenges.map((challenge) => (
                                <Row
                                    key={challenge.id}
                                    href={`/challenges/${generateSlug(challenge.title)}`}
                                    onClick={onResultClick}
                                    icon={<Code2 className="h-4 w-4" />}
                                    title={challenge.title}
                                    meta={`${challenge.category.name} · ${challenge.difficulty}`}
                                />
                            ))}
                        </Group>
                    )}

                    {results.contests.length > 0 && (
                        <Group label="Contests">
                            {results.contests.map((contest) => (
                                <Row
                                    key={contest.id}
                                    href={`/contests/${generateSlug(contest.title)}`}
                                    onClick={onResultClick}
                                    icon={<Trophy className="h-4 w-4" />}
                                    title={contest.title}
                                    meta={`${contest.status} · ${new Date(contest.startsAt).toLocaleDateString()}`}
                                />
                            ))}
                        </Group>
                    )}

                    {results.users.length > 0 && (
                        <Group label="Coders">
                            {results.users.map((user) => (
                                <Row
                                    key={user.id}
                                    href={`/profile/${user.username}`}
                                    onClick={onResultClick}
                                    icon={<User className="h-4 w-4" />}
                                    title={user.name}
                                    meta={`@${user.username}`}
                                />
                            ))}
                        </Group>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                    <SearchX className="h-5 w-5" />
                    No results found
                </div>
            )}
        </div>
    );
};

export default SearchResults;
