# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
# Production-ready Dockerfile for BlueSphere FastAPI Backend

FROM python:3.11-slim as builder

# Set environment variables for Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies required for ocean data processing
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    libhdf5-dev \
    libnetcdf-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create and use a non-root user
RUN adduser --disabled-password --gecos '' --shell /bin/bash user \
    && chown -R user:user /opt
USER user
WORKDIR /opt

# Copy requirements first for better layer caching
COPY --chown=user:user requirements.txt .

# Install Python dependencies in user space
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/home/user/.local/bin:$PATH" \
    ENVIRONMENT=production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    libhdf5-103 \
    libnetcdf19 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN adduser --disabled-password --gecos '' --shell /bin/bash user
USER user
WORKDIR /opt

# Copy Python packages from builder stage
COPY --from=builder --chown=user:user /home/user/.local /home/user/.local

# Copy application code
COPY --chown=user:user backend/ ./backend/
COPY --chown=user:user requirements.txt .

# Create necessary directories
RUN mkdir -p /opt/logs /opt/data && \
    chmod 755 /opt/logs /opt/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Expose port
EXPOSE 8000

# Production command with Gunicorn
CMD ["sh", "-c", "gunicorn backend.app.main:app -w ${MAX_WORKERS:-4} -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000} --timeout ${TIMEOUT:-120} --keep-alive 5 --max-requests 1000 --access-logfile - --error-logfile - --log-level info"]