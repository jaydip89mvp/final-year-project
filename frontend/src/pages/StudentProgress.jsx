import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const StudentProgress = () => {
    const { studentId } = useParams();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use studentId from params if available (teacher viewing specific student), otherwise use logged-in user
    const targetStudentId = studentId || user?.id || user?._id || user?.userId;

    useEffect(() => {
        const fetchProgress = async () => {
            if (!targetStudentId) {
                setLoading(false);
                return;
            }

            try {
                const res = await API.get(`/analytics/student/${targetStudentId}`);
                if (res.data?.success && res.data?.data) {
                    setData(res.data.data);
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch student progress", error);
                setLoading(false);
            }
        };

        fetchProgress();
    }, [targetStudentId]);

    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <h1 className="text-3xl font-bold text-white mb-6">Student Activity & Progress</h1>
                <p className="text-slate-400">Track how your students are engaging with the material.</p>

                <div className="glass-panel p-8 text-center rounded-xl border border-white/5 bg-slate-800/20">
                    <svg className="mx-auto h-12 w-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-white">No data available yet</h3>
                    <p className="mt-1 text-sm text-slate-400">Once students start completing topics, their metrics will appear here.</p>
                </div>
            </div>
        );
    }

    const metrics = data.metrics || {};
    const recentActivity = data.recentActivity || [];

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Student Activity & Progress</h1>
                    <p className="text-slate-400">Track how students are engaging with the material.</p>
                </div>
                <Link to={`/analytics/${targetStudentId}`} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                    View Full Analytics
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700 p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Mastered Topics</dt>
                                <dd className="text-2xl font-semibold text-white">{metrics.masteredTopics || 0}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700 p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Total Topics</dt>
                                <dd className="text-2xl font-semibold text-white">{metrics.totalTopics || 0}</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700 p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Average Score</dt>
                                <dd className="text-2xl font-semibold text-white">{metrics.averageScore || 0}%</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700 p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-400 truncate">Time Spent</dt>
                                <dd className="text-2xl font-semibold text-white">{formatTime(metrics.timeSpentSeconds || 0)}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-panel p-6 rounded-lg shadow border border-slate-700">
                <h3 className="text-lg leading-6 font-medium text-white mb-6">Recent Activity</h3>
                {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                        {recentActivity.map((activity, idx) => (
                            <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{activity.topicTitle}</h4>
                                        <p className="text-sm text-slate-400">{activity.subjectName}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-white">{activity.score}%</div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            activity.status === 'mastered' ? 'bg-green-900/30 text-green-400 border border-green-500/20' :
                                            activity.status === 'developing' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20' :
                                            'bg-red-900/30 text-red-400 border border-red-500/20'
                                        }`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <p>No recent activity to display.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProgress;
