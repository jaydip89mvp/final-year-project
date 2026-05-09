# How to Run the AI-Powered Adaptive Learning Platform

This project has three runtime parts:

| Service | Folder | Technology | Default URL |
| --- | --- | --- | --- |
| Backend API | `backend/` | Node.js + Express | http://localhost:5000 |
| Frontend | `frontend/` | React + Vite | http://localhost:5173 |
| ML service | `ml-service/` | Python + FastAPI | http://localhost:8000 |

## Prerequisites

- Node.js 18+ and npm
- MongoDB, either local MongoDB Community Server or MongoDB Atlas
- Python 3.9+ for the ML service

## 1. MongoDB

Use one of these options:

- Local MongoDB: start MongoDB and use `mongodb://localhost:27017/adaptive-learning`.
- MongoDB Atlas: create a cluster, copy its connection string, and use it as `MONGODB_URI`.

## 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Edit `backend/.env` before starting:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/adaptive-learning
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
MURF_API_KEY=
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_URI=http://localhost:8000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Required for startup:

- `MONGODB_URI`
- `JWT_SECRET`

Optional features:

- `GROQ_API_KEY` and `GROQ_MODEL` for AI lesson/content generation.
- `MURF_API_KEY` for text-to-speech.
- `CLOUDINARY_*` values for Cloudinary-backed uploads.
- `ML_SERVICE_URL` / `ML_SERVICE_URI` if the ML service is not running at the default URL.

The backend runs at http://localhost:5000.

## 3. Frontend

Open a new terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Frontend environment values:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000
```

The frontend runs at http://localhost:5173 by default. If Vite chooses another port, use the URL printed in the terminal.

## 4. ML Service

The app can start without this service, but trait prediction, keyword extraction, and ML-backed learning signals require it.

Open another terminal:

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

The ML service runs at http://localhost:8000.

Optional GenAI endpoints use `OPENAI_API_KEY` from `ml-service/.env` or your shell environment.

## 5. Seed Data

To prefill subjects and topics, run these from the `backend/` folder while MongoDB is running:

```bash
node seedSubjects.js
node seedTopics.js
```

## Run Order

1. Start MongoDB.
2. Start the backend with `npm run dev`.
3. Start the frontend with `npm run dev`.
4. Start the ML service if you need ML/AI helper features.
5. Open http://localhost:5173.
