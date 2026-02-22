import express from 'express';
import { linkStudent, getLinkedStudents, getStudentDetail } from '../controllers/parentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require parent role
router.use(authenticate);
router.use(authorize('parent'));

// @route   POST /api/parent/link
// @desc    Link a student to parent account
router.post('/link', linkStudent);

// @route   GET /api/parent/students
// @desc    Get all linked students
router.get('/students', getLinkedStudents);

// @route   GET /api/parent/student/:studentId
// @desc    Get detailed student progress
router.get('/student/:studentId', getStudentDetail);

export default router;
