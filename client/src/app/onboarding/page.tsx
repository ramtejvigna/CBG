"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Globe, User, Zap } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        preferredLanguage: 'JavaScript'
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Pre-fill form with data from social login if available
    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                fullName: session.user?.name || '',
                username: session.user?.email?.split('@')[0] || '',
            }));
        }
    }, [session]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!session?.user?.id) {
                throw new Error('No user session found');
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/complete-onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    username: formData.username,
                    preferredLanguage: formData.preferredLanguage
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to complete onboarding');
            }

            // Redirect to the dashboard after successful onboarding
            router.push('/');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
                        <p className="text-gray-400 mt-1 text-sm">
                            Just a few more details to get you started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-200"
                                    placeholder="CodeWarrior"
                                />
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-400 mb-1">
                                Preferred Language
                            </label>
                            <div className="relative">
                                <select
                                    id="preferredLanguage"
                                    name="preferredLanguage"
                                    value={formData.preferredLanguage}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-200 appearance-none"
                                >
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Python">Python</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                    <option value="TypeScript">TypeScript</option>
                                    <option value="Go">Go</option>
                                    <option value="Rust">Rust</option>
                                </select>
                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium
                            bg-gradient-to-tr from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700
                            ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <span className="flex items-center justify-center">
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
                                        Complete Setup
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}