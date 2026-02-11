import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const JoinedClasses = ({ refreshTrigger }) => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                if (user?.role !== 'student') return;

                const res = await API.get('/classroom');
                // API returns { success: true, data: [...] }
                setClasses(res.data.data || []);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch joined classes", error);
                setLoading(false);
            }
        };

        if (user) {
            fetchClasses();
        }
    }, [user, refreshTrigger]); // Re-fetch when user or trigger changes

    if (user?.role !== 'student') return null;

    if (loading) return (
        <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (classes.length === 0) return null;

    return (
        <div className="glass-panel shadow-lg rounded-xl overflow-hidden border border-white/5 mb-8">
            <div className="px-6 py-5 border-b border-white/5 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg leading-6 font-bold text-white">Your Classrooms</h3>
            </div>
            <div className="p-2 space-y-2">
                {classes.map((cls) => (
                    <Link to={`/classrooms/${cls._id}`} key={cls._id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex flex-col hover:bg-slate-800 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <h4 className="text-white font-bold group-hover:text-indigo-400 transition-colors">{cls.name}</h4>
                            <span className="text-xs text-indigo-400 font-mono bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/20">{cls.subject}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                                {cls.teacherId?.name?.charAt(0) || 'T'}
                            </div>
                            <span>{cls.teacherId?.name || "Instructor"}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default JoinedClasses;
