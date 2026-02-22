import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await API.get('/analytics/teacher/alerts');
                if (res.data.success) {
                    setAlerts(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching alerts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    if (loading || alerts.length === 0) return null;

    return (
        <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Active Alerts
                <span className="ml-2 px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded-full border border-red-500/20">
                    {alerts.length} Needs Attention
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {alerts.map((alert, idx) => (
                        <motion.div
                            key={`${alert.studentId}-${idx}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`glass-panel p-4 rounded-xl border-l-4 shadow-lg ${alert.severity === 'high' ? 'border-l-red-500 bg-red-500/5' :
                                    alert.severity === 'medium' ? 'border-l-amber-500 bg-amber-500/5' :
                                        'border-l-indigo-500 bg-indigo-500/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white text-sm">{alert.studentName}</h4>
                                <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${alert.type === 'struggle' ? 'bg-red-500/20 text-red-400' :
                                        alert.type === 'stuck' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-indigo-500/20 text-indigo-400'
                                    }`}>
                                    {alert.type}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">{alert.message}</p>
                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{alert.classroomName}</span>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <a
                                        href={`/analytics/${alert.studentId}`}
                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                                    >
                                        Inspect Progress &rarr;
                                    </a>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TeacherAlerts;
