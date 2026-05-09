# AI-Powered Adaptive Learning Platform

An inclusive learning platform for students with different learning needs. The project combines a React/Vite frontend, a Node/Express API, MongoDB, and an optional FastAPI ML service for trait prediction, learning support signals, keyword extraction, and AI-assisted content workflows.

## Project Structure

| Folder | Purpose |
| --- | --- |
| `frontend/` | React + Vite user interface |
| `backend/` | Express API, MongoDB models, authentication, learning/classroom routes, AI content routes |
| `ml-service/` | FastAPI service for ML predictions and keyword extraction |
| `RUN.md` | Full local setup and run instructions |

## Quick Start

1. Install Node.js 18+, npm, Python 3.9+, and MongoDB.
2. Create local environment files from the examples:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp ml-service/.env.example ml-service/.env
   ```
3. Fill in `backend/.env`, especially `MONGODB_URI`, `JWT_SECRET`, and any API keys needed for AI features.
4. Follow [RUN.md](RUN.md) to start MongoDB, the backend, the frontend, and optionally the ML service.

## Main Commands

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# ML service
cd ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

## Repository Hygiene

Local dependencies, virtual environments, environment files, logs, uploads, and generated cache files are ignored by Git. Keep real secrets in `.env` files only; commit the `.env.example` files instead.

If Git still shows files from `ml-service/venv`, `__pycache__`, local `.env`, or generated output files, they were already tracked before being ignored and need to be removed from Git tracking with `git rm --cached`.
