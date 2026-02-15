import Classroom from '../models/Classroom.js';
import ClassroomPost from '../models/ClassroomPost.js';
import User from '../models/User.js';

import Notification from '../models/Notification.js';
import crypto from 'crypto';

// ... (existing imports)

// @desc    Create a post (notice/material)
// @route   POST /api/classroom/:id/posts
// @access  Protected (Teacher only)
export const createPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, type } = req.body;

        const classroom = await Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ success: false, message: 'Classroom not found' });
        }

        // Only teacher of the class can post
        if (classroom.teacherId.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Only the instructor can post content' });
        }

        // Handle attachments
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map(file => ({
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                mimeType: file.mimetype
            }));
        }

        const post = await ClassroomPost.create({
            classroomId: id,
            authorId: req.userId,
            title,
            content,
            type: type || 'notice',
            attachments
        });

        // Create notifications for all students
        const notifications = classroom.students.map(studentId => ({
            userId: studentId,
            message: `New ${type || 'post'} in ${classroom.name}: ${title || 'No Title'}`,
            type: 'post',
            link: `/classroom/${id}`
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Populate author info for immediate display
        await post.populate('authorId', 'name role');

        res.status(201).json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all posts for a classroom
// @route   GET /api/classroom/:id/posts
// @access  Protected (Members only)
export const getClassroomPosts = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify membership first
        const classroom = await Classroom.findById(id);
        if (!classroom) {
            return res.status(404).json({ success: false, message: 'Classroom not found' });
        }

        const isMember = classroom.teacherId.toString() === req.userId ||
            classroom.students.includes(req.userId);

        if (!isMember && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this classroom' });
        }

        const posts = await ClassroomPost.find({ classroomId: id })
            .populate('authorId', 'name role')
            .populate('comments.authorId', 'name role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a post
// @route   DELETE /api/classroom/posts/:postId
// @access  Protected (Teacher only)
export const deletePost = async (req, res, next) => {
    try {
        const { postId } = req.params;

        const post = await ClassroomPost.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const classroom = await Classroom.findById(post.classroomId);

        // Only teacher of the class can delete
        if (classroom.teacherId.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a comment to a post
// @route   POST /api/classroom/posts/:postId/comments
// @access  Protected (Members only)
export const addComment = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        const post = await ClassroomPost.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Verify membership (optional double check, but safer)
        const classroom = await Classroom.findById(post.classroomId);
        const isMember = classroom.teacherId.toString() === req.userId ||
            classroom.students.includes(req.userId);

        if (!isMember) {
            return res.status(403).json({ success: false, message: 'Not authorized to comment' });
        }

        const newComment = {
            authorId: req.userId,
            content,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        // Populate the last comment's author to return it
        await post.populate('comments.authorId', 'name role');
        const addedComment = post.comments[post.comments.length - 1];

        res.status(201).json({
            success: true,
            data: addedComment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new classroom
// @route   POST /api/classrooms/create
// @access  Protected (Teacher only)
export const createClassroom = async (req, res, next) => {
    try {
        if (req.userRole !== 'teacher') {
            return res.status(403).json({ success: false, message: 'Only teachers can create classrooms' });
        }

        const { name, subject, description } = req.body;

        let joinCode;
        let isUnique = false;

        // Generate a simple unique 6-char code
        while (!isUnique) {
            joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            const existing = await Classroom.findOne({ joinCode });
            if (!existing) isUnique = true;
        }

        const classroom = await Classroom.create({
            name,
            subject,
            description,
            teacherId: req.userId,
            joinCode
        });

        res.status(201).json({
            success: true,
            data: classroom
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Join a classroom as a student
// @route   POST /api/classrooms/join
// @access  Protected (Student only)
export const joinClassroom = async (req, res, next) => {
    try {
        if (req.userRole !== 'student') {
            return res.status(403).json({ success: false, message: 'Only students can join classrooms' });
        }

        const { joinCode } = req.body;
        if (!joinCode) {
            return res.status(400).json({ success: false, message: 'Join code is required' });
        }

        const classroom = await Classroom.findOne({ joinCode: joinCode.toUpperCase() });
        if (!classroom) {
            return res.status(404).json({ success: false, message: 'Classroom not found' });
        }

        // Check if already in class
        if (classroom.students.includes(req.userId)) {
            return res.status(400).json({ success: false, message: 'You are already in this classroom' });
        }

        classroom.students.push(req.userId);
        await classroom.save();

        res.status(200).json({
            success: true,
            message: `Successfully joined ${classroom.name}`,
            data: classroom
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get classrooms for current user
// @route   GET /api/classrooms/my-classes
// @access  Protected
export const getMyClassrooms = async (req, res, next) => {
    try {
        let query;
        if (req.userRole === 'teacher') {
            query = { teacherId: req.userId };
        } else {
            query = { students: req.userId };
        }

        const classrooms = await Classroom.find(query)
            .populate('teacherId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: classrooms
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get details of a specific classroom (roster, etc)
// @route   GET /api/classrooms/:id
// @access  Protected
export const getClassroomDetails = async (req, res, next) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate('teacherId', 'name email')
            .populate('students', 'name email role'); // Basic student info

        if (!classroom) {
            return res.status(404).json({ success: false, message: 'Classroom not found' });
        }

        // Security check: Only members can view
        const isMember = classroom.teacherId._id.toString() === req.userId ||
            classroom.students.some(s => s._id.toString() === req.userId);

        if (!isMember && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this classroom' });
        }

        res.status(200).json({
            success: true,
            data: classroom
        });
    } catch (error) {
        next(error);
    }
};
