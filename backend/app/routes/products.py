from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product
from pydantic import BaseModel
from app.services.logger import log_action

class ProductCreate(BaseModel):
    name: str
    short_sign: str
    material: str
    norm: str
    length: float
    price: float
    stock: int
    certificate: str = "3.1"

router = APIRouter(prefix="/products", tags=["Products"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products

@router.post("/")
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump()) 
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    await log_action("CREATE_PRODUCT", product.model_dump())

    return db_product

@router.put("/{product_id}")
async def update_product(product_id: int, product_data: ProductCreate, db: Session = Depends(get_db)):
    """Aktualisiert ein bestehendes Produkt vollständig."""
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    # Alle Felder vom Pydantic-Modell in das Datenbank-Objekt übertragen
    for key, value in product_data.model_dump().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    await log_action("UPDATE_PRODUCT", {"id": product_id, **product_data.model_dump()})
    return db_product

# Route zum Erhöhen des Lagerbestands (für Admin-Funktion)
@router.patch("/{product_id}/increase")
async def increase_stock(product_id: int, data: dict, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    db_product.stock += data["amount"]
    db.commit()
    return {"new_stock": db_product.stock}

#route zum löschen eines Produkts (für Admin-Funktion)
@router.delete("/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    db.delete(db_product)
    db.commit()
    return {"message": "Gelöscht"}
