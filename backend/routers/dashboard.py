from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, timedelta

from database import get_db
from auth import get_current_user, get_farm_user_ids
import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Laporan"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user_ids = get_farm_user_ids(current_user, db)
    today = date.today()

    total_animals = db.query(models.Animal).filter(
        models.Animal.user_id.in_(user_ids)
    ).count()

    status_counts = (
        db.query(models.Animal.status, func.count(models.Animal.id))
        .filter(models.Animal.user_id.in_(user_ids))
        .group_by(models.Animal.status).all()
    )
    status_map = {s: c for s, c in status_counts}

    type_counts = (
        db.query(models.Animal.animal_type, func.count(models.Animal.id))
        .filter(models.Animal.user_id.in_(user_ids))
        .group_by(models.Animal.animal_type).all()
    )
    type_map = {t: c for t, c in type_counts}

    prod_today = (
        db.query(models.Production.product_type,
                 func.sum(models.Production.quantity).label("total"))
        .join(models.Animal)
        .filter(models.Animal.user_id.in_(user_ids),
                models.Production.production_date == today)
        .group_by(models.Production.product_type).all()
    )
    produksi_hari_ini = {row.product_type: float(row.total) for row in prod_today}
    

    low_stock = db.query(models.FeedInventory).filter(
    models.FeedInventory.user_id.in_(user_ids),
    models.FeedInventory.current_stock_kg <= models.FeedInventory.min_stock_alert
    ).all()

    stok_kritis = [{"id": f.id, "feed_name": f.feed_name,
                    "current_stock_kg": float(f.current_stock_kg),
                    "min_stock_alert": float(f.min_stock_alert)} for f in low_stock]

    recent_animals = (
        db.query(models.Animal)
        .filter(models.Animal.user_id.in_(user_ids))
        .order_by(models.Animal.created_at.desc()).limit(5).all()
    )
    aktivitas = [{"id": a.id, "tag_number": a.tag_number, "animal_type": a.animal_type,
                  "status": a.status, "weight_kg": float(a.weight_kg) if a.weight_kg else None}
                 for a in recent_animals]

    return {"total_animals": total_animals, "per_status": status_map, "per_type": type_map,
            "produksi_hari_ini": produksi_hari_ini, "stok_kritis": stok_kritis,
            "aktivitas_terakhir": aktivitas}


@router.get("/laporan")
def laporan_performa(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user_ids = get_farm_user_ids(current_user, db)
    today    = date.today()
    start    = today.replace(day=1)         

    # ── produksi & estimasi pendapatan per jenis produk ───────
    prod_by_type = (
        db.query(
            models.Production.product_type,
            func.sum(models.Production.quantity).label("qty"),
            func.max(models.Production.unit).label("unit"),
            func.sum(
                models.Production.quantity
                * func.coalesce(models.Production.selling_price, 0)
            ).label("pendapatan"),
        )
        .join(models.Animal)
        .filter(
            models.Animal.user_id.in_(user_ids),
            models.Production.production_date.between(start, today),
        )
        .group_by(models.Production.product_type)
        .all()
    )
    produksi_per_jenis = [
        {
            "jenis": row.product_type,
            "qty": float(row.qty or 0),
            "unit": row.unit or "",
            "pendapatan": float(row.pendapatan or 0),
        }
        for row in prod_by_type
    ]
    total_pendapatan = sum(p["pendapatan"] for p in produksi_per_jenis)

    # ── indeks kesehatan (% sehat) ────────────────────────────
    total = db.query(models.Animal).filter(models.Animal.user_id.in_(user_ids)).count()
    sehat = (
        db.query(models.Animal)
        .filter(models.Animal.user_id.in_(user_ids), models.Animal.status == "sehat")
        .count()
    )
    indeks_kesehatan = round((sehat / total * 100), 1) if total else 0

    # ── konsumsi pakan (jadwal aktif × jumlah hari) ───────────
    jadwal_aktif = (
        db.query(func.sum(models.FeedingSchedule.portion_kg))
        .filter(
            models.FeedingSchedule.user_id.in_(user_ids),
            models.FeedingSchedule.is_active == True,
        )
        .scalar()
    ) or 0
    total_konsumsi_kg = float(jadwal_aktif) * 30

    # ── tren estimasi pendapatan harian (Rp) ──────────────────
    tren_raw = (
            db.query(
                models.Production.production_date,
                func.sum(
                    models.Production.quantity
                    * func.coalesce(models.Production.selling_price, 0)
                ).label("total"),
            )
            .join(models.Animal)
            .filter(
                models.Animal.user_id.in_(user_ids),
                models.Production.production_date.between(start, today),
            )
            .group_by(models.Production.production_date)
            .order_by(models.Production.production_date)
            .all()
        )
    tren_pendapatan = [
            {"tanggal": str(row.production_date), "total": float(row.total or 0)}
            for row in tren_raw
        ]

    return {
        "periode": "bulanan",
        "range": {"dari": str(start), "sampai": str(today)},
        "produksi_per_jenis": produksi_per_jenis,
        "total_pendapatan": total_pendapatan,
        "indeks_kesehatan": indeks_kesehatan,
        "total_konsumsi_pakan_kg": total_konsumsi_kg,
        "tren_pendapatan": tren_pendapatan,
    }
