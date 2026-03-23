from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Order, Product
from pydantic import BaseModel
from app.services.logger import log_action
from datetime import datetime, timezone

router = APIRouter(prefix="/orders", tags=["Orders"])

class OrderCreate(BaseModel):
    product_id: int
    quantity: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == order.product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    if product.stock < order.quantity:
        raise HTTPException(status_code=400, detail="Nicht genügend Lagerbestand")

    total_price = product.price * order.quantity

    new_order = Order(
        product_id=order.product_id,
        quantity=order.quantity,
        total_price=total_price
    )

    product.stock -= order.quantity

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    await log_action("CREATE_ORDER", {
        "product_id": order.product_id,
        "quantity": order.quantity
    })

    return {
        "message": "Order erfolgreich",
        "order_id": new_order.id
    }


@router.post("/checkout")
async def checkout_card(cart_items: list[dict], db: Session = Depends(get_db)):
    """
    Simuliert den Checkout-Prozess für eine Liste von Produkten im Warenkorb.
    
    Args:
        cart_items (list[dict]): Liste von Produkten mit 'id' und 'quantity'.
    """
    results = []
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item["id"]).first()
        if product and product.stock >= item["quantity"]:

            #bestand aktualisieren
            product.stock -= item["quantity"]
            # Order-Eintrag erstellen
            new_order = Order(
                product_id=item["id"],
                quantity=item["quantity"],
                total_price=product.price * item["quantity"],
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_order)
            results.append({"product_id": item["id"], "status": "bestellt"})
        else:
            results.append({"id": item["id"], "status": "failed", "reason": "nicht verfügbar"})
            
    db.commit()
    await log_action("CART_CHECKOUT", {"items_count": len(results)})
    return {"results": results}