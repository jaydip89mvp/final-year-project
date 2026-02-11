import { useState, useEffect } from 'react';
import API from '../api/axios';

const StudentProgress = () => {
    // Basic placeholder for now
    return (
        <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-6">Student Activity & Progress</h1>
            <p className="text-slate-400">Track how your students are engaging with the material.</p>

            <div className="glass-panel p-8 text-center rounded-xl border border-white/5 bg-slate-800/20">
                <svg className="mx-auto h-12 w-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-white">No data available yet</h3>
                <p className="mt-1 text-sm text-slate-400">Once students start completing topics, their metrics will appear here.</p>
            </div>
        </div>
    );
};

export default StudentProgress;
