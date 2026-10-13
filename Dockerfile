# APEX Cloud Production Container
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure data directories exist and have open permissions for non-root containers
RUN mkdir -p /app/data /app/data/history /app/data/exports /app/data/memory /app/data/knowledge_vault && \
    chmod -R 777 /app/data

# Hugging Face Spaces listens on port 7860 by default
EXPOSE 7860

CMD ["sh", "-c", "uvicorn run:app --host 0.0.0.0 --port ${PORT:-7860}"]
