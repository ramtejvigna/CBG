/* eslint-disable */
import { useState, useEffect } from 'react';
import { createAuthHeaders } from '@/lib/auth';

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

interface UseAdminUsersReturn {
    users: User[];
    loading: boolean;
    error: string | null;
    totalUsers: number;
    currentPage: number;
    totalPages: number;
    fetchUsers: () => void;
    updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
    banUser: (userId: string, banned: boolean) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useAdminUsers = (filters: UserFilter, page: number = 1, limit: number = 20): UseAdminUsersReturn => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(page);
    const [totalPages, setTotalPages] = useState(0);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.role && { role: filters.role }),
                ...(filters.status && { status: filters.status })
            });

            const response = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...createAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Transform the data to match our User interface
            const transformedUsers = data.users.map((user: any) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name || '',
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                lastActive: user.lastActive || user.createdAt,
                totalSubmissions: user.totalSubmissions || user._count?.submissions || 0,
                points: user.userProfile?.points || 0,
                level: user.userProfile?.level || 1
            }));

            setUsers(transformedUsers);
            setTotalUsers(data.pagination.total);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userId: string, userData: Partial<User>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...createAuthHeaders()
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update user: ${response.statusText}`);
            }

            await fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error updating user:', err);
            throw err;
        }
    };

    const banUser = async (userId: string, banned: boolean) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...createAuthHeaders()
                },
                body: JSON.stringify({ banned })
            });

            if (!response.ok) {
                throw new Error(`Failed to ${banned ? 'ban' : 'unban'} user: ${response.statusText}`);
            }

            await fetchUsers(); // Refresh the list
        } catch (err) {
            console.error(`Error ${banned ? 'banning' : 'unbanning'} user:`, err);
            throw err;
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...createAuthHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete user: ${response.statusText}`);
            }

            await fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error deleting user:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters, currentPage]);

    return {
        users,
        loading,
        error,
        totalUsers,
        currentPage,
        totalPages,
        fetchUsers,
        updateUser,
        banUser,
        deleteUser
    };
};