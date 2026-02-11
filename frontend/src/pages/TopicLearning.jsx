import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TopicLearning = () => {
    const { topicId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('learn'); // 'learn' | 'quiz' | 'result'
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Telemetry state
    const [startTime, setStartTime] = useState(Date.now());
    const [hintsUsed, setHintsUsed] = useState(0);
    const [contentMode, setContentMode] = useState('text');

    useEffect(() => {
        // Cancel speech when unmounting
        return () => window.speechSynthesis.cancel();
    }, []);

    useEffect(() => {
        const fetchTopic = async () => {
            try {
                const res = await API.get(`/learning/topic/${topicId}`);
                setTopic(res.data);
                setLoading(false);
                setStartTime(Date.now()); // Reset timer on load

                // Log lesson view
                API.post('/learning/event', {
                    topicId,
                    eventType: 'lesson_view',
                    contentMode: 'text'
                }).catch(err => console.error("Telemetry error:", err));

            } catch (error) {
                console.error("Failed to fetch topic", error);
                // Mock data for demo
                setTopic({
                    _id: '101',
                    topicTitle: 'Introduction to Logic',
                    content: "## Understanding Logic\nLogic is the study of correct reasoning...",
                    multimediaLinks: ['https://example.com/video'],
                    quiz: {
                        questions: [
                            {
                                _id: 'q1',
                                questionText: 'What is the capital of Logic?',
                                options: ['Reasoning', 'Emotion', 'Chaos', 'Order'],
                            }
                        ]
                    }
                });
                setLoading(false);
            }
        };

        if (topicId) fetchTopic();
    }, [topicId]);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            // Remove markdown characters for cleaner speech (simple)
            const textToSpeak = (topic.content || topic.normalContent || "Content is loading...").replace(/[#*]/g, '');
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    const [generatingVisual, setGeneratingVisual] = useState(false);

    // ... existing useEffects

    // ... existing handleSpeak

    const handleGenerateVisual = async () => {
        setGeneratingVisual(true);
        try {
            const res = await API.post('/ai/generate-visual-card', {
                topic: topic.topicTitle,
                // Pass current neuroType if available in context, or let backend infer
            });

            if (res.data.success) {
                // Update topic with new image URL
                setTopic(prev => ({
                    ...prev,
                    imageUrl: res.data.data.imageUrl
                }));
            }
        } catch (error) {
            console.error("Failed to generate visual", error);
            alert("Could not generate visual aid. API quota may be exceeded.");
        } finally {
            setGeneratingVisual(false);
        }
    };

    const handleAnswerChange = (questionIndex, optionIndex) => {
        setQuizAnswers({
            ...quizAnswers,
            [questionIndex]: optionIndex
        });
    };

    const submitQuiz = async () => {
        setSubmitting(true);
        try {
            // Transform answers to expected format
            const answersArray = Object.keys(quizAnswers).map(key => ({
                questionIndex: parseInt(key),
                selectedOption: quizAnswers[key]
            }));

            const res = await API.post('/learning/submit-quiz', {
                studentId: user.id || user._id,
                topicId: topicId,
                answers: answersArray,
                timeSpentSeconds: (Date.now() - startTime) / 1000,
                hintsUsed: hintsUsed,
                contentMode: contentMode
            });

            setQuizResult(res.data);
            setMode('result');
        } catch (error) {
            console.error("Quiz submission failed", error);
            // Mock result
            setQuizResult({
                score: 80,
                status: 'mastered',
                roadmapUpdate: 'Next topic unlocked'
            });
            setMode('result');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!topic) return <div className="text-center text-white">Topic not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-white flex items-center mb-4 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white font-display mb-2">{topic.topicTitle}</h1>
                        <div className="h-1 w-20 bg-indigo-500 rounded"></div>
                    </div>
                    {/* TTS Button */}
                    <button
                        onClick={handleSpeak}
                        className={`p-3 rounded-full transition-all ${isSpeaking ? 'bg-indigo-600 animate-pulse text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        title={isSpeaking ? "Stop Learning Assistant" : "Read Aloud"}
                    >
                        {isSpeaking ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex space-x-4 border-b border-gray-700 pb-4">
                <button
                    onClick={() => setMode('learn')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'learn'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    Content
                </button>
                <button
                    onClick={() => setMode('quiz')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'quiz' || mode === 'result'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    Quiz
                </button>
            </div>

            {/* Content Area */}
            {mode === 'learn' && (
                <div className="glass-panel p-8 rounded-xl space-y-6">

                    {/* Visual Aid Section */}
                    {(topic.imageUrl || topic.imagePrompt) && (
                        <div className="mb-6">
                            {topic.imageUrl ? (
                                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 group">
                                    <img
                                        src={topic.imageUrl}
                                        alt="Visual Aid"
                                        className="w-full h-64 md:h-80 object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                        <p className="text-white/90 text-sm font-medium backdrop-blur-sm bg-black/30 p-2 rounded">
                                            AI-Generated Visual Summary
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Visual Learning Mode</h3>
                                        <p className="text-slate-300 text-sm mt-1">Generate a custom AI image to help visualize this concept.</p>
                                    </div>
                                    <button
                                        onClick={handleGenerateVisual}
                                        disabled={generatingVisual}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center whitespace-nowrap"
                                    >
                                        {generatingVisual ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Generate Visual Aid
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="prose prose-invert max-w-none">
                        {/* We would render markdown here safely */}
                        <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-lg">
                            {topic.content || topic.normalContent || "Content is loading..."}
                        </div>
                    </div>

                    {topic.multimediaLinks && topic.multimediaLinks.length > 0 && (
                        <div className="mt-8 border-t border-slate-700 pt-6">
                            <h3 className="text-lg font-medium text-white mb-4">Multimedia Resources</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {topic.multimediaLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
                                    >
                                        <svg className="w-8 h-8 text-red-500 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                        </svg>
                                        <span className="text-indigo-300 group-hover:text-white" onClick={() => setContentMode('visual')}>Watch Video Resource {idx + 1}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => setMode('quiz')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center"
                        >
                            Take Quiz
                            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Quiz Area */}
            {mode === 'quiz' && (
                <div className="glass-panel p-8 rounded-xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Topic Assessment</h2>

                    {topic.quiz?.questions?.map((q, qIdx) => (
                        <div key={q._id || qIdx} className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <h3 className="text-lg text-white font-medium mb-4">
                                {qIdx + 1}. {q.questionText}
                            </h3>
                            <div className="space-y-3">
                                {q.options.map((option, oIdx) => (
                                    <label
                                        key={oIdx}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${quizAnswers[qIdx] === oIdx
                                            ? 'bg-indigo-900/30 border-indigo-500'
                                            : 'bg-slate-700/30 border-transparent hover:bg-slate-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${qIdx}`}
                                            value={oIdx}
                                            checked={quizAnswers[qIdx] === oIdx}
                                            onChange={() => handleAnswerChange(qIdx, oIdx)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="ml-3 text-slate-200">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    ))}

                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => {
                                setHintsUsed(h => h + 1);
                                API.post('/learning/event', {
                                    topicId,
                                    eventType: 'hint_request',
                                    hintsUsed: hintsUsed + 1
                                }).catch(e => console.error(e));
                                alert("Hint: Review the summary and key concepts in the lesson content.");
                            }}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Need a Hint?
                        </button>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={submitQuiz}
                            disabled={submitting || (topic.quiz?.questions && Object.keys(quizAnswers).length < topic.quiz.questions.length)}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all ${submitting || (topic.quiz?.questions && Object.keys(quizAnswers).length < topic.quiz.questions.length)
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                                }`}
                        >
                            {submitting ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                        {(topic.quiz?.questions && Object.keys(quizAnswers).length < topic.quiz.questions.length) && (
                            <p className="text-center text-slate-500 mt-4">Please answer all questions to submit.</p>
                        )}
                    </div>
                </div>
            )
            }

            {/* Results Area */}
            {
                mode === 'result' && quizResult && (
                    <div className="glass-panel p-8 rounded-xl text-center">
                        <div className={`mx-auto h-24 w-24 flex items-center justify-center rounded-full mb-6 ${quizResult.status === 'mastered' ? 'bg-green-500/20 text-green-400' :
                            quizResult.status === 'developing' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                            <span className="text-4xl font-bold">{quizResult.score}%</span>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">
                            {quizResult.status === 'mastered' ? 'Topic Mastered!' :
                                quizResult.status === 'developing' ? 'Keep Practicing' :
                                    'Needs Improvement'}
                        </h2>

                        <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
                            {quizResult.status === 'mastered'
                                ? "Great job! You've demonstrated a solid understanding of this topic."
                                : "You're getting there. Review the material and try again to improve your score."}
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => setMode('learn')}
                                className="px-6 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 font-medium"
                            >
                                Review Material
                            </button>
                            <button
                                onClick={() => navigate('/subjects')}
                                className="px-6 py-3 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-500/20"
                            >
                                Next Topic
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TopicLearning;
