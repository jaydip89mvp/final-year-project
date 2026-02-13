import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Subjects = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ subjectName: '', syllabusDescription: '' });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await API.get('/learning/subjects');
            setSubjects(res.data.data || res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await API.post('/learning/subjects', newSubject);
            setShowModal(false);
            setNewSubject({ subjectName: '', syllabusDescription: '' });
            fetchSubjects(); // Refresh list
        } catch (error) {
            console.error("Failed to create subject", error);
            alert("Failed to create subject. Ensure you are a teacher.");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="text-center relative">
                <h1 className="text-4xl font-bold text-white font-display">Explore Subjects</h1>
                <p className="mt-4 text-xl text-slate-400">Select a domain to start your adaptive learning journey.</p>

                {user && user.role === 'teacher' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="absolute right-0 top-0 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors"
                    >
                        + Add Subject
                    </button>
                )}
            </div>

            {/* Create Subject Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Add New Subject</h2>
                        <form onSubmit={handleCreateSubject} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 mb-2">Subject Name</label>
                                <input
                                    type="text"
                                    value={newSubject.subjectName}
                                    onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-2">Description</label>
                                <textarea
                                    value={newSubject.syllabusDescription}
                                    onChange={(e) => setNewSubject({ ...newSubject, syllabusDescription: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                                >
                                    Create Subject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {subjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                        <div key={subject._id} className="group relative glass-panel rounded-2xl p-6 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all"></div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-2">{subject.subjectName}</h3>
                                <p className="text-slate-400 mb-6 h-20 overflow-hidden">{subject.syllabusDescription}</p>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        to={`/learning/subject/${subject._id}`}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium group-hover:translate-x-0.5 transition-transform"
                                    >
                                        Start Learning
                                        <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                    {user?.role === 'teacher' && (
                                        <Link
                                            to={`/topics/${subject._id}?name=${encodeURIComponent(subject.subjectName)}`}
                                            className="inline-flex items-center text-slate-400 hover:text-white font-medium"
                                        >
                                            View Topics
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 px-4 glass-panel rounded-2xl">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-900/30 mb-4">
                        <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No Subjects Found</h3>
                    <p className="text-slate-400 max-w-md mx-auto">There are currently no subjects available. Please check back later or contact your administrator.</p>
                </div>
            )}
        </div>
    );
};

export default Subjects;
