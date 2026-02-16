"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useThemeStore } from '../../../lib/store/themeStore';
import Loader from '../../../components/Loader';
import { createAuthHeaders } from '@/lib/auth';

// User interfaces
interface UserProfile {
  phone?: string;
  bio?: string;
  points?: number;
  level?: number;
  rank?: number;
  solved?: number;
  streakDays?: number;
  preferredLanguage?: string;
}

interface UserData {
  id: string;
  name?: string;
  username: string;
  email?: string;
  image?: string;
  userProfile?: UserProfile;
  pointsBreakdown?: {
    challenges: number;
    contests: number;
    discussions: number;
  };
  stats?: {
    acceptedSubmissions: number;
  };
}

interface Submission {
  id: string;
  status: string;
  runtime: number | null;
  memory: number | null;
  score: number;
  createdAt: string;
  language: {
    name: string;
  };
  challenge: {
    title: string;
    slug: string;
    difficulty?: string;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  name: string;
  result: string;
  points: number;
  time: string;
  timestamp: string;
  challengeName?: string;
  contestName?: string;
}

interface Contest {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startsAt: string;
  endsAt: string;
  status: string;
  maxParticipants: number;
  _count: {
    participants: number;
  };
}

interface ContestParticipation {
  id: string;
  position: number | null;
  score: number;
  points?: number;
  rank?: number;
  submissions?: Submission[];
  joinedAt?: string;
  contest: Contest;
}
import {
  Trophy,
  Code,
  Star,
  Calendar,
  Award,
  ChevronRight,
  CheckCircle,
  Coffee,
  Settings,
  Activity,
  MessageSquare,
  Code2,
  Clock,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bug,
  AlertOctagon
} from 'lucide-react';

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACCEPTED':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'WRONG_ANSWER':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'TIME_LIMIT_EXCEEDED':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case 'MEMORY_LIMIT_EXCEEDED':
      return <HardDrive className="w-5 h-5 text-yellow-500" />;
    case 'RUNTIME_ERROR':
      return <Bug className="w-5 h-5 text-orange-500" />;
    case 'COMPILATION_ERROR':
      return <AlertOctagon className="w-5 h-5 text-red-500" />;
    case 'PENDING':
      return <AlertTriangle className="w-5 h-5 text-blue-500" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-gray-500" />;
  }
};

// Helper function to format status text
const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to format contest status
const formatContestStatus = (status: string) => {
  switch (status) {
    case 'UPCOMING':
      return 'Upcoming';
    case 'REGISTRATION_OPEN':
      return 'Registration Open';
    case 'ONGOING':
      return 'Ongoing';
    case 'FINISHED':
      return 'Finished';
    default:
      return status;
  }
};

// Helper function to get contest status color
const getContestStatusColor = (status: string) => {
  switch (status) {
    case 'UPCOMING':
      return 'text-blue-500';
    case 'REGISTRATION_OPEN':
      return 'text-green-500';
    case 'ONGOING':
      return 'text-orange-500';
    case 'FINISHED':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

// Helper function to format contest duration
const formatContestDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = end.getTime() - start.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else {
    return `${hours}h`;
  }
};

const ProfilePage = () => {
  const { username } = useParams();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Utility function to calculate total points
  const calculateTotalPoints = (userData: UserData | null) => {
    if (userData?.pointsBreakdown) {
      return userData.pointsBreakdown.challenges +
        userData.pointsBreakdown.contests +
        userData.pointsBreakdown.discussions;
    }
    return userData?.userProfile?.points || 0;
  };

  // State
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [hasMoreSubmissions, setHasMoreSubmissions] = useState(true);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [contests, setContests] = useState<ContestParticipation[]>([]);
  const [contestsLoading, setContestsLoading] = useState(false);
  const [hasMoreContests, setHasMoreContests] = useState(true);
  const [contestsPage, setContestsPage] = useState(1);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${username}`);

        if (!response.ok) {
          throw new Error('User not found');
        }

        const data = await response.json();
        // Extract the actual user data from the response
        setUserData(data.user || data);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  // Fetch user submissions
  const fetchSubmissions = useCallback(async (page: number = 1) => {
    if (!username) return;

    try {
      setSubmissionsLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${username}/submissions?page=${page}&limit=20`, {
        headers: createAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setSubmissions(data.submissions);
        } else {
          setSubmissions(prev => [...prev, ...data.submissions]);
        }
        setHasMoreSubmissions(data.pagination.page < data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [username]);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    if (!username) return;

    try {
      setActivityLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${username}/activity?limit=5`, {
        headers: createAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setActivityLoading(false);
    }
  }, [username]);

  // Fetch user contests
  const fetchContests = useCallback(async (page: number = 1) => {
    if (!username) return;

    try {
      setContestsLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${username}/contests?page=${page}&limit=10`, {
        headers: createAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setContests(data.contests);
        } else {
          setContests(prev => [...prev, ...data.contests]);
        }
        setHasMoreContests(data.pagination.page < data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch contests:', err);
    } finally {
      setContestsLoading(false);
    }
  }, [username]);

  // Load submissions when switching to submissions tab
  useEffect(() => {
    if (activeTab === 'submissions' && submissions.length === 0) {
      fetchSubmissions(1);
    }
  }, [activeTab, fetchSubmissions, submissions.length]);

  // Load activity when switching to overview tab
  useEffect(() => {
    if (activeTab === 'overview' && recentActivity.length === 0) {
      fetchRecentActivity();
    }
  }, [activeTab, fetchRecentActivity, recentActivity.length]);

  // Load contests when switching to contests tab
  useEffect(() => {
    if (activeTab === 'contests' && contests.length === 0) {
      fetchContests(1);
    }
  }, [activeTab, fetchContests, contests.length]);

  const loadMoreSubmissions = () => {
    if (!submissionsLoading && hasMoreSubmissions) {
      const nextPage = submissionsPage + 1;
      setSubmissionsPage(nextPage);
      fetchSubmissions(nextPage);
    }
  };

  const loadMoreContests = () => {
    if (!contestsLoading && hasMoreContests) {
      const nextPage = contestsPage + 1;
      setContestsPage(nextPage);
      fetchContests(nextPage);
    }
  };



  // Check if user has preferred languages
  // const hasLanguages = userData?.userProfile?.languages && userData.userProfile.languages.length > 0;
  // const allLanguages: Array<{
  //   id?: string;
  //   name: string;
  //   percentage?: number;
  //   isPreferred?: boolean;
  // }> = userData?.userProfile?.languages || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }


  // Theme-aware styles
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const textColor = isDark ? 'text-gray-200' : 'text-gray-800';
  const secondaryText = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-100';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* Profile header */}
      <div className={`${cardBg} border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar and name */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 border-2 border-orange-600 uppercase rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl font-bold text-white relative group overflow-hidden">
                {userData?.image ? (
                  <img
                    src={userData?.image}
                    alt={userData?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData?.username?.charAt(0)
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  {userData?.name}
                </h1>
                <div className={`flex items-center ${secondaryText} text-sm mt-2`}>
                  <p className={`${secondaryText}`}>{userData?.userProfile?.bio || 'No bio available'}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 md:gap-8 md:ml-auto">
              {[
                { icon: <Trophy className="w-4 h-4 text-yellow-500" />, label: "Global Rank", value: `${userData?.userProfile?.rank || '-'}` },
                { icon: <Star className="w-4 h-4 text-blue-500" />, label: "Level", value: userData?.userProfile?.level || 0 },
                { icon: <CheckCircle className="w-4 h-4 text-green-500" />, label: "Problems", value: userData?.stats?.acceptedSubmissions || userData?.userProfile?.solved || 0 },
                { icon: <Coffee className="w-4 h-4 text-orange-500" />, label: "Streak", value: `${userData?.userProfile?.streakDays || 0} days` }
              ].map((stat, i) => (
                <div key={i} className={`${cardBg} rounded-lg p-3 min-w-[100px] border ${borderColor}`}>
                  <div className={`text-sm ${secondaryText}`}>{stat.label}</div>
                  <div className="flex items-center mt-1">
                    {stat.icon}
                    <span className="text-xl font-bold ml-2">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex md:flex-col gap-2 ml-auto mt-2 md:mt-0">
              <button
                className={`p-2 ${cardBg} ${hoverBg} border ${borderColor} rounded-lg transition-colors`}
                onClick={() => window.location.href = '/settings'}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className={`border-b ${borderColor} ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto hide-scrollbar">
            {[{
              label: 'Overview',
              value: 'overview',
            },
            {
              label: 'Submissions',
              value: 'submissions',
            },
            {
              label: 'Contests',
              value: 'contests',
            }].map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === tab.value
                  ? 'border-b-2 border-orange-500 text-orange-500'
                  : 'text-gray-400 hover:text-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 h-full">
              <div className={`rounded-xl p-6 border h-full ${borderColor} ${cardBg}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Recent Activity</h2>
                  {recentActivity.length > 0 && (
                    <button
                      className="text-orange-500 text-sm flex items-center hover:text-orange-400 transition-colors"
                      onClick={() => window.location.href = '/activity-feed'}
                    >
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>

                {activityLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader />
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className={`flex items-start p-3 rounded-lg ${hoverBg} transition-colors`}>
                        <div className={`p-2 rounded-lg mr-3 ${activity.type === 'challenge' ? 'bg-blue-500/20 text-blue-400' :
                          activity.type === 'contest' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                          {activity.type === 'challenge' ? <Code className="w-5 h-5" /> :
                            activity.type === 'contest' ? <Trophy className="w-5 h-5" /> :
                              <Award className="w-5 h-5" />}
                        </div>

                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{activity.name}</h3>
                              <div className={`text-sm ${secondaryText} mt-1`}>
                                {activity.result}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-orange-500 font-medium">+{activity.points}</div>
                              <div className={`text-sm ${secondaryText} mt-1`}>
                                {activity.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex items-center justify-center h-full'>
                    <div className={`rounded-lg p-6 flex flex-col items-center text-center ${isDark ? 'bg-gray-750' : 'bg-gray-100'}`}>
                      <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mb-3`}>
                        <Activity className="w-8 h-8 text-gray-500" />
                      </div>
                      <h3 className={`text-lg font-medium ${textColor}`}>No Recent Activity</h3>
                      <p className={`${secondaryText} text-sm mt-2 mb-3`}>
                        Start solving challenges to track your activity
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className={`rounded-xl p-6 border ${borderColor} ${cardBg}`}>
                <h2 className="text-lg font-bold mb-4">Points Summary</h2>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-500">
                    {calculateTotalPoints(userData).toLocaleString()}
                  </div>
                  <div className={`${secondaryText} mt-1`}>Total Points</div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { icon: <Code className="text-blue-400" />, label: "Challenges", value: userData?.pointsBreakdown?.challenges || 0 },
                    { icon: <Trophy className="text-purple-400" />, label: "Contests", value: userData?.pointsBreakdown?.contests || 0 },
                    { icon: <MessageSquare className="text-yellow-400" />, label: "Discussions", value: userData?.pointsBreakdown?.discussions || 0 }
                  ].map((item, i) => (
                    <div key={i} className={`rounded-lg p-3 text-center ${isDark ? 'bg-gray-750' : 'bg-gray-100'}`}>
                      <div className="flex justify-center mb-2">{item.icon}</div>
                      <div className="font-bold">{item.value.toLocaleString()}</div>
                      <div className={`text-xs ${secondaryText} mt-1`}>From {item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress to next level */}
                <div className="mt-6">
                  {(() => {
                    const totalPoints = calculateTotalPoints(userData);
                    const currentLevel = userData?.userProfile?.level || 0;
                    const nextLevelThreshold = (currentLevel + 1) * 1000;
                    const progressInCurrentLevel = totalPoints % 1000;
                    const progressPercentage = Math.min(100, (progressInCurrentLevel / 1000) * 100);

                    return (
                      <>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress to Level {currentLevel + 1}</span>
                          <span className={secondaryText}>
                            {totalPoints.toLocaleString()}/{nextLevelThreshold.toLocaleString()} points
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div
                            className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPercentage}%`
                            }}
                          ></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* <div className={`rounded-xl p-6 border ${borderColor} ${cardBg}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Badges</h2>
                  <button
                    className="text-orange-500 text-sm flex items-center hover:text-orange-400 transition-colors"
                    onClick={() => setActiveTab('badges')}
                  >
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {userData?.userProfile?.badges && userData.userProfile.badges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {userData.userProfile.badges.slice(0, 4).map((badge: any, i: number) => (
                      <div key={i} className={`rounded-lg p-3 flex flex-col items-center text-center group ${isDark ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors cursor-pointer`}>
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-2 text-orange-500 group-hover:scale-110 transition-transform">
                          {badge.iconType === 'calendar' ? <Calendar className="w-4 h-4" /> :
                            badge.iconType === 'code' ? <Code className="w-4 h-4" /> :
                              badge.iconType === 'zap' ? <Zap className="w-4 h-4" /> :
                                badge.iconType === 'star' ? <Star className="w-4 h-4" /> :
                                  <Award className="w-4 h-4" />}
                        </div>
                        <div className="font-medium text-sm">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`rounded-lg p-4 flex flex-col items-center text-center ${isDark ? 'bg-gray-750' : 'bg-gray-100'}`}>
                    <Award className="w-10 h-10 text-gray-500 mb-2" />
                    <p className="text-gray-400">No badges earned yet</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Complete challenges and activities to earn badges
                    </p>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        )}

        {/* {activeTab === 'badges' && (
          <div className={`rounded-xl p-6 border ${borderColor} ${cardBg}`}>
            <h2 className="text-xl font-bold mb-6">Badges & Achievements</h2>

            {userData?.userProfile?.badges && userData.userProfile.badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {userData.userProfile.badges.map((badge: any, i: number) => (
                  <div key={i} className={`rounded-lg p-3 flex flex-col items-center text-center group ${hoverBg} transition-colors cursor-pointer`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-orange-500 group-hover:scale-110 transition-transform ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                      {badge.iconType === 'calendar' ? <Calendar className="w-5 h-5" /> :
                        badge.iconType === 'code' ? <Code className="w-5 h-5" /> :
                          badge.iconType === 'zap' ? <Zap className="w-5 h-5" /> :
                            badge.iconType === 'star' ? <Star className="w-5 h-5" /> :
                              <Award className="w-5 h-5" />}
                    </div>
                    <div className="font-medium">{badge.name}</div>
                    <div className={`${secondaryText} text-sm mt-2`}>{badge.description}</div>
                    <div className="text-orange-500 text-sm mt-1">+{badge.points} pts</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-lg p-8 flex flex-col items-center text-center ${isDark ? 'bg-gray-750' : 'bg-gray-100'}`}>
                <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mb-4`}>
                  <Award className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className={`text-xl font-medium ${textColor}`}>No Badges Yet</h3>
                <p className={`${secondaryText} mt-3 max-w-md`}>
                  You haven't earned any badges yet. Complete challenges, participate in contests, and maintain your streak to earn badges.
                </p>
                <button
                  className="mt-6 px-5 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
                  onClick={() => window.location.href = '/challenges'}
                >
                  Explore Challenges
                </button>
              </div>
            )}
          </div>
        )} */}

        {activeTab === 'submissions' && (
          <div className={`rounded-xl p-6 border ${borderColor} ${cardBg}`}>
            <h2 className="text-xl font-bold mb-6">Submissions History</h2>

            {submissionsLoading && submissions.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : submissions.length > 0 ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`text-left text-sm border-b ${borderColor} ${secondaryText}`}>
                        <th className="pb-3 pl-2">Problem</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Language</th>
                        <th className="pb-3">Runtime</th>
                        <th className="pb-3">Memory</th>
                        <th className="pb-3 text-right pr-2">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission, i) => (
                        <tr
                          key={i}
                          className={`border-b ${borderColor} ${hoverBg} cursor-pointer transition-colors`}
                          onClick={() => window.location.href = `/submissions/${submission.id}`}
                        >
                          <td className="py-3 pl-2">
                            <div className="font-medium">{submission.challenge?.title}</div>
                            <div className={`text-sm ${secondaryText} capitalize font-semibold`}>{submission.challenge?.difficulty ? String(submission.challenge.difficulty) : 'N/A'}</div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center">
                              {getStatusIcon(submission.status)}
                              <span className="ml-2">{formatStatus(submission.status)}</span>
                            </div>
                          </td>
                          <td className="py-3">{submission?.language ? String(submission.language.name) : 'N/A'}</td>
                          <td className="py-3">{submission.runtime}ms</td>
                          <td className="py-3">{submission?.memory} KB</td>
                          <td className={`py-3 text-right pr-2 ${secondaryText}`}>
                            {formatDate(submission.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {submissionsLoading && submissions.length > 0 && (
                  <div className="flex justify-center py-4">
                    <Loader />
                  </div>
                )}

                {hasMoreSubmissions && !submissionsLoading && (
                  <div className="mt-6 text-center">
                    <button
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-750 border border-gray-700 hover:bg-gray-700' : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                        }`}
                      onClick={loadMoreSubmissions}
                    >
                      Load More Submissions
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mb-4`}>
                  <Code2 className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className={`text-xl font-medium ${textColor}`}>No Submissions Yet</h3>
                <p className={`${secondaryText} mt-3 max-w-md`}>
                  You haven&apos;t submitted any solutions yet. Start solving coding challenges to build your submission history.
                </p>
                <button
                  className="mt-6 px-5 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
                  onClick={() => window.location.href = '/challenges'}
                >
                  Find Challenges
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contests' && (
          <div className={`rounded-xl p-6 border ${borderColor} ${cardBg}`}>
            <h2 className="text-xl font-bold mb-6">Contest History</h2>

            {contestsLoading && contests.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : contests.length > 0 ? (
              <div>
                <div className="space-y-4">
                  {contests.map((contestParticipation, index) => (
                    <div 
                      key={index} 
                      className={`rounded-lg p-4 border ${borderColor} ${hoverBg} transition-colors cursor-pointer`}
                      onClick={() => {
                        const slug = contestParticipation.contest.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                        window.location.href = `/contests/${slug}`;
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`text-lg font-semibold ${textColor}`}>
                              {contestParticipation.contest.title}
                            </h3>
                            <span className={`text-sm font-medium ${getContestStatusColor(contestParticipation.contest.status)}`}>
                              {formatContestStatus(contestParticipation.contest.status)}
                            </span>
                          </div>
                          
                          {contestParticipation.contest.description && (
                            <p className={`${secondaryText} text-sm mb-3 line-clamp-2`}>
                              {contestParticipation.contest.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className={`flex items-center gap-1 ${secondaryText}`}>
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(contestParticipation.contest.startsAt)} - {formatDate(contestParticipation.contest.endsAt)}
                              </span>
                            </div>
                            
                            <div className={`flex items-center gap-1 ${secondaryText}`}>
                              <Clock className="w-4 h-4" />
                              <span>{formatContestDuration(contestParticipation.contest.startsAt, contestParticipation.contest.endsAt)}</span>
                            </div>

                            <div className={`flex items-center gap-1 ${secondaryText}`}>
                              <Star className="w-4 h-4 text-orange-500" />
                              <span className="text-orange-500 font-medium">{contestParticipation.points || 0} pts earned</span>
                            </div>

                            {contestParticipation.rank && contestParticipation.rank > 0 && (
                              <div className={`flex items-center gap-1 ${secondaryText}`}>
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="text-yellow-500 font-medium">Rank #{contestParticipation.rank}</span>
                              </div>
                            )}
                          </div>

                          {contestParticipation.submissions && contestParticipation.submissions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 text-sm">
                                <Code className="w-4 h-4 text-blue-500" />
                                <span className={secondaryText}>
                                  {contestParticipation.submissions.length} submission{contestParticipation.submissions.length !== 1 ? 's' : ''} made
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <div className={`text-right ${secondaryText}`}>
                            <div className="text-xs">Joined</div>
                            <div className="text-sm font-medium">{contestParticipation.joinedAt ? formatDate(contestParticipation.joinedAt) : 'N/A'}</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {contestsLoading && contests.length > 0 && (
                  <div className="flex justify-center py-4">
                    <Loader />
                  </div>
                )}

                {hasMoreContests && !contestsLoading && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreContests}
                      className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
                    >
                      Load More Contests
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mb-4`}>
                  <Trophy className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className={`text-xl font-medium ${textColor}`}>No Contest Participation Yet</h3>
                <p className={`${secondaryText} mt-3 max-w-md`}>
                  You haven&apos;t participated in any contests yet. Join upcoming contests to compete with other developers and earn ranking points.
                </p>
                <button
                  className="mt-6 px-5 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
                  onClick={() => window.location.href = '/contests'}
                >
                  View Upcoming Contests
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;