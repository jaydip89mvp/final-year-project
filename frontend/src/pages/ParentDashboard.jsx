import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { motion } from 'framer-motion';

const ParentDashboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentEmail, setStudentEmail] = useState('');
    const [linking, setLinking] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchLinkedStudents = async () => {
        try {
            const res = await API.get('/parent/students');
            if (res.data.success) {
                setStudents(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinkedStudents();
    }, []);

    const handleLinkStudent = async (e) => {
        e.preventDefault();
        setLinking(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await API.post('/parent/link', { studentEmail });
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Student linked successfully!' });
                setStudentEmail('');
                fetchLinkedStudents();
            }
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to link student. Check the email and try again.'
            });
        } finally {
            setLinking(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            {/* Header */}
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-xl">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white mb-2">Parent Observer Dashboard</h1>
                    <p className="text-blue-100 italic">Monitor your children's learning journey and celebrate their milestones.</p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Linked Students List */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </span>
                        Linked Students
                    </h2>

                    {students.length === 0 ? (
                        <div className="glass-panel p-12 text-center rounded-2xl border-dashed border-white/10">
                            <p className="text-slate-400 italic">No students linked yet. Use the form to your right to add your child.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {students.map((student) => (
                                <motion.div
                                    key={student._id}
                                    whileHover={{ y: -5 }}
                                    className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{student.name}</h3>
                                            <p className="text-xs text-slate-500">{student.email}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <div className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                                                Lvl {student.level}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-slate-400">Subject Mastery</span>
                                                <span className="text-indigo-400 font-bold">{student.stats.masteryPercentage}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${student.stats.masteryPercentage}%` }}
                                                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 text-center">
                                            <div className="flex-1 p-2 rounded-xl bg-slate-800/50">
                                                <p className="text-[10px] text-slate-500 uppercase">Mastered</p>
                                                <p className="text-lg font-black text-white">{student.stats.mastered}</p>
                                            </div>
                                            <div className="flex-1 p-2 rounded-xl bg-slate-800/50">
                                                <p className="text-[10px] text-slate-500 uppercase">Badges</p>
                                                <p className="text-lg font-black text-white">{student.badges.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/analytics/${student._id}`}
                                        className="mt-auto block w-full text-center py-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-sm font-bold border border-indigo-600/20 transition-all"
                                    >
                                        View Detailed Progress &rarr;
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Linking Form Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-indigo-500/5">
                        <h3 className="text-lg font-bold text-white mb-4">Link a Student</h3>
                        <p className="text-sm text-slate-400 mb-6">Enter your child's email address to link their learning profile to your dashboard.</p>

                        <form onSubmit={handleLinkStudent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Child's Email</label>
                                <input
                                    type="email"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    placeholder="student@example.com"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            {message.text && (
                                <div className={`p-3 rounded-lg text-xs font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={linking}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {linking ? 'Linking...' : 'Link Student'}
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h4 className="text-sm font-bold text-white mb-2 tracking-tight">Parent Role Info</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            As a parent, you can view your child's learning roadmap, quiz scores, and daily activity. You'll also receive alerts if the system detects they are struggling or stuck on a particular topic.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
