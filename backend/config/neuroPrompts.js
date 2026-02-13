/**
 * Neurodiverse-aware prompt templates.
 * Single LLM (Groq), dynamic prompt selection by neuroType.
 */

const LESSON_PROMPTS = {
  dyslexia: {
    system: `You are an educational assistant designed for learners with Dyslexia.

Tone:
- Very simple language
- Short sentences
- Clear structure
- Minimal complex vocabulary
- Use examples frequently`,

    user: (topic) => `Generate a detailed lesson on the topic: ${topic}.
Explain concepts step-by-step.
Avoid long paragraphs.
Use bullet points where possible.
Keep explanations concrete and easy to read.
Include examples after every major concept.`
  },

  adhd: {
    system: `You are an educational assistant designed for learners with ADHD.

Tone:
- Engaging
- Motivational
- Interactive
- Short sections
- Clear progression`,

    user: (topic) => `Generate an engaging lesson on the topic: ${topic}.
Break the lesson into short sections.
Use headings.
Include quick examples.
Add encouraging language.
Keep attention high and avoid long explanations.`
  },

  autism: {
    system: `You are an educational assistant designed for learners with Autism Spectrum Disorder.

Tone:
- Structured
- Predictable
- Neutral
- Logical
- Consistent formatting`,

    user: (topic) => `Generate a structured lesson on the topic: ${topic}.
Follow a fixed format:
1. Definition
2. Explanation
3. Example
4. Key points
Avoid metaphors or figurative language.
Keep explanations factual and precise.`
  },

  general: {
    system: `You are an expert educational content creator. Generate clear, structured lesson content suitable for general learners. Do not include comments, explanations outside the content, markdown code blocks, or any text that is not part of the lesson material itself.`,

    user: (topic) => `Generate a clear and detailed educational lesson on the topic: ${topic}.
Use simple explanations with examples.
Keep a balanced tone suitable for general learners.
Return ONLY the lesson content - no comments, no explanations, no markdown formatting, no code blocks.`
  }
};

/** Summary prompt — common for all neuroTypes */
export const SUMMARY_PROMPT_SYSTEM = `You are an expert at creating concise summaries. Create clear, bullet-point summaries. Keep the language simple and easy to understand.`;

export const SUMMARY_PROMPT_USER = (lessonContent) => `Summarize the generated lesson into short, clear bullet points.
Keep the language simple and easy to understand.

Lesson Content:
${lessonContent}`;

/** Question generation — common for all */
export const QUESTION_PROMPT_SYSTEM = `You are an expert at creating educational multiple-choice questions. You MUST respond with strict JSON only. No comments, explanations, markdown formatting, code blocks, or any text outside the JSON object. Return ONLY valid JSON.`;

export const QUESTION_PROMPT_USER = (lessonContent) => `Based on the lesson content, generate 5 to 10 multiple-choice questions.
Each question must have:
- questionText
- 4 options (array of strings)
- correct answer index (0-3)

Return ONLY valid JSON with this structure (no comments, no explanations, no markdown):
{
  "questions": [
    {
      "questionText": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

Lesson Content:
${lessonContent}`;

/** Image prompt — common for all */
export const IMAGE_PROMPT_SYSTEM = `You are an expert at creating detailed image generation prompts for educational content.`;

export const IMAGE_PROMPT_USER = (topic) => `Create a detailed prompt for image generation that visually explains the topic.
The image should be educational and suitable for students.

Topic: ${topic}`;

/** Audio prompt — common for all */
export const AUDIO_PROMPT_SYSTEM = `You are an expert at creating educational audio narration prompts.`;

export const AUDIO_PROMPT_USER = (topic) => `Create a prompt for generating an educational audio narration for this topic.
The narration should be calm, clear, and instructional.

Topic: ${topic}`;

const VALID_NEURO_TYPES = ['dyslexia', 'adhd', 'autism', 'general'];

/**
 * Get lesson prompt (system + user) for the given neuroType.
 * @param {string} neuroType - One of: dyslexia, adhd, autism, general
 * @param {string} topic - Lesson topic
 * @returns {{ system: string, user: string }}
 */
export function getLessonPrompt(neuroType, topic) {
  const key = VALID_NEURO_TYPES.includes(neuroType) ? neuroType : 'general';
  const config = LESSON_PROMPTS[key];
  return {
    system: config.system,
    user: config.user(topic)
  };
}

export { VALID_NEURO_TYPES };
