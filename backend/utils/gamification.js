import StudentProfile from '../models/StudentProfile.js';
import Notification from '../models/Notification.js';
import ParentLink from '../models/ParentLink.js';
import User from '../models/User.js';

/**
 * Awards XP to a student and handles leveling up.
 * 
 * @param {string} userId - The ID of the student
 * @param {number} amount - Amount of XP to award
 * @param {string} reason - Reason for awarding XP (displayed in notification)
 * @returns {object} - Updated gamification stats
 */
export const awardXP = async (userId, amount, reason) => {
    try {
        let profile = await StudentProfile.findOne({ userId });

        if (!profile) {
            console.error(`Profile not found for user ${userId}`);
            return null;
        }

        const oldXP = profile.xp || 0;
        const newXP = oldXP + amount;

        // Level formula: level = floor(sqrt(xp) / 5) + 1
        // Example: 0 XP = Level 1, 25 XP = Level 2, 100 XP = Level 3, 400 XP = Level 5
        const newLevel = Math.floor(Math.sqrt(newXP) / 5) + 1;
        const leveledUp = newLevel > (profile.level || 1);

        profile.xp = newXP;

        // --- Streak Logic ---
        await updateStreak(profile);

        if (leveledUp) {
            profile.level = newLevel;

            // Create level up notification
            await Notification.create({
                userId,
                title: '🎉 Level Up!',
                message: `Congratulations! You've reached Level ${newLevel}!`,
                type: 'achievement'
            });

            // Notify Linked Parents
            const parents = await ParentLink.find({ studentId: userId });
            const student = await User.findById(userId);
            for (const link of parents) {
                await Notification.create({
                    userId: link.parentId,
                    title: '🎉 Achievement Alert!',
                    message: `${student.name} just reached Level ${newLevel}!`,
                    type: 'achievement'
                });
            }
        }

        await profile.save();

        // Optionally award badges based on milestones
        await checkBadges(profile);

        return {
            xpEarned: amount,
            totalXP: newXP,
            level: profile.level,
            leveledUp,
            reason
        };
    } catch (error) {
        console.error('Error awarding XP:', error);
        return null;
    }
};

/**
 * Checks for badge eligibility and awards them.
 */
const checkBadges = async (profile) => {
    const badges = profile.badges || [];
    const earnedBadgeNames = badges.map(b => b.name);

    const potentialBadges = [
        { name: 'First Steps', condition: profile.xp >= 10, category: 'milestone', icon: '🌱' },
        { name: 'Knowledge Seeker', condition: profile.xp >= 100, category: 'milestone', icon: '📚' },
        { name: 'Master Learner', condition: profile.level >= 5, category: 'milestone', icon: '🎓' }
    ];

    let newBadgesEarned = false;

    for (const badge of potentialBadges) {
        if (badge.condition && !earnedBadgeNames.includes(badge.name)) {
            profile.badges.push({
                name: badge.name,
                icon: badge.icon,
                category: badge.category,
                unlockedAt: new Date()
            });
            newBadgesEarned = true;

            // Notify user
            await Notification.create({
                userId: profile.userId,
                title: '🏆 New Badge Earned!',
                message: `You've earned the "${badge.name}" badge!`,
                type: 'achievement'
            });

            // Notify Linked Parents
            const parents = await ParentLink.find({ studentId: profile.userId });
            const student = await User.findById(profile.userId);
            for (const link of parents) {
                await Notification.create({
                    userId: link.parentId,
                    title: '🏆 Achievement Alert!',
                    message: `${student.name} just earned the "${badge.name}" badge!`,
                    type: 'achievement'
                });
            }
        }
    }

    if (newBadgesEarned) {
        await profile.save();
    }
};

/**
 * Updates the student's learning streak.
 */
export const updateStreak = async (profile) => {
    const now = new Date();
    const lastActive = profile.streaks?.lastActive;

    if (!lastActive) {
        profile.streaks = {
            current: 1,
            lastActive: now
        };
    } else {
        const lastActiveDate = new Date(lastActive);

        // Reset time to compare only dates
        const dateNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dateLast = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());

        const diffDays = Math.round((dateNow - dateLast) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            profile.streaks.current += 1;
            profile.streaks.lastActive = now;
        } else if (diffDays > 1) {
            // Streak broken
            profile.streaks.current = 1;
            profile.streaks.lastActive = now;
        }
        // If diffDays === 0, it's the same day, don't update streak
    }
    return profile;
};
