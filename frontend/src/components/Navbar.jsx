import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'text-white font-bold' : 'text-slate-400 hover:text-white transition-colors';
    };

    // Helper to get user ID safely
    const getUserId = () => user?.id || user?._id || user?.userId;

    return (
        <nav className="border-b border-white/10 glass-panel sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                AdaptiveLearn
                            </span>
                        </Link>
                        {isAuthenticated && (
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}>
                                        Dashboard
                                    </Link>

                                    {user?.role === 'teacher' ? (
                                        <>
                                            <Link to="/teacher/classrooms" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/teacher/classrooms')}`}>
                                                My Classrooms
                                            </Link>
                                            <Link to="/teacher/subjects" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/teacher/subjects')}`}>
                                                Manage Subjects
                                            </Link>
                                            <Link to="/teacher/students" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/teacher/students')}`}>
                                                Student Progress
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/subjects" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/subjects')}`}>
                                                Subjects
                                            </Link>
                                            <Link to={`/analytics/${getUserId()}`} className={`px-3 py-2 rounded-md text-sm font-medium ${isActive(`/analytics/${getUserId()}`)}`}>
                                                Analytics
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {isAuthenticated ? (
                                <div className="flex items-center gap-4">
                                    <Link to={`/profile/${getUserId()}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{user?.name}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden glass-panel border-t border-white/10">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700">Dashboard</Link>

                                {user?.role === 'teacher' ? (
                                    <>
                                        <Link to="/teacher/subjects" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Manage Subjects</Link>
                                        <Link to="/teacher/students" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Student Progress</Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/subjects" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Subjects</Link>
                                        <Link to={`/analytics/${getUserId()}`} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-700">Analytics</Link>
                                    </>
                                )}

                                <div className="border-t border-slate-700 pt-4 pb-3">
                                    <div className="flex items-center px-5">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium leading-none text-white">{user?.name}</div>
                                            <div className="text-sm font-medium leading-none text-slate-400 mt-1">{user?.email}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 px-2 space-y-1">
                                        <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-white hover:bg-slate-700">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2 p-4">
                                <Link to="/login" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-slate-700 hover:bg-slate-800">
                                    Login
                                </Link>
                                <Link to="/register" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
