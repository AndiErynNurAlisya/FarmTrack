from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from auth import get_current_user, require_owner, require_owner_or_staff, get_farm_user_ids
import models
import schemas

router = APIRouter(prefix="/feed-inventory", tags=["Stok Pakan"])


@router.get("", response_model=List[schemas.FeedInventoryOut])
def list_feeds(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    user_ids = get_farm_user_ids(current_user, db)
    return (
        db.query(models.FeedInventory)
        .filter(models.FeedInventory.user_id.in_(user_ids))
        .order_by(models.FeedInventory.feed_name)
        .all()
    )

@router.get("/low-stock", response_model=List[schemas.FeedInventoryOut])
def low_stock_feeds(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    user_ids = get_farm_user_ids(current_user, db)
    return (
        db.query(models.FeedInventory)
        .filter(
            models.FeedInventory.user_id.in_(user_ids),
            models.FeedInventory.current_stock_kg <= models.FeedInventory.min_stock_alert
        )
        .all()
    )

@router.post("", response_model=schemas.FeedInventoryOut, status_code=201)
def create_feed(
    payload: schemas.FeedInventoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    owner_id = current_user.id if current_user.role == "owner" else current_user.owner_id
    feed = models.FeedInventory(**payload.model_dump(), user_id=owner_id)
    db.add(feed)
    db.commit()
    db.refresh(feed)
    return feed


@router.get("/{feed_id}", response_model=schemas.FeedInventoryOut)
def get_feed(
    feed_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),
):
    return _get_or_404(feed_id, current_user, db)


@router.put("/{feed_id}", response_model=schemas.FeedInventoryOut)
def update_feed(
    feed_id: int,
    payload: schemas.FeedInventoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner_or_staff),  
):
    feed = _get_or_404(feed_id, current_user, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(feed, field, value)

    db.commit()
    db.refresh(feed)
    return feed


@router.delete("/{feed_id}", status_code=204)
def delete_feed(
    feed_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),
):
    feed = _get_or_404(feed_id, current_user, db)
    db.delete(feed)
    db.commit()


# ── helper ────────────────────────────────────────────────────
def _get_or_404(feed_id: int, current_user: models.User, db: Session) -> models.FeedInventory:
    owner_id = current_user.id if current_user.role == "owner" else current_user.owner_id
    feed = db.query(models.FeedInventory).filter(
        models.FeedInventory.id == feed_id,
        models.FeedInventory.user_id == owner_id
    ).first()
    if not feed:
        raise HTTPException(status_code=404, detail="Data pakan tidak ditemukan")
    return feed