# ML Service

Python FastAPI microservice for prediction and text-processing features used by the adaptive learning platform.

## Setup

```bash
cd ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

On macOS/Linux:

```bash
cd ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

You can also run it with Uvicorn:

```bash
python -m uvicorn main:app --reload
```

The service runs at http://localhost:8000.

## Environment

Create `ml-service/.env` from `ml-service/.env.example` if you need optional GenAI features:

```env
OPENAI_API_KEY=
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health/status check |
| `POST` | `/predict-support` | Predict learner support level from performance metrics |
| `POST` | `/predict-mode` | Predict preferred learning mode |
| `POST` | `/predict-struggle` | Estimate struggle risk |
| `POST` | `/predict` | Predict progress status with the trained ensemble model |
| `POST` | `/predict-trait` | Predict dominant learning trait from screening answers |
| `POST` | `/extract-keywords` | Extract keyword phrases with RAKE |
| `POST` | `/generate/image` | Optional GenAI image generation |
| `POST` | `/generate/content` | Optional GenAI content generation |

The trained model files in `ml-service/model/` are required by `/predict` and `/predict-trait`.
