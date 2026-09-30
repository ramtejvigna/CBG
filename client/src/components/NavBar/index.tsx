"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Search, LogOut, Moon, Sun, Menu, X, User, Settings, Shield, ChevronDown,
    Code2, Trophy, BarChart3, Activity, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/lib/store/themeStore';
import { UserAvatar } from '@/components/ui/UserAvatar';
import Logo from '@/components/Logo';
import Loader from '../Loader';
import SearchResults from './SearchResults';
import { cn } from '@/lib/utils';

interface SearchResult {
    challenges: Array<{
        id: string;
        title: string;
        difficulty: string;
        category: {
            name: string;
        };
    }>;
    contests: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        startsAt: string;
        endsAt: string;
    }>;
    users: Array<{
        id: string;
        username: string;
        name: string;
        image: string | null;
        hasImage?: boolean;
    }>;
}

const navLinks = [
    { name: 'Problems', href: '/challenges', icon: Code2 },
    { name: 'Contests', href: '/contests', icon: Trophy },
    { name: 'Rankings', href: '/rankings', icon: BarChart3 },
    { name: 'Community', href: '/activity-feed', icon: Activity },
];

const NavBar = () => {
    const pathname = usePathname();
    const [searchFocus, setSearchFocus] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { theme, toggleTheme } = useThemeStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const { user, logout, loading } = useAuth();

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            const data = await response.json();

            // Ensure we have the expected structure
            setSearchResults({
                challenges: data.challenges || [],
                contests: data.contests || [],
                users: data.users || []
            });
        } catch (error) {
            console.error('Search error:', error);
            // Set empty results on error instead of null to show "No results found"
            setSearchResults({
                challenges: [],
                contests: [],
                users: []
            });
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            handleSearch(query);
        }, 300);
    };

    // Click outside handler and keyboard shortcuts
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSearchFocus(false);
                setSearchResults(null);
            }
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl/Cmd + K to focus search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
                setSearchFocus(true);
            }
            if (event.key === 'Escape') {
                setMenuOpen(false);
                if (searchFocus) {
                    setSearchFocus(false);
                    setSearchResults(null);
                    searchInputRef.current?.blur();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [searchFocus]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close menus on navigation
    useEffect(() => {
        setMobileOpen(false);
        setMenuOpen(false);
    }, [pathname]);

    const handleResultClick = () => {
        setSearchQuery('');
        setSearchResults(null);
        setSearchFocus(false);
    };

    if (loading) {
        return <Loader />
    }

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    const searchBox = (
        <div ref={searchContainerRef} className="relative w-full">
            <Search
                className={cn(
                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
                    searchFocus ? 'text-primary' : 'text-muted-foreground',
                    isSearching && 'animate-pulse'
                )}
            />
            <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search problems, contests, coders…"
                className="h-10 w-full rounded-xl border border-border bg-muted/60 pl-9 pr-14 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/60 focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/15"
                onFocus={() => setSearchFocus(true)}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 sm:flex">
                <kbd className="kbd">Ctrl</kbd>
                <kbd className="kbd">K</kbd>
            </span>

            {searchFocus && (
                <SearchResults
                    results={searchResults}
                    loading={isSearching}
                    onResultClick={handleResultClick}
                />
            )}
        </div>
    );

    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full transition-all duration-300',
                scrolled ? 'glass border-b border-border shadow-[0_10px_30px_-20px_rgb(0_0_0/0.6)]' : 'border-b border-transparent bg-background/40 backdrop-blur-md'
            )}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
                <Logo />

                {/* Primary links */}
                <ul className="ml-4 hidden items-center gap-1 lg:flex">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={cn(
                                    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive(link.href)
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                {link.name}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Search */}
                <div className="ml-auto hidden w-full max-w-sm md:block">{searchBox}</div>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2 md:ml-0">
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/50 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>

                    {user ? (
                        <div ref={menuRef} className="relative hidden sm:block">
                            <button
                                onClick={() => setMenuOpen((prev) => !prev)}
                                className="flex items-center gap-2 rounded-xl border border-border bg-card/50 py-1 pl-1 pr-2 transition-colors hover:border-primary/40"
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                            >
                                <UserAvatar
                                    userId={user?.id}
                                    userName={user?.name || user?.username || 'User'}
                                    hasImage={user?.hasImage}
                                    size="sm"
                                    className="rounded-lg"
                                />
                                <span className="max-w-[110px] truncate text-sm font-medium">{user?.username}</span>
                                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
                            </button>

                            {menuOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                                >
                                    <div className="px-3 py-2.5">
                                        <p className="truncate text-sm font-semibold">{user?.name || user?.username}</p>
                                        <p className="truncate text-xs text-muted-foreground">@{user?.username}</p>
                                    </div>
                                    <div className="my-1 h-px bg-border" />
                                    <MenuLink href={`/profile/${user?.username}`} icon={User}>Your profile</MenuLink>
                                    <MenuLink href="/settings" icon={Settings}>Settings</MenuLink>
                                    {user?.role === 'ADMIN' && (
                                        <MenuLink href="/admin" icon={Shield}>Admin panel</MenuLink>
                                    )}
                                    <div className="my-1 h-px bg-border" />
                                    <button
                                        onClick={() => logout()}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden items-center gap-2 sm:flex">
                            <Link
                                href="/login"
                                className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Log in
                            </Link>
                            <Link href="/signup" className="btn-brand whitespace-nowrap !px-4 !py-2.5">
                                Start coding <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileOpen((prev) => !prev)}
                        aria-label="Open menu"
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/50 lg:hidden"
                    >
                        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </nav>

            {/* Mobile panel */}
            {mobileOpen && (
                <div className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden animate-in fade-in-0 slide-in-from-top-2">
                    <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6">
                        <div className="md:hidden">{searchBox}</div>
                        <ul className="grid grid-cols-2 gap-2">
                            {navLinks.map(({ name, href, icon: Icon }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
                                            isActive(href)
                                                ? 'border-primary/40 bg-primary/10 text-primary'
                                                : 'border-border bg-card/50 hover:border-primary/30'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {user ? (
                            <div className="flex gap-2 sm:hidden">
                                <Link href={`/profile/${user?.username}`} className="btn-ghost flex-1 !py-2.5">
                                    <User className="h-4 w-4" /> Profile
                                </Link>
                                <button onClick={() => logout()} className="btn-ghost flex-1 !py-2.5 !text-red-500">
                                    <LogOut className="h-4 w-4" /> Log out
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 sm:hidden">
                                <Link href="/login" className="btn-ghost flex-1 !py-2.5">Log in</Link>
                                <Link href="/signup" className="btn-brand flex-1 !py-2.5">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

const MenuLink = ({
    href,
    icon: Icon,
    children,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) => (
    <Link
        href={href}
        role="menuitem"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted"
    >
        <Icon className="h-4 w-4 text-muted-foreground" />
        {children}
    </Link>
);

export default NavBar;
