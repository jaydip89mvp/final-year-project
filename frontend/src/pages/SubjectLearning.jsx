import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Runware } from "@runware/sdk-js";

// RUNWARE API CONFIG
const RUNWARE_API_KEY = "dSlUqoQvfI4LR2NdmWQN2AzODR2FrL8b";
const runware = new Runware({ apiKey: RUNWARE_API_KEY });

const SubjectLearning = () => {
    const { subjectId } = useParams();

    const StructuredContentRenderer = ({ content }) => {
        if (!content) return null;
        if (typeof content === 'string') {
            return <div className="whitespace-pre-wrap">{content}</div>;
        }

        const { title, subtopics } = content;

        return (
            <div className="space-y-8">
                {title && <h2 className="text-2xl font-bold text-white mb-6 border-b border-indigo-500/30 pb-2">{title}</h2>}
                {subtopics && subtopics.map((item, idx) => (
                    <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all">
                        <h3 className="text-xl font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-sm">{idx + 1}</span>
                            {item.topic}
                        </h3>

                        <div className="space-y-4 text-slate-300">
                            {item.explain && (
                                <div className="flex gap-3">
                                    <div className="mt-1 shrink-0 text-indigo-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="leading-relaxed">{item.explain}</p>
                                </div>
                            )}

                            {item.bulletPoints && item.bulletPoints.length > 0 && (
                                <ul className="pl-8 space-y-2 list-disc marker:text-indigo-500">
                                    {item.bulletPoints.map((point, pIdx) => (
                                        <li key={pIdx}>{point}</li>
                                    ))}
                                </ul>
                            )}

                            {item.example && (
                                <div className="mt-4 p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex gap-3">
                                    <div className="shrink-0 text-amber-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1">Example</span>
                                        <p className="text-sm italic text-slate-400">{item.example}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    const [searchParams] = useSearchParams();
    const pathStr = searchParams.get('path') || '';
    const path = pathStr ? pathStr.split('|').map((p) => p.trim()).filter(Boolean) : [];
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const audioRef = useRef(null);

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('learn');
    const [lessonContent, setLessonContent] = useState('');
    const [lessonSpeechScript, setLessonSpeechScript] = useState('');
    const [lessonLoading, setLessonLoading] = useState(false);
    const [lessonError, setLessonError] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechLoading, setSpeechLoading] = useState(false);

    const [quiz, setQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);
    const [startTime, setStartTime] = useState(Date.now());

    // Selection-based Speech states
    const [selection, setSelection] = useState({ text: '', x: 0, y: 0, visible: false });

    const [lessonImageUrl, setLessonImageUrl] = useState('');
    const [imageLoading, setImageLoading] = useState(false);

    // Helper to generate image using Runware API SDK
    const generateRunwareImage = async (prompt) => {
        console.log(">>> generateRunwareImage CALLED <<< Prompt:", prompt);
        if (!prompt) {
            console.log("!!! generateRunwareImage: Empty prompt, skipping !!!");
            return null;
        }

        try {
            const images = await runware.requestImages({
                positivePrompt: prompt,
                model: "runware:101@1",
                width: 1024,
                height: 1024,
                numberResults: 1,
            });

            console.log("Runware API RAW Data:", images);

            if (images && images.length > 0 && images[0].imageURL) {
                console.log("Generated Image URL SUCCESS:", images[0].imageURL);
                return images[0].imageURL;
            }
            console.log("!!! Runware API: No image URL in response !!!");
            return null;
        } catch (error) {
            console.error(">>> Runware SDK FETCH ERROR <<<", error);
            return null;
        }
    };

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
                const topicContext = plan?.subjectName || data?.subjectName || plan?.rootSubjectName || subjectId;
                console.log("Sending topic:", topicContext);
                console.log("Sending subtopic:", data.nextToStudy);

                try {
                    const lessonRes = await API.post('/ai/subtopic-lesson', {
                        topic: topicContext,
                        subtopic: data.nextToStudy
                    });
                    const lessonData = lessonRes.data?.data || {};
                    console.log("Lesson Data Loaded:", lessonData);
                    setLessonContent(lessonData.lessonContent || '');
                    setLessonSpeechScript(lessonData.lessonSpeechScript || '');

                    // Frontend-driven image generation
                    const visualPrompt = lessonData.lessonVisualPrompt || '';
                    if (visualPrompt) {
                        setImageLoading(true);
                        generateRunwareImage(visualPrompt).then(url => {
                            if (url) setLessonImageUrl(url);
                        }).finally(() => setImageLoading(false));
                    } else if (lessonData.lessonImageUrl) {
                        setLessonImageUrl(lessonData.lessonImageUrl);
                    }


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
        return () => {
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleSpeak = async () => {
        if (isSpeaking) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
            }
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        let textToSpeak = lessonSpeechScript || '';
        if (!textToSpeak) {
            if (typeof lessonContent === 'string') {
                textToSpeak = lessonContent;
            } else if (lessonContent && lessonContent.subtopics) {
                // Flatten structured content for speech
                const sections = [];
                if (lessonContent.title) sections.push(lessonContent.title);

                lessonContent.subtopics.forEach(s => {
                    if (s.topic) sections.push(s.topic);
                    if (s.explain) sections.push(s.explain);
                    if (s.bulletPoints && Array.isArray(s.bulletPoints)) {
                        sections.push(...s.bulletPoints);
                    }
                    if (s.example) sections.push("For example: " + s.example);
                });
                textToSpeak = sections.join(". ");
            }
        }

        const text = textToSpeak.replace(/[#*]/g, '').trim();
        console.log("TTS Text Preview:", text);
        if (!text) return;
        setSpeechLoading(true);
        try {
            const res = await API.post('/ai/speech', { text });
            const audioUrl = res.data?.data?.audioUrl;
            if (!audioUrl) throw new Error('No audio URL');
            if (audioRef.current) audioRef.current.pause();
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
            audio.onerror = () => { setIsSpeaking(false); setSpeechLoading(false); audioRef.current = null; };
            await audio.play();
            setIsSpeaking(true);
        } catch (e) {
            const fallback = text;
            if (fallback && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(fallback);
                utterance.onend = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
            }
        } finally {
            setSpeechLoading(false);
        }
    };

    const handleSpeakQuiz = async (q) => {
        if (isSpeaking) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const text = (q.questionSpeechScript || q.questionText || '').replace(/[#*]/g, '').trim();
        const optionsText = q.options ? `. Options are: ${q.options.join(", ")}` : '';
        const fullText = text + optionsText;

        setSpeechLoading(true);
        try {
            const res = await API.post('/ai/speech', { text: fullText });
            const audioUrl = res.data?.data?.audioUrl;
            if (!audioUrl) throw new Error('No audio URL');
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
            await audio.play();
            setIsSpeaking(true);
        } catch (e) {
            if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(fullText);
                utterance.onend = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
            }
        } finally {
            setSpeechLoading(false);
        }
    };

    const handleMouseUp = () => {
        const selected = window.getSelection();
        const text = selected.toString().trim();
        if (text && text.length > 1) {
            const range = selected.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelection({
                text,
                x: rect.left + window.scrollX + (rect.width / 2),
                y: rect.top + window.scrollY - 10,
                visible: true
            });
        } else {
            setSelection(prev => ({ ...prev, visible: false }));
        }
    };

    const handleSpeakSelection = async () => {
        if (!selection.text) return;
        const textToRead = selection.text;
        setSelection(prev => ({ ...prev, visible: false }));

        setIsSpeaking(true);
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
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
            console.log("Quiz Questions Loaded:", questions);
            setQuiz({ questions });
            setMode('quiz');

            // Trigger background image generation for questions
            questions.forEach((q, idx) => {
                console.log(`Processing Question ${idx}:`, q);
                if (q.questionVisualPrompt) {
                    generateRunwareImage(q.questionVisualPrompt)
                        .then(imageUrl => {
                            console.log(`Quiz Question ${idx} Image URL:`, imageUrl);
                            if (imageUrl) {
                                setQuiz(prev => {
                                    if (!prev || !prev.questions) return prev;
                                    const newQuestions = [...prev.questions];
                                    if (newQuestions[idx]) {
                                        newQuestions[idx] = { ...newQuestions[idx], questionImageUrl: imageUrl };
                                    }
                                    return { ...prev, questions: newQuestions };
                                });
                            }
                        }).catch(() => { });
                }
            });
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
                total: questions.length,
                startTime
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
            <div className="max-w-2xl mx-auto text-center py-16" onMouseUp={handleMouseUp}>
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
            <div className="max-w-4xl mx-auto space-y-6" onMouseUp={handleMouseUp}>
                {selection.visible && (
                    <button
                        onClick={handleSpeakSelection}
                        className="fixed z-[9999] bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in zoom-in duration-200 hover:bg-indigo-500"
                        style={{
                            left: `${selection.x}px`,
                            top: `${selection.y}px`,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        Speak
                    </button>
                )}
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
                            type="button"
                            onClick={handleSpeak}
                            disabled={speechLoading || !(lessonContent || lessonSpeechScript)}
                            className={`p-3 rounded-full transition-all ${isSpeaking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isSpeaking ? 'Stop' : 'Read aloud'}
                        >
                            {speechLoading ? (
                                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isSpeaking ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    )}
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {lessonError && (
                            <div className="mb-4 text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-4 py-2 text-sm">
                                {lessonError}
                            </div>
                        )}
                        {imageLoading && (
                            <div className="mb-4 flex items-center text-slate-400 text-sm animate-pulse">
                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Lesson Illustration...
                            </div>
                        )}
                        {lessonImageUrl && (
                            <div className="mb-6 relative group">
                                <img
                                    src={lessonImageUrl}
                                    alt="Lesson visual"
                                    className="w-full rounded-xl border border-slate-700 shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] text-slate-300">
                                    AI Generated Visual
                                </div>
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
                                    <StructuredContentRenderer content={lessonContent} />
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
            <div className="max-w-2xl mx-auto space-y-6" onMouseUp={handleMouseUp}>
                {selection.visible && (
                    <button
                        onClick={handleSpeakSelection}
                        className="fixed z-[9999] bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in zoom-in duration-200 hover:bg-indigo-500"
                        style={{
                            left: `${selection.x}px`,
                            top: `${selection.y}px`,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        Speak
                    </button>
                )}
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
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-white flex-1 mr-4">
                            {typeof current?.questionText === 'string' ? current.questionText : (current?.questionText?.text || String(current?.questionText || ''))}
                        </h2>
                        <button
                            onClick={() => handleSpeakQuiz(current)}
                            disabled={speechLoading}
                            className={`p-2 rounded-lg transition-all ${isSpeaking ? 'bg-indigo-600/50 text-indigo-300' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            title="Read question aloud"
                        >
                            {speechLoading ? (
                                <div className="w-5 h-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {(current?.options || []).map((opt, oIdx) => (
                            <button
                                key={oIdx}
                                onClick={() => handleAnswer(oIdx)}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${quizAnswers[currentQuestionIndex] === oIdx
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-200 hover:border-slate-600'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    {/* Question Image Rendering */}
                    <div className="mt-6">
                        {current?.questionVisualPrompt && !current?.questionImageUrl && (
                            <div className="text-xs text-slate-500 animate-pulse flex items-center">
                                <svg className="w-3 h-3 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating visual context...
                            </div>
                        )}
                        {current?.questionImageUrl && (
                            <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-lg max-w-md mx-auto">
                                <img
                                    src={current.questionImageUrl}
                                    alt="Question Visual"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        )}
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
            <div className="max-w-xl mx-auto text-center py-12" onMouseUp={handleMouseUp}>
                {selection.visible && (
                    <button
                        onClick={handleSpeakSelection}
                        className="fixed z-[9999] bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in zoom-in duration-200 hover:bg-indigo-500"
                        style={{
                            left: `${selection.x}px`,
                            top: `${selection.y}px`,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        Speak
                    </button>
                )}
                <div className={`glass-panel p-10 rounded-2xl border ${passed ? 'border-green-500/30' : 'border-amber-500/30'}`}>
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <span className="text-4xl font-bold">{quizResult.score}%</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {passed ? 'Well done!' : 'Keep practicing'}
                    </h1>
                    <p className="text-slate-400 mb-2">
                        Time Spent: {quizResult.timeSpentSeconds}s
                    </p>

                    <p className="text-slate-400 mb-4">
                        Attempts: {quizResult.attempts}
                    </p>

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
