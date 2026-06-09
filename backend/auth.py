from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
import models

# ── Config ────────────────────────────────────────────────────
SECRET_KEY  = "farmtrack-secret-key-change-in-production"
ALGORITHM   = "HS256"
EXPIRE_MINS = 60 * 24  # 1 day

# ── Helpers ───────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=EXPIRE_MINS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ── Dependency: current logged-in user ────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah kadaluarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def require_owner(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Hanya owner."""
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fitur ini hanya dapat diakses oleh owner"
        )
    return current_user


def require_owner_or_staff(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Owner dan staff — tidak termasuk veterinary."""
    if current_user.role not in ["owner", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fitur ini hanya dapat diakses oleh owner atau staff"
        )
    return current_user


def require_any_role(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Semua role boleh akses (owner, staff, veterinary) — asal sudah login."""
    if current_user.role not in ["owner", "staff", "veterinary"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak"
        )
    return current_user


def get_farm_user_ids(current_user: models.User, db: Session) -> list[int]:
    """Ambil semua user_id dalam satu farm (owner + staff + veterinary)."""
    if current_user.role == "owner":
        owner_id = current_user.id
    else:
        owner_id = current_user.owner_id or current_user.id

    member_ids = [
        u.id for u in db.query(models.User)
        .filter(models.User.owner_id == owner_id).all()
    ]
    return list(set([owner_id] + member_ids))