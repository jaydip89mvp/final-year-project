import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProfileView = () => {
    const { userId } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Determine if we need to fetch 'me' or a specific ID
                const targetId = userId && userId !== 'undefined' ? userId : user?.userId || user?._id;

                if (!targetId) {
                    setLoading(false);
                    return;
                }

                const res = await API.get(`/profile/${targetId}`);
                if (res.data.success) {
                    setProfile({
                        ...res.data.data,
                        // Flatten nested user details if populated
                        name: res.data.data.userId?.name || res.data.data.name,
                        email: res.data.data.userId?.email || res.data.data.email,
                        role: res.data.data.userId?.role || res.data.data.role
                    });
                }
                setLoading(false);
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error("Failed to fetch profile", error);
                }
                setError(error.response?.status === 404 ? "Profile not found" : "Error loading profile");

                // Fallback: If looking at own profile but it doesn't exist in DB yet
                const targetId = userId && userId !== 'undefined' ? userId : user?.userId || user?._id;
                const currentUserId = user?.userId || user?._id || user?.id;

                if (targetId === currentUserId) {
                    setProfile({
                        name: user?.name,
                        email: user?.email,
                        role: user?.role,
                        isFallback: true // Flag to show "Create Profile" button
                    });
                }

                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, user]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!profile) return (
        <div className="text-center py-12">
            <h2 className="text-xl text-white mb-4">Profile not found.</h2>
            {/* Show create link only if it's potentially the logged in user looking for their own profile */}
            <Link to="/profile/create" className="text-indigo-400 hover:text-indigo-300">
                Create a profile now &rarr;
            </Link>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="glass-panel overflow-hidden rounded-lg shadow">
                <div className="px-4 py-5 sm:px-6 bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/30">
                                {profile.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg leading-6 font-medium text-white">{profile.name}</h3>
                                <p className="mt-1 text-sm text-slate-400">{profile.email} • <span className="capitalize">{profile.role}</span></p>
                            </div>
                        </div>
                        {profile.isFallback && (
                            <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-1 rounded border border-amber-500/20">
                                Profile Incomplete
                            </span>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-700 px-4 py-5 sm:p-0">
                    {profile.isFallback ? (
                        <div className="p-6 text-center">
                            <p className="text-slate-300 mb-4">You haven't set up your learning profile yet.</p>
                            <Link to="/profile/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                Complete Learning Profile
                            </Link>
                        </div>
                    ) : (
                        <dl className="sm:divide-y sm:divide-slate-700">
                            {/* Only show these for students or if data exists */}
                            {(profile.role === 'student' || profile.ageGroup) && (
                                <>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-slate-400">Age Group</dt>
                                        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.ageGroup || 'Not specified'}</dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-slate-400">Education Level</dt>
                                        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.educationLevel || 'Not specified'}</dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-slate-400">Learning Type</dt>
                                        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100/10 text-indigo-300 border border-indigo-500/20 capitalize">
                                                {profile.neuroType || 'General'}
                                            </span>
                                        </dd>
                                    </div>
                                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                        <dt className="text-sm font-medium text-slate-400">Support Level</dt>
                                        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 capitalize">{profile.supportLevel || 'Medium'}</dd>
                                    </div>
                                </>
                            )}
                        </dl>
                    )}
                </div>

                {!profile.isFallback && (
                    <div className="px-4 py-4 sm:px-6 bg-slate-800/20 text-right border-t border-slate-700">
                        <Link to="/profile/edit" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Profile Details
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileView;
