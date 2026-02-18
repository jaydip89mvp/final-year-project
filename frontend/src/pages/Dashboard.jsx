import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import JoinClassroom from '../components/JoinClassroom';
import JoinedClasses from '../components/JoinedClasses';

const Dashboard = () => {
    const { user } = useAuth();
    const studentId = user?.id || user?._id || user?.userId;

    const [stats, setStats] = useState(null);
    const [recentTopics, setRecentTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshClassesTrigger, setRefreshClassesTrigger] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // If user is a teacher, we DO NOT fetch student analytics
                if (user?.role === 'teacher') {
                    setLoading(false);
                    return;
                }

                // If we don't have an ID yet (auth still populating), wait or return
                if (!studentId) {
                    setLoading(false);
                    return;
                }

                const statsRes = await API.get(`/analytics/student/${studentId}`);
                if (statsRes.data && statsRes.data.data) {
                    setStats(statsRes.data.data.metrics);
                    setRecentTopics(statsRes.data.data.recentActivity || []);
                }
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

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    // ----------------------------------------------------------------------
    // TEACHER VIEW
    // ----------------------------------------------------------------------
    if (user?.role === 'teacher') {
        return (
            <div className="space-y-8 animate-fade-in-up">
                {/* Teacher Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 p-8 shadow-xl">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white font-display mb-2">
                                Welcome, Instructor {user?.name?.split(' ')[0]}
                            </h1>
                            <p className="text-emerald-100 max-w-xl">
                                Manage your curriculum and track student progress from here.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Link
                                to="/subjects" // For now, reuse subject view, or add management
                                className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-lg shadow-lg hover:bg-emerald-50 transition-all transform hover:scale-105"
                            >
                                Manage Content
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Teacher Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link to="/teacher/subjects" className="glass-panel p-6 rounded-xl hover:bg-slate-800 transition-colors group">
                        <div className="bg-emerald-500/20 p-4 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-emerald-500/30">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Subject Management</h3>
                        <p className="text-slate-400">Create and edit subjects, topics, and quizzes.</p>
                    </Link>

                    <Link to="/teacher/students" className="glass-panel p-6 rounded-xl hover:bg-slate-800 transition-colors group">
                        <div className="bg-blue-500/20 p-4 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-blue-500/30">
                            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Student Insights</h3>
                        <p className="text-slate-400">View performance analytics and class progress.</p>
                    </Link>

                    <Link to={`/profile/${user.id || user._id}`} className="glass-panel p-6 rounded-xl hover:bg-slate-800 transition-colors group">
                        <div className="bg-purple-500/20 p-4 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-purple-500/30">
                            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">My Profile</h3>
                        <p className="text-slate-400">Update your account settings and preferences.</p>
                    </Link>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // STUDENT VIEW
    // ----------------------------------------------------------------------
    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Find Your Path Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 shadow-xl">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white font-display mb-2">
                            Welcome back, {user?.name?.split(' ')[0]}!
                        </h1>
                        <p className="text-indigo-100 max-w-xl">
                            You're making great progress. Your adaptive learning path is updated and ready for you.
                        </p>
                    </div>
                    <Link
                        to="/subjects"
                        className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105"
                    >
                        Continue Learning
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-panel overflow-hidden shadow-lg rounded-xl p-5 border border-white/5 hover:border-indigo-500/30 transition-colors group">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500/20 p-3 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                            <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Total Progress</dt>
                                <dd className="text-2xl font-bold text-white">{stats?.progressPercentage || 0}%</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow-lg rounded-xl p-5 border border-white/5 hover:border-green-500/30 transition-colors group">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500/20 p-3 rounded-lg group-hover:bg-green-500/30 transition-colors">
                            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Topics Mastered</dt>
                                <dd className="text-2xl font-bold text-white">{stats?.masteredTopics || 0}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow-lg rounded-xl p-5 border border-white/5 hover:border-amber-500/30 transition-colors group">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-amber-500/20 p-3 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                            <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Current Streak</dt>
                                <dd className="text-2xl font-bold text-white">1 Day</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow-lg rounded-xl p-5 border border-white/5 hover:border-purple-500/30 transition-colors group">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-purple-500/20 p-3 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                            <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Learning Style</dt>
                                <dd className="text-lg font-bold text-white capitalize">{user?.neuroType || 'General'}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity - Takes up 2 columns */}
                <div className="lg:col-span-2 glass-panel shadow-lg rounded-xl overflow-hidden border border-white/5">
                    <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-bold text-white">Recent Activity</h3>
                        <Link to={`/analytics/${studentId}`} className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
                    </div>
                    <div className="p-6">
                        {recentTopics.length > 0 ? (
                            <ul className="space-y-4">
                                {recentTopics.map((topic) => (
                                    <li key={topic._id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-lg ${topic.status === 'mastered' ? 'bg-green-500/10 text-green-400' :
                                                    topic.status === 'developing' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-indigo-300">{topic.subjectName}</p>
                                                    <h4 className="text-lg font-bold text-white">{topic.topicTitle}</h4>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="flex-1 sm:w-32">
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${topic.progress}%` }}></div>
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${topic.status === 'mastered' ? 'bg-green-900/30 text-green-400 border border-green-500/20' :
                                                    topic.status === 'developing' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20' :
                                                        'bg-red-900/30 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {topic.status}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                                    <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-white">No activity yet</h3>
                                <p className="mt-1 text-slate-400 max-w-sm">Get started by choosing a subject and taking your first lesson.</p>
                                <div className="mt-6">
                                    <Link to="/subjects" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                                        Browse Subjects
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Actions & Recommendations */}
                <div className="flex flex-col gap-8">
                    {/* Join Classroom Widget */}
                    <JoinClassroom onJoinSuccess={() => setRefreshClassesTrigger(prev => prev + 1)} />

                    {/* Joined Classes List */}
                    <JoinedClasses refreshTrigger={refreshClassesTrigger} />

                    {/* Recommended Path / Roadmap Preview */}
                    <div className="glass-panel shadow-lg rounded-xl overflow-hidden border border-white/5 flex flex-col flex-1">
                        <div className="px-6 py-5 border-b border-white/5">
                            <h3 className="text-lg leading-6 font-bold text-white">Recommended Path</h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                                <svg className="relative w-24 h-24 text-indigo-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">AI-Personalized Roadmap</h4>
                            <p className="text-slate-400 mb-6 text-sm">
                                Your learning path adapts to your performance. Complete your profile to get the most accurate recommendations.
                            </p>
                            <Link
                                to={`/profile/${user.id || user._id}`}
                                className="w-full block text-center px-4 py-3 border border-slate-600 rounded-lg shadow-sm text-sm font-bold text-white hover:bg-slate-700 focus:outline-none transition-colors"
                            >
                                Update Profile Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
