"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Home,
    ArrowLeft,
    Code,
    Trophy,
    Users,
    Zap,
    Star,
    AlertTriangle,
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { Button } from '@/components/ui/button';

const NotFound = () => {
    const router = useRouter();
    const { theme } = useThemeStore();
    const [mounted, setMounted] = useState(false);
    const [glitchActive, setGlitchActive] = useState(false);
    const [floatingIcons, setFloatingIcons] = useState<Array<{ id: number; icon: React.ReactNode; x: number; y: number; delay: number }>>([]);

    useEffect(() => {
        setMounted(true);
        
        // Generate floating icons
        const icons = [Code, Trophy, Users, Zap, Star];
        const generatedIcons = Array.from({ length: 8 }, (_, i) => {
            const IconComponent = icons[i % icons.length];
            return {
                id: i,
                icon: <IconComponent className="w-6 h-6" />,
                x: Math.random() * 100,
                y: Math.random() * 100,
                delay: Math.random() * 2
            };
        });
        setFloatingIcons(generatedIcons);

        // Glitch effect timer
        const glitchInterval = setInterval(() => {
            setGlitchActive(true);
            setTimeout(() => setGlitchActive(false), 200);
        }, 3000);

        return () => clearInterval(glitchInterval);
    }, []);

    const handleGoBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    if (!mounted) return null;

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
            theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-white to-orange-50'
        }`}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Floating Icons */}
                {floatingIcons.map((item) => (
                    <div
                        key={item.id}
                        className={`absolute opacity-10 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            animation: `float 6s ease-in-out infinite`,
                            animationDelay: `${item.delay}s`
                        }}
                    >
                        {item.icon}
                    </div>
                ))}

                {/* Geometric Shapes */}
                <div className="absolute top-20 left-20 w-32 h-32 border-2 border-orange-300 rounded-full animate-spin opacity-20" style={{ animationDuration: '20s' }}></div>
                <div className="absolute bottom-20 right-20 w-24 h-24 border-2 border-blue-300 rotate-45 animate-pulse opacity-20"></div>
                <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg animate-bounce opacity-30"></div>
                
                {/* Grid Pattern */}
                <div className={`absolute inset-0 opacity-5 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} 
                     style={{ 
                         backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                         backgroundSize: '50px 50px'
                     }}>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                {/* 404 Number with Glitch Effect */}
                <div className="relative mb-8">
                    <h1 className={`text-9xl md:text-[12rem] font-black leading-none select-none ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    } ${glitchActive ? 'animate-pulse' : ''}`}
                        style={{
                            background: 'linear-gradient(45deg, #f97316, #ef4444, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: glitchActive ? 'hue-rotate(90deg)' : 'none',
                            transition: 'filter 0.1s ease-in-out'
                        }}
                    >
                        404
                    </h1>
                    
                    {/* Glitch layers */}
                    {glitchActive && (
                        <>
                            <h1 className="absolute inset-0 text-9xl md:text-[12rem] font-black leading-none text-red-500 opacity-50 animate-ping"
                                style={{ transform: 'translate(-2px, 0)' }}>
                                404
                            </h1>
                            <h1 className="absolute inset-0 text-9xl md:text-[12rem] font-black leading-none text-blue-500 opacity-50 animate-ping"
                                style={{ transform: 'translate(2px, 0)' }}>
                                404
                            </h1>
                        </>
                    )}
                </div>

                {/* Error Message */}
                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <AlertTriangle className={`w-8 h-8 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'} animate-bounce`} />
                    </div>
                    
                    <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        Oops! Page Not Found
                    </h2>
                    
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                        The page you&quot;re looking for seems to have vanished into the digital void. 
                        Don&quot;t worry, even the best coders encounter bugs sometimes!
                    </p>
                </div>

                {/* Animated Code Block */}
                <div className={`inline-block p-4 rounded-lg mb-8 ${
                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
                }`}>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <code className={`text-sm font-mono ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        <span className="opacity-60">if</span> (page.exists()) {`{`}<br />
                        <span className="ml-4 opacity-60">return</span> <span className="text-orange-500">&lt;CodeBattleGround /&gt;</span>;<br />
                        {`}`} <span className="opacity-60">else</span> {`{`}<br />
                        <span className="ml-4 opacity-60">return</span> <span className="text-red-500">&lt;NotFound /&gt;</span>; <span className="animate-blink">|</span><br />
                        {`}`}
                    </code>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <Button
                        onClick={handleGoBack}
                        className="group bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                        Go Back
                    </Button>
                    
                    <Link href="/">
                        <Button className="group bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                            Home
                        </Button>
                    </Link>
                    
                    <Link href="/challenges">
                        <Button variant="outline" className="group px-6 py-3 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Code className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                            Browse Challenges
                        </Button>
                    </Link>
                </div>

                {/* Fun Suggestions */}
                <div className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-sm mb-4">While you&quot;re here, why not:</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link 
                            href="/challenges" 
                            className="flex items-center space-x-1 hover:text-orange-500 transition-colors duration-200 group"
                        >
                            <Code className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                            <span>Solve a challenge</span>
                        </Link>
                        <Link 
                            href="/contests" 
                            className="flex items-center space-x-1 hover:text-orange-500 transition-colors duration-200 group"
                        >
                            <Trophy className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            <span>Join a contest</span>
                        </Link>
                        <Link 
                            href="/rankings" 
                            className="flex items-center space-x-1 hover:text-orange-500 transition-colors duration-200 group"
                        >
                            <Star className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" />
                            <span>Check rankings</span>
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
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-blink {
                    animation: blink 1s infinite;
                }
            `}</style>
        </div>
    );
};

export default NotFound;