import { useState, useEffect } from 'react';
import API from '../api/axios';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // In a teacher view, we might want ALL subjects or just theirs
                // For now, consistent with student view but maybe different actions
                const res = await API.get('/learning/subjects');
                // Backend returns { success: true, count: X, data: [...] }
                // So we need res.data.data
                setSubjects(res.data.data || []);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch subjects", error);
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white font-display">Manage Subjects</h1>
                    <p className="text-slate-400">Create and edit course content.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                    + New Subject
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                    <div key={subject._id} className="glass-panel p-6 rounded-xl hover:bg-slate-800 transition-colors border border-white/5">
                        <h3 className="text-xl font-bold text-white mb-2">{subject.subjectName}</h3>
                        <p className="text-slate-400 mb-4 h-16 overflow-hidden text-sm">{subject.syllabusDescription}</p>
                        <div className="flex gap-2">
                            <button className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">Edit</button>
                            <button className="text-sm px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 rounded transition-colors">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {subjects.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-slate-800/20 rounded-xl">
                    No subjects found. Start by creating one.
                </div>
            )}
        </div>
    );
};

export default Subjects;
