import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProfileCreate = () => {
    const navigate = useNavigate();
    const { user, updateUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        ageGroup: '13-15',
        educationLevel: 'High School',
        learningComfort: 'Medium',
        neuroType: 'general',
        supportLevel: 'medium'
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await API.post('/profile/create', {
                userId: user.id || user._id,
                ...formData
            });

            // Update local user context if needed, or just redirect
            updateUserProfile({ profileId: res.data.profileId });

            navigate('/');
        } catch (error) {
            console.error("Profile creation failed", error);
            // Handle error (show toast/alert)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white font-display">Let's Personalize Your Experience</h1>
                <p className="mt-2 text-slate-400">
                    We adapt content to your unique learning style. All methods are private and secure.
                </p>
            </div>

            <div className="glass-panel shadow sm:rounded-lg p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Education Level */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Current Education Level
                        </label>
                        <select
                            name="educationLevel"
                            value={formData.educationLevel}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700/50 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="Middle School">Middle School</option>
                            <option value="High School">High School</option>
                            <option value="Undergraduate">Undergraduate</option>
                            <option value="Graduate">Graduate</option>
                        </select>
                    </div>

                    {/* Age Group */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Age Group
                        </label>
                        <select
                            name="ageGroup"
                            value={formData.ageGroup}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700/50 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="10-12">10-12 years</option>
                            <option value="13-15">13-15 years</option>
                            <option value="16-18">16-18 years</option>
                            <option value="19+">19+ years</option>
                        </select>
                    </div>

                    {/* NeuroType Selection */}
                    <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/20">
                        <label className="block text-base font-medium text-white mb-2">
                            Learning Preference / Neurodiversity
                        </label>
                        <p className="text-xs text-slate-400 mb-4">
                            Selecting this helps us format text, contrast, and interactivity to suit you best.
                        </p>
                        <div className="space-y-3">
                            {[
                                { val: 'general', label: 'General / No Specific Preference', desc: 'Standard layout and pacing.' },
                                { val: 'dyslexia', label: 'Dyslexia Friendly', desc: 'High contrast, specialized fonts, simplified text structures.' },
                                { val: 'adhd', label: 'ADHD Friendly', desc: 'Broken down content, gamified elements, focused view.' },
                                { val: 'autism', label: 'Autism Friendly', desc: 'Clear instructions, minimal distractions, predictable layout.' }
                            ].map((type) => (
                                <div key={type.val} className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id={`neuro-${type.val}`}
                                            name="neuroType"
                                            type="radio"
                                            value={type.val}
                                            checked={formData.neuroType === type.val}
                                            onChange={handleChange}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-300"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor={`neuro-${type.val}`} className="font-medium text-white">
                                            {type.label}
                                        </label>
                                        <p className="text-slate-400">{type.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Level */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            How much guidance do you prefer?
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Low', 'Medium', 'High'].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, supportLevel: level.toLowerCase() })}
                                    className={`
                                        py-2 px-4 rounded-md text-sm font-medium transition-all
                                        ${formData.supportLevel === level.toLowerCase()
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                                    `}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            {formData.supportLevel === 'low' && 'We will provide minimal hints and harder challenges.'}
                            {formData.supportLevel === 'medium' && 'Balanced guidance with adaptive hints.'}
                            {formData.supportLevel === 'high' && 'Step-by-step guidance and simplified explanations.'}
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Creating Profile...' : 'Complete Setup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCreate;
