"""
Service-Modul für das NoSQL-Audit-Logging.
Verwendet TinyDB zur lokalen Speicherung von Aktionen in einer JSON-Datei,
um eine externe Datenbank-Infrastruktur für Demos zu vermeiden.
"""
from tinydb import TinyDB
from datetime import datetime, timezone
import os

# Pfad zur JSON-Datei für das Audit-Log
LOG_DB_PATH = os.path.join(os.path.dirname(__file__), "../logs/audit_logs.json")
db = TinyDB(LOG_DB_PATH)

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