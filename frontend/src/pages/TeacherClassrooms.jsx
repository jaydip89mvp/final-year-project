import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const Classrooms = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClass, setNewClass] = useState({ name: '', subject: '', description: '' });
    const [createError, setCreateError] = useState(null);

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            const res = await API.get('/classroom');
            // API returns { success: true, data: [...] }
            setClassrooms(res.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch classrooms", error);
            setLoading(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        setCreateError(null);
        try {
            const res = await API.post('/classroom/create', newClass);
            // Add new class to list
            setClassrooms([res.data.data, ...classrooms]);
            setShowCreateModal(false);
            setNewClass({ name: '', subject: '', description: '' });
        } catch (error) {
            setCreateError(error.response?.data?.message || "Failed to create classroom");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white font-display">My Classrooms</h1>
                    <p className="text-slate-400">Manage your classes and viewing student rosters.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Class
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map((classroom) => (
                    <div key={classroom._id} className="glass-panel p-6 rounded-xl hover:bg-slate-800 transition-colors border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50 bg-slate-800 rounded-bl-xl border-l border-b border-white/5">
                            <span className="text-xs text-slate-400 uppercase tracking-widest block text-center mb-1">Join Code</span>
                            <span className="text-lg font-mono font-bold text-indigo-400 select-all">{classroom.joinCode}</span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1 pr-20">{classroom.name}</h3>
                        <p className="text-indigo-400 text-sm font-medium mb-4">{classroom.subject}</p>

                        <p className="text-slate-400 text-sm mb-6 h-10 overflow-hidden">{classroom.description || "No description provided."}</p>

                        <div className="flex justify-between items-center border-t border-slate-700 pt-4">
                            <div className="flex -space-x-2">
                                {classroom.students?.slice(0, 3).map((student, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-white">
                                        {student.name ? student.name.charAt(0) : '?'}
                                    </div>
                                ))}
                                {(classroom.students?.length || 0) > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs text-slate-400">
                                        +{classroom.students.length - 3}
                                    </div>
                                )}
                                {(classroom.students?.length || 0) === 0 && (
                                    <span className="text-xs text-slate-500 italic">No students yet</span>
                                )}
                            </div>

                            <Link to={`/classrooms/${classroom._id}`} className="text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}

                {classrooms.length === 0 && !loading && (
                    <div className="col-span-full py-16 text-center bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-700">
                        <div className="bg-slate-800 inline-flex p-4 rounded-full mb-4">
                            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No classrooms yet</h3>
                        <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first classroom to start inviting students and tracking their progress.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Create Classroom
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Classroom</h2>

                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Class Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. Grade 10 Physics"
                                    value={newClass.name}
                                    onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. Physics"
                                    value={newClass.subject}
                                    onChange={e => setNewClass({ ...newClass, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                                    placeholder="Brief description of the class..."
                                    value={newClass.description}
                                    onChange={e => setNewClass({ ...newClass, description: e.target.value })}
                                />
                            </div>

                            {createError && (
                                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                                    {createError}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Create Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Classrooms;
