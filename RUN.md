# How to Run the AI-Powered Adaptive Learning Platform

This project has **three parts**: Backend (Node/Express), Frontend (React/Vite), and ML Service (Python/FastAPI). Follow the steps below in order.

---

## Prerequisites

Install these before starting:

| Tool | Purpose |
|------|---------|
| **Node.js** (v18+) | Backend + Frontend |
| **npm** | Install Node dependencies |
| **MongoDB** | Database (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier) |
| **Python 3.9+** | ML microservice (optional for full AI features) |

---

## 1. MongoDB

- **Option A – Local:** Install [MongoDB Community](https://www.mongodb.com/try/download/community) and start the service. Default URI: `mongodb://localhost:27017`.
- **Option B – Atlas:** Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), get your connection string, and use it as `MONGODB_URI`.

---

## 2. Backend

1. Open a terminal and go to the backend folder:
   ```bash
   cd backend
   ```

2. Create a `.env` file in the `backend` folder with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/adaptive-learning
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   PORT=5000
   NODE_ENV=development
   GROQ_API_KEY=your-groq-api-key
   ```
   - Replace `MONGODB_URI` with your Atlas URI if you use Atlas.
   - Replace `JWT_SECRET` with a long random string.
   - Get `GROQ_API_KEY` from [Groq Console](https://console.groq.com/) (needed for AI features).

3. Install dependencies and start the server:
   ```bash
   npm install
   npm run dev
   ```
   Backend runs at **http://localhost:5000**. You should see “MongoDB Connected” and “Server running… on port 5000”.

---

## 3. Frontend

1. Open a **new** terminal and go to the frontend folder:
   ```bash
   cd frontend
   ```

2. The repo already has a `.env` with:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
   If your backend runs on a different host/port, change this.

3. Install and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   Frontend runs at **http://localhost:5173** (or the port Vite shows). Open this URL in your browser.

---

## 4. ML Service (optional)

Used for predictions and some AI features. The app can run without it, but some features may fail.

1. Open another terminal and go to the ML service folder:
   ```bash
   cd ml-service
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
   (On macOS/Linux: `source venv/bin/activate`.)

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. (Optional) For GenAI features, set your OpenAI API key:
   ```env
   set OPENAI_API_KEY=your-openai-key
   ```
   (On macOS/Linux: `export OPENAI_API_KEY=...`.)

5. Start the ML service:
   ```bash
   python main.py
   ```
   Or: `uvicorn main:app --reload`  
   ML service runs at **http://localhost:8000**.

---

## 5. Seed data (optional)

To prefill subjects/topics in the database:

From the **backend** folder (with backend `.env` and MongoDB running):

```bash
node seedSubjects.js
node seedTopics.js
```

---

## Quick reference

| Service    | Folder    | Command           | URL                  |
|-----------|-----------|-------------------|----------------------|
| Backend   | `backend` | `npm run dev`     | http://localhost:5000 |
| Frontend  | `frontend`| `npm run dev`     | http://localhost:5173 |
| ML Service| `ml-service` | `python main.py` | http://localhost:8000 |

**Order to run:**  
1) Start MongoDB → 2) Backend → 3) Frontend → 4) ML service (optional).

Then open **http://localhost:5173** in your browser.
