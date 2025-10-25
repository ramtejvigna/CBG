"use client";

import React, { useState } from 'react';
import { 
    Search, 
    Filter, 
    Plus, 
    Edit3, 
    Trash2, 
    Eye, 
    Trophy,
    Calendar,
    Users,
    Clock,
    Play,
    Pause,
    Square,
    AlertCircle
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { useAdminContests } from '@/hooks/useAdminContests';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import StatCard from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Contest {
    id: string;
    title: string;
    description: string;
    status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
    startsAt: string;
    endsAt: string;
    registrationEnd: string;
    participants: number;
    maxParticipants: number | null;
    points: number;
    createdAt: string;
    creator: {
        name: string;
        username: string;
    };
    challenges: number;
    tags: string[];
}

interface ContestFilter {
    status: string;
    search: string;
    timeframe: string;
}

interface ContestStats {
    total: number;
    upcoming: number;
    ongoing: number;
    finished: number;
    totalParticipants: number;
}

const ContestManagement = () => {
    const { theme } = useThemeStore();
    const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filters, setFilters] = useState<ContestFilter>({
        status: '',
        search: '',
        timeframe: ''
    });
    const [currentPage, setCurrentPage] = useState(1);

    const {
        contests,
        stats,
        loading,
        error,
        totalPages,
        fetchContests,
        createContest,
        updateContest,
        deleteContest
    } = useAdminContests(filters, currentPage, 20);

    const handleFilterChange = (newFilters: Partial<ContestFilter>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const clearFilters = () => {
        setFilters({ status: '', search: '', timeframe: '' });
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
                        <span className="font-medium">Error loading contests</span>
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

    const handleCreateContest = () => {
        setSelectedContest({
            id: '',
            title: '',
            description: '',
            status: 'UPCOMING',
            startsAt: '',
            endsAt: '',
            registrationEnd: '',
            participants: 0,
            maxParticipants: null,
            points: 0,
            createdAt: '',
            creator: { name: '', username: '' },
            challenges: 0,
            tags: []
        });
        setIsCreateModalOpen(true);
    };

    const handleEditContest = (contest: Contest) => {
        setSelectedContest(contest);
        setIsEditModalOpen(true);
    };

    const handleDeleteContest = (contest: Contest) => {
        setSelectedContest(contest);
        setIsDeleteModalOpen(true);
    };

    const handleSaveContest = async (contestData: Partial<Contest>) => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            if (isCreateModalOpen) {
                await createContest(contestData);
            } else if (selectedContest) {
                await updateContest(selectedContest.id, contestData);
            }
            
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedContest(null);
        } catch (error) {
            console.error('Failed to save contest:', error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedContest || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await deleteContest(selectedContest.id);
            setIsDeleteModalOpen(false);
            setSelectedContest(null);
        } catch (error) {
            console.error('Failed to delete contest:', error);
            // You could add a toast notification here
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            UPCOMING: 'bg-blue-100 text-blue-800',
            REGISTRATION_OPEN: 'bg-green-100 text-green-800',
            ONGOING: 'bg-yellow-100 text-yellow-800',
            FINISHED: 'bg-gray-100 text-gray-800',
            CANCELLED: 'bg-red-100 text-red-800'
        };
        
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'UPCOMING':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'ONGOING':
                return <Play className="w-4 h-4 text-green-500" />;
            case 'FINISHED':
                return <Square className="w-4 h-4 text-gray-500" />;
            case 'CANCELLED':
                return <Pause className="w-4 h-4 text-red-500" />;
            default:
                return <Calendar className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const tableHeaders = ['Title', 'Status', 'Start Time', 'End Time', 'Participants', 'Challenges', 'Points', 'Creator'];

    const formatTableData = (contests: Contest[]) => {
        return contests.map(contest => ({
            title: contest.title,
            status: getStatusBadge(contest.status),
            starttime: formatDateTime(contest.startsAt),
            endtime: formatDateTime(contest.endsAt),
            participants: `${contest.participants}${contest.maxParticipants ? `/${contest.maxParticipants}` : ''}`,
            challenges: contest.challenges,
            points: contest.points,
            creator: contest.creator.name,
            _originalData: contest
        }));
    };

    const renderActions = (item: any) => {
        const contest = item._originalData as Contest;
        return (
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => console.log('View contest:', contest.id)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="View Contest"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleEditContest(contest)}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Edit Contest"
                >
                    <Edit3 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleDeleteContest(contest)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete Contest"
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
                        Contest Management
                    </h1>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Create and manage programming contests
                    </p>
                </div>
                <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleCreateContest}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Contest
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <StatCard
                    title="Total Contests"
                    value={stats?.total || 0}
                    icon={Trophy}
                    loading={!stats}
                />
                <StatCard
                    title="Upcoming"
                    value={stats?.upcoming || 0}
                    icon={Clock}
                    loading={!stats}
                />
                <StatCard
                    title="Ongoing"
                    value={stats?.ongoing || 0}
                    icon={Play}
                    loading={!stats}
                />
                <StatCard
                    title="Finished"
                    value={stats?.finished || 0}
                    icon={Square}
                    loading={!stats}
                />
                <StatCard
                    title="Total Participants"
                    value={stats?.totalParticipants?.toLocaleString() || 0}
                    icon={Users}
                    loading={!stats}
                />
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
                                placeholder="Search contests..."
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
                            <option value="UPCOMING">Upcoming</option>
                            <option value="REGISTRATION_OPEN">Registration Open</option>
                            <option value="ONGOING">Ongoing</option>
                            <option value="FINISHED">Finished</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Timeframe
                        </label>
                        <select
                            value={filters.timeframe}
                            onChange={(e) => handleFilterChange({ timeframe: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md ${
                                theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                            }`}
                        >
                            <option value="">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
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

            {/* Contests Table */}
            <DataTable
                headers={tableHeaders}
                data={formatTableData(contests)}
                actions={renderActions}
                loading={loading}
                emptyMessage="No contests found"
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

            {/* Create/Edit Contest Modal */}
            <Modal
                isOpen={isCreateModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedContest(null);
                }}
                title={isCreateModalOpen ? "Create Contest" : "Edit Contest"}
                size="xl"
                footer={
                    <div className="flex justify-end space-x-3">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                setIsEditModalOpen(false);
                                setSelectedContest(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={() => handleSaveContest(selectedContest || {})}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isCreateModalOpen ? "Create" : "Save Changes")}
                        </Button>
                    </div>
                }
            >
                {selectedContest && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Contest Title
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Contest title"
                                    value={selectedContest.title}
                                    onChange={(e) => setSelectedContest(prev => 
                                        prev ? { ...prev, title: e.target.value } : null
                                    )}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Status
                                </label>
                                <select
                                    value={selectedContest.status}
                                    onChange={(e) => setSelectedContest(prev => 
                                        prev ? { ...prev, status: e.target.value as Contest['status'] } : null
                                    )}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        theme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300'
                                    }`}
                                >
                                    <option value="UPCOMING">Upcoming</option>
                                    <option value="REGISTRATION_OPEN">Registration Open</option>
                                    <option value="ONGOING">Ongoing</option>
                                    <option value="FINISHED">Finished</option>
                                    <option value="CANCELLED">Cancelled</option>
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
                                rows={3}
                                placeholder="Contest description"
                                value={selectedContest.description}
                                onChange={(e) => setSelectedContest(prev => 
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
                                    Start Time
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={selectedContest.startsAt ? new Date(selectedContest.startsAt).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setSelectedContest(prev => 
                                        prev ? { ...prev, startsAt: new Date(e.target.value).toISOString() } : null
                                    )}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    End Time
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={selectedContest.endsAt ? new Date(selectedContest.endsAt).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setSelectedContest(prev => 
                                        prev ? { ...prev, endsAt: new Date(e.target.value).toISOString() } : null
                                    )}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Registration End
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={selectedContest.registrationEnd ? new Date(selectedContest.registrationEnd).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setSelectedContest(prev => 
                                        prev ? { ...prev, registrationEnd: new Date(e.target.value).toISOString() } : null
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Total Points
                                </label>
                                <Input
                                    type="number"
                                    placeholder="500"
                                    value={selectedContest.points}
                                    onChange={(e) => setSelectedContest(prev => 
                                        prev ? { ...prev, points: parseInt(e.target.value) || 0 } : null
                                    )}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Max Participants (Optional)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="Leave empty for unlimited"
                                    value={selectedContest.maxParticipants || ''}
                                    onChange={(e) => setSelectedContest(prev => 
                                        prev ? { ...prev, maxParticipants: e.target.value ? parseInt(e.target.value) : null } : null
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Tags (comma separated)
                            </label>
                            <Input
                                type="text"
                                placeholder="Array, String, Dynamic Programming"
                                value={selectedContest.tags.join(', ')}
                                onChange={(e) => setSelectedContest(prev => 
                                    prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) } : null
                                )}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Contest"
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
                            {isSubmitting ? 'Deleting...' : 'Delete Contest'}
                        </Button>
                    </div>
                }
            >
                <div className="text-center">
                    <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Are you sure you want to delete this contest?
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Contest "{selectedContest?.title}" will be permanently removed. All participant data and submissions will be lost.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default ContestManagement;