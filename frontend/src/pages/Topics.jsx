import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Topics = () => {
    const { subjectId } = useParams();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const subjectName = searchParams.get('name') || 'Subject';

    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTopic, setNewTopic] = useState({
        topicTitle: '',
        difficultyLevel: 'Easy',
        normalContent: 'AI will generate content...',
        simplifiedContent: 'AI will generate simplified content...'
    });

    useEffect(() => {
        if (subjectId) fetchTopics();
    }, [subjectId]);

    const fetchTopics = async () => {
        try {
            const res = await API.get(`/learning/topics/${subjectId}`);
            setTopics(res.data.data || res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch topics", error);
            setLoading(false);
        }
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        try {
            await API.post('/learning/topics', {
                ...newTopic,
                subjectId
            });
            setShowModal(false);
            setNewTopic({
                topicTitle: '',
                difficultyLevel: 'Easy',
                normalContent: 'AI will generate content...',
                simplifiedContent: 'AI will generate simplified content...'
            });
            fetchTopics();
        } catch (error) {
            console.error("Failed to create topic", error);
            alert("Failed to create topic. Ensure you are a teacher.");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 relative">
                <Link to="/subjects" className="text-slate-400 hover:text-white flex items-center mb-4 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Subjects
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white font-display">
                            {subjectName} <span className="text-indigo-500">Topics</span>
                        </h1>
                        <p className="mt-2 text-slate-400">Select a topic to begin learning. Topics are adapted to your profile.</p>
                    </div>
                    {user && user.role === 'teacher' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors"
                        >
                            + Add Topic
                        </button>
                    )}
                </div>
            </div>

            {/* Create Topic Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Add New Topic</h2>
                        <form onSubmit={handleCreateTopic} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 mb-2">Topic Title</label>
                                <input
                                    type="text"
                                    value={newTopic.topicTitle}
                                    onChange={(e) => setNewTopic({ ...newTopic, topicTitle: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-2">Difficulty</label>
                                <select
                                    value={newTopic.difficultyLevel}
                                    onChange={(e) => setNewTopic({ ...newTopic, difficultyLevel: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
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
                                    Create Topic
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {topics.map((topic) => (
                    <Link
                        key={topic._id}
                        to={`/topic/${topic.topicId || topic._id}`}
                        className="block glass-panel p-6 rounded-lg hover:bg-slate-800/80 transition-all border-l-4 border-transparent hover:border-indigo-500"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-white">{topic.topicTitle}</h3>
                                <p className="text-sm text-slate-400 mt-1">Difficulty:
                                    <span className={`ml-2 font-medium ${topic.difficultyLevel === 'Hard' ? 'text-red-400' :
                                        topic.difficultyLevel === 'Medium' ? 'text-yellow-400' :
                                            'text-green-400'
                                        }`}>
                                        {topic.difficultyLevel}
                                    </span>
                                </p>
                            </div>
                            <div className="hidden sm:block">
                                <span className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-300 rounded-full text-sm font-medium">
                                    Start Learning
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}

                {topics.length === 0 && (
                    <div className="glass-panel p-8 text-center rounded-lg">
                        <p className="text-slate-400">No topics found for this subject yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Topics;
