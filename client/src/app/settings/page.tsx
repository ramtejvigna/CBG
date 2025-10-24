"use client";

import { useEffect, useState, useRef } from 'react';
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
    Upload,
    X,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '@/lib/store/themeStore';
import { useUserProfile } from '@/hooks/useUserProfile';

const Settings = () => {
    const { user } = useAuthStore();
    const { theme } = useThemeStore();
    const { userData, loading: profileLoading, fetchUserProfileById, updateUserProfile } = useUserProfile();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasFetchedRef = useRef(false);

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
                                                        className={`px-4 py-2 rounded-md border transition-colors ${
                                                            imageUploading 
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

                                {activeTab === 'notifications' && (
                                    <div>
                                        <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
                                        {/* Notification settings content */}
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div>
                                        <h2 className="text-xl font-bold mb-4">Security Settings</h2>
                                        {/* Security settings content */}
                                    </div>
                                )}

                                {activeTab === 'billing' && (
                                    <div>
                                        <h2 className="text-xl font-bold mb-4">Billing Information</h2>
                                        {/* Billing content */}
                                    </div>
                                )}

                                {activeTab === 'preferences' && (
                                    <div>
                                        <h2 className="text-xl font-bold mb-4">User Preferences</h2>
                                        {/* Preferences content */}
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
