import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Roadmap = () => {
    const { subjectId } = useParams();
    const { user } = useAuth();
    const [roadmap, setRoadmap] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                // Mocking connection for now or use real endpoint if ready
                // const res = await API.get(`/learning/roadmap/${user.id}/${subjectId}`);
                // setRoadmap(res.data);

                // Demo data
                setRoadmap([
                    { topicId: '1', title: 'Foundations', status: 'mastered', date: '2023-10-15' },
                    { topicId: '2', title: 'Basic Concepts', status: 'mastered', date: '2023-10-18' },
                    { topicId: '3', title: 'Intermediate Theory', status: 'developing', date: '2023-10-20' },
                    { topicId: '4', title: 'Advanced Application', status: 'locked', date: null },
                    { topicId: '5', title: 'Mastery Challenge', status: 'locked', date: null },
                ]);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch roadmap", error);
                setLoading(false);
            }
        };

        if (user && subjectId) fetchRoadmap();
    }, [user, subjectId]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-white font-display">Your Learning Path</h1>
                <p className="mt-2 text-slate-400">Follow your personalized roadmap to mastery.</p>
            </div>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-slate-700/50 rounded-full"></div>

                <div className="space-y-12 pb-12">
                    {roadmap.map((step, index) => (
                        <div key={step.topicId} className={`relative flex items-center justify-between ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>

                            {/* Content Box */}
                            <div className="w-5/12">
                                <Link
                                    to={step.status !== 'locked' ? `/topic/${step.topicId}` : '#'}
                                    className={`block p-5 rounded-xl border transition-all ${step.status === 'mastered'
                                            ? 'bg-indigo-900/20 border-indigo-500/50 hover:bg-indigo-900/30'
                                            : step.status === 'developing'
                                                ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/30'
                                                : 'bg-slate-800/50 border-slate-700 opacity-75 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-white">{step.title}</h3>
                                        {step.status === 'mastered' && (
                                            <span className="text-green-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                        )}
                                        {step.status === 'locked' && (
                                            <span className="text-slate-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {step.status === 'locked' ? 'Complete previous topics to unlock' : 'Click to continue learning'}
                                    </p>
                                </Link>
                            </div>

                            {/* Center Node */}
                            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 ${step.status === 'mastered' ? 'bg-indigo-600 border-indigo-900' :
                                        step.status === 'developing' ? 'bg-amber-500 border-amber-900' :
                                            'bg-slate-700 border-slate-900'
                                    }`}>
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            </div>

                            {/* Spacer for the other side */}
                            <div className="w-5/12"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Roadmap;
