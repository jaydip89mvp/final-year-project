import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

const AccessibilityMenu = () => {
    const { preferences, updatePreference } = useAccessibility();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-indigo-600 shadow-2xl rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition-all transform hover:scale-110 active:scale-95"
                title="Accessibility Settings"
            >
                {isOpen ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m10 0a2 2 0 100 4m0-4a2 2 0 110 4M6 20h12M6 4h12" />
                    </svg>
                )}
            </button>

            {/* Menu Panel */}
            {isOpen && (
                <div className={`absolute bottom-16 right-0 w-80 border shadow-2xl rounded-2xl p-6 animate-in slide-in-from-bottom-4 fade-in duration-200 ${preferences.theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : preferences.theme === 'cream'
                        ? 'bg-[#fcfaf2] border-[#e6e3b0] text-[#1a1a1a]'
                        : 'bg-[#f0f7ff] border-[#c3dafe] text-[#102a43]'
                    }`}>
                    <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 ${preferences.theme === 'dark' ? 'text-white' : 'text-current'
                        }`}>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m10 0a2 2 0 100 4m0-4a2 2 0 110 4M6 20h12M6 4h12" />
                            </svg>
                        </div>
                        Reading Settings
                    </h3>

                    <div className="space-y-8">
                        {/* Font Family */}
                        <div>
                            <label className={`text-sm font-semibold block mb-3 ${preferences.theme === 'dark' ? 'text-slate-400' : 'opacity-80'
                                }`}>Reading Font</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => updatePreference('fontFamily', 'default')}
                                    className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all ${preferences.fontFamily === 'default'
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : preferences.theme === 'dark'
                                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                                        }`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => updatePreference('fontFamily', 'opendyslexic')}
                                    className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all ${preferences.fontFamily === 'opendyslexic'
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : preferences.theme === 'dark'
                                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                                        }`}
                                    style={{ fontFamily: 'OpenDyslexic, sans-serif' }}
                                >
                                    Dyslexic
                                </button>
                            </div>
                        </div>

                        {/* Theme */}
                        <div>
                            <label className={`text-sm font-semibold block mb-3 ${preferences.theme === 'dark' ? 'text-slate-400' : 'opacity-80'
                                }`}>Display Theme</label>
                            <div className="flex gap-4">
                                {[
                                    { id: 'dark', color: 'bg-slate-900', label: 'Dark' },
                                    { id: 'cream', color: 'bg-[#fffdd0]', label: 'Cream' },
                                    { id: 'blue-tint', color: 'bg-[#ebf4ff]', label: 'Blue' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => updatePreference('theme', t.id)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center theme-picker-btn ${t.color} ${preferences.theme === t.id
                                            ? 'border-indigo-500 scale-115 ring-4 ring-indigo-500/20'
                                            : 'border-transparent hover:scale-105'
                                            }`}
                                        title={t.label}
                                    >
                                        {preferences.theme === t.id && (
                                            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Line Height & Spacing */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className={`text-xs font-semibold ${preferences.theme === 'dark' ? 'text-slate-400' : 'opacity-80'
                                        }`}>Line Spacing</label>
                                    <span className="text-indigo-500 font-bold text-xs">{preferences.lineHeight}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="1.2"
                                    max="2.5"
                                    step="0.1"
                                    value={preferences.lineHeight}
                                    onChange={(e) => updatePreference('lineHeight', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className={`text-xs font-semibold ${preferences.theme === 'dark' ? 'text-slate-400' : 'opacity-80'
                                    }`}>Wide Letter Spacing</label>
                                <button
                                    onClick={() => updatePreference('letterSpacing', preferences.letterSpacing === 'wide' ? 'normal' : 'wide')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${preferences.letterSpacing === 'wide' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${preferences.letterSpacing === 'wide' ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Reading Tools */}
                        <div className={`pt-6 border-t ${preferences.theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-bold ${preferences.theme === 'dark' ? 'text-white' : 'text-current'}`}>Reading Ruler</span>
                                <button
                                    onClick={() => updatePreference('readingRuler', !preferences.readingRuler)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${preferences.readingRuler ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${preferences.readingRuler ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${preferences.theme === 'dark' ? 'text-white' : 'text-current'}`}>Focus Mode</span>
                                    <span className="text-[10px] opacity-60">Hides distractions</span>
                                </div>
                                <button
                                    onClick={() => updatePreference('focusMode', !preferences.focusMode)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${preferences.focusMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${preferences.focusMode ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <span className={`text-sm font-bold ${preferences.theme === 'dark' ? 'text-white' : 'text-current'}`}>High Contrast</span>
                                <button
                                    onClick={() => updatePreference('highContrast', !preferences.highContrast)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${preferences.highContrast ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${preferences.highContrast ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <span className={`text-sm font-bold ${preferences.theme === 'dark' ? 'text-white' : 'text-current'}`}>Monochrome Mode</span>
                                <button
                                    onClick={() => updatePreference('monochrome', !preferences.monochrome)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${preferences.monochrome ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${preferences.monochrome ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessibilityMenu;
