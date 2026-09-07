@echo off
TITLE CharterMind SIH Terminal Launcher
COLOR 0B

echo ======================================================================
echo    CharterMind - Smart India Hackathon Maritime Decision Terminal
echo ======================================================================
echo.

cd /d "%~dp0"

REM 1. Setup frontend .env if missing
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        echo [INFO] Creating frontend\.env from .env.example...
        copy "frontend\.env.example" "frontend\.env" >nul
    )
)

REM 2. Setup backend .env if missing
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [INFO] Creating backend\.env from .env.example...
        copy "backend\.env.example" "backend\.env" >nul
    )
)

echo [1/2] Launching Backend (FastAPI on port 8000)...
start "CharterMind Backend (FastAPI)" cmd /k "cd /d ""%~dp0backend"" && if not exist venv (python -m venv venv && call venv\Scripts\activate.bat && pip install -r requirements.txt) else (call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Frontend (React + Vite on port 3000)...
start "CharterMind Frontend (React/Vite)" cmd /k "cd /d ""%~dp0frontend"" && if not exist node_modules (npm install) && npm run dev"

echo.
echo ======================================================================
echo  Both services launched in separate windows!
echo   * Frontend: http://localhost:3000
echo   * Backend:  http://localhost:8000
echo   * API Docs: http://localhost:8000/docs
echo ======================================================================
echo.
pause
