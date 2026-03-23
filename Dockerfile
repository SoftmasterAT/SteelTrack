# 1. Basis-Image (Python)
FROM python:3.12-slim

# 2. Arbeitsverzeichnis im Container
WORKDIR /app
RUN chmod -R 777 /app

# System-Abhängigkeiten für Bcrypt/Cryptography
RUN apt-get update && apt-get install -y build-essential libffi-dev && rm -rf /var/lib/apt/lists/*

# Kopiere Anforderungen und installiere sie
COPY backend/pyproject.toml .
RUN pip install .

# 4. Den restlichen Code kopieren
COPY . .

# Setze Umgebungsvariablen
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend

# 5. Port 8000 freigeben
EXPOSE 8000

# Starte die App (Port wird von Render übergeben)
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]
