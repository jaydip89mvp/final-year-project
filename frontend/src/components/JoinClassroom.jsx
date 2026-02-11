import { useState } from 'react';
import API from '../api/axios';

const JoinClassroom = ({ onJoinSuccess }) => {
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const res = await API.post('/classroom/join', { joinCode });
            setMessage(res.data.message);
            setJoinCode('');
            if (onJoinSuccess) onJoinSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join classroom');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel shadow-lg rounded-xl overflow-hidden border border-white/5 mb-8">
            <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-indigo-900/40 to-purple-900/40">
                <h3 className="text-lg leading-6 font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Join Classroom
                </h3>
            </div>
            <div className="p-6">
                <p className="text-slate-400 text-sm mb-4">
                    Enter the 6-character code provided by your teacher to join their class.
                </p>
                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Enter Code (e.g. X7Y2Z9)"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent tracking-widest uppercase font-mono text-center text-lg"
                            maxLength={6}
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-500/20 text-center">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="text-green-400 text-xs bg-green-900/20 p-2 rounded border border-green-500/20 text-center">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !joinCode}
                        className={`w-full py-2.5 rounded-lg font-bold text-white transition-all ${loading || !joinCode
                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25'
                            }`}
                    >
                        {loading ? 'Joining...' : 'Join Class'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinClassroom;
