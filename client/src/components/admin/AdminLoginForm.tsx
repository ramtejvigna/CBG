"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Shield, 
    Eye, 
    EyeOff, 
    LogIn, 
    ArrowLeft, 
    AlertCircle,
    Lock,
    Mail,
    Terminal,
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminLoginFormProps {
    onSuccess?: () => void;
    redirectUrl?: string;
    showBackToSite?: boolean;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ 
    onSuccess, 
    redirectUrl = '/admin',
    showBackToSite = true 
}) => {
    const router = useRouter();
    const { theme } = useThemeStore();
    const { login, loading, error, setError } = useAuthStore();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setError(null);
        setIsSubmitting(true);

        try {
            await login(formData.email, formData.password);
            
            // Check if user is admin after login
            const { user } = useAuthStore.getState();
            if (user?.role === 'ADMIN') {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push(redirectUrl);
                }
            } else {
                setLoginError('Access denied. Admin privileges required.');
                // Logout non-admin user
                useAuthStore.getState().logout();
            }
        } catch (err) {
            setLoginError('Invalid admin credentials. Please check your email and password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Matrix-like background effect for admin theme
    const AdminMatrixBackground = () => (
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute inset-0 flex justify-between">
                {Array.from({ length: 15 }).map((_, index) => (
                    <div 
                        key={index} 
                        className="text-orange-500 text-xs font-mono animate-pulse"
                        style={{ 
                            animationDelay: `${index * 0.3}s`,
                            animationDuration: `${3 + (index % 5)}s`
                        }}
                    >
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="mb-1">
                                {['ADMIN', 'SECURE', 'ACCESS', 'SHIELD', 'GUARD'][i % 5]}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
            {/* Animated background */}
            <AdminMatrixBackground />
            
            {/* Background glow effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 -left-40 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
            </div>

            {/* Floating security icons */}
            <div className="absolute top-20 left-20 text-orange-500/20 animate-bounce">
                <Shield className="w-12 h-12" />
            </div>
            <div className="absolute bottom-20 right-20 text-red-500/20 animate-bounce" style={{ animationDelay: '1s' }}>
                <Lock className="w-12 h-12" />
            </div>
            <div className="absolute top-1/3 right-1/4 text-orange-400/20 animate-bounce" style={{ animationDelay: '2s' }}>
                <Terminal className="w-8 h-8" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className={`${
                    theme === 'dark' 
                        ? 'bg-gray-800/90 border-gray-700' 
                        : 'bg-white/90 border-gray-200'
                } backdrop-blur-lg border rounded-xl shadow-2xl overflow-hidden`}>
                    
                    {/* Header */}
                    <div className={`p-6 border-b ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    } text-center relative overflow-hidden`}>
                        {/* Header background effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-orange-500/5"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            
                            <h1 className={`text-2xl font-bold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                                Admin Access
                            </h1>
                            <p className={`text-sm mt-2 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Secure administrative portal for Code Battle Ground
                            </p>
                            
                            {/* Animated security indicator */}
                            <div className="flex items-center justify-center mt-3 space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className={`text-xs ${
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                    Secure Connection
                                </span>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Error Display */}
                        {(error || loginError) && (
                            <div className={`p-4 rounded-lg border flex items-start space-x-3 ${
                                theme === 'dark' 
                                    ? 'bg-red-900/20 border-red-800 text-red-200' 
                                    : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
                                <div>
                                    <p className="font-medium text-sm">Authentication Failed</p>
                                    <p className="text-sm opacity-90">{error || loginError}</p>
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="admin-email" className={`block text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Administrator Email
                            </label>
                            <div className="relative group">
                                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                } group-hover:text-orange-500 transition-colors`} />
                                <Input
                                    id="admin-email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`pl-10 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-300'
                                    } focus:border-orange-500 focus:ring-orange-500`}
                                />
                                <div className="absolute bottom-0 left-10 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="admin-password" className={`block text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                } group-hover:text-orange-500 transition-colors`} />
                                <Input
                                    id="admin-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Enter your secure password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`pl-10 pr-10 ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-300'
                                    } focus:border-orange-500 focus:ring-orange-500`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                                        theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                    } transition-colors focus:outline-none`}
                                >
                                    {showPassword ? 
                                        <EyeOff className="w-5 h-5" /> : 
                                        <Eye className="w-5 h-5" />
                                    }
                                </button>
                                <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading || isSubmitting}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-3 relative overflow-hidden group"
                        >
                            {/* Button glow effect */}
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></span>
                            
                            <span className="relative flex items-center justify-center">
                                {(loading || isSubmitting) ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5 mr-2" />
                                        Access Admin Panel
                                    </>
                                )}
                            </span>
                        </Button>

                        {/* Security Notice */}
                        <div className={`p-3 rounded-lg ${
                            theme === 'dark' 
                                ? 'bg-yellow-900/20 border border-yellow-800/30 text-yellow-200' 
                                : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                        }`}>
                            <div className="flex items-start space-x-2">
                                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="text-xs">
                                    <p className="font-medium">Security Notice</p>
                                    <p className="opacity-90">This area is restricted to authorized administrators only. All access attempts are logged and monitored.</p>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    {showBackToSite && (
                        <div className={`px-6 py-4 border-t ${
                            theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
                        } text-center`}>
                            <Link 
                                href="/" 
                                className={`inline-flex items-center text-sm ${
                                    theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                                } transition-colors group`}
                            >
                                <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform duration-300" />
                                Back to main site
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Additional Security Info */}
                <div className={`mt-6 text-center space-y-2 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                    <div className="flex items-center justify-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>SSL Secured</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>2FA Ready</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Audit Logged</span>
                        </div>
                    </div>
                    <p className="text-xs">
                        Need assistance? Contact your system administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginForm;