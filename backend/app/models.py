"""
    Datenbankmodelle für SQLAlchemy (Relationales Schema).
    Definiert die Tabellen 'products' und 'orders'.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from .database import Base

class Product(Base):
    """
    Repräsentiert ein Stahlprodukt im Inventar.
    Diese Struktur kann in IRIS 1:1 als ObjectScript-Klasse gespiegelt werden.
        - name: z.B. "Breitflanschträger"
        - price: Preis pro Einheit
        - stock: Verfügbare Menge im Lager
        - short_sign: Kurzzeichen, z.B. "HEB 300"
        - material: Werkstoffliste, z.B. "S235JR"
        - norm: Abmessungsnorm, z.B. "EN 10025-2"
        - certificate: Werkszeugnis, z.B. "3.1"
        - length: Herstellungslänge in Metern
    """
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]  # z.B. Breitflanschträger
    price: Mapped[float]
    stock: Mapped[int]
    short_sign: Mapped[str]  # Kurzzeichen z.B. HEB 300
    material: Mapped[str]  # Werkstoffliste
    norm: Mapped[str]  # Abmessungsnorm
    certificate: Mapped[str]  # Werkszeugnis (z.B. 3.1)
    length: Mapped[float]  # Herstellungslänge


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer)
    total_price: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc).isoformat(),)


class User(Base):
    """Datenmodell für Benutzer mit Rollen (admin, staff)."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str]
    role: Mapped[str] # 'admin' oder 'staff'