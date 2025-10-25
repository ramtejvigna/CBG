"use client";

import React, { useState } from 'react';
import { Shield, Users, ChevronDown } from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import AdminLoginForm from './AdminLoginForm';

interface LoginModeSwitcherProps {
    onModeChange?: (mode: 'user' | 'admin') => void;
    initialMode?: 'user' | 'admin';
}

const LoginModeSwitcher: React.FC<LoginModeSwitcherProps> = ({ 
    onModeChange, 
    initialMode = 'user' 
}) => {
    const { theme } = useThemeStore();
    const [currentMode, setCurrentMode] = useState<'user' | 'admin'>(initialMode);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleModeChange = (mode: 'user' | 'admin') => {
        setCurrentMode(mode);
        setIsDropdownOpen(false);
        if (onModeChange) {
            onModeChange(mode);
        }
    };

    const modes = [
        {
            key: 'user' as const,
            label: 'User Login',
            description: 'Regular user access',
            icon: Users,
            color: 'blue'
        },
        {
            key: 'admin' as const,
            label: 'Admin Login',
            description: 'Administrative access',
            icon: Shield,
            color: 'orange'
        }
    ];

    const currentModeData = modes.find(mode => mode.key === currentMode);

    return (
        <div className="relative">
            {/* Mode Selector Dropdown */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                        theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500'
                            : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
                    } ${isDropdownOpen ? 'ring-2 ring-orange-500 ring-opacity-50' : ''}`}
                >
                    <div className="flex items-center space-x-3">
                        {currentModeData && (
                            <>
                                <div className={`p-2 rounded-lg ${
                                    currentModeData.color === 'orange' 
                                        ? 'bg-orange-500/20 text-orange-500' 
                                        : 'bg-blue-500/20 text-blue-500'
                                }`}>
                                    <currentModeData.icon className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-sm">{currentModeData.label}</p>
                                    <p className={`text-xs ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {currentModeData.description}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                        isDropdownOpen ? 'rotate-180' : ''
                    } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg z-50 ${
                        theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                    }`}>
                        {modes.map((mode) => {
                            const Icon = mode.icon;
                            const isSelected = mode.key === currentMode;
                            
                            return (
                                <button
                                    key={mode.key}
                                    onClick={() => handleModeChange(mode.key)}
                                    className={`w-full flex items-center space-x-3 p-3 text-left transition-all duration-200 ${
                                        isSelected 
                                            ? mode.color === 'orange'
                                                ? 'bg-orange-500/10 border-l-4 border-orange-500'
                                                : 'bg-blue-500/10 border-l-4 border-blue-500'
                                            : theme === 'dark'
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-50'
                                    } ${mode.key === 'user' ? 'rounded-t-lg' : 'rounded-b-lg'}`}
                                >
                                    <div className={`p-2 rounded-lg ${
                                        mode.color === 'orange' 
                                            ? 'bg-orange-500/20 text-orange-500' 
                                            : 'bg-blue-500/20 text-blue-500'
                                    }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`font-medium text-sm ${
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {mode.label}
                                        </p>
                                        <p className={`text-xs ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            {mode.description}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <div className="ml-auto">
                                            <div className={`w-2 h-2 rounded-full ${
                                                mode.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`}></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Mode Indicator */}
            <div className={`mb-4 p-3 rounded-lg border ${
                currentMode === 'admin'
                    ? theme === 'dark'
                        ? 'bg-orange-900/20 border-orange-800/30 text-orange-200'
                        : 'bg-orange-50 border-orange-200 text-orange-800'
                    : theme === 'dark'
                        ? 'bg-blue-900/20 border-blue-800/30 text-blue-200'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
                <div className="flex items-center space-x-2">
                    {currentModeData && <currentModeData.icon className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                        {currentMode === 'admin' ? 'Administrator Login' : 'User Login'}
                    </span>
                </div>
                <p className="text-xs mt-1 opacity-90">
                    {currentMode === 'admin' 
                        ? 'You are accessing the administrative interface. This requires elevated privileges.'
                        : 'Standard user access to Code Battle Ground platform.'
                    }
                </p>
            </div>
        </div>
    );
};

export default LoginModeSwitcher;