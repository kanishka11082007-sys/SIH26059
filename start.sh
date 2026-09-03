#!/usr/bin/env bash
set -e

echo "================================================================"
echo " POLARNAV (SIH26059) - Antarctic AI Navigation System"
echo "================================================================"

export PYTHONPATH="$(pwd):$(pwd)/backend:$(pwd)/backend/src:$PYTHONPATH"

if [ ! -f .env ]; then
    echo "[INFO] Creating .env from .env.example..."
    cp .env.example .env
fi

echo "[1/2] Launching Backend on http://localhost:8000..."
python -m uvicorn backend.app.server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "[2/2] Launching Frontend on http://localhost:3000..."
cd SIH26059/frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
