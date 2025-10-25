"use client";

import React, { useEffect, useState } from 'react';
import { 
    Search, 
    Filter, 
    UserPlus, 
    Edit3, 
    Trash2, 
    Ban, 
    Eye,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminUsers } from '@/hooks/useAdminUsers';

interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    status: 'active' | 'inactive' | 'banned';
    createdAt: string;
    lastActive: string;
    totalSubmissions: number;
    userProfile?: {
        points: number;
        level: number;
        solved: number;
        rank: number;
    };
}

interface UserFilter {
    role: string;
    status: string;
    search: string;
}

const UserManagement = () => {
    const { theme } = useThemeStore();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [filters, setFilters] = useState<UserFilter>({
        role: '',
        status: '',
        search: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        users,
        loading,
        error,
        totalUsers,
        totalPages,
        fetchUsers,
        updateUser,
        banUser,
        deleteUser
    } = useAdminUsers(filters, currentPage, 20);

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleBanUser = async (user: User) => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            const shouldBan = user.status !== 'banned';
            await banUser(user.id, shouldBan);
        } catch (error) {
            console.error('Failed to ban/unban user:', error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveUser = async (userData: Partial<User>) => {
        if (!selectedUser || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await updateUser(selectedUser.id, userData);
            setIsEditModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user:', error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await deleteUser(selectedUser.id);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to delete user:', error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
            inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
            banned: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
        };
        
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            USER: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
            ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
        };
        
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role as keyof typeof styles]}`}>
                {role}
            </span>
        );
    };

    const tableHeaders = ['Username', 'Email', 'Name', 'Role', 'Status', 'Points', 'Level', 'Submissions', 'Last Active'];

    const formatTableData = (users: User[]) => {
        return users.map(user => ({
            username: user.username,
            email: user.email,
            name: user.name || 'N/A',
            role: getRoleBadge(user.role),
            status: getStatusBadge(user.status),
            points: user.userProfile?.points?.toLocaleString() || '0',
            level: user.userProfile?.level || 1,
            submissions: user.totalSubmissions || 0,
            lastactive: user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never',
            _originalData: user
        }));
    };

    const renderActions = (item: any) => {
        const user = item._originalData as User;
        return (
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => console.log('View user details:', user.id)}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="View Details"
                    disabled={isSubmitting}
                >
                    <Eye className="w-4 h-4" />
                </button>
                {user.status !== 'banned' ? (
                    <button
                        onClick={() => handleBanUser(user)}
                        className="p-1 text-orange-600 hover:text-orange-800 transition-colors disabled:opacity-50"
                        title="Ban User"
                        disabled={isSubmitting}
                    >
                        <Ban className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={() => handleBanUser(user)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                        title="Unban User"
                        disabled={isSubmitting}
                    >
                        <Ban className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    title="Delete User"
                    disabled={isSubmitting}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        );
    };

    const handleFilterChange = (newFilters: Partial<UserFilter>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const clearFilters = () => {
        setFilters({ role: '', status: '', search: '' });
        setCurrentPage(1);
    };

    if (error) {
        return (
            <div className="space-y-6">
                <div className={`p-4 rounded-lg border border-red-300 ${
                    theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-800'
                }`}>
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span>Error loading users: {error}</span>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={fetchUsers}
                        className="mt-2"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        User Management
                    </h1>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage user accounts and permissions ({totalUsers} total users)
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search users..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange({ search: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Role
                        </label>
                        <select
                            value={filters.role}
                            onChange={(e) => handleFilterChange({ role: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                            }`}
                        >
                            <option value="">All Roles</option>
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange({ status: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                            }`}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button 
                            variant="outline" 
                            onClick={clearFilters}
                            className="w-full"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <DataTable
                headers={tableHeaders}
                data={formatTableData(users)}
                actions={renderActions}
                loading={loading}
                emptyMessage="No users found"
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || loading}
                    >
                        Previous
                    </Button>
                    <span className={`px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
                title="Delete User"
                size="md"
                footer={
                    <div className="flex justify-end space-x-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={handleConfirmDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete User'
                            )}
                        </Button>
                    </div>
                }
            >
                <div className="text-center">
                    <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Are you sure you want to delete this user?
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        This action cannot be undone. User "{selectedUser?.username}" and all associated data will be permanently removed.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;