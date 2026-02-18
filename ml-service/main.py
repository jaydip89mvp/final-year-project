from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import random
import joblib
import pandas as pd
import os

# Optional genai import - will load only if API key is available
try:
    import genai
    GENAI_AVAILABLE = True
except Exception as e:
    print(f"⚠️  GenAI not available: {e}")
    genai = None
    GENAI_AVAILABLE = False

app = FastAPI(title="AI Learning Analytics Service", version="1.0.0")

# ==============================
# Load Trained Models for Status Prediction
# ==============================
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(MODEL_DIR, "model", "student_status_ensemble_model.pkl")
encoder_path = os.path.join(MODEL_DIR, "model", "label_encoder.pkl")

try:
    status_model = joblib.load(model_path)
    label_encoder = joblib.load(encoder_path)
    print(f"✓ Status prediction models loaded successfully")
except FileNotFoundError as e:
    print(f"✗ Error loading models: {e}")
    status_model = None
    label_encoder = None

# ==============================
# Data Models
# ==============================

class LearnerFeatures(BaseModel):
    avg_score: float
    avg_time_per_question: float
    hint_usage_rate: float
    retry_count: int
    completion_rate: float
    dropout_rate: float

class SupportPrediction(BaseModel):
    support_level: str  # LOW_SUPPORT, MEDIUM_SUPPORT, HIGH_SUPPORT

class ModeFeatures(BaseModel):
    score_after_text: Optional[float] = 0.0
    score_after_audio: Optional[float] = 0.0
    score_after_visual: Optional[float] = 0.0
    time_spent_text: Optional[float] = 0.0
    time_spent_audio: Optional[float] = 0.0
    time_spent_visual: Optional[float] = 0.0

class ModePrediction(BaseModel):
    preferred_mode: str # TEXT, AUDIO, VISUAL, MIXED

class StruggleFeatures(BaseModel):
    recent_score: float
    time_spent: float
    baseline_time: float
    hints_used: int
    attempts: int

class StrugglePrediction(BaseModel):
    struggle_risk: bool
    risk_factor: float

class PredictRequest(BaseModel):
    score: float
    attempts: int
    timeSpentSeconds: float
    correct: int
    total: int

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "online", "service": "ML Analytics Microservice"}

@app.post("/predict-support", response_model=SupportPrediction)
def predict_support(features: LearnerFeatures):
    """
    Predicts the level of support a student needs based on performance metrics.
    Currently uses heuristic rules until enough data is collected for ML training.
    """
    # Heuristic Logic (Placeholder for Random Forest)
    
    # High support if low scores or high hint usage/retries
    if features.avg_score < 50 or features.hint_usage_rate > 0.5 or features.retry_count > 3:
        return {"support_level": "HIGH_SUPPORT"}
    
    # Medium support for average performance
    elif features.avg_score < 80 or features.hint_usage_rate > 0.2:
        return {"support_level": "MEDIUM_SUPPORT"}
        
    # Low support for mastery
    else:
        return {"support_level": "LOW_SUPPORT"}

@app.post("/predict-mode", response_model=ModePrediction)
def predict_mode(features: ModeFeatures):
    """
    Predicts the preferred learning mode (Visual, Audio, Text) based on past engagement and scores.
    Currently uses heuristic comparison.
    """
    # Calculate effectiveness score (Score * Engagement Time)
    text_score = (features.score_after_text or 0) * (1 + (features.time_spent_text or 0) / 100)
    audio_score = (features.score_after_audio or 0) * (1 + (features.time_spent_audio or 0) / 100)
    visual_score = (features.score_after_visual or 0) * (1 + (features.time_spent_visual or 0) / 100)
    
    # Determine winner
    scores = {"TEXT": text_score, "AUDIO": audio_score, "VISUAL": visual_score}
    best_mode = max(scores, key=scores.get)
    
    # If scores are very close, suggest MIXED
    if max(scores.values()) - min(scores.values()) < 10:
        best_mode = "MIXED"
        
    # Default fallback
    if max(scores.values()) == 0:
        best_mode = "MIXED"

    return {"preferred_mode": best_mode}

@app.post("/predict-struggle", response_model=StrugglePrediction)
def predict_struggle(features: StruggleFeatures):
    """
    Detects if a student is currently struggling with a topic.
    """
    risk_score = 0.0
    
    # 1. Score Drop Logic
    if features.recent_score < 40:
        risk_score += 0.4
    
    # 2. Time Spike Logic (taking 50% longer than baseline)
    if features.baseline_time > 0 and features.time_spent > (features.baseline_time * 1.5):
        risk_score += 0.3
        
    # 3. Hint Usage Logic
    if features.hints_used > 2:
        risk_score += 0.2
        
    # 4. Excessive Retries
    if features.attempts > 2:
        risk_score += 0.3
        
    is_struggling = risk_score >= 0.5
    
    return {
        "struggle_risk": is_struggling,
        "risk_factor": min(risk_score, 1.0)
    }

@app.post("/predict")
def predict_status(data: PredictRequest):
    """
    Predicts student progress status using the trained ensemble model.
    Returns status: 'mastered', 'developing', or 'weak'
    """
    try:
        if status_model is None or label_encoder is None:
            raise HTTPException(status_code=500, detail="Models not loaded. Please check model files.")
        
        accuracy = data.correct / data.total
        avgTimePerAttempt = data.timeSpentSeconds / data.attempts

        df = pd.DataFrame({
            "score": [data.score],
            "attempts": [data.attempts],
            "timeSpentSeconds": [data.timeSpentSeconds],
            "correct": [data.correct],
            "total": [data.total],
            "accuracy": [accuracy],
            "avgTimePerAttempt": [avgTimePerAttempt]
        })

        pred = status_model.predict(df)
        return {
            "status": label_encoder.inverse_transform(pred)[0]
        }
    except ZeroDivisionError:
        raise HTTPException(status_code=400, detail="Invalid input: attempts or total cannot be zero")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

class ImageRequest(BaseModel):
    prompt: str

@app.post("/generate/image")
def generate_image_endpoint(request: ImageRequest):
    """
    Generates an image from a text prompt.
    """
    if not GENAI_AVAILABLE:
        raise HTTPException(status_code=503, detail="GenAI service not available. Please set OPENAI_API_KEY environment variable.")
    
    url = genai.generate_image(request.prompt)
    if not url:
        raise HTTPException(status_code=500, detail="Image generation failed")
    return {"image_url": url}

@app.post("/generate/content")
def generate_content_endpoint(request: BaseModel):
    """
    Generates personalized lesson content using GenAI.
    """
    if not GENAI_AVAILABLE:
        raise HTTPException(status_code=503, detail="GenAI service not available. Please set OPENAI_API_KEY environment variable.")
    
    return genai.generate_content(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
