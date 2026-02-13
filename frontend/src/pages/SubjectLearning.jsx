import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SubjectLearning = () => {
    const { subjectId } = useParams();
    const [searchParams] = useSearchParams();
    const pathStr = searchParams.get('path') || '';
    const path = pathStr ? pathStr.split('|').map((p) => p.trim()).filter(Boolean) : [];
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('learn');
    const [lessonContent, setLessonContent] = useState('');
    const [lessonLoading, setLessonLoading] = useState(false);
    const [lessonError, setLessonError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [quiz, setQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);
    const [startTime, setStartTime] = useState(Date.now());

    const fetchRoadmap = async () => {
        setLoading(true);
        setLessonError(null);
        try {
            const params = new URLSearchParams({ subjectId });
            if (path.length > 0) params.set('path', path.join('|'));
            const res = await API.get(`/learning/roadmap/node?${params.toString()}`);
            const data = res.data?.data;
            setPlan(data);
            if (data?.completed) {
                setLessonContent('');
                setLoading(false);
                return;
            }
            if (data?.nextToStudy) {
                setLessonContent('');
                setLessonLoading(true);
                const topicContext = data?.subjectName || data?.name || '';
                try {
                    const lessonRes = await API.post('/ai/subtopic-lesson', {
                        topic: topicContext,
                        subtopic: data.nextToStudy
                    });
                    setLessonContent(lessonRes.data?.data?.lessonContent || '');
                } catch (e) {
                    setLessonError(e.response?.data?.message || 'Could not load lesson.');
                } finally {
                    setLessonLoading(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch roadmap', error);
            setLessonError(error.response?.data?.message || 'Could not load roadmap.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subjectId && isAuthenticated && user) fetchRoadmap();
    }, [subjectId, pathStr, isAuthenticated, user]);

    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        const text = (lessonContent || '').replace(/[#*]/g, '');
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const startQuiz = async () => {
        if (!plan?.nextToStudy || !plan?.subjectName) return;
        setQuizLoading(true);
        setQuizAnswers({});
        setQuizResult(null);
        setCurrentQuestionIndex(0);
        setStartTime(Date.now());
        try {
            const res = await API.post('/ai/generate-quiz', {
                topic: plan.subjectName,
                subtopics: [plan.nextToStudy]
            });
            const questions = res.data?.data?.questions || [];
            setQuiz({ questions });
            setMode('quiz');
        } catch (error) {
            alert(error.response?.data?.message || 'Could not generate quiz.');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleAnswer = (optionIndex) => {
        setQuizAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    };

    const submitQuiz = async () => {
        if (!quiz?.questions?.length || !plan?.nodeKey || !plan?.nextToStudy) return;
        const questions = quiz.questions;
        let correct = 0;
        questions.forEach((q, idx) => {
            if (quizAnswers[idx] === q.correctOptionIndex) correct++;
        });

        setSubmitting(true);
        try {
            const res = await API.post('/learning/adaptive/submit-node-quiz', {
                nodeKey: plan.nodeKey,
                childName: plan.nextToStudy,
                correct,
                total: questions.length
            });
            setQuizResult(res.data?.data);
            setMode('result');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit quiz.');
        } finally {
            setSubmitting(false);
        }
    };

    const goToNextTopic = () => {
        setMode('learn');
        setQuiz(null);
        setQuizResult(null);
        setQuizAnswers({});
        fetchRoadmap();
    };

    const goToParent = () => {
        if (path.length === 0) navigate('/subjects');
        else {
            const newPath = path.slice(0, -1);
            navigate(`/learning/subject/${subjectId}${newPath.length ? `?path=${encodeURIComponent(newPath.join('|'))}` : ''}`, { replace: true });
        }
    };

    const enterChild = (childName) => {
        const newPath = [...path, childName];
        navigate(`/learning/subject/${subjectId}?path=${encodeURIComponent(newPath.join('|'))}`, { replace: true });
    };

    if (loading && !plan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4" />
                <p className="text-slate-400">Loading your learning plan...</p>
            </div>
        );
    }

    if (plan?.completed) {
        const isRoot = path.length === 0;
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="glass-panel p-10 rounded-2xl border border-green-500/20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{isRoot ? 'Subject completed' : 'Node completed'}</h1>
                    <p className="text-slate-400 mb-8">{isRoot ? 'You have mastered all items for this subject.' : `You have mastered all items under "${plan?.name}".`}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {!isRoot && (
                            <button type="button" onClick={goToParent} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium">
                                Back to parent
                            </button>
                        )}
                        <Link to="/subjects" className="inline-flex px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
                            Back to Subjects
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'learn') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {path.length > 0 && (
                    <nav className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={() => navigate('/subjects')} className="hover:text-white">Subjects</button>
                        <span>/</span>
                        <button type="button" onClick={goToParent} className="hover:text-white">{plan?.subjectName}</button>
                        {path.map((seg, i) => (
                            <span key={i} className="flex items-center gap-2">
                                <span>/</span>
                                {i === path.length - 1 ? (
                                    <span className="text-indigo-300">{seg}</span>
                                ) : (
                                    <button type="button" onClick={() => { const p = path.slice(0, i + 1); navigate(`/learning/subject/${subjectId}?path=${encodeURIComponent(p.join('|'))}`); }} className="hover:text-white">{seg}</button>
                                )}
                            </span>
                        ))}
                    </nav>
                )}

                <p className="text-slate-500 text-sm">
                    Roadmap is loaded from the database (generated once). Only not_started or weak items are shown. Study in-depth content, then pass the quiz to mark as mastered.
                </p>

                {plan?.allChildren?.length > 0 && (
                    <div className="glass-panel rounded-xl p-4 border border-white/5">
                        <h3 className="text-sm font-semibold text-slate-400 mb-2">Learning nodes for: {plan?.name} (only to-study shown below)</h3>
                        <ul className="space-y-1.5">
                            {plan.children?.map((c, i) => {
                                const isCurrent = c.name === plan.nextToStudy;
                                return (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        {isCurrent ? (
                                            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white shrink-0">•</span>
                                        ) : (
                                            <span className="w-5 shrink-0 text-slate-600">{i + 1}</span>
                                        )}
                                        <span className={isCurrent ? 'text-indigo-300 font-medium' : 'text-slate-400'}>{c.name}</span>
                                        {isCurrent && <span className="text-xs text-indigo-400/80">(current)</span>}
                                        <button type="button" onClick={() => enterChild(c.name)} className="ml-2 text-xs text-slate-500 hover:text-indigo-400">Enter →</button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-white">Node: {plan?.name}</h1>
                            <p className="text-indigo-300 font-semibold mt-1 text-lg">
                                Studying: {plan?.nextToStudy}
                            </p>
                            <p className="text-slate-500 text-sm mt-0.5">In-depth content for this item only</p>
                        </div>
                        <button
                            onClick={handleSpeak}
                            className={`p-3 rounded-full transition-all ${isSpeaking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            title="Read aloud"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {lessonError && (
                            <div className="mb-4 text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-4 py-2 text-sm">
                                {lessonError}
                            </div>
                        )}
                        {lessonLoading ? (
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                                Loading in-depth content...
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-base md:text-lg">
                                    {lessonContent || 'No content available.'}
                                </div>
                            </div>
                        )}

                        {!lessonLoading && lessonContent && (
                            <div className="mt-10 flex flex-col items-end gap-2">
                                <p className="text-slate-500 text-sm w-full">Quiz is for this item only. One question shown at a time.</p>
                                <button
                                    onClick={startQuiz}
                                    disabled={quizLoading}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2"
                                >
                                    {quizLoading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            Preparing quiz...
                                        </>
                                    ) : (
                                        <>
                                            Start Quiz for this item
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'quiz' && quiz?.questions?.length) {
        const questions = quiz.questions;
        const current = questions[currentQuestionIndex];
        const total = questions.length;
        const isLast = currentQuestionIndex === total - 1;
        const answered = quizAnswers[currentQuestionIndex] !== undefined;

        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between text-slate-400 flex-wrap gap-2">
                    <button onClick={goToParent} className="text-slate-400 hover:text-white flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm">Quiz: {plan?.nextToStudy}</span>
                        <span className="font-medium bg-slate-800/80 px-3 py-1 rounded-lg">One question at a time — Question {currentQuestionIndex + 1} of {total}</span>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-2xl border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6">{current?.questionText}</h2>
                    <div className="space-y-3">
                        {(current?.options || []).map((opt, oIdx) => (
                            <button
                                key={oIdx}
                                onClick={() => handleAnswer(oIdx)}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                                    quizAnswers[currentQuestionIndex] === oIdx
                                        ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                        : 'bg-slate-800/50 border-slate-700 text-slate-200 hover:border-slate-600'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {isLast ? (
                            <button
                                onClick={submitQuiz}
                                disabled={submitting || !answered}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium"
                            >
                                {submitting ? 'Submitting...' : 'Submit Quiz'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(i => Math.min(total - 1, i + 1))}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'result' && quizResult) {
        const passed = (quizResult.score || 0) >= 80;
        return (
            <div className="max-w-xl mx-auto text-center py-12">
                <div className={`glass-panel p-10 rounded-2xl border ${passed ? 'border-green-500/30' : 'border-amber-500/30'}`}>
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <span className="text-4xl font-bold">{quizResult.score}%</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {passed ? 'Well done!' : 'Keep practicing'}
                    </h1>
                    <p className="text-slate-400 mb-8">
                        {passed ? 'You cleared this item. Move on to the next item.' : 'Review the in-depth content for this item and try the quiz again when ready.'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        {passed && !quizResult.completed && (
                            <button onClick={goToNextTopic} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
                                Next item →
                            </button>
                        )}
                        {quizResult.completed && (
                            <Link to="/subjects" className="inline-flex justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
                                All items done – Back to Subjects
                            </Link>
                        )}
                        {!passed && (
                            <button onClick={() => { setMode('learn'); setQuizResult(null); }} className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl font-medium">
                                Review this item
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default SubjectLearning;
