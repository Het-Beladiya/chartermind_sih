#!/usr/bin/env bash

# Resolve project directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

echo "======================================================================"
echo "   CharterMind - Smart India Hackathon Maritime Decision Terminal"
echo "======================================================================"
echo ""

# 1. Setup frontend .env if missing
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        echo "[INFO] Creating frontend/.env from .env.example..."
        cp frontend/.env.example frontend/.env
    fi
fi

# 2. Setup backend .env if missing
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo "[INFO] Creating backend/.env from .env.example..."
        cp backend/.env.example backend/.env
    fi
fi

echo "[1/2] Preparing & starting Backend..."
(
    cd "$PROJECT_DIR/backend"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi
    python3 -m uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "[2/2] Preparing & starting Frontend..."
(
    cd "$PROJECT_DIR/frontend"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "======================================================================"
echo " Both services are running in the background:"
echo "  * Frontend: http://localhost:3000"
echo "  * Backend:  http://localhost:8000"
echo "  * API Docs: http://localhost:8000/docs"
echo " Press Ctrl+C to stop both."
echo "======================================================================"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
