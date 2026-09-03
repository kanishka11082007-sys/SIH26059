# =============================================================================
# PolarNav (SIH26059) Unified Production Dockerfile
# Multi-stage build: Builds React frontend -> Serves via FastAPI + Uvicorn
# =============================================================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY SIH26059/frontend/package*.json ./
RUN npm ci

COPY SIH26059/frontend/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install system dependencies required for geospatial libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python production dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and AI engine code
COPY antarctic-ai/ /app/antarctic-ai/
COPY SIH26059/ /app/SIH26059/

# Copy compiled frontend from Stage 1 into backend's static directory
COPY --from=frontend-builder /app/frontend/dist /app/SIH26059/frontend/dist

# Set Python path
ENV PYTHONPATH="/app/SIH26059:/app/antarctic-ai"
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "uvicorn", "backend.app.server:app", "--host", "0.0.0.0", "--port", "8000"]
