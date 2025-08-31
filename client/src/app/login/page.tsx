"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Github, 
  Mail, 
  Lock,  
  LogIn, 
  ArrowLeft, 
  Code, 
  AlertCircle,
  Terminal, 
  Zap,
} from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function AuthForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        fullName: '',
        preferredLanguage: 'JavaScript'
    });
    const [codeLines, setCodeLines] = useState<string[]>([]);
    const [typedCode, setTypedCode] = useState('');
    const [codePosition, setCodePosition] = useState(0);
    const [isClient, setIsClient] = useState(false);

    // Use useEffect to set isClient to true after component mounts
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Animation for background code typing effect - only run on client
    useEffect(() => {
        if (!isClient) return;
        
        const codeSamples = [
            '// The ultimate coding challenge platform',
            'function solveChallenge(code, tests) {',
            '  return tests.every(test => test.runWith(code));',
            '}',
            '',
            'class Battleground {',
            '  constructor(players) {',
            '    this.players = players;',
            '    this.challenges = [];',
            '    this.leaderboard = new Map();',
            '  }',
            '',
            '  startBattle() {',
            '    console.log("Battle begins now!");',
            '    return this.assignChallenges();',
            '  }',
            '}',
            '',
            'const battle = new Battleground([',
            '  { name: "CodeNinja", rank: "Platinum" },',
            '  { name: "ByteMaster", rank: "Diamond" }',
            ']);'
        ];

        setCodeLines(codeSamples);

        const interval = setInterval(() => {
            setCodePosition(prevPos => {
                if (prevPos >= codeSamples.join('').length) {
                    return 0;
                }
                return prevPos + 1;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [isClient]);

    useEffect(() => {
        if (!isClient) return;
        
        const fullCode = codeLines.join('\n');
        setTypedCode(fullCode.substring(0, codePosition));
    }, [codePosition, codeLines, isClient]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            console.log(data);

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            const result = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            if (!result?.error) {
                if(data.user.role === 'ADMIN') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } else {
                throw new Error('Authentication failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        setLoading(true);
        try {
            await signIn(provider, { 
                callbackUrl: '/'  // Redirect to home for existing users
            });
        } catch (err) {
            setError('Failed to initialize social login');
            console.error(err);
            setLoading(false);
        }
    };

    // Deterministic Matrix-like raining code effect component
    const MatrixRain = () => {
        if (!isClient) return null;
        
        // Use a deterministic pattern instead of random
        return (
            <div className="absolute inset-0 overflow-hidden z-0 select-none pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 right-0 flex justify-between">
                    {Array.from({ length: 20 }).map((_, index) => (
                        <div key={index} 
                            className="text-green-500 text-xs font-mono animate-matrix-rain" 
                            style={{ 
                                animationDelay: `${(index % 5) * 1}s`,
                                animationDuration: `${5 + (index % 10)}s`
                            }}>
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i}>
                                    {String.fromCharCode(33 + ((index + i) % 93))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Matrix-like code rain - only rendered client-side */}
            {isClient && <MatrixRain />}
            
            {/* Animated background glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 -left-40 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-lg opacity-20 animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-lg opacity-20 animate-pulse"></div>
            </div>

            {/* Animated code background - only rendered client-side */}
            {isClient && (
                <div className="absolute inset-0 overflow-hidden select-none pointer-events-none z-0">
                    <div className="absolute right-0 bottom-0 text-orange-500/20 text-xs font-mono p-4 max-w-xs overflow-hidden">
                        <pre className="whitespace-pre-wrap">
                            {typedCode}
                        </pre>
                    </div>
                </div>
            )}

            {/* Logo with animation */}
            <Link href="/" className="mb-8 relative z-10 group">
                <div className="relative">
                    <h1 className="uppercase font-[family-name:var(--font-kanit-sans)] flex flex-col select-none">
                        <span className="text-xs leading-3 self-start tracking-wider text-gray-400 group-hover:text-gray-200 transition-colors duration-300">
                            Code
                        </span>
                        <span className="bg-gradient-to-tr from-orange-500 to-orange-700 text-3xl py-1 bg-clip-text text-transparent leading-4 font-extrabold tracking-wide scale-y-75 transform origin-top group-hover:from-orange-400 group-hover:to-orange-600 transition-all duration-500">
                            Battle
                        </span>
                        <span className="text-xs leading-3 self-end tracking-wider text-gray-400 group-hover:text-gray-200 transition-colors duration-300">
                            Ground
                        </span>
                    </h1>
                    <div className="absolute -bottom-3 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-300 group-hover:w-full transition-all duration-500"></div>
                </div>
                <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border border-orange-500/0 group-hover:border-orange-500/20 rounded-md transition-all duration-500"></div>
            </Link>

            <div className="w-full max-w-md relative z-10">
                {/* Floating code symbols */}
                <div className="absolute -top-8 -left-8 text-orange-500/30 animate-pulse">
                    <Code className="w-16 h-16" />
                </div>
                <div className="absolute -bottom-8 -right-8 text-blue-500/30 animate-pulse">
                    <Terminal className="w-16 h-16" />
                </div>

                <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-orange-900/20">
                    {/* Header with animated icon */}
                    <div className="p-6 border-b border-gray-700 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                Welcome Back
                            </h2>
                            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                                    <LogIn className="w-5 h-5 text-orange-500" />
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-400 mt-1 text-sm">
                            Sign in to continue your coding journey
                        </p>
                        
                        {/* Animated underline */}
                        <div className="h-0.5 w-1/3 bg-gradient-to-r from-orange-500 to-transparent mt-2 animate-pulse"></div>
                    </div>

                    {/* Form with enhanced input animations */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Common Fields */}
                        <div className="mb-4 transform transition-all duration-300 hover:translate-x-1">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-200 
                                    placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500
                                    transition-all duration-300 group-hover:border-gray-600"
                                    placeholder="you@example.com"
                                />
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 
                                group-hover:text-orange-500 transition-colors duration-300" />
                                <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                            </div>
                        </div>

                        <div className="mb-6 transform transition-all duration-300 hover:translate-x-1">
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs text-orange-500 hover:text-orange-400 transition-colors duration-300">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={'current-password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 pr-10 text-gray-200 
                                    placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500
                                    transition-all duration-300 group-hover:border-gray-600"
                                    placeholder={'••••••••'}
                                />
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 
                                group-hover:text-orange-500 transition-colors duration-300" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 
                                    transition-colors duration-300 focus:outline-none"
                                >
                                    {showPassword ? 
                                        <EyeOff className="w-5 h-5 hover:text-orange-400 transition-colors duration-300" /> : 
                                        <Eye className="w-5 h-5 hover:text-orange-400 transition-colors duration-300" />
                                    }
                                </button>
                                <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                            </div>
                        </div>

                        {/* Enhanced submit button with animation effects */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium relative overflow-hidden group
                            bg-gradient-to-tr from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700
                            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 
                            transition-all duration-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {/* Button glow effect */}
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 
                            group-hover:opacity-20 transform group-hover:-translate-x-full transition-all duration-1000 ease-in-out"></span>
                            
                            <span className="relative flex items-center justify-center">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </span>
                        </button>

                        <div className="mt-6 relative flex items-center justify-center">
                            <div className="absolute border-t border-gray-700 w-full"></div>
                            <div className="relative bg-gray-800 px-4 text-sm text-gray-500">Or continue with</div>
                        </div>

                        {/* Social login buttons with enhanced hover effects */}
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('github')}
                                disabled={loading}
                                className="flex items-center justify-center py-2.5 px-4 rounded-lg border border-gray-700 
                                bg-gray-700 hover:bg-gray-600 transition-all duration-300 text-white font-medium
                                group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/20 to-transparent opacity-0 
                                group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                                <Github className="w-5 h-5 mr-2 group-hover:text-orange-400 transition-colors duration-300" />
                                <span className="relative z-10">GitHub</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('google')}
                                disabled={loading}
                                className="flex items-center justify-center py-2.5 px-4 rounded-lg border border-gray-700 
                                bg-gray-700 hover:bg-gray-600 transition-all duration-300 text-white font-medium
                                group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/20 to-transparent opacity-0 
                                group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="relative z-10">Google</span>
                            </button>
                        </div>
                    </form>

                    {/* Footer with animated toggle */}
                    <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 text-center relative overflow-hidden">
                        {/* Tech pattern subtle background */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-px w-full bg-gradient-to-r from-transparent via-gray-500 to-transparent mt-2"></div>
                            ))}
                        </div>
                        
                        <p className="text-sm text-gray-400 relative z-10">
                            Don't have an account?
                            <button
                                type="button"
                                onClick={() => router.push("/signup")}
                                className="ml-1 text-orange-500 hover:text-orange-400 font-medium relative group"
                            >
                                Sign up now
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
                            </button>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-gray-400 hover:text-gray-300 relative group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform duration-300" />
                        <span>Back to home</span>
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-500 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                </div>
            </div>
        </div>
    );
}