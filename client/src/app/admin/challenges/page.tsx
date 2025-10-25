"use client";

import React, { useState } from 'react';
import { 
    Search, 
    Filter, 
    Plus, 
    Edit3, 
    Trash2, 
    Eye, 
    Code2,
    CheckCircle,
    Trophy,
    AlertCircle
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { useAdminChallenges } from '@/hooks/useAdminChallenges';
import { useCategories } from '@/hooks/useCategories';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import StatCard from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    points: number;
    category: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
    submissions: number;
    acceptanceRate: number;
    timeLimit: number;
    memoryLimit: number;
    status: 'draft' | 'published' | 'archived';
    creator: {
        name: string;
        username: string;
    };
    testCases: number;
}

interface ChallengeFilter {
    difficulty: string;
    category: string;
    status: string;
    search: string;
}

interface ChallengeStats {
    total: number;
    published: number;
    draft: number;
    totalSubmissions: number;
}

const ChallengeManagement = () => {
    const { theme } = useThemeStore();
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filters, setFilters] = useState<ChallengeFilter>({
        difficulty: '',
        category: '',
        status: '',
        search: ''
    });
    const [currentPage, setCurrentPage] = useState(1);

    const {
        challenges,
        stats,
        loading,
        error,
        totalPages,
        fetchChallenges,
        createChallenge,
        updateChallenge,
        deleteChallenge
    } = useAdminChallenges(filters, currentPage, 20);

    const { categories } = useCategories();

    const handleCreateChallenge = () => {
        setSelectedChallenge({
            id: '',
            title: '',
            description: '',
            difficulty: 'EASY',
            points: 100,
            category: { id: '', name: '' },
            createdAt: '',
            updatedAt: '',
            submissions: 0,
            acceptanceRate: 0,
            timeLimit: 1000,
            memoryLimit: 256,
            status: 'published',
            creator: { name: '', username: '' },
            testCases: 0
        });
        setIsCreateModalOpen(true);
    };

    const handleEditChallenge = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsEditModalOpen(true);
    };

    const handleDeleteChallenge = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsDeleteModalOpen(true);
    };

    const handleSaveChallenge = async (challengeData: Partial<Challenge>) => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            if (isCreateModalOpen) {
                await createChallenge(challengeData);
            } else if (selectedChallenge) {
                await updateChallenge(selectedChallenge.id, challengeData);
            }
            
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedChallenge(null);
        } catch (error) {
            console.error('Failed to save challenge:', error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedChallenge || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await deleteChallenge(selectedChallenge.id);
            setIsDeleteModalOpen(false);
            setSelectedChallenge(null);
        } catch (error) {
            console.error('Failed to delete challenge:', error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFilterChange = (newFilters: Partial<ChallengeFilter>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const clearFilters = () => {
        setFilters({ difficulty: '', category: '', status: '', search: '' });
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
                        <span className="font-medium">Error loading challenges</span>
                    </div>
                    <p className="mt-2 text-sm">{error}</p>
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="mt-3"
                        variant="outline"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const getDifficultyBadge = (difficulty: string) => {
        const styles = {
            EASY: 'bg-green-100 text-green-800',
            MEDIUM: 'bg-yellow-100 text-yellow-800',
            HARD: 'bg-red-100 text-red-800',
            EXPERT: 'bg-purple-100 text-purple-800'
        };
        
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[difficulty as keyof typeof styles]}`}>
                {difficulty}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            published: 'bg-green-100 text-green-800',
            draft: 'bg-gray-100 text-gray-800',
            archived: 'bg-red-100 text-red-800'
        };
        
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const tableHeaders = ['Title', 'Difficulty', 'Category', 'Points', 'Status', 'Submissions', 'Acceptance', 'Created'];

    const formatTableData = (challenges: Challenge[]) => {
        return challenges.map(challenge => ({
            title: challenge.title,
            difficulty: getDifficultyBadge(challenge.difficulty),
            category: challenge.category.name,
            points: challenge.points,
            status: getStatusBadge(challenge.status),
            submissions: challenge.submissions,
            acceptance: `${challenge.acceptanceRate}%`,
            created: new Date(challenge.createdAt).toLocaleDateString(),
            _originalData: challenge
        }));
    };

    const renderActions = (item: any) => {
        const challenge = item._originalData as Challenge;
        return (
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => console.log('View challenge:', challenge.id)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="View Challenge"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleEditChallenge(challenge)}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Edit Challenge"
                >
                    <Edit3 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleDeleteChallenge(challenge)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete Challenge"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Challenge Management
                    </h1>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Create and manage coding challenges
                    </p>
                </div>
                <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleCreateChallenge}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Challenges"
                    value={stats?.total || 0}
                    icon={Code2}
                    loading={!stats}
                />
                <StatCard
                    title="Published"
                    value={stats?.published || 0}
                    icon={CheckCircle}
                    loading={!stats}
                />
                <StatCard
                    title="Draft"
                    value={stats?.draft || 0}
                    icon={Edit3}
                    loading={!stats}
                />
                <StatCard
                    title="Total Submissions"
                    value={stats?.totalSubmissions?.toLocaleString() || 0}
                    icon={Trophy}
                    loading={!stats}
                />
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                placeholder="Search challenges..."
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
                            Difficulty
                        </label>
                        <select
                            value={filters.difficulty}
                            onChange={(e) => handleFilterChange({ difficulty: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                            }`}
                        >
                            <option value="">All Difficulties</option>
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                            <option value="EXPERT">Expert</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Category
                        </label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange({ category: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                            }`}
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
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
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button 
                            variant="outline" 
                            onClick={clearFilters}
                            className="w-full"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </div>
            </div>

            {/* Challenges Table */}
            <DataTable
                headers={tableHeaders}
                data={formatTableData(challenges)}
                actions={renderActions}
                loading={loading}
                emptyMessage="No challenges found"
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

            {/* Create/Edit Challenge Modal */}
            <Modal
                isOpen={isCreateModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedChallenge(null);
                }}
                title={isCreateModalOpen ? "Create Challenge" : "Edit Challenge"}
                size="lg"
                footer={
                    <div className="flex justify-end space-x-3">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                setIsEditModalOpen(false);
                                setSelectedChallenge(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={() => handleSaveChallenge(selectedChallenge || {})}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isCreateModalOpen ? "Create" : "Save Changes")}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Title
                            </label>
                            <Input
                                type="text"
                                placeholder="Challenge title"
                                value={selectedChallenge?.title || ''}
                                onChange={(e) => setSelectedChallenge(prev => 
                                    prev ? { ...prev, title: e.target.value } : null
                                )}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Difficulty
                            </label>
                            <select
                                value={selectedChallenge?.difficulty || 'EASY'}
                                onChange={(e) => setSelectedChallenge(prev => 
                                    prev ? { ...prev, difficulty: e.target.value as Challenge['difficulty'] } : null
                                )}
                                className={`w-full px-3 py-2 border rounded-md ${
                                    theme === 'dark' 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300'
                                }`}
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                                <option value="EXPERT">Expert</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Description
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Challenge description"
                            value={selectedChallenge?.description || ''}
                            onChange={(e) => setSelectedChallenge(prev => 
                                prev ? { ...prev, description: e.target.value } : null
                            )}
                            className={`w-full px-3 py-2 border rounded-md ${
                                theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                            }`}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Points
                            </label>
                            <Input
                                type="number"
                                placeholder="100"
                                value={selectedChallenge?.points || ''}
                                onChange={(e) => setSelectedChallenge(prev => 
                                    prev ? { ...prev, points: parseInt(e.target.value) } : null
                                )}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Time Limit (ms)
                            </label>
                            <Input
                                type="number"
                                placeholder="1000"
                                value={selectedChallenge?.timeLimit || ''}
                                onChange={(e) => setSelectedChallenge(prev => 
                                    prev ? { ...prev, timeLimit: parseInt(e.target.value) } : null
                                )}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Memory Limit (MB)
                            </label>
                            <Input
                                type="number"
                                placeholder="256"
                                value={selectedChallenge?.memoryLimit || ''}
                                onChange={(e) => setSelectedChallenge(prev => 
                                    prev ? { ...prev, memoryLimit: parseInt(e.target.value) } : null
                                )}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Challenge"
                size="md"
                footer={
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button 
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={handleConfirmDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Challenge'}
                        </Button>
                    </div>
                }
            >
                <div className="text-center">
                    <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Are you sure you want to delete this challenge?
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Challenge "{selectedChallenge?.title}" will be permanently removed. This action cannot be undone.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default ChallengeManagement;