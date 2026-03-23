FROM python:3.12-slim

WORKDIR /app

# System-Tools für Bcrypt
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Abhängigkeiten kopieren und installieren
COPY backend/pyproject.toml ./backend/
RUN pip install ./backend/

# Gesamten Code kopieren
COPY . .

# WICHTIG: Setze den PYTHONPATH auf das Verzeichnis, das 'app' enthält
ENV PYTHONPATH=/app/backend

# Korrekter Startbefehl: modul.submodul:variable
# Da PYTHONPATH=/app/backend ist, findet er 'app.main'
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
