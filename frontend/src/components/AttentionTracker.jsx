import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const AttentionTracker = ({ onFocusLost }) => {
    const videoRef = useRef(null);
    const { preferences } = useAccessibility();
    const [isTracking, setIsTracking] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [focusScore, setFocusScore] = useState(100);
    const [isCalming, setIsCalming] = useState(false);
    const [stream, setStream] = useState(null);
    
    // Use ref to avoid closure staleness in setInterval
    const isCalmingRef = useRef(isCalming);
    useEffect(() => { isCalmingRef.current = isCalming; }, [isCalming]);

    // Load ML Models
    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Face-API Model load error", err);
            }
        };
        loadModels();
    }, []);

    // Initialize Webcam
    const startWebcam = async () => {
        if (!modelsLoaded) {
            alert("Please wait for the AI models to finish loading securely.");
            return;
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(mediaStream);
            setIsTracking(true);
        } catch (err) {
            console.error("Webcam access denied or unavailable", err);
            alert("Please allow webcam access to use the Attention Tracker feature.");
        }
    };

    // Attach stream once video element mounts
    useEffect(() => {
        if (isTracking && videoRef.current && stream && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
        }
    }, [isTracking, stream]);

    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsTracking(false);
    };

    // Tracking Loop (True ML)
    useEffect(() => {
        let interval;
        if (isTracking && modelsLoaded && videoRef.current) {
            interval = setInterval(async () => {
                if (isCalmingRef.current) return;
                if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

                try {
                    const detection = await faceapi.detectSingleFace(
                        videoRef.current, 
                        new faceapi.TinyFaceDetectorOptions({ inputSize: 128 })
                    ).withFaceLandmarks();

                    console.log("[Focus AI] Detection result:", detection ? "Face Found" : "No Face");

                    setFocusScore(prev => {
                        let newScore = prev;

                        if (!detection) {
                            // Penalty for no face detected (wandering off)
                            newScore = Math.max(0, prev - 15);
                            console.log("[Focus AI] Penalty: No Face. Score:", newScore);
                        } else {
                            // Calculate Head Pose (Yaw) using accurate landmarks
                            const landmarks = detection.landmarks;
                            const noseTip = landmarks.getNose()[3]; // Tip of the nose
                            const leftEye = landmarks.getLeftEye();
                            const rightEye = landmarks.getRightEye();
                            
                            const leftEyeCenter = (leftEye[0].x + leftEye[3].x) / 2;
                            const rightEyeCenter = (rightEye[0].x + rightEye[3].x) / 2;
                            
                            const leftDistance = Math.abs(noseTip.x - leftEyeCenter);
                            const rightDistance = Math.abs(noseTip.x - rightEyeCenter);
                            
                            // Ratio indicates turning head left or right
                            let ratio = 1;
                            if (leftDistance > 0 && rightDistance > 0) {
                                 ratio = Math.max(leftDistance, rightDistance) / Math.min(leftDistance, rightDistance);
                            }

                            console.log(`[Focus AI] Pose Ratio: ${ratio.toFixed(2)} (L: ${leftDistance.toFixed(0)}, R: ${rightDistance.toFixed(0)})`);

                            // Threshold 2.0 is roughly when the nose tip crosses the inner corner of the eye
                            if (ratio > 2.0) {
                                // Penalty for looking away
                                newScore = Math.max(0, prev - 15);
                                console.log("[Focus AI] Penalty: Looking Away. Score:", newScore);
                            } else {
                                // Recover focus if looking at screen
                                newScore = Math.min(100, prev + 10);
                            }
                        }

                        // Trigger Intervention exactly once when it dips below 40
                        if (newScore < 40 && !isCalmingRef.current) {
                            triggerIntervention();
                            return 100; // Reset
                        }
                        return newScore;
                    });
                } catch (err) {
                    console.error("[Focus AI] FaceAPI Error during detection:", err);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking, modelsLoaded, isCalming]);

    const triggerIntervention = () => {
        setIsCalming(true);
        if (onFocusLost) onFocusLost();
        
        // 10-second breathing intervention
        setTimeout(() => {
            setIsCalming(false);
            setFocusScore(100);
        }, 10000);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [stream]);

    if (!preferences.trackingEnabled && !isTracking) {
         return (
             <div className="fixed bottom-24 right-6 z-[990]">
                 <button 
                    onClick={startWebcam}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 transition-all font-semibold"
                 >
                     {modelsLoaded ? (
                         <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                     ) : (
                         <svg className="w-5 h-5 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                     )}
                     {modelsLoaded ? 'Enable Focus AI' : 'Loading ML...'}
                 </button>
             </div>
         );
    }

    const getGlowColor = () => {
        if (focusScore > 70) return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]';
        if (focusScore > 40) return 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]';
        return 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]';
    };

    return (
        <>
            <div className="fixed bottom-24 right-6 z-[990] flex flex-col items-center gap-2 group animate-in slide-in-from-bottom-8 duration-500">
                <div className={`relative p-1 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-2xl overflow-hidden transition-all duration-300 ring-2 ${focusScore > 70 ? 'ring-emerald-500/50' : focusScore > 40 ? 'ring-amber-500/50' : 'ring-rose-500/80 animate-pulse'}`}>
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline
                        width="128"
                        height="96"
                        className="w-32 h-24 object-cover rounded-xl opacity-80"
                    />
                    
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md">
                        <div className={`w-2 h-2 rounded-full ${focusScore > 70 ? 'bg-emerald-400' : focusScore > 40 ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
                        <span className="text-[10px] font-bold text-white tracking-wider">
                            {Math.round(focusScore)}%
                        </span>
                    </div>

                    <button 
                        onClick={stopWebcam}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <span className="text-white text-xs font-bold ring-1 ring-white/50 px-3 py-1 rounded-full">Stop AI</span>
                    </button>
                </div>
                <div className="flex flex-col items-center w-full">
                     <span className={`text-xs font-bold uppercase tracking-widest ${getGlowColor()} transition-colors duration-500`}>
                         {focusScore > 70 ? 'Highly Focused' : focusScore > 40 ? 'Slight Distraction' : 'Focus Dropping'}
                     </span>
                     <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                         <div 
                             className="h-full bg-indigo-500 transition-all duration-500"
                             style={{ width: `${focusScore}%` }}
                         />
                     </div>
                </div>
            </div>

            {isCalming && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-1000">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
                    
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-xl text-center">
                        Let's re-center our focus.
                    </h2>
                    <p className="text-slate-300 text-lg mb-12 max-w-md text-center">
                        We noticed your attention wandered. Take a deep breath with the circle.
                    </p>

                    <div className="relative flex items-center justify-center w-64 h-64">
                         <div className="absolute w-full h-full bg-indigo-600/20 rounded-full animate-ping shadow-[0_0_40px_rgba(99,102,241,0.5)]" style={{ animationDuration: '4s' }} />
                         <div className="absolute w-48 h-48 bg-indigo-500/40 rounded-full animate-ping shadow-[0_0_60px_rgba(99,102,241,0.6)]" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
                         <div className="relative z-10 w-32 h-32 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-full shadow-2xl flex items-center justify-center ring-4 ring-white/20">
                             <svg className="w-12 h-12 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                         </div>
                    </div>
                    
                    <button 
                        onClick={() => { setIsCalming(false); setFocusScore(100); }} 
                        className="mt-16 px-6 py-3 bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white rounded-full transition-all font-medium backdrop-blur-md"
                    >
                        I'm ready to learn
                    </button>
                </div>
            )}
        </>
    );
};

export default AttentionTracker;
