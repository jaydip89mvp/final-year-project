# Frontend

React + Vite client for the AI-Powered Adaptive Learning Platform.

## Setup

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

On macOS/Linux, use `cp .env.example .env`.

## Environment

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000
```

`VITE_API_BASE_URL` is used by the shared Axios client. `VITE_API_URL` is used by a few direct API calls that build the `/api/...` path themselves.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build production assets into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Notes

- Keep real local values in `frontend/.env`; commit `frontend/.env.example` instead.
- The backend should be running at http://localhost:5000 before using the app.
