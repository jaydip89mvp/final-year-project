import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

const ReadingRuler = () => {
    const { preferences } = useAccessibility();
    const [position, setPosition] = useState({ y: 0 });

    useEffect(() => {
        if (!preferences.readingRuler) return;

        const handleMouseMove = (e) => {
            setPosition({ y: e.clientY });
        };

        const handleTouchMove = (e) => {
            if (e.touches[0]) {
                setPosition({ y: e.touches[0].clientY });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [preferences.readingRuler]);

    if (!preferences.readingRuler) return null;

    return (
        <div
            className="fixed left-0 right-0 h-10 bg-indigo-500/20 border-y-2 border-indigo-400/50 pointer-events-none z-[8888] shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-opacity duration-300"
            style={{
                top: `${position.y - 20}px`,
                mixBlendMode: 'multiply'
            }}
        >
            <div className="absolute top-1/2 left-4 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        </div>
    );
};

export default ReadingRuler;
