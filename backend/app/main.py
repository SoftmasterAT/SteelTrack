"""
SteelTrack API - Hauptmodul.

Dieses Modul initialisiert die FastAPI-Anwendung, konfiguriert die Middleware,
bindet die Datenbank-Modelle an und serviert sowohl die REST-Endpunkte 
als auch das statische Frontend.

Generierung der Dokumentation:
    $ pdoc ./backend/app -o ./docs
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

# Eigene Module
from app.routes import products, orders
from app.database import engine
from app.models import Base
from app.auth import verify_password, create_token  

load_dotenv()  # Lädt die Variablen aus der .env Datei in das System (os.environ)
Base.metadata.create_all(bind=engine)  # Erstellt die Tabellen in der Datenbank basierend auf den Modellen

app = FastAPI(
    title="SteelTrack API",
    description="Lagerverwaltungssystem für Stahlprodukte mit SQL & NoSQL Logging.",
    version="1.1"
)

# CORS-Konfiguration für die Entwicklung (lokal & Remote)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API-Routen einbinden
app.include_router(products.router)
app.include_router(orders.router)

# --- LOGIN ENDPUNKT ---
@app.post("/login", tags=["Auth"])
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")
    # Validierung gegen .env Hashes
    if username == "admin" and verify_password(password, os.getenv("STEELTRACK_ADMIN_HASH")):
        role = "admin"
    elif username == "staff" and verify_password(password, os.getenv("STAFF_HASH")):
        role = "staff"
    else:
        raise HTTPException(status_code=401, detail="Falsche Logindaten")
    
    token = create_token(username, role)
    return {"token": token, "role": role}

# --- FRONTEND INTEGRATION ---

# Absoluter Pfad zum SteelTrack-Hauptverzeichnis
# (geht zwei Ebenen hoch von backend/app/main.py)
BASE_PATH = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_PATH = os.path.join(BASE_PATH, "frontend")

# Statische Dateien (JS, CSS, Bilder) unter /static verfügbar machen
app.mount("/static", StaticFiles(directory=FRONTEND_PATH), name="static")

@app.get("/", tags=["Frontend"])
async def read_index():
    """
    Serviert die Hauptseite der Anwendung.
    
    Returns:
        FileResponse: Die index.html Datei aus dem Frontend-Ordner.
    """
    return FileResponse(os.path.join(FRONTEND_PATH, "index.html"))

@app.get("/status", tags=["System"])
def root():
    """System-Health-Check Endpunkt."""
    return {"message": "SteelTrack API läuft 🚀", "status": "online"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)