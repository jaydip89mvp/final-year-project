import Progress from '../models/Progress.js';
import Topic from '../models/Topic.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';

// @desc    Get student analytics
// @route   GET /api/analytics/student/:studentId
// @access  Protected
export const getStudentAnalytics = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const requestingUserId = req.userId;

    // Validate access
    if (studentId !== requestingUserId && req.userRole !== 'teacher' && req.userRole !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own analytics.'
      });
    }

    // Get all progress records for this student
    const progressRecords = await Progress.find({ studentId })
      .populate('topicId', 'topicTitle subjectId')
      .populate({
        path: 'topicId',
        populate: { path: 'subjectId', select: 'subjectName' }
      })
      .sort({ lastAttemptDate: -1 });

    // Calculate metrics
    const totalTopics = progressRecords.length;
    const weakTopics = progressRecords.filter(p => p.status === 'weak').length;
    const masteredTopics = progressRecords.filter(p => p.status === 'mastered').length;
    const developingTopics = progressRecords.filter(p => p.status === 'developing').length;

    // Calculate overall progress percentage
    const totalScore = progressRecords.reduce((sum, p) => sum + p.score, 0);
    const averageScore = totalTopics > 0 ? Math.round(totalScore / totalTopics) : 0;

    // Calculate progress percentage (based on mastered topics)
    const progressPercentage = totalTopics > 0
      ? Math.round((masteredTopics / totalTopics) * 100)
      : 0;

    // Get attempt frequency (total attempts)
    const totalAttempts = progressRecords.reduce((sum, p) => sum + p.attempts, 0);

    // Calculate total time spent
    const totalTimeSpentSeconds = progressRecords.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0);

    // Get weak topics details
    const weakTopicsDetails = progressRecords
      .filter(p => p.status === 'weak')
      .map(p => ({
        topicId: p.topicId._id,
        topicTitle: p.topicId.topicTitle,
        subjectName: p.topicId.subjectId?.subjectName,
        score: p.score,
        attempts: p.attempts,
        lastAttemptDate: p.lastAttemptDate
      }));

    // Get mastered topics details
    const masteredTopicsDetails = progressRecords
      .filter(p => p.status === 'mastered')
      .map(p => ({
        topicId: p.topicId._id,
        topicTitle: p.topicId.topicTitle,
        subjectName: p.topicId.subjectId?.subjectName,
        score: p.score,
        attempts: p.attempts,
        lastAttemptDate: p.lastAttemptDate
      }));

    res.status(200).json({
      success: true,
      data: {
        studentId,
        metrics: {
          totalTopics,
          weakTopics,
          masteredTopics,
          developingTopics,
          averageScore,
          progressPercentage,
          totalAttempts,
          timeSpentSeconds: totalTimeSpentSeconds
        },
        weakTopics: weakTopicsDetails,
        masteredTopics: masteredTopicsDetails,
        recentActivity: progressRecords.slice(0, 5).map(p => ({
          _id: p.topicId._id,
          topicTitle: p.topicId.topicTitle,
          subjectName: p.topicId.subjectId?.subjectName,
          score: p.score,
          status: p.status,
          progress: p.score // Map score to progress for dashboard visualization
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher dashboard data
// @route   GET /api/analytics/teacher/:studentId
// @access  Protected (Teacher only)
export const getTeacherDashboardData = async (req, res, next) => {
  try {
    // Check if user is teacher
    if (req.userRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers can access this data.'
      });
    }

    const { studentId } = req.params;

    // Get student info
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student profile
    const profile = await StudentProfile.findOne({ userId: studentId });

    // Get all progress records
    const progressRecords = await Progress.find({ studentId })
      .populate('topicId', 'topicTitle subjectId')
      .populate({
        path: 'topicId',
        populate: { path: 'subjectId', select: 'subjectName' }
      })
      .sort({ lastAttemptDate: -1 });

    // Calculate summary
    const totalTopics = progressRecords.length;
    const weakTopics = progressRecords.filter(p => p.status === 'weak').length;
    const masteredTopics = progressRecords.filter(p => p.status === 'mastered').length;
    const developingTopics = progressRecords.filter(p => p.status === 'developing').length;
    const totalScore = progressRecords.reduce((sum, p) => sum + p.score, 0);
    const averageScore = totalTopics > 0 ? Math.round(totalScore / totalTopics) : 0;
    const progressPercentage = totalTopics > 0
      ? Math.round((masteredTopics / totalTopics) * 100)
      : 0;
    const totalAttempts = progressRecords.reduce((sum, p) => sum + p.attempts, 0);

    // Group by subject
    const subjectGroups = {};
    progressRecords.forEach(progress => {
      const subjectName = progress.topicId?.subjectId?.subjectName || 'Unknown';
      if (!subjectGroups[subjectName]) {
        subjectGroups[subjectName] = {
          subjectName,
          topics: [],
          mastered: 0,
          developing: 0,
          weak: 0
        };
      }
      subjectGroups[subjectName].topics.push({
        topicTitle: progress.topicId?.topicTitle,
        status: progress.status,
        score: progress.score,
        attempts: progress.attempts
      });
      if (progress.status === 'mastered') subjectGroups[subjectName].mastered++;
      if (progress.status === 'developing') subjectGroups[subjectName].developing++;
      if (progress.status === 'weak') subjectGroups[subjectName].weak++;
    });

    res.status(200).json({
      success: true,
      data: {
        student: {
          userId: student._id,
          name: student.name,
          email: student.email,
          profile: profile ? {
            ageGroup: profile.ageGroup,
            educationLevel: profile.educationLevel,
            neuroType: profile.neuroType,
            supportLevel: profile.supportLevel
          } : null
        },
        summary: {
          totalTopics,
          weakTopics,
          masteredTopics,
          developingTopics,
          averageScore,
          progressPercentage,
          totalAttempts,
          timeSpentSeconds: totalTimeSpentSeconds
        },
        bySubject: Object.values(subjectGroups),
        recentActivity: progressRecords.slice(0, 10).map(p => ({
          topicTitle: p.topicId?.topicTitle,
          subjectName: p.topicId?.subjectId?.subjectName,
          status: p.status,
          score: p.score,
          lastAttemptDate: p.lastAttemptDate
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
