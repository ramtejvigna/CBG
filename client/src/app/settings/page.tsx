"use client";

import { useEffect, useState, useRef, use } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import Loader from '@/components/Loader';
import {
    User as UserIcon,
    Bell,
    Shield,
    CreditCard,
    Settings as SettingsIcon,
    ChevronRight,
    LogOut,
    Lock,
    Eye,
    EyeOff,
    Mail,
    Flame,
    Trophy,
    TrendingUp,
    Moon,
    Sun,
    Monitor,
    Check,
    Upload,
    X,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '@/lib/store/themeStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Theme } from '@/lib/store/themeStore';

const Settings = () => {
    const { user } = useAuthStore();
    const { theme, setTheme } = useThemeStore();
    const { userData, loading: profileLoading, fetchUserProfileById, updateUserProfile } = useUserProfile();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasFetchedRef = useRef(false);

    const [notificationPrefs, setNotificationPrefs] = useState({
        contestAlerts: true,
        leaderboardUpdates: true,
        streakAlerts: true,
        emailNotifications: true,
        digestFrequency: 'weekly'
    })

    const [securitySettings, setSecuritySettings] = useState({
        twoFactorEnabled: false,
        showPassword: false,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    })

    const [preferences, setPreferences] = useState({
        theme: theme || "system",
        language: "en",
        codeEditor: "vs-dark"
    })
    // Form states for profile info
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        preferredLanguage: 'javascript'
    });

    // Helper function to check if theme is dark
    const isDark = theme === 'dark';


    useEffect(() => {
        if (user?.id && !userData && !profileLoading && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchUserProfileById(user.id).finally(() => setLoading(false));
        } else if (userData) {
            setLoading(false);
        }
    }, [user?.id, userData, profileLoading, fetchUserProfileById]);

    // Reset fetch flag when user changes
    useEffect(() => {
        hasFetchedRef.current = false;
    }, [user?.id]);

    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.userProfile?.phone || '',
                bio: userData.userProfile?.bio || '',
                preferredLanguage: userData.userProfile?.preferredLanguage || 'javascript'
            });
            setImagePreview(userData.image || null);
        }
    }, [userData]);

    const handleThemeChange = (newTheme: Theme) => {
        setPreferences({ ...preferences, theme: newTheme });
        setTheme(newTheme);
        toast.success(`Theme changed to ${newTheme}`);
    }

    const toggleNotificationPref = (key: string) => {
        setNotificationPrefs(prev => ({
            ...prev,
            [key]: !prev[key as keyof typeof prev]
        }));
    }

    const saveNotificationSettings = async () => {
        setSaving(true);
        try {
            // Simulated save - in real app, update to backend
            await new Promise((resolve) => setTimeout(resolve, 800))
            toast.success("Notification preferences saved!")
        } catch (err) {
            toast.error("Failed to save notification settings")
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error("Please upload a valid image file (JPG, PNG, GIF, or WebP)");
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }

            setImageUploading(true);

            try {
                let imageDataUrl: string;

                // If image is larger than 1MB, compress it
                if (file.size > 1024 * 1024) {
                    toast("Compressing large image...", { duration: 2000 });
                    imageDataUrl = await compressImage(file, 800, 0.8);
                } else {
                    // For smaller images, use original
                    imageDataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }

                setImagePreview(imageDataUrl);
                setImageUploading(false);
                toast.success("Image uploaded successfully");
            } catch (error) {
                setImageUploading(false);
                console.error('Error processing image:', error);
                toast.error("Error processing the image file");
            }
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success("Image removed");
    };

    // Helper function to compress image
    const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = document.createElement('img');

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = (width * maxWidth) / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const saveProfile = async () => {
        if (!user) return;

        try {
            setSaving(true);

            const updateData = {
                name: formData.name,
                email: formData.email,
                image: imagePreview === null ? null : imagePreview,
                profile: {
                    phone: formData.phone,
                    bio: formData.bio,
                    preferredLanguage: formData.preferredLanguage
                }
            };

            await updateUserProfile(user.id, updateData);
            toast.success("Profile updated successfully");
        } catch (err) {
            console.error("Error updating profile:", err);
            toast.error("Error saving profile changes");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;
    if (loading || profileLoading) return <Loader />;

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: <UserIcon className="w-5 h-5" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
        { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'preferences', label: 'Preferences', icon: <SettingsIcon className="w-5 h-5" /> },
    ];

    return (
        <div className={`${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'} min-h-screen transition-colors duration-300`}>
            {/* Main content with sidebar */}
            <div className="grid px-16 py-12 grid-cols-1 md:grid-cols-4 gap-16">
                {/* Sidebar */}
                <aside className={`md:col-span-1 rounded-lg h-fit transition-colors duration-300`}>
                    <nav>
                        <ul className="space-y-1">
                            {tabs.map((tab) => (
                                <motion.li key={tab.id} whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${activeTab === tab.id
                                            ? isDark
                                                ? 'bg-gray-700 text-orange-500'
                                                : 'bg-gray-200 text-orange-600'
                                            : isDark
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            {tab.icon}
                                            <span className="ml-3">{tab.label}</span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
                                    </button>
                                </motion.li>
                            ))}

                            <motion.li whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                                <button
                                    className={`w-full flex items-center justify-between p-3 rounded-lg mt-6 ${isDark
                                        ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                        } transition-colors`}
                                >
                                    <div className="flex items-center">
                                        <LogOut className="w-5 h-5" />
                                        <span className="ml-3">Logout</span>
                                    </div>
                                </button>
                            </motion.li>
                        </ul>
                    </nav>
                </aside>

                {/* Main content */}
                <main className={`md:col-span-3 transition-colors duration-300`}>
                    <div className="animate-fadeIn">
                        {(
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'profile' && (
                                    <div>
                                        <h2 className="text-2xl font-normal mb-4">Profile Settings</h2>
                                        <hr className='opacity-25 mb-4' />
                                        <div className={`p-4 grid grid-cols-1 md:grid-cols-2 gap-8`}>
                                            <div className="flex flex-col items-start gap-8">
                                                <div className='w-full'>
                                                    <label className="block text-sm font-semibold mb-1">Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-3 text-sm py-2 rounded-md ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                                                    />
                                                </div>
                                                <div className='w-full flex items-center gap-3'>
                                                    <label className="text-sm font-semibold">Username : </label>
                                                    <p className='opacity-85'>{userData?.username}</p>
                                                </div>
                                                <div className='w-full'>
                                                    <label className="block text-sm font-semibold mb-1">Email</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className={`w-full px-3 py-2 rounded-md ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                                                    />
                                                </div>
                                                <div className='w-full'>
                                                    <label className="block text-sm font-semibold mb-1">Phone</label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        placeholder="Add phone number"
                                                        className={`w-full px-3 py-2 rounded-md ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                                                    />
                                                </div>

                                                <div className='w-full'>
                                                    <label className="block text-sm font-semibold mb-1">Preferred Language</label>
                                                    <select
                                                        name="preferredLanguage"
                                                        value={formData.preferredLanguage}
                                                        onChange={e => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                                        className={`w-full px-3 py-2 rounded-md ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                                                    >
                                                        <option value="javascript">JavaScript</option>
                                                        <option value="typescript">TypeScript</option>
                                                        <option value="python">Python</option>
                                                        <option value="java">Java</option>
                                                        <option value="csharp">C#</option>
                                                        <option value="c++">C++</option>
                                                    </select>
                                                </div>

                                                <div className="mt-6 w-full">
                                                    <label className="block text-sm font-semibold mb-1">Bio</label>
                                                    <textarea
                                                        rows={4}
                                                        name="bio"
                                                        value={formData.bio}
                                                        onChange={handleInputChange}
                                                        placeholder="Tell us about yourself"
                                                        className={`w-full px-3 py-2 rounded-md ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                                                    ></textarea>
                                                </div>

                                                <div className="mt-6 flex justify-end w-full">
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={saveProfile}
                                                        disabled={saving}
                                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors flex items-center gap-2"
                                                    >
                                                        {saving ? (
                                                            <>
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap className="w-5 h-5 mr-2" />
                                                                Save Changes
                                                            </>
                                                        )}
                                                    </motion.button>
                                                </div>
                                            </div>

                                            <div className='flex flex-col items-center justify-start gap-4'>
                                                <div className="relative">
                                                    <div className="w-60 h-60 uppercase rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-6xl font-bold text-white relative group overflow-hidden">
                                                        {imagePreview ? (
                                                            <img
                                                                src={imagePreview}
                                                                alt={userData?.name || 'User'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            userData?.username?.charAt(0)
                                                        )}

                                                        {/* Upload overlay */}
                                                        <motion.div
                                                            className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                            onClick={triggerFileInput}
                                                        >
                                                            <div className="bg-gray-800 p-2 px-4 rounded-md border border-gray-600 flex items-center gap-2">
                                                                <Upload className="w-5 h-5 text-white" />
                                                                <p className="text-sm capitalize font-normal text-white">
                                                                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                                                                </p>
                                                            </div>
                                                        </motion.div>

                                                        {/* Loading overlay */}
                                                        {imageUploading && (
                                                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                                                <div className="bg-gray-800 p-3 rounded-md border border-gray-600 flex items-center gap-2">
                                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    <p className="text-sm text-white">Uploading...</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Remove image button */}
                                                    {imagePreview && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={removeImage}
                                                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </motion.button>
                                                    )}
                                                </div>

                                                {/* Hidden file input */}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />

                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: imageUploading ? 1 : 1.02 }}
                                                        whileTap={{ scale: imageUploading ? 1 : 0.98 }}
                                                        onClick={triggerFileInput}
                                                        disabled={imageUploading}
                                                        className={`px-4 py-2 rounded-md border transition-colors ${imageUploading
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : isDark
                                                                ? 'border-gray-600 hover:bg-gray-700'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {imageUploading ? (
                                                                <>
                                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    <span className="text-sm">Uploading...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload className="w-4 h-4" />
                                                                    <span className="text-sm">Choose File</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </motion.button>

                                                    {imagePreview && imagePreview !== userData?.image && !imageUploading && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={removeImage}
                                                            className="px-4 py-2 rounded-md border border-red-500 text-red-500 hover:bg-red-50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <X className="w-4 h-4" />
                                                                <span className="text-sm">Remove</span>
                                                            </div>
                                                        </motion.button>
                                                    )}
                                                </div>

                                                <p className="text-sm text-center mt-2 opacity-70">
                                                    Upload a profile photo<br />
                                                    JPG, PNG, GIF, or WebP. Max 5MB.
                                                </p>

                                                {/* Stats and badges section */}
                                                <div className={`mt-8 p-4 w-full rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                                    <h3 className="text-lg font-medium mb-3">Profile Stats</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                                                            <p className="text-2xl font-bold">{userData?.userProfile?.solved || 0}</p>
                                                            <p className="text-xs opacity-70">Problems Solved</p>
                                                        </div>
                                                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                                                            <p className="text-2xl font-bold">{userData?.userProfile?.level || 0}</p>
                                                            <p className="text-xs opacity-70">Current Level</p>
                                                        </div>
                                                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
                                                            <p className="text-2xl font-bold">{userData?.userProfile?.points || 0}</p>
                                                            <p className="text-xs opacity-70">Total Points</p>
                                                        </div>
                                                        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10">
                                                            <p className="text-2xl font-bold">{userData?.userProfile?.streakDays || 0}</p>
                                                            <p className="text-xs opacity-70">Day Streak</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "notifications" && (
                                    <div>
                                        <h2 className="text-2xl font-normal mb-4">Notification Settings</h2>
                                        <hr className="opacity-25 mb-6" />

                                        <div className={`space-y-6`}>
                                            {/* Email Notifications Section */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isDark ? "bg-orange-500/20" : "bg-orange-100"}`}>
                                                            <Mail className="w-5 h-5 text-orange-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">Email Notifications</h3>
                                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                                Receive important updates via email
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => toggleNotificationPref("emailNotifications")}
                                                        className={`relative w-12 h-6 rounded-full transition-colors ${notificationPrefs.emailNotifications ? "bg-orange-500" : isDark ? "bg-gray-700" : "bg-gray-300"}`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all"
                                                            initial={false}
                                                            animate={{ left: notificationPrefs.emailNotifications ? "26px" : "2px" }}
                                                        />
                                                    </motion.button>
                                                </div>
                                            </motion.div>

                                            {/* Contest Alerts */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
                                                            <Trophy className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">Contest Alerts</h3>
                                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                                Get notified about upcoming contests and registration deadlines
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => toggleNotificationPref("contestAlerts")}
                                                        className={`relative w-12 h-6 rounded-full transition-colors ${notificationPrefs.contestAlerts ? "bg-blue-500" : isDark ? "bg-gray-700" : "bg-gray-300"}`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all"
                                                            initial={false}
                                                            animate={{ left: notificationPrefs.contestAlerts ? "26px" : "2px" }}
                                                        />
                                                    </motion.button>
                                                </div>
                                                <p className={`text-xs ml-11 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                                    Send to: {notificationPrefs.emailNotifications ? userData?.email : "Email disabled"}
                                                </p>
                                            </motion.div>

                                            {/* Leaderboard Updates */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                                                            <TrendingUp className="w-5 h-5 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">Leaderboard Updates</h3>
                                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                                Get updates when your ranking changes
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => toggleNotificationPref("leaderboardUpdates")}
                                                        className={`relative w-12 h-6 rounded-full transition-colors ${notificationPrefs.leaderboardUpdates ? "bg-purple-500" : isDark ? "bg-gray-700" : "bg-gray-300"}`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all"
                                                            initial={false}
                                                            animate={{ left: notificationPrefs.leaderboardUpdates ? "26px" : "2px" }}
                                                        />
                                                    </motion.button>
                                                </div>
                                                <p className={`text-xs ml-11 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                                    Send to: {notificationPrefs.emailNotifications ? userData?.email : "Email disabled"}
                                                </p>
                                            </motion.div>

                                            {/* Streak Alerts */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isDark ? "bg-red-500/20" : "bg-red-100"}`}>
                                                            <Flame className="w-5 h-5 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">Streak Alerts</h3>
                                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                                Remind you to maintain your coding streak
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => toggleNotificationPref("streakAlerts")}
                                                        className={`relative w-12 h-6 rounded-full transition-colors ${notificationPrefs.streakAlerts ? "bg-red-500" : isDark ? "bg-gray-700" : "bg-gray-300"}`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all"
                                                            initial={false}
                                                            animate={{ left: notificationPrefs.streakAlerts ? "26px" : "2px" }}
                                                        />
                                                    </motion.button>
                                                </div>
                                                <p className={`text-xs ml-11 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                                    Send to: {notificationPrefs.emailNotifications ? userData?.email : "Email disabled"}
                                                </p>
                                            </motion.div>

                                            {/* Digest Frequency */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.7 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <label className="block text-sm font-semibold mb-3">Digest Frequency</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {["daily", "weekly", "monthly"].map((freq) => (
                                                        <motion.button
                                                            key={freq}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setNotificationPrefs({ ...notificationPrefs, digestFrequency: freq })}
                                                            className={`py-2 px-4 rounded-lg transition-all capitalize ${notificationPrefs.digestFrequency === freq
                                                                ? "bg-orange-500 text-white"
                                                                : isDark
                                                                    ? "bg-gray-700 hover:bg-gray-600"
                                                                    : "bg-gray-100 hover:bg-gray-200"
                                                                }`}
                                                        >
                                                            {freq}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </motion.div>

                                            {/* Save Button */}
                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={saveNotificationSettings}
                                                disabled={saving}
                                                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                {saving ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-5 w-5"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-5 h-5" />
                                                        Save Notification Settings
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div>
                                        <h2 className="text-2xl font-normal mb-4">Security Settings</h2>
                                        <hr className="opacity-25 mb-6" />

                                        <div className={`space-y-6`}>
                                            {/* Account Security */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`p-2 rounded-lg ${isDark ? "bg-green-500/20" : "bg-green-100"}`}>
                                                        <Lock className="w-5 h-5 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">Password</h3>
                                                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                            Change your account password
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 ml-11">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">Current Password</label>
                                                        <div
                                                            className={`flex items-center px-3 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
                                                        >
                                                            <input
                                                                type={securitySettings.showPassword ? "text" : "password"}
                                                                value={securitySettings.currentPassword}
                                                                onChange={(e) =>
                                                                    setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })
                                                                }
                                                                placeholder="Enter current password"
                                                                className={`flex-1 outline-none bg-transparent text-sm`}
                                                            />
                                                            <button
                                                                onClick={() =>
                                                                    setSecuritySettings({
                                                                        ...securitySettings,
                                                                        showPassword: !securitySettings.showPassword,
                                                                    })
                                                                }
                                                                className="text-gray-500 hover:text-gray-700"
                                                            >
                                                                {securitySettings.showPassword ? (
                                                                    <EyeOff className="w-4 h-4" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">New Password</label>
                                                        <input
                                                            type="password"
                                                            value={securitySettings.newPassword}
                                                            onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                                                            placeholder="Enter new password"
                                                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"} outline-none text-sm`}
                                                        />
                                                        <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                                                            Minimum 8 characters, include uppercase, lowercase, and numbers
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                                        <input
                                                            type="password"
                                                            value={securitySettings.confirmNewPassword}
                                                            onChange={(e) =>
                                                                setSecuritySettings({ ...securitySettings, confirmNewPassword: e.target.value })
                                                            }
                                                            placeholder="Confirm new password"
                                                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"} outline-none text-sm`}
                                                        />
                                                    </div>

                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                                    >
                                                        Update Password
                                                    </motion.button>
                                                </div>
                                            </motion.div>

                                            {/* Two-Factor Authentication */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                                                            <Shield className="w-5 h-5 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">Two-Factor Authentication</h3>
                                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                                Add extra security to your account
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() =>
                                                            setSecuritySettings({
                                                                ...securitySettings,
                                                                twoFactorEnabled: !securitySettings.twoFactorEnabled,
                                                            })
                                                        }
                                                        className={`relative w-12 h-6 rounded-full transition-colors ${securitySettings.twoFactorEnabled ? "bg-purple-500" : isDark ? "bg-gray-700" : "bg-gray-300"}`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all"
                                                            initial={false}
                                                            animate={{ left: securitySettings.twoFactorEnabled ? "26px" : "2px" }}
                                                        />
                                                    </motion.button>
                                                </div>
                                                {securitySettings.twoFactorEnabled && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`mt-3 text-sm ${isDark ? "text-purple-400" : "text-purple-600"}`}
                                                    >
                                                        ✓ Two-factor authentication is enabled
                                                    </motion.p>
                                                )}
                                            </motion.div>

                                            {/* Active Sessions */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <h3 className="font-semibold mb-4">Active Sessions</h3>
                                                <div className={`space-y-2 p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>Current Session - Browser</span>
                                                        <span className="text-xs text-green-500">● Active</span>
                                                    </div>
                                                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Last active: Just now</p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "preferences" && (
                                    <div>
                                        <h2 className="text-2xl font-normal mb-4">User Preferences</h2>
                                        <hr className="opacity-25 mb-6" />

                                        <div className={`space-y-6`}>
                                            {/* Theme Selection */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <h3 className="font-semibold mb-4">Appearance</h3>
                                                <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                    Choose your preferred color theme
                                                </p>

                                                <div className="grid grid-cols-3 gap-4">
                                                    {([
                                                        { id: "light" as const, label: "Light", icon: Sun },
                                                        { id: "dark" as const, label: "Dark", icon: Moon },
                                                        { id: "system" as const, label: "System", icon: Monitor },
                                                    ] as const).map(({ id, label, icon: Icon }) => (
                                                        <motion.button
                                                            key={id}
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => handleThemeChange(id)}
                                                            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${preferences.theme === id
                                                                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                                                    : isDark
                                                                        ? "border-gray-700 hover:border-gray-600"
                                                                        : "border-gray-200 hover:border-gray-300"
                                                                }`}
                                                        >
                                                            <Icon className="w-6 h-6" />
                                                            <span className="text-sm font-medium">{label}</span>
                                                            {preferences.theme === id && (
                                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-orange-500">
                                                                    <Check className="w-4 h-4" />
                                                                </motion.div>
                                                            )}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </motion.div>

                                            {/* Language Selection */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <label className="block text-sm font-semibold mb-3">Language</label>
                                                <select
                                                    value={preferences.language}
                                                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                                                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"} outline-none text-sm transition-colors`}
                                                >
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                    <option value="de">German</option>
                                                    <option value="zh">Chinese</option>
                                                    <option value="ja">Japanese</option>
                                                </select>
                                            </motion.div>

                                            {/* Code Editor Theme */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <label className="block text-sm font-semibold mb-3">Code Editor Theme</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {["vs-dark", "vs-light", "github-dark", "monokai"].map((editorTheme) => (
                                                        <motion.button
                                                            key={editorTheme}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setPreferences({ ...preferences, codeEditor: editorTheme })}
                                                            className={`p-3 rounded-lg border transition-all capitalize text-sm ${preferences.codeEditor === editorTheme
                                                                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                                                    : isDark
                                                                        ? "border-gray-700 hover:bg-gray-700"
                                                                        : "border-gray-300 hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            {editorTheme.replace("-", " ")}
                                                            {preferences.codeEditor === editorTheme && <Check className="w-4 h-4 inline ml-2" />}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </motion.div>

                                            {/* Additional Preferences */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6 }}
                                                className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-colors`}
                                            >
                                                <h3 className="font-semibold mb-4">Other Preferences</h3>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                                        <span className="text-sm font-medium">Show hints during contests</span>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className={`relative w-10 h-5 rounded-full transition-colors bg-orange-500`}
                                                        >
                                                            <motion.div
                                                                layout
                                                                className="absolute w-4 h-4 bg-white rounded-full top-0.5 right-0.5 transition-all"
                                                            />
                                                        </motion.button>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                                        <span className="text-sm font-medium">Sound effects</span>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className={`relative w-10 h-5 rounded-full transition-colors bg-orange-500`}
                                                        >
                                                            <motion.div
                                                                layout
                                                                className="absolute w-4 h-4 bg-white rounded-full top-0.5 right-0.5 transition-all"
                                                            />
                                                        </motion.button>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                                        <span className="text-sm font-medium">Auto-save code</span>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className={`relative w-10 h-5 rounded-full transition-colors bg-orange-500`}
                                                        >
                                                            <motion.div
                                                                layout
                                                                className="absolute w-4 h-4 bg-white rounded-full top-0.5 right-0.5 transition-all"
                                                            />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Save Preferences */}
                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-5 h-5" />
                                                Save Preferences
                                            </motion.button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
