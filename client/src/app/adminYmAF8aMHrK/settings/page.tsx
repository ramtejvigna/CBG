/* eslint-disable */
"use client";

import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    Database, 
    Mail, 
    Shield, 
    Globe, 
    Code, 
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/admin/StatCard';

interface SystemSettings {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    allowRegistration: boolean;
    enableEmailVerification: boolean;
    maxSubmissionsPerUser: number;
    contestRegistrationEnabled: boolean;
    maintenanceMode: boolean;
    emailProvider: string;
    databaseConnection: string;
    cacheEnabled: boolean;
    debugMode: boolean;
    apiRateLimit: number;
    maxFileUploadSize: number;
    defaultChallengeTimeLimit: number;
    defaultChallengeMemoryLimit: number;
}

interface SystemHealth {
    database: 'online' | 'offline' | 'warning';
    emailService: 'online' | 'offline' | 'warning';
    codeExecution: 'online' | 'offline' | 'warning';
    storage: 'online' | 'offline' | 'warning';
}

const AdminSettings = () => {
    const { theme } = useThemeStore();
    const [settings, setSettings] = useState<SystemSettings>({
        siteName: 'Code Battle Ground',
        siteDescription: 'Competitive programming platform',
        adminEmail: 'admin@cbg.com',
        allowRegistration: true,
        enableEmailVerification: true,
        maxSubmissionsPerUser: 100,
        contestRegistrationEnabled: true,
        maintenanceMode: false,
        emailProvider: 'smtp',
        databaseConnection: 'postgresql://localhost:5432/cbg',
        cacheEnabled: true,
        debugMode: false,
        apiRateLimit: 1000,
        maxFileUploadSize: 10,
        defaultChallengeTimeLimit: 2000,
        defaultChallengeMemoryLimit: 512
    });
    
    const [systemHealth, setSystemHealth] = useState<SystemHealth>({
        database: 'online',
        emailService: 'warning',
        codeExecution: 'online',
        storage: 'online'
    });
    
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        fetchSettings();
        fetchSystemHealth();
    }, []);

    const fetchSettings = async () => {
        try {
            // Mock API call - replace with actual endpoint
            console.log('Fetching system settings...');
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const fetchSystemHealth = async () => {
        try {
            // Mock API call - replace with actual endpoint
            console.log('Fetching system health...');
        } catch (error) {
            console.error('Failed to fetch system health:', error);
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            // Mock API call - replace with actual endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Saving settings:', settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: keyof SystemSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getHealthIcon = (status: SystemHealth[keyof SystemHealth]) => {
        switch (status) {
            case 'online':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'offline':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
        }
    };

    const getHealthText = (status: SystemHealth[keyof SystemHealth]) => {
        switch (status) {
            case 'online':
                return 'Online';
            case 'warning':
                return 'Warning';
            case 'offline':
                return 'Offline';
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'system', label: 'System', icon: Database },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'challenges', label: 'Challenges', icon: Code }
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        System Settings
                    </h1>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Configure system settings and monitor health
                    </p>
                </div>
                <div className="flex space-x-3">
                    <Button 
                        variant="outline" 
                        onClick={fetchSystemHealth}
                        className="flex items-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button 
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={handleSaveSettings}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </div>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Success Message */}
            {saved && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    Settings saved successfully!
                </div>
            )}

            {/* System Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Database"
                    value={getHealthText(systemHealth.database)}
                    icon={Database}
                />
                <StatCard
                    title="Email Service"
                    value={getHealthText(systemHealth.emailService)}
                    icon={Mail}
                />
                <StatCard
                    title="Code Execution"
                    value={getHealthText(systemHealth.codeExecution)}
                    icon={Code}
                />
                <StatCard
                    title="Storage"
                    value={getHealthText(systemHealth.storage)}
                    icon={Globe}
                />
            </div>

            {/* Settings Tabs */}
            <div className={`rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                {/* Tab Navigation */}
                <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex space-x-8 px-6">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-4 border-b-2 text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-orange-500 text-orange-600'
                                            : `border-transparent ${
                                                theme === 'dark' 
                                                    ? 'text-gray-400 hover:text-gray-300' 
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                General Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Site Name
                                    </label>
                                    <Input
                                        type="text"
                                        value={settings.siteName}
                                        onChange={(e) => handleInputChange('siteName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Admin Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={settings.adminEmail}
                                        onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Site Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={settings.siteDescription}
                                    onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        theme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300'
                                    }`}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="allowRegistration"
                                        checked={settings.allowRegistration}
                                        onChange={(e) => handleInputChange('allowRegistration', e.target.checked)}
                                        className="w-4 h-4 text-orange-600 rounded"
                                    />
                                    <label htmlFor="allowRegistration" className={`text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Allow new user registrations
                                    </label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="maintenanceMode"
                                        checked={settings.maintenanceMode}
                                        onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                                        className="w-4 h-4 text-orange-600 rounded"
                                    />
                                    <label htmlFor="maintenanceMode" className={`text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Maintenance mode
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                System Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        API Rate Limit (requests/hour)
                                    </label>
                                    <Input
                                        type="number"
                                        value={settings.apiRateLimit}
                                        onChange={(e) => handleInputChange('apiRateLimit', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Max File Upload Size (MB)
                                    </label>
                                    <Input
                                        type="number"
                                        value={settings.maxFileUploadSize}
                                        onChange={(e) => handleInputChange('maxFileUploadSize', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="cacheEnabled"
                                        checked={settings.cacheEnabled}
                                        onChange={(e) => handleInputChange('cacheEnabled', e.target.checked)}
                                        className="w-4 h-4 text-orange-600 rounded"
                                    />
                                    <label htmlFor="cacheEnabled" className={`text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Enable caching
                                    </label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="debugMode"
                                        checked={settings.debugMode}
                                        onChange={(e) => handleInputChange('debugMode', e.target.checked)}
                                        className="w-4 h-4 text-orange-600 rounded"
                                    />
                                    <label htmlFor="debugMode" className={`text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Debug mode
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'challenges' && (
                        <div className="space-y-6">
                            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Challenge Defaults
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Default Time Limit (ms)
                                    </label>
                                    <Input
                                        type="number"
                                        value={settings.defaultChallengeTimeLimit}
                                        onChange={(e) => handleInputChange('defaultChallengeTimeLimit', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Default Memory Limit (MB)
                                    </label>
                                    <Input
                                        type="number"
                                        value={settings.defaultChallengeMemoryLimit}
                                        onChange={(e) => handleInputChange('defaultChallengeMemoryLimit', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Max Submissions Per User
                                </label>
                                <Input
                                    type="number"
                                    value={settings.maxSubmissionsPerUser}
                                    onChange={(e) => handleInputChange('maxSubmissionsPerUser', parseInt(e.target.value))}
                                    className="w-full md:w-1/2"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;