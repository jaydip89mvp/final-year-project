import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

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

const Analytics = () => {
    const { studentId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await API.get(`/analytics/student/${studentId}`);
                const api = res.data?.data;
                if (!api) {
                    setLoading(false);
                    return;
                }

                const metrics = api.metrics || {};
                const weakTopics = api.weakTopics || [];
                const masteredTopics = api.masteredTopics || [];

                const topicBreakdown = [
                    ...masteredTopics.map(t => ({
                        name: t.topicTitle,
                        score: t.score,
                        status: 'Mastered'
                    })),
                    ...weakTopics.map(t => ({
                        name: t.topicTitle,
                        score: t.score,
                        status: 'Weak'
                    }))
                ];

                setData({
                    totalTopics: metrics.totalTopics || 0,
                    mastered: metrics.masteredTopics || 0,
                    developing: metrics.developingTopics || 0,
                    weak: metrics.weakTopics || 0,
                    averageScore: metrics.averageScore || 0,
                    progressPercentage: metrics.progressPercentage || 0,
                    totalAttempts: metrics.totalAttempts || 0,
                    timeSpentSeconds: metrics.timeSpentSeconds || 0,
                    topicBreakdown
                });
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                setLoading(false);
            }
        };

        if (studentId) fetchAnalytics();
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <h1 className="text-3xl font-bold text-white mb-4">Analytics Dashboard</h1>
                <p className="text-slate-400">No analytics data available yet.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="px-4 sm:px-0">
                <h1 className="text-3xl font-bold text-white font-display">Performance Analytics</h1>
                <p className="mt-1 text-sm text-slate-400">Detailed insights into your learning progress.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-400 truncate">Average Score</dt>
                                    <dd className="text-2xl font-semibold text-white">{data.averageScore}%</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-400 truncate">Mastered Topics</dt>
                                    <dd className="text-2xl font-semibold text-white">{data.mastered}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-400 truncate">Total Topics</dt>
                                    <dd className="text-2xl font-semibold text-white">{data.totalTopics}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-400 truncate">Needs Attention</dt>
                                    <dd className="text-2xl font-semibold text-white">{data.weak}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden shadow rounded-lg border border-slate-700">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-400 truncate">Time Spent</dt>
                                    <dd className="text-2xl font-semibold text-white">{formatTime(data.timeSpentSeconds || 0)}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Breakdown */}
            <div className="glass-panel p-6 rounded-lg shadow">
                <h3 className="text-lg leading-6 font-medium text-white mb-6">Topic Performance</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Topic</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {data.topicBreakdown.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        <div className="flex items-center">
                                            <span className="mr-2">{item.score}%</span>
                                            <div className="w-24 bg-slate-700 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${item.score}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Mastered' ? 'bg-green-100 text-green-800' :
                                            item.status === 'Developing' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
