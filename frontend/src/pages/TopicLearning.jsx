import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Runware } from "@runware/sdk-js";

// RUNWARE API CONFIG
const RUNWARE_API_KEY = "dSlUqoQvfI4LR2NdmWQN2AzODR2FrL8b";
const runware = new Runware({ apiKey: RUNWARE_API_KEY });

const TopicLearning = () => {
    const { topicId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('learn');
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [imageGenerating, setImageGenerating] = useState(false); // Track local generation state



    // Subtopics + subtopic lessons (AI)
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [subtopicsLoading, setSubtopicsLoading] = useState(false);
    const [subtopicLessons, setSubtopicLessons] = useState({});
    const [subtopicLessonLoading, setSubtopicLessonLoading] = useState(false);
    const [subtopicError, setSubtopicError] = useState(null);

    // AI quiz based on subtopics
    const [aiQuiz, setAiQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);

    const [startTime, setStartTime] = useState(Date.now());
    const [hintsUsed, setHintsUsed] = useState(0);
    const [contentMode, setContentMode] = useState('text');

    // Selection-based Speech states
    const [selection, setSelection] = useState({ text: '', x: 0, y: 0, visible: false });

    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

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

    const fetchSubtopics = async (topicData) => {
        if (!topicData?.topicTitle) return;
        setSubtopicsLoading(true);
        setSubtopicError(null);
        try {
            const res = await API.post('/ai/generate-subtopics', {
                topic: topicData.topicTitle,
                topicId: topicData.topicId || topicId
            });
            const apiData = res.data?.data;
            const list = apiData?.subtopics || [];
            setSubtopics(list);
            if (!selectedSubtopic && list.length > 0) {
                setSelectedSubtopic(list[0]);
            }
        } catch (error) {
            setSubtopicError(error.response?.data?.message || 'Could not generate subtopics.');
        } finally {
            setSubtopicsLoading(false);
        }
    };
    // Fetch AI lesson for selected subtopic
    const fetchSubtopicLesson = async (subtopicName, topicData) => {
        if (!subtopicName || !topicData?.topicTitle) return;
        if (subtopicLessons[subtopicName]) return;

        setSubtopicLessonLoading(true);
        setSubtopicError(null);

        try {
            const res = await API.post('/ai/subtopic-lesson', {
                topic: topicData.topicTitle,
                subtopic: subtopicName
            });

            const lessonContent = res.data?.data?.lessonContent || '';
            const visualPrompt = res.data?.data?.lessonVisualPrompt || '';

            // Initial state with content, no image yet
            setSubtopicLessons(prev => ({
                ...prev,
                [subtopicName]: { content: lessonContent, imageUrl: null }
            }));

            // Generate image in background if prompt exists

            if (visualPrompt) {
                // Set a temporary loading state for image
                setSubtopicLessons(prev => ({
                    ...prev,
                    [subtopicName]: {
                        ...prev[subtopicName],
                        imageLoading: true
                    }
                }));

                generateRunwareImage(visualPrompt).then(imageUrl => {
                    console.log(`Subtopic [${subtopicName}] Image URL:`, imageUrl);
                    setSubtopicLessons(prev => ({
                        ...prev,
                        [subtopicName]: {
                            ...prev[subtopicName],
                            imageUrl: imageUrl,
                            imageLoading: false
                        }
                    }));
                }).catch(err => {
                    setSubtopicLessons(prev => ({
                        ...prev,
                        [subtopicName]: {
                            ...prev[subtopicName],
                            imageLoading: false
                        }
                    }));
                });
            }

        } catch (error) {
            setSubtopicError(error.response?.data?.message || 'Could not load subtopic lesson.');
        } finally {
            setSubtopicLessonLoading(false);
        }
    };

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

    useEffect(() => {
        const fetchTopic = async () => {
            try {
                const res = await API.get(`/learning/topic/${topicId}`);
                // Backend: { success, data: { topicId, topicTitle, content, ... } }
                const topicData = res.data?.data;
                setTopic(topicData);
                setLoading(false);
                setStartTime(Date.now()); // Reset timer on load

                // Kick off subtopic generation + first subtopic lesson
                if (topicData?.topicTitle) {
                    fetchSubtopics(topicData);
                }

                // Optional telemetry (backend may or may not implement this endpoint)
                API.post('/learning/event', {
                    topicId,
                    eventType: 'lesson_view',
                    contentMode: 'text'
                }).catch(err => { });

            } catch (error) {
                setLoading(false);
                // Show error state instead of mock data
            }
        };

        if (topicId) fetchTopic();

    }, [topicId]);

    // Auto-generate topic image if missing but prompt exists
    useEffect(() => {
        if (!topic || topic.imageUrl || !topic.imagePrompt || imageGenerating) return;

        const generateImage = async () => {
            // Avoid double generation if logic called multiple times
            setImageGenerating(true);
            try {
                const imageUrl = await generateRunwareImage(topic.imagePrompt);
                console.log("Topic Image URL (Auto):", imageUrl);
                if (imageUrl) {
                    setTopic(prev => ({ ...prev, imageUrl: imageUrl }));
                }
            } finally {
                setImageGenerating(false);
            }
        };

        generateImage();
    }, [topic, imageGenerating]);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            setSpeechLoading(true);
            try {
                let textToSpeak = ''; // lessonSpeechScript was not defined, removed it
                if (!textToSpeak) {
                    const content = (selectedSubtopic && subtopicLessons[selectedSubtopic]?.content) ||
                        topic.content ||
                        topic.normalContent;

                    if (typeof content === 'string') {
                        textToSpeak = content;
                    } else if (content && content.subtopics) {
                        const sections = [];
                        if (content.title) sections.push(content.title);

                        content.subtopics.forEach(s => {
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
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.onend = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
            } finally {
                setSpeechLoading(false);
            }
        }
    };

    const handleSpeakQuiz = async (q) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const text = (q.questionSpeechScript || q.questionText || '').replace(/[#*]/g, '').trim();
        const optionsText = q.options ? `. Options are: ${q.options.join(", ")}` : '';
        const fullText = text + optionsText;

        setSpeechLoading(true);
        try {
            // Check if backend speech is available (reuse API if needed)
            const fallback = fullText;
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

    const handleSpeakSelection = () => {
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

    const [generatingVisual, setGeneratingVisual] = useState(false);

    const handleGenerateVisual = async () => {
        setGeneratingVisual(true);
        try {
            const prompt = topic.imagePrompt || topic.topicTitle + " educational illustration";
            const imageUrl = await generateRunwareImage(prompt);
            console.log("Topic Image URL (Manual):", imageUrl);

            if (imageUrl) {
                setTopic(prev => ({
                    ...prev,
                    imageUrl: imageUrl
                }));
            } else {
                alert("Could not generate visual aid. Please try again.");
            }
        } catch (error) {
            alert("Could not generate visual aid. " + error.message);
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

    const generateQuiz = async () => {
        if (!topic?.topicTitle || !subtopics.length) return;
        setQuizLoading(true);
        setQuizAnswers({});
        setQuizResult(null);
        try {
            const res = await API.post('/ai/generate-quiz', {
                topic: topic.topicTitle,
                subtopics
            });
            const data = res.data?.data;
            const questions = data?.questions || [];

            setAiQuiz({ questions });
            setStartTime(Date.now());

            questions.forEach((q, idx) => {
                if (q.questionVisualPrompt) {
                    generateRunwareImage(q.questionVisualPrompt)
                        .then(imageUrl => {
                            console.log(`Quiz Question ${idx} Image URL:`, imageUrl);
                            if (imageUrl) {
                                setAiQuiz(prev => {
                                    if (!prev || !prev.questions) return prev;
                                    const newQuestions = [...prev.questions];
                                    if (newQuestions[idx]) {
                                        newQuestions[idx] = {
                                            ...newQuestions[idx],
                                            questionImageUrl: imageUrl
                                        };
                                    }
                                    return { ...prev, questions: newQuestions };
                                });
                            }
                        })
                        .catch(err => { });
                }
            });

        } catch (error) {
            alert(error.response?.data?.message || 'Failed to generate quiz. Please try again.');
        } finally {
            setQuizLoading(false);
        }
    };

    const submitQuiz = async () => {
        if (!aiQuiz?.questions || !aiQuiz.questions.length) return;

        setSubmitting(true);
        try {
            const questions = aiQuiz.questions;
            const totalQuestions = questions.length;

            const subtopicMap = {};
            questions.forEach((q, idx) => {
                const chosen = quizAnswers[idx];
                const correctIndex = q.correctOptionIndex;
                const sub = q.subtopic || 'General';

                if (!subtopicMap[sub]) {
                    subtopicMap[sub] = { subtopic: sub, correct: 0, total: 0 };
                }
                subtopicMap[sub].total += 1;
                if (chosen === correctIndex) {
                    subtopicMap[sub].correct += 1;
                }
            });

            const timeTakenSeconds = Math.round((Date.now() - startTime) / 1000);

            const payload = {
                topicId,
                subtopicResults: Object.values(subtopicMap),
                timeSpentSeconds: timeTakenSeconds > 0 ? timeTakenSeconds : undefined
            };

            const res = await API.post('/learning/adaptive/submit-quiz', payload);

            if (res.data?.success && res.data?.data) {
                setQuizResult(res.data.data);
                setMode('result');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to submit quiz. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 py-12 px-4" onMouseUp={handleMouseUp}>
            {/* Selection Speech Popup */}
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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        </div>
    );

    if (!topic) return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 py-12 px-4" onMouseUp={handleMouseUp}>
            {/* Selection Speech Popup */}
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
            <div className="text-center text-white">Topic not found</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 py-12 px-4" onMouseUp={handleMouseUp}>
            {/* Selection Speech Popup */}
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

            <div className="max-w-5xl mx-auto space-y-8">
                <div className="relative">
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
                < div className="flex space-x-4 border-b border-gray-700 pb-4" >
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
                </div >

                {/* Layout: Subtopic sidebar + content */}
                {
                    mode === 'learn' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Subtopics Sidebar */}
                            <aside className="md:col-span-1 space-y-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Subtopics</h3>
                                {subtopicsLoading && (
                                    <p className="text-slate-500 text-sm">Generating subtopics...</p>
                                )}
                                {subtopicError && (
                                    <p className="text-amber-400 text-xs">{subtopicError}</p>
                                )}
                                <div className="space-y-2">
                                    {subtopics.map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => {
                                                setSelectedSubtopic(st);
                                                fetchSubtopicLesson(st, topic);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSubtopic === st
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-800/60 text-slate-200 hover:bg-slate-700'
                                                }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                    {!subtopicsLoading && subtopics.length === 0 && (
                                        <p className="text-xs text-slate-500">
                                            No subtopics generated yet.
                                        </p>
                                    )}
                                </div>
                            </aside>

                            {/* Main Learning Panel */}
                            <div className="md:col-span-3 glass-panel p-8 rounded-xl space-y-6">

                                {/* Visual Aid Section - Always show if topic exists */}
                                {true && (
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

                                <div className="space-y-4">
                                    {/* AI Lesson Header / Controls */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                AI-Powered Subtopic Lesson
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                Study each subtopic separately. Content is adapted using your profile.
                                            </p>
                                        </div>
                                        {selectedSubtopic && (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-600">
                                                Current: {selectedSubtopic}
                                            </span>
                                        )}
                                    </div>

                                    {subtopicError && (
                                        <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-4 py-2">
                                            {subtopicError}
                                        </div>
                                    )}

                                    <div className="prose prose-invert max-w-none">
                                        {/* Prefer subtopic lesson when available, else fallback to topic-level content */}
                                        <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-lg">
                                            {subtopicLessonLoading && !subtopicLessons[selectedSubtopic]
                                                ? 'Loading lesson for this subtopic...'
                                                : (
                                                    <>
                                                        {
                                                            (() => {
                                                                const content = (selectedSubtopic && subtopicLessons[selectedSubtopic]?.content) ||
                                                                    topic.content ||
                                                                    topic.normalContent;
                                                                if (!content) return 'Content is loading...';
                                                                return <StructuredContentRenderer content={content} />;
                                                            })()
                                                        }
                                                    </>
                                                )}
                                        </div>

                                        {/* Moved Image Below Content as requested */}
                                        {selectedSubtopic && (
                                            <div className="mt-8">
                                                {subtopicLessons[selectedSubtopic]?.imageLoading && (
                                                    <div className="flex items-center text-slate-400 text-sm animate-pulse">
                                                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Generating Lesson Illustration...
                                                    </div>
                                                )}
                                                {subtopicLessons[selectedSubtopic]?.imageUrl && (
                                                    <div className="rounded-xl overflow-hidden shadow-lg border border-slate-700/50">
                                                        <img
                                                            src={subtopicLessons[selectedSubtopic].imageUrl}
                                                            alt={`${selectedSubtopic} visual`}
                                                            className="w-full h-48 md:h-64 object-cover"
                                                        />
                                                        <p className="text-xs text-slate-500 bg-slate-800 p-2 text-center">AI Generated Visual for {selectedSubtopic}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                        onClick={() => {
                                            setMode('quiz');
                                            if (!aiQuiz) {
                                                generateQuiz();
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center"
                                    >
                                        Start Quiz on Subtopics
                                        <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Quiz Area */}
                {
                    mode === 'quiz' && (
                        <div className="glass-panel p-8 rounded-xl">
                            <h2 className="text-2xl font-bold text-white mb-2">Subtopic Quiz</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Questions cover all subtopics you studied. Your mastery will be updated per subtopic.
                            </p>

                            {quizLoading && (
                                <p className="text-slate-500">Generating quiz...</p>
                            )}

                            {aiQuiz?.questions?.map((q, qIdx) => (
                                <div key={q._id || qIdx} className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-2 gap-4">
                                        <h3 className="text-lg text-white font-medium flex-1">
                                            {qIdx + 1}. {q.questionText}
                                        </h3>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleSpeakQuiz(q)}
                                                disabled={speechLoading}
                                                className={`p-1.5 rounded-lg transition-all ${isSpeaking ? 'bg-indigo-600/50 text-indigo-300' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                                                title="Read question aloud"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                </svg>
                                            </button>
                                            {q.subtopic && (
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-200 border border-slate-500">
                                                    {q.subtopic}
                                                </span>
                                            )}
                                        </div>
                                    </div>



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

                                    {/* Question Image - Moved Below Options */}
                                    <div className="mt-4">
                                        {q.questionVisualPrompt && !q.questionImageUrl && (
                                            <div className="text-xs text-slate-500 animate-pulse flex items-center">
                                                Generating visual context...
                                            </div>
                                        )}
                                        {q.questionImageUrl && (
                                            <div className="rounded-lg overflow-hidden border border-slate-700/50 max-w-md">
                                                <img
                                                    src={q.questionImageUrl}
                                                    alt="Question Visual"
                                                    className="w-full h-auto object-cover"
                                                />
                                            </div>
                                        )}
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
                                        }).catch(e => { });
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
                                    disabled={submitting || (aiQuiz?.questions && Object.keys(quizAnswers).length < aiQuiz.questions.length)}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all ${submitting || (aiQuiz?.questions && Object.keys(quizAnswers).length < aiQuiz.questions.length)
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                                        }`}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                                </button>
                                {(aiQuiz?.questions && Object.keys(quizAnswers).length < aiQuiz.questions.length) && (
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
            </div>
        </div>
    );
};

export default TopicLearning;
