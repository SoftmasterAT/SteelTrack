"""
Service-Modul für das NoSQL-Audit-Logging.
Verwendet TinyDB zur lokalen Speicherung von Aktionen in einer JSON-Datei,
um eine externe Datenbank-Infrastruktur für Demos zu vermeiden.
"""
from tinydb import TinyDB
from datetime import datetime, timezone
import os
from pathlib import Path

# Absoluter Pfad berechnen
BASE_DIR = Path(__file__).resolve().parent.parent.parent # Geht zu /backend
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "audit_logs.json"

# Ordner erstellen, falls nicht vorhanden
LOG_DIR.mkdir(parents=True, exist_ok=True)

db = TinyDB(str(LOG_FILE))

async def log_action(action: str, details: dict):
    """
    Loggt eine Aktion in die NoSQL-JSON-Datei.
    
    Args:
        action (str): Typ der Aktion (z.B. 'STOCK_UPDATE')
        details (dict): Metadaten zur Aktion
    """
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "details": details
    }
    db.insert(log_entry)