import Quiz from '../models/Quiz.js';
import Progress from '../models/Progress.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import SubjectProgress from '../models/SubjectProgress.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapProgress from '../models/RoadmapProgress.js';
import LearningEvent from '../models/LearningEvent.js';
import groqClient from '../config/groqClient.js';

const GROQ_MODEL = "llama-3.3-70b-versatile";
const MASTERY_EXCELLED = 0.8;

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
    const updateData = {
      score,
      status,
      $inc: { attempts: 1 },
      lastAttemptDate: new Date()
    };

    // Add timeSpentSeconds if provided
    if (timeSpentSeconds && timeSpentSeconds > 0) {
      updateData.$inc.timeSpentSeconds = timeSpentSeconds;
    }

    const progress = await Progress.findOneAndUpdate(
      { studentId, topicId },
      updateData,
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
      attemptNumber: progress.attempts, 
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

// @desc    Adaptive quiz submission at subtopic level
// @route   POST /api/learning/adaptive/submit-quiz
// @access  Protected
export const submitAdaptiveQuiz = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { topicId, subtopicResults, timeSpentSeconds } = req.body;

    if (!topicId || !Array.isArray(subtopicResults) || subtopicResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'topicId and subtopicResults are required'
      });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Load or create Progress for this topic
    let progress = await Progress.findOne({ studentId, topicId });
    if (!progress) {
      progress = await Progress.create({
        studentId,
        topicId,
        score: 0,
        status: 'weak',
        attempts: 0,
        timeSpentSeconds: 0,
        subtopics: []
      });
    }

    const subtopicMap = new Map();
    (progress.subtopics || []).forEach(s => {
      subtopicMap.set(s.name, s);
    });

    let totalCorrect = 0;
    let totalQuestions = 0;

    subtopicResults.forEach(result => {
      const name = String(result.subtopic || result.name || '').trim();
      const correct = Number(result.correct || 0);
      const total = Number(result.total || 0);
      if (!name || total <= 0) return;

      totalCorrect += correct;
      totalQuestions += total;

      const prev = subtopicMap.get(name) || {
        name,
        masteryScore: 0,
        correct: 0,
        total: 0,
        lastAttempt: null
      };

      const previousMastery = prev.masteryScore || 0;
      const currentScore = Math.max(0, Math.min(1, correct / total));
      const newMastery = (previousMastery * 0.7) + (currentScore * 0.3);

      const updated = {
        ...prev,
        masteryScore: newMastery,
        correct: prev.correct + correct,
        total: prev.total + total,
        lastAttempt: new Date()
      };

      subtopicMap.set(name, updated);
    });

    // Update overall topic score/status using aggregated performance
    const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    let status;
    if (overallScore >= 80) status = 'mastered';
    else if (overallScore >= 50) status = 'developing';
    else status = 'weak';

    progress.score = overallScore;
    progress.status = status;
    progress.attempts = (progress.attempts || 0) + 1;
    progress.lastAttemptDate = new Date();
    if (timeSpentSeconds && timeSpentSeconds > 0) {
      progress.timeSpentSeconds = (progress.timeSpentSeconds || 0) + timeSpentSeconds;
    }
    progress.subtopics = Array.from(subtopicMap.values());
    await progress.save();

    // Log event
    await LearningEvent.create({
      studentId,
      subjectId: topic.subjectId,
      topicId,
      eventType: 'subtopic_quiz_attempt',
      score: overallScore,
      totalQuestions,
      timeSpentSeconds: timeSpentSeconds || 0,
      hintsUsed: 0,
      contentMode: 'text',
      details: {
        subtopicResults
      },
      attemptNumber: progress.attempts,
      completed: true,
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      data: {
        score: overallScore,
        status,
        totalQuestions,
        attempts: progress.attempts,
        subtopics: progress.subtopics
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get next subtopic to study for a subject (linear plan; only non-excelled)
// @route   GET /api/learning/subject/:subjectId/next-topic
// @access  Protected
export const getNextTopicForSubject = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    let progress = await SubjectProgress.findOne({ studentId, subjectId });

    if (!progress || !progress.subtopics || progress.subtopics.length === 0) {
      const response = await groqClient.post('/chat/completions', {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert curriculum designer. You MUST respond with strict JSON only. No comments, explanations, markdown formatting, code blocks, or any text outside the JSON object. Return ONLY valid JSON.' },
          { role: 'user', content: `Break the subject "${subject.subjectName}" into 6 to 12 logical subtopics (learning units). Each subtopic will be studied one at a time with in-depth content and a quiz. Return ONLY valid JSON with no comments: { "subtopics": ["name1", "name2", ...] }` }
        ],
        temperature: 0.4,
        max_tokens: 512
      });
      const raw = response.data?.choices?.[0]?.message?.content || '';
      let subtopics = [];
      if (raw) {
        try {
          const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
          const json = JSON.parse(cleaned);
          if (Array.isArray(json.subtopics)) {
            subtopics = json.subtopics.map(s => ({ name: String(s), masteryScore: 0, correct: 0, total: 0, lastAttempt: null }));
          }
        } catch (e) {
          console.error('Parse subtopics error:', e);
        }
      }
      if (subtopics.length === 0) {
        return res.status(502).json({ success: false, message: 'Could not generate subtopics for this subject.' });
      }

      progress = await SubjectProgress.findOne({ studentId, subjectId });
      if (!progress) {
        progress = await SubjectProgress.create({
          studentId,
          subjectId,
          subjectName: subject.subjectName,
          subtopics
        });
      } else {
        progress.subtopics = subtopics;
        progress.subjectName = subject.subjectName;
        await progress.save();
      }
    }

    const list = progress.subtopics || [];
    const nextIndex = list.findIndex(s => (s.masteryScore || 0) < MASTERY_EXCELLED);

    if (nextIndex === -1) {
      return res.status(200).json({
        success: true,
        data: { completed: true, subjectName: progress.subjectName, subtopics: list }
      });
    }

    const currentSubtopic = list[nextIndex].name;
    return res.status(200).json({
      success: true,
      data: {
        completed: false,
        subjectId,
        subjectName: progress.subjectName,
        currentSubtopic,
        index: nextIndex,
        total: list.length,
        subtopics: list
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit subject-level adaptive quiz (updates SubjectProgress)
// @route   POST /api/learning/adaptive/submit-subject-quiz
// @access  Protected
export const submitSubjectAdaptiveQuiz = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { subjectId, subtopicResults, timeSpentSeconds } = req.body;

    if (!subjectId || !Array.isArray(subtopicResults) || subtopicResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'subjectId and subtopicResults are required'
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    let progress = await SubjectProgress.findOne({ studentId, subjectId });
    if (!progress || !progress.subtopics || progress.subtopics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No learning plan found for this subject. Start learning first.'
      });
    }

    const subtopicMap = new Map();
    progress.subtopics.forEach(s => subtopicMap.set(s.name, { ...s.toObject ? s.toObject() : s }));

    const normalizeName = (n) => String(n || '').trim().toLowerCase();

    let totalCorrect = 0;
    let totalQuestions = 0;

    subtopicResults.forEach(result => {
      const nameFromRequest = String(result.subtopic || result.name || '').trim();
      const correct = Number(result.correct || 0);
      const total = Number(result.total || 0);
      if (!nameFromRequest || total <= 0) return;

      totalCorrect += correct;
      totalQuestions += total;

      // Match the subtopic in the map (same key as stored) so we update the right entry, not a duplicate
      const mapKey = Array.from(subtopicMap.keys()).find((k) => normalizeName(k) === normalizeName(nameFromRequest)) || nameFromRequest;
      const prev = subtopicMap.get(mapKey) || { name: mapKey, masteryScore: 0, correct: 0, total: 0, lastAttempt: null };
      const previousMastery = prev.masteryScore || 0;
      const currentScore = Math.max(0, Math.min(1, correct / total));
      let newMastery = (previousMastery * 0.7) + (currentScore * 0.3);
      // If they passed (80%+), mark subtopic as cleared so they can move to next
      if (currentScore >= 0.8) {
        newMastery = MASTERY_EXCELLED;
      }

      subtopicMap.set(mapKey, {
        name: mapKey,
        masteryScore: newMastery,
        correct: (prev.correct || 0) + correct,
        total: (prev.total || 0) + total,
        lastAttempt: new Date()
      });
    });

    progress.subtopics = Array.from(subtopicMap.values());
    progress.subjectName = subject.subjectName;
    progress.updatedAt = new Date();
    progress.markModified('subtopics');
    await progress.save();

    const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const list = progress.subtopics || [];
    const nextIndex = list.findIndex(s => (s.masteryScore || 0) < MASTERY_EXCELLED);

    return res.status(200).json({
      success: true,
      data: {
        score: overallScore,
        totalQuestions,
        subtopics: progress.subtopics,
        nextSubtopic: nextIndex >= 0 ? list[nextIndex].name : null,
        completed: nextIndex === -1
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- Hierarchical roadmap (subject/topic/subtopic as learning nodes) ---

/**
 * Get roadmap for a node. If roadmap exists in DB, use it; else generate 5-8 children via AI, store once.
 * Return only children with status not_started or weak (exclude mastered).
 * @route GET /api/learning/roadmap/node
 * @query subjectId, path (optional, pipe-separated e.g. "TopicName|SubtopicName")
 */
export const getRoadmapByNode = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const subjectId = req.query.subjectId;
    const pathStr = (req.query.path || '').trim();
    const path = pathStr ? pathStr.split('|').map((p) => p.trim()).filter(Boolean) : [];

    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'subjectId is required' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const nodeKey = Roadmap.buildNodeKey(subjectId, path);
    const nodeName = path.length > 0 ? path[path.length - 1] : subject.subjectName;

    // Check DB first - never regenerate if roadmap exists
    let roadmap = await Roadmap.findOne({ nodeKey });
    if (!roadmap) {
      // Generate roadmap only if it doesn't exist
      const parentContext = path.length > 0 ? path.join(' > ') : subject.subjectName;
      const response = await groqClient.post('/chat/completions', {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert curriculum designer. You MUST respond with strict JSON only. No comments, explanations, markdown formatting, code blocks, or any text outside the JSON object. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: `Divide "${nodeName}" (context: ${parentContext}) into 5 to 8 logical subtopics. Each subtopic will be treated as a learning node that can be further divided. Return ONLY valid JSON with no comments: {"subtopics":["name1","name2","name3","name4","name5"]}`
          }
        ],
        temperature: 0.4,
        max_tokens: 512
      });
      const raw = response.data?.choices?.[0]?.message?.content || '';
      let children = [];
      if (raw) {
        try {
          const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
          const json = JSON.parse(cleaned);
          if (Array.isArray(json.subtopics)) {
            children = json.subtopics.slice(0, 8).map((name) => ({ name: String(name).trim() })).filter((c) => c.name);
          }
        } catch (e) {
          console.error('Roadmap parse error:', e);
        }
      }
      if (children.length === 0) {
        return res.status(502).json({ success: false, message: 'Could not generate roadmap. AI did not return valid JSON.' });
      }
      roadmap = await Roadmap.create({
        nodeKey,
        subjectId,
        subjectName: subject.subjectName,
        path,
        name: nodeName,
        children
      });
    }

    // Load or create progress - when fetching from DB, assume user may have attempted before
    let progress = await RoadmapProgress.findOne({ studentId, nodeKey });
    if (!progress) {
      progress = await RoadmapProgress.create({
        studentId,
        nodeKey,
        childrenProgress: roadmap.children.map((c) => ({
          name: c.name,
          status: 'not_started',
          masteryScore: 0,
          correct: 0,
          total: 0,
          lastAttempt: null
        }))
      });
    }

    // Build progress map for filtering
    const progressMap = new Map();
    progress.childrenProgress.forEach((p) => {
      const key = String(p.name).trim().toLowerCase();
      progressMap.set(key, p);
    });

    // Filter: only show not_started or weak (mastered items excluded)
    const filtered = roadmap.children.filter((c) => {
      const key = String(c.name).trim().toLowerCase();
      const p = progressMap.get(key);
      const score = p?.masteryScore ?? 0;
      const status = p?.status ?? 'not_started';
      // Exclude mastered items - they should not appear in study recommendations
      return status !== 'mastered' && score < MASTERY_EXCELLED;
    });

    const nextToStudy = filtered.length > 0 ? filtered[0].name : null;
    const completed = filtered.length === 0;

    return res.status(200).json({
      success: true,
      data: {
        nodeKey,
        name: roadmap.name,
        subjectId,
        subjectName: roadmap.subjectName,
        path,
        children: filtered,
        allChildren: roadmap.children,
        nextToStudy,
        completed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz for a child of a node. Update progress; mastered items excluded from roadmap.
 * @route POST /api/learning/adaptive/submit-node-quiz
 * @body nodeKey, childName, correct, total
 */
export const submitNodeQuiz = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { nodeKey, childName, correct, total, startTime } = req.body;

    if (!nodeKey || !childName) {
      return res.status(400).json({
        success: false,
        message: 'nodeKey and childName are required'
      });
    }

    const totalNum = Number(total) || 0;
    const correctNum = Number(correct) || 0;

    if (totalNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'total must be positive'
      });
    }

    // ✅ Calculate score
    const scorePercent = Math.round((correctNum / totalNum) * 100);

    // ✅ Calculate time spent
    let timeSpentSeconds = 0;
    if (startTime) {
      const now = Date.now();
      timeSpentSeconds = Math.floor((now - Number(startTime)) / 1000);
    }

    const roadmap = await Roadmap.findOne({ nodeKey });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    let progress = await RoadmapProgress.findOne({ studentId, nodeKey });
    if (!progress) {
      return res.status(400).json({
        success: false,
        message: 'No progress for this node'
      });
    }

    const normalize = (n) => String(n).trim().toLowerCase();
    const idx = progress.childrenProgress.findIndex(
      (p) => normalize(p.name) === normalize(childName)
    );

    if (idx === -1) {
      return res.status(400).json({
        success: false,
        message: 'Child not found in roadmap'
      });
    }

    const prev = progress.childrenProgress[idx];
    const currentScoreRatio = correctNum / totalNum;

    let newMastery =
      (prev.masteryScore ?? 0) * 0.7 + currentScoreRatio * 0.3;

    let status = prev.status || 'not_started';

    if (currentScoreRatio >= 0.8) {
      newMastery = 1;
      status = 'mastered';
    } else {
      status = 'weak';
    }

    // ✅ Update child progress
    progress.childrenProgress[idx] = {
      ...prev.toObject?.() ?? prev,
      name: prev.name,
      status,
      masteryScore: newMastery,
      correct: (prev.correct ?? 0) + correctNum,
      total: (prev.total ?? 0) + totalNum,
      attempts: (prev.attempts ?? 0) + 1,          // ✅ attempts
      timeSpentSeconds: (prev.timeSpentSeconds ?? 0) + timeSpentSeconds, // ✅ time
      lastAttempt: new Date()
    };

    progress.updatedAt = new Date();
    progress.markModified('childrenProgress');
    await progress.save();

    // ✅ Find next item
    const nextItem = roadmap.children.find((c) => {
      const p = progress.childrenProgress.find(
        (x) => normalize(x.name) === normalize(c.name)
      );
      return !p || p.status !== 'mastered';
    });

    return res.status(200).json({
      success: true,
      data: {
        score: scorePercent,
        nextToStudy: nextItem?.name || null,
        completed: !nextItem,
        timeSpentSeconds,
        attempts: progress.childrenProgress[idx].attempts
      }
    });
  } catch (error) {
    next(error);
  }
};


