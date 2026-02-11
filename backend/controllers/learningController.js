import Quiz from '../models/Quiz.js';
import Progress from '../models/Progress.js';
import Topic from '../models/Topic.js';
import LearningEvent from '../models/LearningEvent.js';

// @desc    Submit quiz and evaluate performance
// @route   POST /api/learning/submit-quiz
// @access  Protected
export const submitQuiz = async (req, res, next) => {
  try {
    const { topicId, answers, timeSpentSeconds, hintsUsed, contentMode } = req.body; // answers is array of selected option indices
    const studentId = req.userId;

    if (!topicId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide topicId and answers array'
      });
    }

    // Find quiz for this topic
    const quiz = await Quiz.findOne({ topicId });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found for this topic'
      });
    }

    // Validate answers array length matches questions length
    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Number of answers must match number of questions'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctOptionIndex) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    // Rule-based evaluation
    let status;
    if (score >= 80) {
      status = 'mastered';
    } else if (score >= 50) {
      status = 'developing';
    } else {
      status = 'weak';
    }

    // Update or create Progress record
    const progress = await Progress.findOneAndUpdate(
      { studentId, topicId },
      {
        score,
        status,
        $inc: { attempts: 1 },
        lastAttemptDate: new Date()
      },
      { new: true, upsert: true }
    );

    // Get subjectId from topic (we need to fetch it separately or populate)
    const topic = await Topic.findById(topicId);

    // Log Learning Event
    await LearningEvent.create({
      studentId,
      subjectId: topic ? topic.subjectId : null,
      topicId,
      eventType: 'quiz_attempt',
      score,
      totalQuestions: quiz.questions.length,
      timeSpentSeconds: timeSpentSeconds || 0,
      hintsUsed: hintsUsed || 0,
      contentMode: contentMode || 'text',
      attemptNumber: progress.attempts, // attempts is already incremented by findOneAndUpdate
      completed: true,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        score,
        status,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        attempts: progress.attempts,
        progressId: progress._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get adaptive roadmap for student
// @route   GET /api/learning/roadmap/:studentId/:subjectId
// @access  Protected
export const getRoadmap = async (req, res, next) => {
  try {
    const { studentId, subjectId } = req.params;
    const requestingUserId = req.userId;

    // Validate access: student can view own roadmap, teacher/parent can view any
    if (studentId !== requestingUserId && req.userRole !== 'teacher' && req.userRole !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own roadmap.'
      });
    }

    // Get all topics for this subject
    const topics = await Topic.find({ subjectId }).sort({ createdAt: 1 });

    // Get all progress records for this student and subject topics
    const topicIds = topics.map(t => t._id);
    const progressRecords = await Progress.find({
      studentId,
      topicId: { $in: topicIds }
    });

    // Create progress map for quick lookup
    const progressMap = new Map();
    progressRecords.forEach(record => {
      progressMap.set(record.topicId.toString(), record);
    });

    // Build roadmap with lock/unlock logic
    const roadmap = topics.map((topic, index) => {
      const progress = progressMap.get(topic._id.toString());
      const status = progress ? progress.status : null;
      const score = progress ? progress.score : null;

      // Determine if topic is locked
      let isLocked = false;
      let lockReason = null;

      if (index === 0) {
        // First topic is always unlocked
        isLocked = false;
      } else if (progress && progress.status === 'weak') {
        // Topic with weak status is locked
        isLocked = true;
        lockReason = 'Previous attempt was weak. Master previous topics to unlock.';
      } else {
        // Check if previous topic is mastered
        const previousTopic = topics[index - 1];
        const previousProgress = progressMap.get(previousTopic._id.toString());

        if (!previousProgress || previousProgress.status !== 'mastered') {
          isLocked = true;
          lockReason = 'Previous topic must be mastered to unlock this topic.';
        }
      }

      return {
        topicId: topic._id,
        topicTitle: topic.topicTitle,
        difficultyLevel: topic.difficultyLevel,
        status: status || 'not-attempted',
        score: score || null,
        attempts: progress ? progress.attempts : 0,
        isLocked,
        lockReason,
        lastAttemptDate: progress ? progress.lastAttemptDate : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        subjectId,
        studentId,
        roadmap,
        summary: {
          totalTopics: topics.length,
          mastered: roadmap.filter(t => t.status === 'mastered').length,
          developing: roadmap.filter(t => t.status === 'developing').length,
          weak: roadmap.filter(t => t.status === 'weak').length,
          notAttempted: roadmap.filter(t => t.status === 'not-attempted').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a learning event (lesson view, hint, mode switch, etc)
// @route   POST /api/learning/event
// @access  Protected
export const logLearningEvent = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const {
      topicId,
      eventType,
      timeSpentSeconds,
      hintsUsed,
      contentMode,
      details
    } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    // Optional: Validate topicId if provided
    let subjectId = null;
    if (topicId) {
      const topic = await Topic.findById(topicId);
      if (topic) {
        subjectId = topic.subjectId;
      }
    }

    const event = await LearningEvent.create({
      studentId,
      subjectId,
      topicId,
      eventType,
      timeSpentSeconds: timeSpentSeconds || 0,
      hintsUsed: hintsUsed || 0,
      contentMode: contentMode || 'text',
      completed: eventType === 'early_exit' ? false : true, // Context dependent
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Event logged successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};
