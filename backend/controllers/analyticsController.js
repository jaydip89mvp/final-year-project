import Progress from '../models/Progress.js';
import RoadmapProgress from '../models/RoadmapProgress.js';
import Roadmap, { NODE_KEY_DELIM } from '../models/Roadmap.js';
import LearningEvent from '../models/LearningEvent.js';
import Topic from '../models/Topic.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Classroom from '../models/Classroom.js';

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

    // 1. Get dedicated topic progress records (with activity)
    const progressRecords = await Progress.find({
      studentId,
      attempts: { $gt: 0 }
    })
      .populate('topicId', 'topicTitle subjectId')
      .populate({
        path: 'topicId',
        populate: { path: 'subjectId', select: 'subjectName' }
      })
      .sort({ lastAttemptDate: -1 });

    // 2. Get hierarchical roadmap progress records
    const roadmapProgressRecords = await RoadmapProgress.find({ studentId });

    // Fetch unique subjects involved in roadmap progress for name mapping
    const subjectIdsFromRoadmap = [...new Set(roadmapProgressRecords.map(rp => rp.nodeKey.split(NODE_KEY_DELIM)[0]))];
    const subjects = await Subject.find({ _id: { $in: subjectIdsFromRoadmap } }, 'subjectName');
    const subjectMap = subjects.reduce((map, s) => ({ ...map, [s._id.toString()]: s.subjectName }), {});

    // Flatten roadmap progress into a unified format for analytics
    const roadmapTopics = [];
    roadmapProgressRecords.forEach(rp => {
      const subjectId = rp.nodeKey.split(NODE_KEY_DELIM)[0];
      const subjectName = subjectMap[subjectId] || 'Roadmap';

      rp.childrenProgress.forEach(child => {
        if (child.attempts > 0) {
          roadmapTopics.push({
            _id: rp._id,
            topicTitle: child.name,
            subjectName: subjectName,
            score: child.total > 0 ? Math.round((child.correct / child.total) * 100) : 0,
            status: child.status,
            attempts: child.attempts,
            timeSpentSeconds: child.timeSpentSeconds,
            lastAttemptDate: child.lastAttempt || rp.updatedAt || new Date(),
            isRoadmap: true
          });
        }
      });
    });

    // 3. Combine both sources for aggregate metrics
    const allActivity = [
      ...progressRecords.map(p => ({
        _id: p._id,
        topicTitle: p.topicId?.topicTitle || 'Unknown',
        subjectName: p.topicId?.subjectId?.subjectName || 'Unknown',
        score: p.score,
        status: p.status,
        attempts: p.attempts,
        timeSpentSeconds: p.timeSpentSeconds || 0,
        lastAttemptDate: p.lastAttemptDate
      })),
      ...roadmapTopics
    ];

    // Normalize status so every row belongs to exactly one mastery bucket.
    // This guarantees mastery counts and breakdown row counts are computed from the same set.
    const normalizedActivity = allActivity.map((p) => {
      const rawStatus = String(p.status || '').toLowerCase();
      let normalizedStatus = rawStatus;

      if (!['mastered', 'developing', 'weak'].includes(rawStatus)) {
        const score = Number(p.score) || 0;
        normalizedStatus = score >= 80 ? 'mastered' : score >= 50 ? 'developing' : 'weak';
      }

      return {
        ...p,
        status: normalizedStatus
      };
    });

    const topicBreakdown = normalizedActivity
      .map((p) => ({
        _id: p._id,
        topicTitle: p.topicTitle || 'Unknown Topic',
        subjectName: p.subjectName || 'Unknown Subject',
        score: p.score ?? 0,
        status: p.status || 'not_attempted',
        attempts: p.attempts ?? 0,
        timeSpentSeconds: p.timeSpentSeconds ?? 0,
        lastAttemptDate: p.lastAttemptDate || null
      }))
      .sort((a, b) => new Date(b.lastAttemptDate || 0) - new Date(a.lastAttemptDate || 0));

    // Calculate metrics using combined activity
    const totalTopics = normalizedActivity.length;
    const weakTopics = normalizedActivity.filter(p => p.status === 'weak').length;
    const masteredTopics = normalizedActivity.filter(p => p.status === 'mastered').length;
    const developingTopics = normalizedActivity.filter(p => p.status === 'developing').length;

    // Calculate overall progress percentage
    const totalScore = normalizedActivity.reduce((sum, p) => sum + p.score, 0);
    const averageScore = totalTopics > 0 ? Math.round(totalScore / totalTopics) : 0;

    // Calculate progress percentage (based on mastered topics)
    const progressPercentage = totalTopics > 0
      ? Math.round((masteredTopics / totalTopics) * 100)
      : 0;

    // Get attempt frequency (total attempts)
    const totalAttempts = normalizedActivity.reduce((sum, p) => sum + (p.attempts || 0), 0);

    // Calculate total time spent (combined)
    const totalTimeSpentSeconds = normalizedActivity.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0);

    // Get weak topics details
    const weakTopicsDetails = normalizedActivity
      .filter(p => p.status === 'weak')
      .map(p => ({
        topicTitle: p.topicTitle,
        subjectName: p.subjectName,
        score: p.score,
        attempts: p.attempts,
        lastAttemptDate: p.lastAttemptDate
      }));

    // Get mastered topics details
    const masteredTopicsDetails = normalizedActivity
      .filter(p => p.status === 'mastered')
      .map(p => ({
        topicTitle: p.topicTitle,
        subjectName: p.subjectName,
        score: p.score,
        attempts: p.attempts,
        lastAttemptDate: p.lastAttemptDate
      }));

    // --- Advanced Analytics: Activity Over Time (Last 30 Days for streak) ---
    // Use LearningEvent for accurate daily activity tracking
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const learningEvents = await LearningEvent.find({
      studentId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 });

    // Group events by date (counting unique topics/lessons)
    const activityMap = {};
    const uniqueActivity = {}; // Track unique topicId/details per day

    // Initialize last 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      activityMap[dStr] = 0;
      uniqueActivity[dStr] = new Set();
    }

    learningEvents.forEach(event => {
      const dateStr = new Date(event.timestamp).toISOString().split('T')[0];
      if (activityMap[dateStr] !== undefined) {
        // Count significant learning actions as "activity"
        if (['quiz_attempt', 'subtopic_quiz_attempt', 'lesson_view', 'subtopic_view'].includes(event.eventType)) {
          // Identify the unique unit (Topic ID or Roadmap Node Name)
          const unitId = event.topicId
            ? event.topicId.toString()
            : (event.details?.nodeName || event.details?.topic || 'unknown');

          if (!uniqueActivity[dateStr].has(unitId)) {
            uniqueActivity[dateStr].add(unitId);
            activityMap[dateStr] += 1;
          }
        }
      }
    });

    // Calculate Current Streak
    let currentStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Start checking from today, if no activity today, check if yesterday had activity (streak still alive)
    let streakDate = activityMap[todayStr] > 0 ? new Date() : (activityMap[yesterdayStr] > 0 ? yesterday : null);

    if (streakDate) {
      let checkDate = new Date(streakDate);
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (activityMap[checkStr] > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const activityOverTime = Object.keys(activityMap).sort().slice(-7).map(date => ({
      date,
      topicsPracticed: activityMap[date]
    }));

    const studentProfile = await StudentProfile.findOne({ userId: studentId }).populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: {
        studentId,
        profile: studentProfile,
        metrics: {
          totalTopics,
          weakTopics,
          masteredTopics,
          developingTopics,
          averageScore,
          progressPercentage,
          totalAttempts,
          timeSpentSeconds: totalTimeSpentSeconds,
          currentStreak // Added streak to metrics
        },
        weakTopics: weakTopicsDetails,
        masteredTopics: masteredTopicsDetails,
        topicBreakdown,
        activityOverTime,
        recentActivity: normalizedActivity
          .sort((a, b) => new Date(b.lastAttemptDate || 0) - new Date(a.lastAttemptDate || 0))
          .slice(0, 5)
          .map(p => ({
            _id: p._id,
            topicTitle: p.topicTitle || 'Unknown Topic',
            subjectName: p.subjectName || 'Unknown Subject',
            score: p.score,
            status: p.status,
            progress: p.score,
            lastAttemptDate: p.lastAttemptDate
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

    // 1. Get dedicated topic progress records
    const progressRecords = await Progress.find({ studentId })
      .populate('topicId', 'topicTitle subjectId')
      .populate({
        path: 'topicId',
        populate: { path: 'subjectId', select: 'subjectName' }
      })
      .sort({ lastAttemptDate: -1 });

    // 2. Get hierarchical roadmap progress records
    const roadmapProgressRecords = await RoadmapProgress.find({ studentId });

    // Fetch unique subjects involved in roadmap progress
    const subjectIdsFromRoadmap = [...new Set(roadmapProgressRecords.map(rp => rp.nodeKey.split(NODE_KEY_DELIM)[0]))];
    const subjects = await Subject.find({ _id: { $in: subjectIdsFromRoadmap } }, 'subjectName');
    const subjectMap = subjects.reduce((map, s) => ({ ...map, [s._id.toString()]: s.subjectName }), {});

    // Flatten roadmap progress
    const roadmapTopics = [];
    roadmapProgressRecords.forEach(rp => {
      const subjectId = rp.nodeKey.split(NODE_KEY_DELIM)[0];
      const subjectName = subjectMap[subjectId] || 'Roadmap';
      rp.childrenProgress.forEach(child => {
        if (child.attempts > 0) {
          roadmapTopics.push({
            topicTitle: child.name,
            subjectName: subjectName,
            status: child.status,
            score: child.total > 0 ? Math.round((child.correct / child.total) * 100) : 0,
            attempts: child.attempts,
            timeSpentSeconds: child.timeSpentSeconds,
            lastAttemptDate: child.lastAttempt || rp.updatedAt || new Date()
          });
        }
      });
    });

    // 3. Combine both sources
    const allActivity = [
      ...progressRecords.map(p => ({
        topicTitle: p.topicId?.topicTitle || 'Unknown',
        subjectName: p.topicId?.subjectId?.subjectName || 'Unknown',
        status: p.status,
        score: p.score,
        attempts: p.attempts,
        timeSpentSeconds: p.timeSpentSeconds || 0,
        lastAttemptDate: p.lastAttemptDate
      })),
      ...roadmapTopics
    ];

    // Calculate summary
    const totalTopics = allActivity.length;
    const weakTopics = allActivity.filter(p => p.status === 'weak').length;
    const masteredTopics = allActivity.filter(p => p.status === 'mastered').length;
    const developingTopics = allActivity.filter(p => p.status === 'developing').length;
    const totalScore = allActivity.reduce((sum, p) => sum + p.score, 0);
    const averageScore = totalTopics > 0 ? Math.round(totalScore / totalTopics) : 0;
    const progressPercentage = totalTopics > 0
      ? Math.round((masteredTopics / totalTopics) * 100)
      : 0;
    const totalAttempts = allActivity.reduce((sum, p) => sum + (p.attempts || 0), 0);
    const totalTimeSpentSeconds = allActivity.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0);

    // Group by subject (for teacher drill-down)
    const subjectGroups = {};
    allActivity.forEach(progress => {
      const subjectName = progress.subjectName;
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
        topicTitle: progress.topicTitle,
        status: progress.status,
        score: progress.score,
        attempts: progress.attempts,
        timeSpentSeconds: progress.timeSpentSeconds
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
        recentActivity: allActivity
          .sort((a, b) => new Date(b.lastAttemptDate || 0) - new Date(a.lastAttemptDate || 0))
          .slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get struggle alerts for teacher's classrooms
// @route   GET /api/analytics/teacher/alerts
// @access  Protected (Teacher only)
export const getTeacherAlerts = async (req, res, next) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers can access alerts.'
      });
    }

    const teacherId = req.userId;
    const classrooms = await Classroom.find({ teacherId }).populate('students', 'name email');

    const alerts = [];

    for (const classroom of classrooms) {
      for (const student of classroom.students) {
        // Fetch progress for this student
        const progress = await Progress.find({ studentId: student._id });

        // Alert: High Weak Ratio (Struggling student)
        const weakTopics = progress.filter(p => p.status === 'weak');
        if (weakTopics.length >= 2) {
          alerts.push({
            studentId: student._id,
            studentName: student.name,
            classroomName: classroom.name,
            type: 'struggle',
            message: `${student.name} is struggling with ${weakTopics.length} topics.`,
            severity: weakTopics.length >= 4 ? 'high' : 'medium',
            details: weakTopics.map(t => t.topicId) // Just IDs
          });
        }

        // Alert: High time spent without mastery (Stuck student)
        const stuckTopics = progress.filter(p => p.status !== 'mastered' && (p.timeSpentSeconds || 0) > 3600); // 1 hour
        if (stuckTopics.length > 0) {
          alerts.push({
            studentId: student._id,
            studentName: student.name,
            classroomName: classroom.name,
            type: 'stuck',
            message: `${student.name} has spent considerable time without mastering topics.`,
            severity: 'medium'
          });
        }

        // Alert: Inactivity
        const lastActivity = progress.length > 0
          ? Math.max(...progress.map(p => new Date(p.lastAttemptDate || 0).getTime()))
          : 0;

        if (lastActivity > 0) {
          const daysInactive = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
          if (daysInactive > 7) {
            alerts.push({
              studentId: student._id,
              studentName: student.name,
              classroomName: classroom.name,
              type: 'inactive',
              message: `${student.name} has been inactive for ${Math.floor(daysInactive)} days.`,
              severity: 'low'
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: alerts.sort((a, b) => {
        const severityMap = { 'high': 0, 'medium': 1, 'low': 2 };
        return severityMap[a.severity] - severityMap[b.severity];
      })
    });
  } catch (error) {
    next(error);
  }
};
