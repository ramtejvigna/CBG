"use client";

import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Code, Heart } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const Footer = () => {
    const { theme } = useTheme(); 

    return (
        <footer className={`${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-black'} border-t border-gray-800 mt-auto`}>
            <div className="max-w-7xl mx-auto px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Logo and Tagline Section */}
                    <div className="flex flex-col space-y-4">
                        <Link href="/" className='w-[23%]'>
                            <h1 className="cursor-pointer uppercase font-[family-name:var(--font-kanit-sans)] flex flex-col select-none">
                                <span className="text-[9px] leading-[9px] self-start tracking-wider text-gray-400">Code</span>
                                <span className="bg-gradient-to-tr from-[#F14A00] to-[#C62300] text-2xl py-1 bg-clip-text text-transparent leading-[12px] font-extrabold tracking-wide scale-y-75 transform origin-top">
                                    Battle
                                </span>
                                <span className="text-[9px] leading-[0] self-end tracking-wider text-gray-400">Ground</span>
                            </h1>
                        </Link>
                        <p className="text-sm">
                            Where code warriors clash and algorithms triumph.
                            <br />
                            <span className="text-xs opacity-75">Sharpen your skills. Rise in the ranks.</span>
                        </p>
                        <div className="flex space-x-4 ">
                            <Link href="https://github.com" className="hover:text-orange-500 transition-colors duration-300">
                                <Github size={18} />
                            </Link>
                            <Link href="https://twitter.com" className="hover:text-orange-500 transition-colors duration-300">
                                <Twitter size={18} />
                            </Link>
                            <Link href="https://linkedin.com" className="hover:text-orange-500 transition-colors duration-300">
                                <Linkedin size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links Section */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/challenge" className=" hover:text-orange-500 transition-colors duration-300 flex items-center gap-2">
                                    Challenges
                                </Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className=" hover:text-orange-500 transition-colors duration-300 flex items-center gap-2">
                                    Leaderboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/tutorials" className=" hover:text-orange-500 transition-colors duration-300 flex items-center gap-2">
                                    Tutorials
                                </Link>
                            </li>
                            <li>
                                <Link href="/community" className=" hover:text-orange-500 transition-colors duration-300 flex items-center gap-2">
                                    Community
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className=" hover:text-orange-500 transition-colors duration-300 flex items-center gap-2">
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Section */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Join The Battle</h3>
                        <p className="text-sm">Stay updated with the latest challenges and features.</p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-2 pl-4 pr-10 text-gray-300 
                         placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500
                         transition-all duration-300"
                            />
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-tr from-[#F14A00] to-[#C62300] text-white px-2 py-1 rounded text-xs"
                            >
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 mt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                    <div className="text-xs flex items-center mb-4 md:mb-0">
                        <Code size={14} className="mr-2" />
                        <span>
                            Made with <Heart size={12} className="inline text-orange-500 mx-1" /> by{" "}
                            <Link href="https://www.linkedin.com/in/vignaramtej/" className="text-orange-500 hover:underline">
                                Vigna Ramtej Telagarapu
                            </Link>
                        </span>
                    </div>

                    <div className="flex space-x-4 text-xs ">
                        <Link href="/terms" className="hover:text-gray-300 transition-colors duration-300">
                            Terms
                        </Link>
                        <Link href="/privacy" className="hover:text-gray-300 transition-colors duration-300">
                            Privacy
                        </Link>
                        <Link href="/cookies" className="hover:text-gray-300 transition-colors duration-300">
                            Cookies
                        </Link>
                        <span>© {new Date().getFullYear()}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;