"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Home,
    ArrowLeft,
    Shield,
    Settings,
    Users,
    Code2,
    Trophy,
    AlertTriangle,
    Zap
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { Button } from '@/components/ui/button';

const AdminNotFound = () => {
    const router = useRouter();
    const { theme } = useThemeStore();
    const [mounted, setMounted] = useState(false);
    const [glitchActive, setGlitchActive] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        const glitchInterval = setInterval(() => {
            setGlitchActive(true);
            setTimeout(() => setGlitchActive(false), 150);
        }, 4000);

        return () => clearInterval(glitchInterval);
    }, []);

    if (!mounted) return null;

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
            theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-gray-50 via-white to-orange-50'
        }`}>
            {/* Admin-themed Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Floating Admin Icons */}
                <div className="absolute top-20 left-20 opacity-10 animate-spin" style={{ animationDuration: '20s' }}>
                    <Shield className="w-16 h-16 text-orange-500" />
                </div>
                <div className="absolute top-40 right-32 opacity-10 animate-bounce">
                    <Settings className="w-12 h-12 text-blue-500" />
                </div>
                <div className="absolute bottom-32 left-32 opacity-10 animate-pulse">
                    <Users className="w-14 h-14 text-green-500" />
                </div>
                <div className="absolute bottom-20 right-20 opacity-10 animate-spin" style={{ animationDuration: '15s' }}>
                    <Code2 className="w-10 h-10 text-purple-500" />
                </div>
                <div className="absolute top-1/2 right-10 opacity-10 animate-bounce" style={{ animationDelay: '1s' }}>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                </div>

                {/* Grid Pattern */}
                <div className={`absolute inset-0 opacity-5 ${theme === 'dark' ? 'bg-white' : 'bg-gray-800'}`} 
                     style={{ 
                         backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                         backgroundSize: '40px 40px'
                     }}>
                </div>

                {/* Admin Circuit Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-5">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="circuit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M0 10h20M10 0v20" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                                <circle cx="10" cy="10" r="1" fill="currentColor"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#circuit)"/>
                    </svg>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                {/* Admin Badge */}
                <div className="flex justify-center mb-6">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 ${
                        theme === 'dark' 
                            ? 'border-orange-400 bg-gray-800' 
                            : 'border-orange-500 bg-white'
                    }`}>
                        <Shield className="w-5 h-5 text-orange-500 mr-2" />
                        <span className={`font-semibold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                            ADMIN PANEL
                        </span>
                    </div>
                </div>

                {/* 404 Number with Glitch Effect */}
                <div className="relative mb-8">
                    <h1 className={`text-8xl md:text-[10rem] font-black leading-none select-none ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    } ${glitchActive ? 'animate-pulse' : ''}`}
                        style={{
                            background: 'linear-gradient(45deg, #f97316, #ef4444, #3b82f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: glitchActive ? 'hue-rotate(90deg)' : 'none',
                            transition: 'filter 0.1s ease-in-out'
                        }}
                    >
                        404
                    </h1>
                    
                    {/* Admin-themed overlay */}
                    <div className="absolute -top-4 -right-4">
                        <Zap className={`w-12 h-12 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} animate-pulse`} />
                    </div>
                </div>

                {/* Error Message */}
                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <AlertTriangle className={`w-8 h-8 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'} animate-bounce`} />
                    </div>
                    
                    <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        Admin Page Not Found
                    </h2>
                    
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                        The admin page you&apos;re looking for doesn&apos;t exist or has been moved. 
                        Let&apos;s get you back to managing your platform!
                    </p>
                </div>

                {/* Admin Code Block */}
                <div className={`inline-block p-4 rounded-lg mb-8 ${
                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
                }`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            ADMIN_CONSOLE
                        </span>
                    </div>
                    <code className={`text-sm font-mono ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        <span className="opacity-60">sudo</span> find /admin/<span className="text-orange-500">*</span> -name &quot;page&quot;<br />
                        <span className="text-red-500">Error:</span> No such file or directory<br />
                        <span className="opacity-60">Suggestion:</span> Try /adminYmAF8aMHrK/ <span className="animate-blink">|</span>
                    </code>
                </div>

                {/* Admin Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <Link href="/adminYmAF8aMHrK">
                        <Button className="group bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                            Admin Dashboard
                        </Button>
                    </Link>
                    
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="group px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                        Go Back
                    </Button>
                    
                    <Link href="/">
                        <Button variant="outline" className="group px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Home className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                            Main Site
                        </Button>
                    </Link>
                </div>

                {/* Admin Quick Links */}
                <div className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-sm mb-4">Quick admin actions:</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link 
                            href="/adminYmAF8aMHrK/users" 
                            className="flex items-center space-x-1 hover:text-orange-500 transition-colors duration-200 group"
                        >
                            <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            <span>Manage Users</span>
                        </Link>
                        <Link 
                            href="/adminYmAF8aMHrK/challenges" 
                            className="flex items-center space-x-1 hover:text-orange-500 transition-colors duration-200 group"
                        >
                            <Code2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                            <span>Manage Challenges</span>
                        </Link>
                        <Link 
                            href="/adminYmAF8aMHrK/settings" 
                            className="flex items-center space-x-1 hover:text-orange-500 transition-colors duration-200 group"
                        >
                            <Settings className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" />
                            <span>System Settings</span>
                        </Link>
                    </div>
                </div>

                {/* Loading Animation */}
                <div className="mt-12 flex justify-center">
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-orange-400' : 'bg-orange-500'} animate-bounce`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                
                .animate-blink {
                    animation: blink 1s infinite;
                }
            `}</style>
        </div>
    );
};

export default AdminNotFound;