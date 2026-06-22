from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from database import get_db
from auth import get_current_user, require_owner, require_owner_or_staff, get_farm_user_ids
import models
import schemas

router = APIRouter(prefix="/productions", tags=["Produksi"])

ANIMAL_PRODUCTS = {
    "sapi":    {"susu": "liter", "daging": "kg"},
    "kambing": {"susu": "liter", "daging": "kg"},
    "ayam":    {"telur": "butir", "daging": "kg"},
    "domba":   {"wol": "kg", "daging": "kg"},
}


@router.get("", response_model=List[schemas.ProductionOut])
def list_productions(
    animal_id:    Optional[int]  = Query(None),
    product_type: Optional[str]  = Query(None),
    date_from:    Optional[date] = Query(None),
    date_to:      Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),  
):
    user_ids = get_farm_user_ids(current_user, db)
    q = (
        db.query(models.Production)
        .join(models.Animal)
        .filter(models.Animal.user_id.in_(user_ids))
    )
    if animal_id:
        q = q.filter(models.Production.animal_id == animal_id)
    if product_type:
        q = q.filter(models.Production.product_type == product_type)
    if date_from:
        q = q.filter(models.Production.production_date >= date_from)
    if date_to:
        q = q.filter(models.Production.production_date <= date_to)

    return q.order_by(models.Production.production_date.desc()).all()


@router.post("", response_model=schemas.ProductionOut, status_code=201)
def create_production(
    payload: schemas.ProductionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),  
):
    animal = _verify_animal_access(payload.animal_id, current_user, db)

    allowed = ANIMAL_PRODUCTS.get(animal.animal_type, {})
    if payload.product_type not in allowed:
        pilihan = ", ".join(allowed.keys()) or "tidak ada"
        raise HTTPException(
            status_code=400,
            detail=f"Jenis produk '{payload.product_type}' tidak sesuai untuk {animal.animal_type}. Pilihan yang valid: {pilihan}.",
        )

    prod = models.Production(**payload.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod


@router.get("/summary/today")
def today_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    user_ids = get_farm_user_ids(current_user, db)
    today = date.today()
    result = (
        db.query(
            models.Production.product_type,
            func.sum(models.Production.quantity).label("total"),
        )
        .join(models.Animal)
        .filter(
            models.Animal.user_id.in_(user_ids),
            models.Production.production_date == today,
        )
        .group_by(models.Production.product_type)
        .all()
    )
    return {row.product_type: float(row.total) for row in result}


@router.get("/{production_id}", response_model=schemas.ProductionOut)
def get_production(
    production_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    return _get_or_404(production_id, current_user, db)


@router.put("/{production_id}", response_model=schemas.ProductionOut)
def update_production(
    production_id: int,
    payload: schemas.ProductionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    prod = _get_or_404(production_id, current_user, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prod, field, value)

    db.commit()
    db.refresh(prod)
    return prod


@router.delete("/{production_id}", status_code=204)
def delete_production(
    production_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),  
):
    prod = _get_or_404(production_id, current_user, db)
    db.delete(prod)
    db.commit()


# ── helpers ───────────────────────────────────────────────────
def _get_or_404(prod_id: int, current_user: models.User, db: Session) -> models.Production:
    user_ids = get_farm_user_ids(current_user, db)
    prod = (
        db.query(models.Production)
        .join(models.Animal)
        .filter(
            models.Production.id == prod_id,
            models.Animal.user_id.in_(user_ids),
        )
        .first()
    )
    if not prod:
        raise HTTPException(status_code=404, detail="Data produksi tidak ditemukan")
    return prod


def _verify_animal_access(animal_id: int, current_user: models.User, db: Session) -> models.Animal:
    user_ids = get_farm_user_ids(current_user, db)
    animal = db.query(models.Animal).filter(
        models.Animal.id == animal_id,
        models.Animal.user_id.in_(user_ids)
    ).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Hewan tidak ditemukan")
    return animal