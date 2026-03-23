import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = Path(__file__).resolve().parent.parent

# Pfad zur DB: /app/backend/steeltrack.db
db_path = BASE_DIR / "steeltrack.db"
DATABASE_URL = f"sqlite:///{db_path}"

print(f"--- DATABASE STATUS ---")
print(f"Suche Datenbank unter: {db_path}")
print(f"Datenbank existiert: {'JA' if db_path.exists() else 'NEIN (wird neu erstellt!)'}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
