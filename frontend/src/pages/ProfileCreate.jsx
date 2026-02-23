import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProfileCreate = () => {
    const navigate = useNavigate();
    const { user, updateUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        ageGroup: '13-15',
        educationLevel: 'High School',
        learningComfort: 'Medium',
        neuroType: 'general',
        supportLevel: 'medium'
    });

    useEffect(() => {
        const fetchSuggestedTrait = async () => {
            try {
                const res = await API.get('/profile/me');
                if (res.data.success && res.data.data.suggestedNeuroType) {
                    setFormData(prev => ({
                        ...prev,
                        neuroType: res.data.data.suggestedNeuroType
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch suggested trait", err);
            }
        };
        fetchSuggestedTrait();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleNeuroSelect = (val) => {
        setFormData(prev => ({ ...prev, neuroType: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await API.post('/profile/create', {
                userId: user.id || user._id,
                ...formData
            });

            // Update local user context if needed
            updateUserProfile({ profileId: res.data.profileId });

            navigate('/dashboard');
        } catch (error) {
            console.error("Profile creation failed", error);
            // In a real app, I'd show a toast here
        } finally {
            setIsLoading(false);
        }
    };

    const neuroTypes = [
        { val: 'general', label: 'General Learner', desc: 'Standard layout and pacing.', icon: '🎓' },
        { val: 'dyslexia', label: 'Dyslexia Friendly', desc: 'High contrast, specialized fonts, simplified text.', icon: '📖' },
        { val: 'adhd', label: 'ADHD Friendly', desc: 'Broken down content, gamified elements, focused view.', icon: '⚡' },
        { val: 'autism', label: 'Autism Friendly', desc: 'Clear instructions, minimal distractions, predictable layout.', icon: '🧩' }
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            <div className="text-center mb-12">
                <div className="inline-block p-3 rounded-full bg-indigo-500/10 mb-4 ring-1 ring-indigo-500/20">
                    <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-white font-display mb-3">Customize Your Learning Journey</h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    We use AI to adapt content to your unique learning style. Tell us a bit about how you learn best.
                </p>
            </div>

            <div className="glass-panel shadow-2xl sm:rounded-2xl p-8 border border-white/5 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <form onSubmit={handleSubmit} className="space-y-10 relative z-10">

                    {/* Section 1: Basics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wider">
                                Current Education Level
                            </label>
                            <div className="relative">
                                <select
                                    name="educationLevel"
                                    value={formData.educationLevel}
                                    onChange={handleChange}
                                    className="block w-full pl-4 pr-10 py-3 border border-slate-600 rounded-xl shadow-sm bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition-all hover:bg-slate-800"
                                >
                                    <option value="Middle School">Middle School</option>
                                    <option value="High School">High School</option>
                                    <option value="Undergraduate">Undergraduate</option>
                                    <option value="Graduate">Graduate</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wider">
                                Age Group
                            </label>
                            <div className="relative">
                                <select
                                    name="ageGroup"
                                    value={formData.ageGroup}
                                    onChange={handleChange}
                                    className="block w-full pl-4 pr-10 py-3 border border-slate-600 rounded-xl shadow-sm bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition-all hover:bg-slate-800"
                                >
                                    <option value="10-12">10-12 years</option>
                                    <option value="13-15">13-15 years</option>
                                    <option value="16-18">16-18 years</option>
                                    <option value="19+">19+ years</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: NeuroType Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-indigo-300 mb-4 uppercase tracking-wider">
                            Learning Preference / Neurodiversity
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {neuroTypes.map((type) => (
                                <div
                                    key={type.val}
                                    onClick={() => handleNeuroSelect(type.val)}
                                    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${formData.neuroType === type.val
                                        ? 'border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-500/20'
                                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <div className="flex items-start">
                                        <span className="text-3xl mr-4 group-hover:scale-110 transition-transform">{type.icon}</span>
                                        <div>
                                            <h3 className={`font-bold text-lg mb-1 ${formData.neuroType === type.val ? 'text-white' : 'text-slate-200'}`}>
                                                {type.label}
                                            </h3>
                                            <p className="text-sm text-slate-400 leading-snug">
                                                {type.desc}
                                            </p>
                                        </div>
                                        {formData.neuroType === type.val && (
                                            <div className="absolute top-4 right-4">
                                                <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Support Level */}
                    <div>
                        <label className="block text-sm font-semibold text-indigo-300 mb-4 uppercase tracking-wider">
                            Preferred Guidance Level
                        </label>
                        <div className="bg-slate-900/50 p-1 rounded-xl flex">
                            {['Low', 'Medium', 'High'].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, supportLevel: level.toLowerCase() })}
                                    className={`
                                        flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200
                                        ${formData.supportLevel === level.toLowerCase()
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                                    `}
                                >
                                    {level} Guidance
                                </button>
                            ))}
                        </div>
                        <div className="mt-3 text-center">
                            <p className="text-sm text-indigo-200/80 italic">
                                {formData.supportLevel === 'low' && 'For independent learners who enjoy figuring things out with minimal help.'}
                                {formData.supportLevel === 'medium' && 'Balanced approach with hints available when you need them.'}
                                {formData.supportLevel === 'high' && 'More structure, step-by-step breakdowns, and frequent checks.'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Setting up profile...
                                </span>
                            ) : 'Complete Setup & Start Learning'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCreate;
