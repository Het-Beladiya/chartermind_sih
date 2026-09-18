# 🚢 CharterMind — Maritime Freight & Voyage Decision Terminal
### Smart India Hackathon (SIH) Project

An AI-powered maritime bulk shipping decision terminal featuring dynamic freight rate forecasting, intelligent vessel-cargo matching, port turnaround risk modeling, and interactive voyage simulator.

---

## 🚀 Quick Start Guide (For Teammates)

Clone or unzip the project, then follow these simple steps to run it on your machine.

### Prerequisites
- **Node.js** (v18 or higher): [Download here](https://nodejs.org)
- **Python** (v3.10 or higher): [Download here](https://python.org)
- An active internet connection (for Firebase Auth & cloud services)

---

### Step 1: Start the Frontend (Terminal 1)

1. Open a terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Ensure `.env` exists. If you cloned via Git, create it from `.env.example`:
   ```bash
   # Windows PowerShell:
   Copy-Item .env.example .env

   # Mac / Linux:
   cp .env.example .env
   ```
3. Install dependencies and start the app:
   ```bash
   npm install
   npm run dev
   ```
4. Open **http://localhost:3000** in your browser.
   - **Google Sign-In**: Works out of the box with 1 click.
   - **Email/Password**: Works out of the box (Click "Create Account").
   - **Try Demo Persona**: 1-click bypass to explore without signing up.

---

### Step 2: Start the Backend (Terminal 2)

1. Open a second terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv .venv
   .venv\Scripts\Activate.ps1

   # Mac / Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Ensure `.env` exists:
   ```bash
   # Windows PowerShell:
   Copy-Item .env.example .env

   # Mac / Linux:
   cp .env.example .env
   ```
4. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
5. Apply database schema migrations:
   ```bash
   # Applies all versioned migrations (PostgreSQL or zero-install SQLite):
   alembic upgrade head
   ```
6. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
7. Verify the API:
   - Interactive API Docs (Swagger): **http://localhost:8000/docs**
   - Health Check: **http://localhost:8000/health**

---

## 🛠️ Project Architecture

```
SIH/
├── frontend/             # React 19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Maritime UI views & charts (Recharts, Lucide)
│   │   ├── context/      # CharterContext (State management & Firebase sync)
│   │   ├── utils/        # Firebase, Firestore user sync, calculations
│   │   └── types.ts      # TypeScript interfaces and vessel/port data
│   └── package.json
│
├── backend/              # Primary Full-Stack API (Port 8000)
│   ├── app/
│   │   ├── routers/      # API routes (voyage, freight forecast, risk, auth)
│   │   ├── models/       # Database models (PostgreSQL)
│   │   ├── services/     # Maritime decision engines & regression models
│   │   └── ml_artifacts/ # Bundled trained model binaries & historical series
│   ├── run.py            # Backend launcher script (python run.py --dev)
│   └── requirements.txt
│
├── ml_model/             # Standalone ML Subsystem & Research (Port 8001)
│   ├── data/             # BDI historical index and port traffic datasets
│   ├── models/           # Serialized models and feature weight metadata
│   ├── training/         # Walk-forward cross-validation training scripts
│   ├── app/              # Independent lightweight FastAPI microservice
│   └── run.py            # Standalone ML launcher (python run.py --dev)
│
├── README.md             # This file
└── .gitignore            # Git exclusion rules
```

---

## 🔐 Firebase Authentication & Firestore
- **Authentication**: Powered by Firebase Auth (`chartermind-417f3`).
- **Cloud Database**: User profiles automatically sync to Cloud Firestore under collection `users/{uid}`.
- **Localhost Allowed**: All teammates running on `localhost:3000` share the same cloud database and can sign in instantly.
