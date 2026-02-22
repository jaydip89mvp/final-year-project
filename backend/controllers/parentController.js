import ParentLink from '../models/ParentLink.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Progress from '../models/Progress.js';

/**
 * Link a student to a parent using student's email.
 */
export const linkStudent = async (req, res, next) => {
    try {
        const { studentEmail } = req.body;
        const parentId = req.userId;

        if (!studentEmail) {
            return res.status(400).json({ success: false, message: 'Student email is required' });
        }

        const student = await User.findOne({ email: studentEmail, role: 'student' });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found with this email' });
        }

        // Check if already linked
        const existingLink = await ParentLink.findOne({ parentId, studentId: student._id });
        if (existingLink) {
            return res.status(400).json({ success: false, message: 'This student is already linked to your account' });
        }

        const link = await ParentLink.create({
            parentId,
            studentId: student._id
        });

        res.status(201).json({
            success: true,
            message: 'Student linked successfully',
            data: link
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all linked students with basic progress stats.
 */
export const getLinkedStudents = async (req, res, next) => {
    try {
        const parentId = req.userId;
        const links = await ParentLink.find({ parentId }).populate('studentId', 'name email');

        const studentData = await Promise.all(links.map(async (link) => {
            const studentId = link.studentId._id;
            const profile = await StudentProfile.findOne({ userId: studentId });

            // Get aggregate stats
            const progress = await Progress.find({ studentId });
            const totalTopics = progress.length;
            const mastered = progress.filter(p => p.status === 'mastered').length;

            return {
                _id: studentId,
                name: link.studentId.name,
                email: link.studentId.email,
                level: profile?.level || 1,
                xp: profile?.xp || 0,
                badges: profile?.badges || [],
                stats: {
                    totalTopics,
                    mastered,
                    masteryPercentage: totalTopics > 0 ? Math.round((mastered / totalTopics) * 100) : 0
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: studentData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get detailed progress for a specific linked student.
 */
export const getStudentDetail = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const parentId = req.userId;

        // Verify link
        const link = await ParentLink.findOne({ parentId, studentId });
        if (!link) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this student' });
        }

        const profile = await StudentProfile.findOne({ userId: studentId }).populate('userId', 'name email');
        const progress = await Progress.find({ studentId }).populate('topicId', 'topicTitle');

        res.status(200).json({
            success: true,
            data: {
                profile,
                progress
            }
        });
    } catch (error) {
        next(error);
    }
};
