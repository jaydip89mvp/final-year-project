import axios from 'axios';

/**
 * Rapid Automatic Keyword Extraction via ML-Service (Python rake-nltk)
 * @param {string} text - The input text to extract keywords from
 * @returns {Promise<string[]>} - Array of top ranked keyword phrases
 */
export async function rake(text) {
    if (!text) return [];

    try {
        const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${ML_SERVICE_URL}/extract-keywords`,
            { text },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // 10 second timeout
            }
        );

        return response.data?.keywords || [];
    } catch (error) {
        console.error('RAKE ML-Service Error:', error.response?.data || error.message);
        return []; // Return empty array on failure as fallback
    }
}
