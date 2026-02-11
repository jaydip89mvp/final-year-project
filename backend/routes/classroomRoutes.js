import express from 'express';
import {
    createClassroom,
    joinClassroom,
    getMyClassrooms,
    getClassroomDetails,
    createPost,
    getClassroomPosts,
    deletePost,
    addComment
} from '../controllers/classroomController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ... existing routes ...

// @route   POST /api/classrooms/:id/posts
// @desc    Create a post in a classroom
// @access  Protected
router.post('/:id/posts', authenticate, createPost);

// @route   GET /api/classrooms/:id/posts
// @desc    Get all posts for a classroom
// @access  Protected
router.get('/:id/posts', authenticate, getClassroomPosts);

// @route   DELETE /api/classrooms/posts/:postId
// @desc    Delete a post
// @access  Protected
router.delete('/posts/:postId', authenticate, deletePost);

// @route   POST /api/classrooms/posts/:postId/comments
// @desc    Add a comment
// @access  Protected
router.post('/posts/:postId/comments', authenticate, addComment);

// @route   POST /api/classrooms/create
// @desc    Create a new classroom (Teachers only)
// @access  Protected
router.post('/create', authenticate, createClassroom);

// @route   POST /api/classrooms/join
// @desc    Join a classroom via Code (Students only)
// @access  Protected
router.post('/join', authenticate, joinClassroom);

// @route   GET /api/classrooms
// @desc    Get user's classrooms (Teachers see their classes, students see what they joined)
// @access  Protected
router.get('/', authenticate, getMyClassrooms);

// @route   GET /api/classrooms/:id
// @desc    Get classroom details + roster
// @access  Protected
router.get('/:id', authenticate, getClassroomDetails);

export default router;
