import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ClassroomView = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [classroom, setClassroom] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState({ title: '', content: '', type: 'notice' });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isPosting, setIsPosting] = useState(false);
    const [commentContent, setCommentContent] = useState({}); // Map of postId -> comment

    const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [classRes, postsRes] = await Promise.all([
                    API.get(`/classroom/${id}`),
                    API.get(`/classroom/${id}/posts`)
                ]);
                setClassroom(classRes.data.data);
                setPosts(postsRes.data.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch classroom data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.content.trim() && selectedFiles.length === 0) return;
        setIsPosting(true);

        try {
            const formData = new FormData();
            formData.append('title', newPost.title);
            formData.append('content', newPost.content);
            formData.append('type', newPost.type);

            for (let i = 0; i < selectedFiles.length; i++) {
                formData.append('files', selectedFiles[i]);
            }

            const res = await API.post(`/classroom/${id}/posts`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setPosts([res.data.data, ...posts]);
            setNewPost({ title: '', content: '', type: 'notice' });
            setSelectedFiles([]);
        } catch (error) {
            console.error("Failed to create post", error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await API.delete(`/classroom/posts/${postId}`);
            setPosts(posts.filter(p => p._id !== postId));
        } catch (error) {
            console.error("Failed to delete post", error);
        }
    };

    const handleAddComment = async (e, postId) => {
        e.preventDefault();
        const content = commentContent[postId];
        if (!content?.trim()) return;

        try {
            const res = await API.post(`/classroom/posts/${postId}/comments`, { content });
            // Update comments for this post
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    return { ...post, comments: [...post.comments, res.data.data] };
                }
                return post;
            }));
            setCommentContent({ ...commentContent, [postId]: '' });
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!classroom) return (
        <div className="max-w-4xl mx-auto mt-8 p-8 glass-panel rounded-xl text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Classroom Not Found</h2>
            <p className="text-slate-400 mb-6">The classroom you are looking for does not exist or you do not have permission to view it.</p>
            <Link to="/dashboard" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                Return to Dashboard
            </Link>
        </div>
    );

    const currentUserId = user?._id || user?.id || user?.userId;
    const teacherId = classroom?.teacherId?._id || classroom?.teacherId;
    const isTeacher = currentUserId && teacherId && currentUserId.toString() === teacherId.toString();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            {/* Classroom Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 p-8 shadow-xl">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white mb-3 tracking-wide uppercase">
                                {classroom.subject}
                            </span>
                            <h1 className="text-3xl font-bold text-white font-display mb-2">{classroom.name}</h1>
                            <p className="text-indigo-100 max-w-2xl">{classroom.description}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center">
                            <span className="block text-xs text-indigo-200 uppercase tracking-widest mb-1">Instructor</span>
                            <span className="block text-white font-bold">{classroom.teacherId?.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Create Post Widget (Teacher Only) */}
                    {isTeacher && (
                        <div className="glass-panel p-6 rounded-xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Post Announcement</h3>
                            <form onSubmit={handleCreatePost} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Title (Optional)"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={newPost.title}
                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                />
                                <textarea
                                    placeholder="Share something with your class..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                                    value={newPost.content}
                                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                />

                                {/* File Upload */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 cursor-pointer rounded-lg text-sm text-slate-300 transition-colors border border-slate-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span>Attach Files</span>
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    {selectedFiles.length > 0 && (
                                        <span className="text-sm text-emerald-400">
                                            {selectedFiles.length} file(s) selected
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewPost({ ...newPost, type: 'notice' })}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${newPost.type === 'notice' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                                        >
                                            Notice
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewPost({ ...newPost, type: 'material' })}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${newPost.type === 'material' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                                        >
                                            Material
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isPosting || !newPost.content}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isPosting ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Posts List */}
                    <div className="space-y-6">
                        {posts.length === 0 ? (
                            <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-slate-700/50">
                                <p className="text-slate-400">No posts yet.</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <div key={post._id} className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                                    {post.authorId?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{post.authorId?.name}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${post.type === 'notice' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-emerald-900/40 text-emerald-400'
                                                            }`}>
                                                            {post.type}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                            {isTeacher && (
                                                <button
                                                    onClick={() => handleDeletePost(post._id)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {post.title && <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>}
                                        <div className="text-slate-300 whitespace-pre-wrap mb-4">{post.content}</div>

                                        {/* Attachments */}
                                        {post.attachments && post.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {post.attachments.map((file, i) => {
                                                    const isRemote = file.path.startsWith('http');
                                                    // For local files, normalize slashes and ensure it points to /uploads
                                                    // file.path for diskStorage is usually 'uploads\filename.ext'
                                                    const localPath = file.path.replace(/\\/g, '/');
                                                    // If path already starts with uploads/, remove it to avoid duplication when we append
                                                    const cleanPath = localPath.startsWith('uploads/')
                                                        ? localPath
                                                        : `uploads/${localPath}`;

                                                    const fileUrl = isRemote
                                                        ? file.path
                                                        : `${FILE_BASE_URL}/${cleanPath.replace(/^uploads\/uploads\//, 'uploads/')}`;

                                                    return (
                                                        <a
                                                            key={i}
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span className="truncate max-w-[200px]">{file.originalName}</span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Comments Section */}
                                        <div className="bg-slate-900/30 rounded-lg p-4 space-y-4">
                                            {post.comments?.length > 0 && (
                                                <div className="space-y-3">
                                                    {post.comments.map((comment, idx) => (
                                                        <div key={idx} className="flex gap-3 text-sm">
                                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] text-white">
                                                                {comment.authorId?.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-300 mr-2">{comment.authorId?.name}</span>
                                                                <span className="text-slate-400">{comment.content}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Write a comment..."
                                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                    value={commentContent[post._id] || ''}
                                                    onChange={(e) => setCommentContent({ ...commentContent, [post._id]: e.target.value })}
                                                />
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-4">Class Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Subject</label>
                                <p className="text-white font-medium">{classroom.subject}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Join Code</label>
                                <p className="text-indigo-400 font-mono font-bold text-lg select-all">{classroom.joinCode}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Members</label>
                                <p className="text-white font-medium">{classroom.students.length} Students</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassroomView;
