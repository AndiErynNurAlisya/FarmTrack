from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from auth import get_current_user, require_owner, get_farm_user_ids
import models
import schemas

router = APIRouter(prefix="/animals", tags=["Ternak"])


@router.get("", response_model=List[schemas.AnimalOut])
def list_animals(
    animal_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user_ids = get_farm_user_ids(current_user, db)
    q = db.query(models.Animal).filter(models.Animal.user_id.in_(user_ids))

    if animal_type:
        q = q.filter(models.Animal.animal_type == animal_type)
    if status:
        q = q.filter(models.Animal.status == status)
    if search:
        q = q.filter(models.Animal.tag_number.ilike(f"%{search}%"))

    return q.order_by(models.Animal.created_at.desc()).all()


@router.post("", response_model=schemas.AnimalOut, status_code=201)
def create_animal(
    payload: schemas.AnimalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),
):
    # ✅ cek duplikat tag hanya dalam farm owner ini
    existing = db.query(models.Animal).filter(
        models.Animal.user_id == current_user.id,
        models.Animal.tag_number == payload.tag_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Tag '{payload.tag_number}' sudah digunakan di peternakan ini")

    animal = models.Animal(**payload.model_dump(), user_id=current_user.id)
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


@router.get("/{animal_id}", response_model=schemas.AnimalOut)
def get_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _get_or_404(animal_id, current_user, db)


@router.put("/{animal_id}", response_model=schemas.AnimalOut)
def update_animal(
    animal_id: int,
    payload: schemas.AnimalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),
):
    animal = _get_or_404(animal_id, current_user, db)

    # ✅ jika tag_number diubah, cek duplikat dalam farm yang sama
    new_tag = payload.model_dump(exclude_unset=True).get("tag_number")
    if new_tag and new_tag != animal.tag_number:
        conflict = db.query(models.Animal).filter(
            models.Animal.user_id == animal.user_id,
            models.Animal.tag_number == new_tag,
            models.Animal.id != animal_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail=f"Tag '{new_tag}' sudah digunakan di peternakan ini")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(animal, field, value)

    db.commit()
    db.refresh(animal)
    return animal


@router.delete("/{animal_id}", status_code=204)
def delete_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),
):
    animal = _get_or_404(animal_id, current_user, db)
    db.delete(animal)
    db.commit()


# ── helper ────────────────────────────────────────────────────
def _get_or_404(animal_id: int, current_user: models.User, db: Session) -> models.Animal:
    user_ids = get_farm_user_ids(current_user, db)
    animal = db.query(models.Animal).filter(
        models.Animal.id == animal_id,
        models.Animal.user_id.in_(user_ids)
    ).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Hewan tidak ditemukan")
    return animal