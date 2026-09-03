# =============================================================================
# PolarNav (SIH26059) Production Multi-Stage Full-Stack Dockerfile
# Automatically builds React Frontend + FastAPI Backend into 1 deployable image
# Compatible with: Render, Railway, Fly.io, AWS App Runner, Docker Hub, GCP Cloud Run
# =============================================================================

# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY SIH26059/frontend/package*.json ./
RUN npm ci || npm install

COPY SIH26059/frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Backend & AI Engine ---
FROM python:3.11-slim AS production

WORKDIR /app

# Install system dependencies for geospatial/GIS libraries & healthcheck curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application, AI engine, trained models, configurations, and data
COPY backend/ /app/backend/

# Copy compiled frontend SPA from Stage 1 into backend static directory
COPY --from=frontend-builder /app/frontend/dist /app/backend/dist
COPY --from=frontend-builder /app/frontend/dist /app/dist

# Configure Python search paths and default runtime variables
ENV PYTHONPATH="/app:/app/backend:/app/backend/src"
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Launch FastAPI server (reads $PORT dynamically from environment)
CMD ["python", "-m", "backend.app.server"]
