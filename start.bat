@echo off
echo ================================================================
echo  POLARNAV (SIH26059) - Antarctic AI Navigation System
echo ================================================================
echo.

set PYTHONPATH=%~dp0;%~dp0backend;%~dp0backend\src

echo [1/3] Checking environment configuration...
if not exist .env (
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env
)

echo [2/3] Launching FastAPI Backend on http://localhost:8000...
start "PolarNav Backend" cmd /k "python -m uvicorn backend.app.server:app --host 0.0.0.0 --port 8000"

echo [3/3] Launching React Frontend on http://localhost:3000...
cd SIH26059\frontend
start "PolarNav Frontend" cmd /k "npm run dev"

echo.
echo ================================================================
echo  PolarNav is running!
echo  Frontend: http://localhost:3000
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ================================================================
pause
