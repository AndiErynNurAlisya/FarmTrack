from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import date, time, datetime
from decimal import Decimal


# ─────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name:      str = Field(min_length=2, max_length=100)
    email:     EmailStr
    password:  str = Field(min_length=8, max_length=72)
    role:      Optional[Literal["owner", "staff", "veterinary"]] = "staff"
    farm_name: Optional[str] = None
    owner_id:  Optional[int] = None 

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"


# ─────────────────────────────────────────────
# User
# ─────────────────────────────────────────────
class UserUpdate(BaseModel):
    name:      Optional[str] = None
    farm_name: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password:     str = Field(min_length=8, max_length=72)

class AccountDeleteRequest(BaseModel):
    password: str

class UserOut(BaseModel):
    id:        int
    name:      str
    email:     str
    role:      str
    farm_name: Optional[str]
    owner_id:  Optional[int] = None
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Animal
# ─────────────────────────────────────────────

class AnimalCreate(BaseModel):
    tag_number:    str = Field(min_length=1, max_length=50)
    animal_type:   Literal["sapi", "kambing", "ayam", "domba"]
    breed:         Optional[str] = None
    birth_date:    Optional[date] = None
    weight_kg:     Optional[Decimal] = Field(default=None, gt=0)
    gender:        Optional[Literal["jantan", "betina"]] = None
    status:        Optional[Literal["sehat", "sakit", "kritis", "mati"]] = "sehat"
    purchase_date: Optional[date] = None
    notes:         Optional[str] = None

class AnimalUpdate(BaseModel):
    tag_number:    Optional[str] = Field(default=None, min_length=1, max_length=50)
    animal_type:   Optional[Literal["sapi", "kambing", "ayam", "domba"]] = None
    breed:         Optional[str] = None
    birth_date:    Optional[date] = None
    weight_kg:     Optional[Decimal] = Field(default=None, gt=0)
    gender:        Optional[Literal["jantan", "betina"]] = None
    status:        Optional[Literal["sehat", "sakit", "kritis", "mati"]] = None
    purchase_date: Optional[date] = None
    notes:         Optional[str] = None

class AnimalOut(BaseModel):
    id:            int
    user_id:       int
    tag_number:    str
    animal_type:   str
    breed:         Optional[str]
    birth_date:    Optional[date]
    weight_kg:     Optional[Decimal]
    gender:        Optional[str]
    status:        str
    purchase_date: Optional[date]
    notes:         Optional[str]
    created_at:    Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Health Record
# ─────────────────────────────────────────────

class HealthRecordCreate(BaseModel):
    animal_id:         int
    check_date:        date
    disease:           Optional[str] = None
    symptoms:          Optional[str] = None
    treatment:         Optional[str] = None
    medicine_name:     Optional[str] = None
    next_vaccine_date: Optional[date] = None
    handled_by:        Optional[int] = None

class HealthRecordUpdate(BaseModel):
    check_date:        Optional[date] = None
    disease:           Optional[str] = None
    symptoms:          Optional[str] = None
    treatment:         Optional[str] = None
    medicine_name:     Optional[str] = None
    next_vaccine_date: Optional[date] = None
    handled_by:        Optional[int] = None

class HealthRecordOut(BaseModel):
    id:                int
    animal_id:         int
    check_date:        date
    disease:           Optional[str]
    symptoms:          Optional[str]
    treatment:         Optional[str]
    medicine_name:     Optional[str]
    next_vaccine_date: Optional[date]
    handled_by:        Optional[int]
    created_at:        Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Production
# ─────────────────────────────────────────────

class ProductionCreate(BaseModel):
    animal_id:       int
    production_date: date
    product_type:    Literal["susu", "telur", "wol", "daging"]
    quantity:        Decimal = Field(gt=0)
    unit:            Optional[str] = None
    selling_price:   Optional[Decimal] = Field(default=None, ge=0)
    notes:           Optional[str] = None

class ProductionUpdate(BaseModel):
    production_date: Optional[date] = None
    product_type:    Optional[Literal["susu", "telur", "wol", "daging"]] = None
    quantity:        Optional[Decimal] = Field(default=None, gt=0)
    unit:            Optional[str] = None
    selling_price:   Optional[Decimal] = Field(default=None, ge=0)
    notes:           Optional[str] = None

class ProductionOut(BaseModel):
    id:              int
    animal_id:       int
    production_date: date
    product_type:    str
    quantity:        Decimal
    unit:            Optional[str]
    selling_price:   Optional[Decimal]
    notes:           Optional[str]
    created_at:      Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Feed Inventory
# ─────────────────────────────────────────────

class FeedInventoryCreate(BaseModel):
    feed_name:         str = Field(min_length=1, max_length=100)
    current_stock_kg:  Decimal = Field(ge=0)
    min_stock_alert:   Decimal = Field(ge=0)
    unit_price:        Optional[Decimal] = Field(default=None, ge=0)
    last_restock_date: Optional[date] = None
    supplier:          Optional[str] = None

class FeedInventoryUpdate(BaseModel):
    feed_name:         Optional[str] = Field(default=None, min_length=1, max_length=100)
    current_stock_kg:  Optional[Decimal] = Field(default=None, ge=0)
    min_stock_alert:   Optional[Decimal] = Field(default=None, ge=0)
    unit_price:        Optional[Decimal] = Field(default=None, ge=0)
    last_restock_date: Optional[date] = None
    supplier:          Optional[str] = None

class FeedInventoryOut(BaseModel):
    id:                int
    feed_name:         str
    current_stock_kg:  Decimal
    min_stock_alert:   Decimal
    unit_price:        Optional[Decimal]
    last_restock_date: Optional[date]
    supplier:          Optional[str]
    created_at:        Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Feeding Schedule
# ─────────────────────────────────────────────

class FeedingScheduleCreate(BaseModel):
    animal_type:  Literal["sapi", "kambing", "ayam", "domba"]
    feed_id:      int
    feeding_time: time
    portion_kg:   Decimal = Field(gt=0)
    is_active:    Optional[bool] = True
    notes:        Optional[str] = None

class FeedingScheduleUpdate(BaseModel):
    animal_type:  Optional[Literal["sapi", "kambing", "ayam", "domba"]] = None
    feed_id:      Optional[int] = None
    feeding_time: Optional[time] = None
    portion_kg:   Optional[Decimal] = Field(default=None, gt=0)
    is_active:    Optional[bool] = None
    notes:        Optional[str] = None

class FeedingScheduleOut(BaseModel):
    id:           int
    animal_type:  str
    feed_id:      int
    feeding_time: time
    portion_kg:   Decimal
    is_active:    bool
    notes:        Optional[str]
    created_at:   Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Dashboard summary
# ─────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_animals:       int
    sehat:               int
    observasi:           int
    kritis:              int
    produksi_hari_ini:   float
    stok_kritis:         list[dict]
    aktivitas_terakhir:  list[dict]
