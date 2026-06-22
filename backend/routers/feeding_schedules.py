from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from auth import get_current_user, require_owner, require_owner_or_staff, get_farm_user_ids
import models
import schemas

router = APIRouter(prefix="/feeding-schedules", tags=["Jadwal Pakan"])


@router.get("", response_model=List[schemas.FeedingScheduleOut])
def list_schedules(
    animal_type: Optional[str]  = Query(None),
    is_active:   Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    owner_id = current_user.id if current_user.role == "owner" else current_user.owner_id
    q = db.query(models.FeedingSchedule).filter(
        models.FeedingSchedule.user_id == owner_id
    )
    if animal_type:
        q = q.filter(models.FeedingSchedule.animal_type == animal_type)
    if is_active is not None:
        q = q.filter(models.FeedingSchedule.is_active == is_active)

    return q.order_by(models.FeedingSchedule.feeding_time).all()


@router.post("", response_model=schemas.FeedingScheduleOut, status_code=201)
def create_schedule(
    payload: schemas.FeedingScheduleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),
):
    owner_id = current_user.id if current_user.role == "owner" else current_user.owner_id

    feed = db.query(models.FeedInventory).filter(
        models.FeedInventory.id == payload.feed_id,
        models.FeedInventory.user_id == owner_id
    ).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Jenis pakan tidak ditemukan")

    schedule = models.FeedingSchedule(**payload.model_dump(), user_id=owner_id)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/{schedule_id}", response_model=schemas.FeedingScheduleOut)
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    return _get_or_404(schedule_id, current_user, db)


@router.put("/{schedule_id}", response_model=schemas.FeedingScheduleOut)
def update_schedule(
    schedule_id: int,
    payload: schemas.FeedingScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    schedule = _get_or_404(schedule_id, current_user, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),  
):
    schedule = _get_or_404(schedule_id, current_user, db)
    db.delete(schedule)
    db.commit()


# ── helper ────────────────────────────────────────────────────
def _get_or_404(schedule_id: int, current_user: models.User, db: Session) -> models.FeedingSchedule:
    owner_id = current_user.id if current_user.role == "owner" else current_user.owner_id
    schedule = db.query(models.FeedingSchedule).filter(
        models.FeedingSchedule.id == schedule_id,
        models.FeedingSchedule.user_id == owner_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Jadwal pakan tidak ditemukan")
    return schedule