import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

const ProfileView = () => {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get(`/profile/${userId}`);
                setProfile(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch profile", error);

                // Mock data
                setProfile({
                    name: 'Ashutosh',
                    email: 'ashutosh@example.com',
                    role: 'Student',
                    ageGroup: '19+',
                    educationLevel: 'Undergraduate',
                    neuroType: 'general',
                    supportLevel: 'medium',
                    learningComfort: 'High'
                });
                setLoading(false);
            }
        };

        if (userId) fetchProfile();
    }, [userId]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto">
            <div className="glass-panel overflow-hidden rounded-lg shadow">
                <div className="px-4 py-5 sm:px-6 bg-slate-800/50">
                    <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg leading-6 font-medium text-white">{profile.name}</h3>
                            <p className="mt-1 text-sm text-slate-400">{profile.email} • {profile.role}</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-700 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-slate-700">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-400">Age Group</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.ageGroup}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-400">Education Level</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.educationLevel}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-400">Learning Type</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                                    {profile.neuroType}
                                </span>
                            </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-400">Support Level</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 capitalize">{profile.supportLevel}</dd>
                        </div>
                    </dl>
                </div>
                <div className="px-4 py-4 sm:px-6 bg-slate-800/20 text-right">
                    <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                        Edit Profile Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
