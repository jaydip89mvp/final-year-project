import axios from 'axios';

/**
 * Groq API client (chat completions compatible with OpenAI-style API).
 * Uses GROQ_API_KEY from environment variables.
 */
const groqClient = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export default groqClient;

