import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

# Lädt die Variablen aus der .env Datei in das System (os.environ)
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_local_only_123")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_token(username: str, role: str):
    expire = datetime.now(timezone.utc) + timedelta(hours=8)
    return jwt.encode({"sub": username, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_curent_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """Validiert den JWT Token und gibt die User-Daten zurück."""
    try:
        payload = jwt.decode(auth.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload # Enthält 'sub' (Name) und 'role'
    except JWTError:
        raise HTTPException(status_code=401, detail="Ungültiges Token")