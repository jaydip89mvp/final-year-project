import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const match = word.match(/[aeiouy]{1,2}/g);
  return match != null ? match.length : 1;
}

function fkgl(text) {
  const sentencesRow = text.split(/[.?!]+/).filter(s => s.trim().length > 0);
  const sentences = sentencesRow.length || 1;
  const words = text.match(/\b[A-Za-z]+\b/g) || [];
  const numWords = words.length || 1;
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);
  
  return (0.39 * (numWords / sentences)) + (11.8 * (syllables / numWords)) - 15.59;
}

const originalText = `Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities. Some of this chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water – hence the name photosynthesis, from the Greek phōs, "light", and synthesis, "putting together". Most plants, algae, and cyanobacteria perform photosynthesis; such organisms are called photoautotrophs. Photosynthesis is largely responsible for producing and maintaining the oxygen content of the Earth's atmosphere, and supplies most of the energy necessary for life on Earth.`;

const prompt = `You are a learning assistant for neurodiverse students (e.g. Dyslexia, ADHD, ASD). Rewrite the following text to make it extremely accessible. Use short sentences, easy vocabulary, and clear formatting. Output ONLY the simplified text, no introductory remarks.\n\nTEXT:\n${originalText}`;

async function run() {
  if(!GROQ_API_KEY) {
    console.log("No Groq API Key found. Using simulated data...");
    const simulatedSimplified = "Plants use sunlight to make their own food. This process is called photosynthesis. They take in sunlight, water, and a gas called carbon dioxide. Then, they turn it into sugar for energy. Plants also give off oxygen. We need oxygen to breathe and live on Earth. Most plants and algae do this.";
    console.log("FKGL Original:", fkgl(originalText));
    console.log("FKGL Simulated Simplified:", fkgl(simulatedSimplified));
    return;
  }

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` }
    });
    
    const simplifiedText = response.data.choices[0].message.content;
    
    console.log("=== ORIGINAL TEXT ===");
    console.log(originalText);
    console.log("-> FKGL Score (Grade Level):", fkgl(originalText).toFixed(2));
    
    console.log("\n=== SIMPLIFIED TEXT ===");
    console.log(simplifiedText);
    console.log("-> FKGL Score (Grade Level):", fkgl(simplifiedText).toFixed(2));
    
    // Generate a markdown table string
    console.log("\n=== MARKDOWN TABLE FOR PAPER ===");
    console.log("| Metric | Original Text | Simplified Text (GenAI) |");
    console.log("|---|---|---|");
    console.log(`| Flesch-Kincaid Grade Level | ${fkgl(originalText).toFixed(1)} | ${fkgl(simplifiedText).toFixed(1)} |`);
    console.log(`| Word Count | ${(originalText.match(/\\b[A-Za-z]+\\b/g)||[]).length} | ${(simplifiedText.match(/\\b[A-Za-z]+\\b/g)||[]).length} |`);
    console.log(`| Sentence Count | ${originalText.split(/[.?!]+/).filter(s => s.trim().length > 0).length} | ${simplifiedText.split(/[.?!]+/).filter(s => s.trim().length > 0).length} |`);
    
  } catch (err) {
    console.error("Error connecting to Groq:", err.response?.data || err.message);
  }
}

run();
