from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user, require_owner
import models
import schemas

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Register Owner (publik) ────────────────────────────────────
@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register_owner(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = models.User(
        name          = payload.name,
        email         = payload.email,
        password_hash = hash_password(payload.password),
        role          = "owner",    # selalu owner, tidak bisa dimanipulasi
        farm_name     = payload.farm_name,
        owner_id      = None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Register Staff / Veterinary (hanya owner) ─────────────────
@router.post("/register-member", response_model=schemas.UserOut, status_code=201)
def register_member(
    payload: schemas.RegisterRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),  # wajib login sebagai owner
):
    # validasi role yang boleh didaftarkan
    if payload.role not in ["staff", "veterinary"]:
        raise HTTPException(
            status_code=400,
            detail="Role harus 'staff' atau 'veterinary'"
        )

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = models.User(
        name          = payload.name,
        email         = payload.email,
        password_hash = hash_password(payload.password),
        role          = payload.role,           # staff atau veterinary
        farm_name     = None,                   # ikut farm owner
        owner_id      = current_user.id,        # otomatis terhubung ke owner
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Lihat daftar member dalam farm (hanya owner) ──────────────
@router.get("/members", response_model=list[schemas.UserOut])
def list_members(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),
):
    members = db.query(models.User).filter(
        models.User.owner_id == current_user.id
    ).all()
    return members


# ── Hapus member (hanya owner) ────────────────────────────────
@router.delete("/members/{member_id}", status_code=204)
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_owner),
):
    member = db.query(models.User).filter(
        models.User.id == member_id,
        models.User.owner_id == current_user.id  # pastikan member milik owner ini
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member tidak ditemukan")
    db.delete(member)
    db.commit()


# ── Login ──────────────────────────────────────────────────────
@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


# ── Me ─────────────────────────────────────────────────────────
@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user