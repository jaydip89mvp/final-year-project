import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import Draggable from 'react-draggable';

const AICompanion = () => {
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [showText, setShowText] = useState(false);

    const recognitionRef = useRef(null);
    const dragRef = useRef(null);

    useEffect(() => {
        // Initialize SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleSendToAI(text);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setTranscript('');
            setResponseMessage('');
            setShowText(true);
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error("Couldn't start recognition", e);
                alert("Microphone access is required for the AI Companion.");
            }
        }
    };

    const handleSendToAI = async (text) => {
        setIsThinking(true);
        try {
            const res = await API.post('/ai/companion-chat', {
                message: text,
                context: window.location.pathname // Simple context based on current URL pattern
            });
            const reply = res.data?.data?.reply;
            setResponseMessage(reply);
            speakResponse(reply);
        } catch (error) {
            console.error("AI Companion Error:", error);
            setResponseMessage("I'm sorry, I'm having trouble connecting right now.");
            speakResponse("I'm sorry, I'm having trouble connecting right now.");
        } finally {
            setIsThinking(false);
        }
    };

    const speakResponse = (text) => {
        if (!text) return;
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.name.includes('Zira') ||
            v.name.includes('Samantha') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Hazel') ||
            v.name.includes('Susan') ||
            v.name.includes('Female')
        ) || voices.find(v => v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 0.95; // Slightly slower
        utterance.pitch = 1.1; // Slightly higher/friendly

        utterance.onend = () => {
            setIsSpeaking(false);
            setTimeout(() => {
                setShowText(false);
            }, 6000);
        };

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }, []);

    return (
        <Draggable nodeRef={dragRef} bounds="body" cancel=".no-drag">
            <div ref={dragRef} className="fixed bottom-6 left-6 z-[990] flex flex-col items-start gap-4 pointer-events-none cursor-grab active:cursor-grabbing">
                {/* Context Bubble */}
                {showText && (transcript || responseMessage || isThinking) && (
                    <div className="bg-slate-800/95 backdrop-blur-md border border-indigo-500/30 p-4 rounded-2xl rounded-bl-sm shadow-2xl max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300 no-drag cursor-default">
                    {transcript && (
                        <p className="text-sm font-medium text-slate-300 mb-2 pb-2 border-b border-white/10">
                            <span className="text-indigo-400">You:</span> "{transcript}"
                        </p>
                    )}
                    {isThinking && (
                        <div className="flex items-center gap-2 text-indigo-300 py-1">
                            <span className="animate-pulse">●</span>
                            <span className="animate-pulse delay-75">●</span>
                            <span className="animate-pulse delay-150">●</span>
                        </div>
                    )}
                    {responseMessage && !isThinking && (
                        <p className="text-base text-white leading-relaxed">
                            {responseMessage}
                        </p>
                    )}
                </div>
            )}

            {/* AI Avatar Button */}
            <button
                onClick={toggleListening}
                className="relative group pointer-events-auto transition-transform hover:scale-105 active:scale-95 mt-4 cursor-grab active:cursor-grabbing"
                title="Talk to AI Companion (Drag to move)"
            >
                {/* Glow Effect behind the circle */}
                <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
                    isSpeaking ? 'bg-indigo-400 animate-pulse scale-110 opacity-80' : 
                    isListening ? 'bg-rose-400 animate-ping scale-110 opacity-60' : 
                    isThinking ? 'bg-cyan-400 animate-spin scale-105 opacity-70' :
                    'bg-indigo-400/50 group-hover:bg-indigo-500/60 scale-100 opacity-60'
                }`} />
                
                {/* Fixed Round Shape Container */}
                <div className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center bg-white shadow-2xl transition-all duration-500 overflow-hidden ${
                    isListening ? 'ring-4 ring-rose-400/80 scale-105' : 
                    isSpeaking ? 'ring-4 ring-indigo-400/80 scale-105' :
                    isThinking ? 'ring-4 ring-cyan-400/80' :
                    'ring-2 ring-indigo-200 group-hover:ring-indigo-400/50'
                }`}>
                    {/* The Mascot Image (fills the circle) */}
                    <img 
                        src="/ai_mascot2.png" 
                        alt="AI Tutor" 
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                            isListening ? 'scale-110' : 
                            isSpeaking ? 'animate-[bounce_2s_infinite]' : 
                            'hover:scale-110'
                        }`} 
                    />
                    
                    {/* Microphone Overlay when Listening */}
                    {isListening && (
                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-12 h-12 text-rose-600 animate-pulse drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                    )}
                </div>
            </button>
            </div>
        </Draggable>
    );
};

export default AICompanion;
