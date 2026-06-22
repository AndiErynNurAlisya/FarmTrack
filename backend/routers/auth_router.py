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
    if not payload.farm_name or not payload.farm_name.strip():
        raise HTTPException(status_code=400, detail="Nama peternakan wajib diisi")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = models.User(
        name          = payload.name,
        email         = payload.email,
        password_hash = hash_password(payload.password),
        role          = "owner",    
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
    current_user: models.User = Depends(require_owner),  
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
        role          = payload.role,           
        farm_name     = None,                   
        owner_id      = current_user.id,        
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
        models.User.owner_id == current_user.id  
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


# ── Update profil sendiri ─────────────────────────────────────
@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)

    if "name" in data and data["name"] is not None:
        current_user.name = data["name"]

    if "farm_name" in data and current_user.role == "owner":
        current_user.farm_name = data["farm_name"]

    db.commit()
    db.refresh(current_user)
    return current_user


# ── Ubah kata sandi sendiri ──────────────────────────
@router.put("/me/password", status_code=204)
def change_my_password(
    payload: schemas.PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Kata sandi saat ini salah")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Kata sandi baru minimal 8 karakter")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()


# ── Hapus akun sendiri ─────────────────────────────
@router.delete("/me", status_code=204)
def delete_my_account(
    payload: schemas.AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Kata sandi salah")

    if current_user.role == "owner":
        member_ids = [
            u.id for u in db.query(models.User)
            .filter(models.User.owner_id == current_user.id).all()
        ]
        farm_user_ids = [current_user.id] + member_ids

        db.query(models.HealthRecord).filter(
            models.HealthRecord.handled_by.in_(farm_user_ids)
        ).update({models.HealthRecord.handled_by: None}, synchronize_session=False)

        for animal in db.query(models.Animal).filter(
            models.Animal.user_id.in_(farm_user_ids)
        ).all():
            db.delete(animal)

        for feed in db.query(models.FeedInventory).filter(
            models.FeedInventory.user_id.in_(farm_user_ids)
        ).all():
            db.delete(feed)

        for member in db.query(models.User).filter(
            models.User.owner_id == current_user.id
        ).all():
            db.delete(member)

        db.flush()
        db.delete(current_user)
        db.commit()
    else:
        db.query(models.HealthRecord).filter(
            models.HealthRecord.handled_by == current_user.id
        ).update({models.HealthRecord.handled_by: None}, synchronize_session=False)
        db.delete(current_user)
        db.commit()
