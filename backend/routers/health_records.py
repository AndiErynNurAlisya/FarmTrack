from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from auth import get_current_user, require_owner, get_farm_user_ids
import models
import schemas

router = APIRouter(prefix="/health-records", tags=["Kesehatan"])


@router.get("", response_model=List[schemas.HealthRecordOut])
def list_health_records(
    animal_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user_ids = get_farm_user_ids(current_user, db)
    q = (
        db.query(models.HealthRecord)
        .join(models.Animal)
        .filter(models.Animal.user_id.in_(user_ids))
    )
    if animal_id:
        q = q.filter(models.HealthRecord.animal_id == animal_id)

    return q.order_by(models.HealthRecord.check_date.desc()).all()


@router.post("", response_model=schemas.HealthRecordOut, status_code=201)
def create_health_record(
    payload: schemas.HealthRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  
):
    _verify_animal_access(payload.animal_id, current_user, db)

    data = payload.model_dump()
    data["handled_by"] = current_user.id

    record = models.HealthRecord(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}", response_model=schemas.HealthRecordOut)
def get_health_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _get_or_404(record_id, current_user, db)


@router.put("/{record_id}", response_model=schemas.HealthRecordOut)
def update_health_record(
    record_id: int,
    payload: schemas.HealthRecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  
):
    record = _get_or_404(record_id, current_user, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_health_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),  
):
    record = _get_or_404(record_id, current_user, db)
    db.delete(record)
    db.commit()


# ── helpers ───────────────────────────────────────────────────
def _get_or_404(record_id: int, current_user: models.User, db: Session) -> models.HealthRecord:
    user_ids = get_farm_user_ids(current_user, db)
    record = (
        db.query(models.HealthRecord)
        .join(models.Animal)
        .filter(
            models.HealthRecord.id == record_id,
            models.Animal.user_id.in_(user_ids),
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Catatan kesehatan tidak ditemukan")
    return record


def _verify_animal_access(animal_id: int, current_user: models.User, db: Session):
    user_ids = get_farm_user_ids(current_user, db)
    animal = db.query(models.Animal).filter(
        models.Animal.id == animal_id,
        models.Animal.user_id.in_(user_ids)
    ).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Hewan tidak ditemukan")