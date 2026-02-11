from pydantic import BaseModel
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Define Models for Request logic
class GenerationRequest(BaseModel):
    topic: str
    neuro_type: str = "general" # 'dyslexic', 'adhd', 'asd', 'general'
    support_level: str = "MEDIUM_SUPPORT" # 'LOW_SUPPORT', 'MEDIUM_SUPPORT', 'HIGH_SUPPORT'
    interests: list[str] = []

class GenerationResponse(BaseModel):
    lesson_content: str
    summary: str
    questions: list[dict]
    visual_prompt: str
    audio_prompt: str

# Neuro-inclusive Prompt Templates
SYSTEM_PROMPTS = {
    "general": "You are an expert educator creating engaging, clear, and structured content.",
    "dyslexic": "You are an expert in inclusive education for dyslexic students. Use simple sans-serif-friendly structure, avoid dense blocks of text, use high-frequency words, and bold key terms. Focus on clarity and readability.",
    "adhd": "You are an expert in engaged learning for ADHD students. Break content into small, gamified 'micro-chunks'. Use exciting analogies, bullet points, and an enthusiastic tone to maintain focus. Avoid long paragraphs.",
    "asd": "You are an expert in education for autistic students. Use clear, literal language. Avoid idioms, metaphors, or ambiguity. Stick to facts, logical flow, and structured step-by-step explanations."
}

def generate_content(request: GenerationRequest) -> GenerationResponse:
    
    # 1. Select Base System Prompt
    system_prompt = SYSTEM_PROMPTS.get(request.neuro_type, SYSTEM_PROMPTS["general"])

    # 2. Add Adaptation Instruction based on Support Level
    if request.support_level == "HIGH_SUPPORT":
        system_prompt += "\n\nThe student is struggling. Use extremely simple language. Explain every concept with a real-world analogy. Avoid technical jargon completely."
    elif request.support_level == "MEDIUM_SUPPORT":
        system_prompt += "\n\nProvide a balanced explanation. Include extra examples for difficult concepts."
    else: # LOW_SUPPORT
        system_prompt += "\n\nThe student is advanced. Be concise and include challenge ideas."

    # 3. Incorporate Interests
    interest_context = ""
    if request.interests:
        interest_context = f"If possible, relate concepts to these interests: {', '.join(request.interests)}."

    # 4. Construct User Prompt
    user_prompt = f"""
    Create a comprehensive lesson on the topic: '{request.topic}'.
    {interest_context}
    
    Format the output as a valid JSON object with the following structure:
    {{
        "lesson_content": "The main markdown content of the lesson...",
        "summary": "A 2-sentence summary of the key takeaways.",
        "questions": [
            {{
                "questionText": "Question 1?",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": 0
            }}
        ],
        "visual_prompt": "A detailed description for an image generator (DALL-E) to explain this concept visually.",
        "audio_prompt": "A text script for a narrator to read, summarizing the lesson in a calming voice."
    }}
    """

    # 5. Call OpenAI
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo", # Or gpt-3.5-turbo if budget constrained
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        import json
        content_json = json.loads(response.choices[0].message.content)
        
        return GenerationResponse(**content_json)

    except Exception as e:
        print(f"Error generating content: {e}")
        # Return fallback content in case of AI failure
        return GenerationResponse(
            lesson_content=f"Could not generate content for {request.topic}. Please try again.",
            summary="Generation failed.",
            questions=[],
            visual_prompt="Error",
            audio_prompt="Error"
        )

def generate_image(prompt: str) -> str:
    """
    Generates an image using DALL-E 3 based on the provided prompt.
    Returns the URL of the generated image.
    """
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        return image_url
    except Exception as e:
        print(f"Error generating image: {e}")
        return ""
