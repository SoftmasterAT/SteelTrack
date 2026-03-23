FROM python:3.12-slim

WORKDIR /app

# System-Abhängigkeiten
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Zuerst nur die pyproject.toml für schnelleres Caching
COPY backend/pyproject.toml ./backend/
RUN pip install ./backend/

# Gesamten Code kopieren
COPY . .

# Ordner für Logs und DB explizit erstellen
RUN mkdir -p /app/backend/logs

# Umgebungsvariablen
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1

# Render nutzt oft Port 10000 oder 8000, wir fixieren 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
