import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('accessibility_prefs');
        return saved ? JSON.parse(saved) : {
            fontFamily: 'default', // 'default', 'opendyslexic'
            fontSize: 'medium', // 'small', 'medium', 'large'
            lineHeight: 1.5,
            letterSpacing: 'normal',
            theme: 'dark', // 'dark', 'cream', 'blue-tint'
            readingRuler: false,
            focusMode: false,
            highContrast: false,
            monochrome: false
        };
    });

    useEffect(() => {
        localStorage.setItem('accessibility_prefs', JSON.stringify(preferences));

        // Apply global classes to body
        const body = document.body;

        // Font
        body.classList.remove('font-opendyslexic');
        if (preferences.fontFamily === 'opendyslexic') body.classList.add('font-opendyslexic');

        // Theme
        body.classList.remove('theme-cream', 'theme-blue-tint');
        if (preferences.theme === 'cream') body.classList.add('theme-cream');
        if (preferences.theme === 'blue-tint') body.classList.add('theme-blue-tint');

        // Focus Mode
        if (preferences.focusMode) {
            body.classList.add('theme-focus-mode');
        } else {
            body.classList.remove('theme-focus-mode');
        }

        // High Contrast & Monochrome
        if (preferences.highContrast) body.classList.add('theme-high-contrast');
        else body.classList.remove('theme-high-contrast');

        if (preferences.monochrome) body.classList.add('theme-monochrome');
        else body.classList.remove('theme-monochrome');

        // Spacing/Size
        body.style.lineHeight = preferences.lineHeight;
        body.style.letterSpacing = preferences.letterSpacing === 'wide' ? '0.1em' : 'normal';
        body.style.fontSize = preferences.fontSize === 'large' ? '1.1rem' : preferences.fontSize === 'small' ? '0.9rem' : '1rem';

    }, [preferences]);

    const updatePreference = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    return (
        <AccessibilityContext.Provider value={{ preferences, updatePreference }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};
