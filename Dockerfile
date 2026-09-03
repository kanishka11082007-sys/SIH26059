# =============================================================================
# PolarNav (SIH26059) Backend Production Dockerfile (Render / Railway / Cloud)
# Automatically detected by Render, Railway, and Cloud platforms
# =============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for geospatial/GIS libraries
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

# Copy both backend modules: AI Engine & Platform Services
COPY antarctic-ai/ /app/antarctic-ai/
COPY SIH26059/backend/ /app/SIH26059/backend/

# Configure Python search path across both packages
ENV PYTHONPATH="/app/SIH26059:/app/antarctic-ai"
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "uvicorn", "backend.app.server:app", "--host", "0.0.0.0", "--port", "8000"]
