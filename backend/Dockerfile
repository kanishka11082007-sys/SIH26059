# =============================================================================
# PolarNav (SIH26059) Unified Backend Dockerfile
# Self-contained: Packages FastAPI Platform + Antarctic AI/ML Navigation Engine
# =============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for geospatial/GIS libraries & healthcheck curl
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

# Copy entire backend source code, trained models, configurations, and data
COPY . .

# Configure Python search paths
ENV PYTHONPATH="/app:/app/src"
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "app.server"]
