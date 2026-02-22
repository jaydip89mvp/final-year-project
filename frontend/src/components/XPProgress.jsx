import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const XPProgress = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching gamification stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return null;
    if (!stats || stats.role === 'teacher') return null;

    const xp = stats.xp || 0;
    const level = stats.level || 1;

    // Calculate progress to next level
    // level = floor(sqrt(xp) / 5) + 1  => (level - 1) * 5 = sqrt(xp) => xp = [(level-1)*5]^2
    const currentLevelXP = Math.pow((level - 1) * 5, 2);
    const nextLevelXP = Math.pow(level * 5, 2);
    const progressXP = xp - currentLevelXP;
    const totalXPToNext = nextLevelXP - currentLevelXP;
    const percentage = Math.min(100, Math.max(0, (progressXP / totalXPToNext) * 100));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 rounded-2xl border border-white/10 mb-6 bg-indigo-500/5"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
                        {level}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mastery Level</h4>
                        <p className="text-white font-bold">Rank: Knowledge Seeker</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black text-white">{xp} <span className="text-[10px] text-indigo-400">XP</span></p>
                    <p className="text-[10px] text-slate-500">{Math.round(nextLevelXP - xp)} XP to Level {level + 1}</p>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {stats.badges?.slice(0, 3).map((badge, idx) => (
                    <div key={idx} className="flex-shrink-0 bg-white/5 px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                        <span className="text-xs" title={badge.category}>{badge.icon}</span>
                        <span className="text-[9px] font-bold text-slate-300 whitespace-nowrap">{badge.name}</span>
                    </div>
                ))}
                {(!stats.badges || stats.badges.length === 0) && (
                    <p className="text-[10px] text-slate-500 italic">No badges earned yet. Complete your first quiz!</p>
                )}
            </div>
        </motion.div>
    );
};

export default XPProgress;
