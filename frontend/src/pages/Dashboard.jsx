import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentTopics, setRecentTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In a real app, these would be actual API calls
                // const statsRes = await API.get(`/analytics/student/${user._id}`);
                // setStats(statsRes.data);

                // For now, let's look for any analytics if available, or show empty state
                // Mocking data for visual structure until backend has data
                setRecentTopics([
                    // { id: '1', title: 'Calculus I', subject: 'Mathematics', progress: 75, status: 'developing' }
                ]);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white font-display">
                        Hello, <span className="text-indigo-400">{user?.name}</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Ready to continue learning today?</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link
                        to="/subjects"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Start Learning
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-panel overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-slate-400 truncate">Total Progress</dt>
                    <dd className="mt-1 text-3xl font-semibold text-white">0%</dd>
                </div>
                <div className="glass-panel overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-slate-400 truncate">Topics Mastered</dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-400">0</dd>
                </div>
                <div className="glass-panel overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-slate-400 truncate">Current Streak</dt>
                    <dd className="mt-1 text-3xl font-semibold text-amber-400">1 Day</dd>
                </div>
                <div className="glass-panel overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-slate-400 truncate">Learning Type</dt>
                    <dd className="mt-1 text-lg font-semibold text-purple-400">Checking...</dd>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="glass-panel shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-white/5">
                        <h3 className="text-lg leading-6 font-medium text-white">Recent Activity</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        {recentTopics.length > 0 ? (
                            <ul className="space-y-4">
                                {recentTopics.map((topic) => (
                                    <li key={topic.id} className="bg-slate-700/30 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-indigo-300">{topic.subject}</p>
                                                <p className="text-lg font-semibold text-white">{topic.title}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${topic.status === 'mastered' ? 'bg-green-100 text-green-800' :
                                                    topic.status === 'developing' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {topic.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 w-full bg-slate-700 rounded-full h-2.5">
                                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${topic.progress}%` }}></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <p className="mt-2 text-sm text-slate-400">No recent activity found.</p>
                                <div className="mt-4">
                                    <Link to="/subjects" className="text-indigo-400 hover:text-indigo-300 font-medium">
                                        Browse Subjects &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommended Path / Roadmap Preview */}
                <div className="glass-panel shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-white/5">
                        <h3 className="text-lg leading-6 font-medium text-white">Recommended Path</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <div className="text-center py-8">
                            <p className="text-slate-400 mb-4">Complete your profile to get personalized recommendations.</p>
                            <Link
                                to={`/profile/${user?._id || user?.id}`}
                                className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-slate-700 focus:outline-none"
                            >
                                Update Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
