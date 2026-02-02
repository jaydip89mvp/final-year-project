import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

const Topics = () => {
    const { subjectId } = useParams();
    const [searchParams] = useSearchParams();
    const subjectName = searchParams.get('name') || 'Subject';

    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await API.get(`/learning/topics/${subjectId}`);
                setTopics(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch topics", error);
                // Mock data for fallback/demo
                setTopics([
                    { _id: '101', topicTitle: 'Introduction to Logic', difficultyLevel: 'Easy', topicId: 't1' },
                    { _id: '102', topicTitle: 'Advanced Algebra', difficultyLevel: 'Hard', topicId: 't2' },
                    { _id: '103', topicTitle: 'Derivatives', difficultyLevel: 'Medium', topicId: 't3' }
                ]);
                setLoading(false);
            }
        };

        if (subjectId) fetchTopics();
    }, [subjectId]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <Link to="/subjects" className="text-slate-400 hover:text-white flex items-center mb-4 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Subjects
                </Link>
                <h1 className="text-3xl font-bold text-white font-display">
                    {subjectName} <span className="text-indigo-500">Topics</span>
                </h1>
                <p className="mt-2 text-slate-400">Select a topic to begin learning. Topics are adapted to your profile.</p>
            </div>

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
