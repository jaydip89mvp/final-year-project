import express from 'express';
import { getStudentAnalytics, getTeacherDashboardData } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// @route   GET /api/analytics/student/:studentId
// @desc    Get student analytics
// @access  Protected
router.get('/student/:studentId', getStudentAnalytics);

// @route   GET /api/analytics/teacher/:studentId
// @desc    Get teacher dashboard data
// @access  Protected (Teacher only)
router.get('/teacher/:studentId', getTeacherDashboardData);

export default router;
