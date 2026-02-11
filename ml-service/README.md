# ML Microservice for Adaptive Learning

This is a Python FastAPI service that provides intelligent predictions for the learning platform.

## Setup

1. Navigation to this directory:
   ```bash
   cd ml-service
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

Start the server:
```bash
python main.py
```
Or using uvicorn directly:
```bash
uvicorn main:app --reload
```

The service will run at `http://localhost:8000`.

## Endpoints

- **POST /predict-support**: Returns LOW/MEDIUM/HIGH support level based on student history.
- **POST /predict-mode**: Returns TEXT/AUDIO/VISUAL/MIXED preference.
- **POST /predict-struggle**: Returns boolean if student is at risk of failing the topic.
