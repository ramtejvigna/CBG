"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Grip, LogIn, UserPlus, LogOut, Moon, Sun } from 'lucide-react';
import GridModel from './GridModel';
import { useAuth } from '@/context/AuthContext';
import Loader from '../Loader';
import { useTheme } from '@/context/ThemeContext'; // Import the useTheme hook
import SearchResults from './SearchResults';

interface SearchResult {
    challenges: Array<{
        id: string;
        title: string;
        difficulty: string;
        category: {
            name: string;
        };
    }>;
    users: Array<{
        id: string;
        username: string;
        name: string;
        image: string | null;
    }>;
}

const NavBar = () => {
    const [searchFocus, setSearchFocus] = useState(false);
    const [gridModel, setGridModel] = useState(false);
    const { theme, setTheme } = useTheme(); // Use the theme context
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);

    const { user, logout, loading } = useAuth();

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults(null);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Clear previous timeout
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Set new timeout
        searchTimeout.current = setTimeout(() => {
            handleSearch(query);
        }, 300);
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSearchFocus(false);
                setSearchResults(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleResultClick = () => {
        setSearchQuery('');
        setSearchResults(null);
        setSearchFocus(false);
    };

    if(loading) {
        return <Loader />
    }

    return (
        <div>
            <nav className={`flex ${theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'text-black'} flex-row justify-between items-center border-b p-4 px-8`}>
                {/* Logo Section */}
                <Link href="/" className="flex-shrink-0">
                    <h1 className="cursor-pointer uppercase font-[family-name:var(--font-kanit-sans)] flex flex-col select-none">
                        <span className="text-[9px] leading-[9px] self-start tracking-wider text-gray-400">Code</span>
                        <span className="bg-gradient-to-tr from-[#F14A00] to-[#C62300] text-2xl py-1 bg-clip-text text-transparent leading-[12px] font-extrabold tracking-wide scale-y-75 transform origin-top">
                            Battle
                        </span>
                        <span className="text-[9px] leading-[0] self-end tracking-wider text-gray-400">Ground</span>
                    </h1>
                </Link>

                {/* Search Bar Section */}
                <div ref={searchContainerRef} className={`relative w-1/2 transition-all duration-300 ${searchFocus ? 'scale-100' : 'scale-95'}`}>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            placeholder="Search battles, challenges, warriors..."
                            className={`w-full border-2 rounded-lg py-2 pl-4 pr-10 ${theme === 'dark'? 'text-gray-300 bg-gray-800 border-gray-700 \
                                     placeholder-gray-500' : ''} focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 \
                                     transition-all duration-300`}
                            onFocus={() => setSearchFocus(true)}
                        />
                        <Search
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 
                                      ${searchFocus ? 'text-orange-500' : 'text-gray-500'} 
                                      transition-colors duration-300 ${isSearching ? 'animate-pulse' : ''}`}
                        />
                    </div>
                    
                    {/* Search Results */}
                    {searchFocus && (
                        <SearchResults 
                            results={searchResults}
                            loading={isSearching}
                            onResultClick={handleResultClick}
                        />
                    )}
                </div>

                {/* Navigation Links */}
                <div className="flex-shrink-0">
                    <ul className="flex flex-row items-center gap-8 text-sm">
                        <li>
                            <Link href="/about" className="relative group">
                                <span className="cursor-pointer transition-colors duration-300">
                                    About
                                </span>
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-tr from-[#F14A00] to-[#C62300] rounded-full group-hover:w-full transition-all duration-300"></span>
                            </Link>
                        </li>
                        <li onClick={() => setGridModel(prev => !prev)}>
                            <span className="cursor-pointer transition-colors duration-300">
                                <Grip />
                            </span>
                        </li>

                        <span className='opacity-40'>|</span>

                        {/* Theme Toggler */}
                        <li>
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="cursor-pointer transition-colors duration-300">
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>
                        </li>

                        {user ? (
                            <>
                                <li>
                                    <Link href={`/profile/${user?.username}`} className="relative group">
                                        <div className="w-12 h-12 border- border-orange-600 uppercase rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl font-bold text-white relative group overflow-hidden">
                                            {user?.image ? (
                                                <img
                                                    src={user?.image}
                                                    alt={user?.username || 'User'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                user?.username?.charAt(0)
                                            )}
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={() => logout()}
                                        className="relative group flex items-center"
                                    >
                                        <span className="cursor-pointer hover:text-[#F14A00]  transition-colors duration-300 flex items-center">
                                            <LogOut className="w-4 h-4 mr-1" />
                                            Logout
                                        </span>
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/login" className="relative group">
                                        <span className="cursor-pointer transition-colors duration-300 flex items-center">
                                            <LogIn className="w-4 h-4 mr-1" />
                                            Login
                                        </span>
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-tr from-[#F14A00] to-[#C62300] rounded-full group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/signup" className="relative group">
                                        <span className="cursor-pointer transition-colors duration-300 flex items-center">
                                            <UserPlus className="w-4 h-4 mr-1" />
                                            Sign Up
                                        </span>
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-tr from-[#F14A00] to-[#C62300] rounded-full group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>

                    {gridModel && <GridModel onClose={() => setGridModel(false)} />}
                </div>
            </nav>
        </div>
    );
};

export default NavBar;