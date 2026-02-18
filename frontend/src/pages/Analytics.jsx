import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    BookOpen,
    Clock,
    Target,
    AlertTriangle,
    Award,
    TrendingUp,
    Activity
} from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Emerald, Amber, Red

const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl relative overflow-hidden group hover:bg-slate-800/60 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
            <Icon className={`w-24 h-24 text-${color}-500`} />
        </div>
        <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-xl bg-${color}-500/10 mb-4`}>
                <Icon className={`w-6 h-6 text-${color}-400`} />
            </div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-1 font-display">{value}</h3>
            {subtext && <p className="text-slate-500 text-xs mt-2">{subtext}</p>}
        </div>
    </div>
);

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
                // Use fallback if activityOverTime is missing (backward compatibility)
                const activity = api.activityOverTime || [];

                // Prepare Pie Chart Data
                const pieData = [
                    { name: 'Mastered', value: metrics.masteredTopics || 0 },
                    { name: 'Developing', value: metrics.developingTopics || 0 },
                    { name: 'Needs Focus', value: metrics.weakTopics || 0 },
                ].filter(d => d.value > 0);

                // Prepare Topic List (combining all lists if needed, or just showing weak/mastered)
                // Let's create a combined list from all available topic details
                // Ideally backend sends "allTopics", but we have weak & mastered. 
                // We'll merge them. 
                // Note: developing topics might be missing from detailed lists in current controller.
                // For now, visualize what we have.
                const topicBreakdown = [];
                if (masteredTopics) {
                    masteredTopics.forEach(t => topicBreakdown.push({ ...t, status: 'Mastered' }));
                }
                if (weakTopics) {
                    weakTopics.forEach(t => topicBreakdown.push({ ...t, status: 'Weak' }));
                }

                // Sort by last attempt
                topicBreakdown.sort((a, b) => new Date(b.lastAttemptDate) - new Date(a.lastAttemptDate));


                setData({
                    ...metrics,
                    activityOverTime: activity,
                    pieData,
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
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="relative w-20 h-20">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!data || (data.totalTopics === 0 && data.activityOverTime.length === 0)) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 space-y-6 animate-fade-in">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-700/50 shadow-xl">
                    <Activity className="w-12 h-12 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white font-display mb-2">No Activity Yet</h2>
                    <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
                        Start exploring topics and taking quizzes to see your personalized learning analytics here.
                    </p>
                </div>
                <div className="pt-4">
                    <a href="/subjects" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25">
                        Start Learning
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-700/50 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white font-display">Performance Analytics</h1>
                    <p className="text-slate-400 mt-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        Track your progress and mastery over time
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Overall Mastery</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">
                        {data.progressPercentage}%
                    </span>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Topics"
                    value={data.totalTopics}
                    icon={BookOpen}
                    color="indigo"
                    subtext={`${data.pieData.find(d => d.name === 'Mastered')?.value || 0} Mastered`}
                />
                <StatCard
                    title="Average Score"
                    value={`${data.averageScore}%`}
                    icon={Award}
                    color="emerald"
                    subtext="Across all attempts"
                />
                <StatCard
                    title="Time Invested"
                    value={formatTime(data.timeSpentSeconds)}
                    icon={Clock}
                    color="blue"
                    subtext="Active learning time"
                />
                <StatCard
                    title="Needs Focus"
                    value={data.weakTopics}
                    icon={AlertTriangle}
                    color="red"
                    subtext="Topics to review"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Chart */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-700/50 bg-slate-800/20 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        Learning Activity (Last 7 Days)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.activityOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        borderColor: '#334155',
                                        color: '#f8fafc',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    cursor={{ fill: '#334155', opacity: 0.4 }}
                                />
                                <Bar
                                    dataKey="topicsPracticed"
                                    name="Topics Practiced"
                                    fill="#6366f1"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                >
                                    {
                                        data.activityOverTime.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.topicsPracticed > 0 ? '#6366f1' : '#334155'} fillOpacity={entry.topicsPracticed > 0 ? 1 : 0.3} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mastery Distribution */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col bg-slate-800/20 backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-400" />
                        Topic Mastery
                    </h3>
                    <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
                        {data.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
                                <PieChart className="w-16 h-16 text-slate-700 mb-2 opacity-50" />
                                <span>No mastery data yet</span>
                            </div>
                        )}
                        {/* Center Text Overlay */}
                        {data.pieData.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                                <span className="text-3xl font-bold text-white">{data.totalTopics}</span>
                                <span className="text-xs text-slate-400 uppercase tracking-wider">Topics</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Topic List */}
            <div className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-800/20 backdrop-blur-md">
                <div className="p-6 border-b border-slate-700/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        Topic Performance Breakdown
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Topic</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Attempts</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-800/10">
                            {data.topicBreakdown.length > 0 ? (
                                data.topicBreakdown.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.topicTitle}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{item.subjectName || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-slate-200 w-8">{item.score}%</span>
                                                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' :
                                                                item.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${item.score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {item.attempts}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${item.status === 'Mastered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    item.status === 'Developing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No topics attempted yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
