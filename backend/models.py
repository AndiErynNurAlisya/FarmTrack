from sqlalchemy import (
    Numeric, UniqueConstraint,
    Column, Integer, String, Text, Date, Time,
    DateTime, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role          = Column(String(10), nullable=False, default="staff")
    farm_name     = Column(String(100))
    owner_id      = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at    = Column(DateTime, server_default=func.now())

    # relationships
    animals        = relationship("Animal", back_populates="owner", foreign_keys="Animal.user_id")
    health_handled = relationship("HealthRecord", back_populates="handler", foreign_keys="HealthRecord.handled_by")
    
    # self-referential: owner → staff
    staff_members  = relationship(
        "User",
        foreign_keys="User.owner_id",
        back_populates="owner_user"   
    )
    owner_user = relationship(
        "User",
        foreign_keys=[owner_id],
        back_populates="staff_members",
        remote_side="User.id"         
    )

    feed_inventories  = relationship("FeedInventory", back_populates="owner", foreign_keys="FeedInventory.user_id")
    feeding_schedules = relationship("FeedingSchedule", back_populates="owner", foreign_keys="FeedingSchedule.user_id")

class Animal(Base):
    __tablename__ = "animals"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)  
    tag_number    = Column(String(50), nullable=False, index=True)            
    animal_type   = Column(String(10), nullable=False)   
    breed         = Column(String(100))
    birth_date    = Column(Date)
    weight_kg     = Column(Numeric(10, 2))
    gender        = Column(String(10))                   
    status        = Column(String(10), nullable=False, default="sehat")  
    purchase_date = Column(Date)
    notes         = Column(Text)
    created_at    = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'tag_number', name='uq_animal_tag_per_owner'),
    )

    # relationships
    owner          = relationship("User", back_populates="animals", foreign_keys=[user_id])
    health_records = relationship("HealthRecord", back_populates="animal", cascade="all, delete-orphan")
    productions    = relationship("Production", back_populates="animal", cascade="all, delete-orphan")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id                = Column(Integer, primary_key=True, index=True)
    animal_id         = Column(Integer, ForeignKey("animals.id"), nullable=False)
    check_date        = Column(Date, nullable=False)
    disease           = Column(String(100))
    symptoms          = Column(Text)
    treatment         = Column(Text)
    medicine_name     = Column(String(100))
    next_vaccine_date = Column(Date)
    handled_by        = Column(Integer, ForeignKey("users.id"))
    created_at        = Column(DateTime, server_default=func.now())

    # relationships
    animal  = relationship("Animal", back_populates="health_records")
    handler = relationship("User", back_populates="health_handled", foreign_keys=[handled_by])


class Production(Base):
    __tablename__ = "productions"

    id              = Column(Integer, primary_key=True, index=True)
    animal_id       = Column(Integer, ForeignKey("animals.id"), nullable=False)
    production_date = Column(Date, nullable=False)
    product_type    = Column(String(10), nullable=False)  
    quantity        = Column(Numeric(10, 2), nullable=False)
    unit            = Column(String(20))                  
    selling_price   = Column(Numeric(10, 2))
    notes           = Column(Text)
    created_at      = Column(DateTime, server_default=func.now())

    # relationships
    animal = relationship("Animal", back_populates="productions")


class FeedInventory(Base):
    __tablename__ = "feed_inventory"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, ForeignKey("users.id"), nullable=False)  # FIX: tambah user_id
    feed_name         = Column(String(100), nullable=False)
    current_stock_kg  = Column(Numeric(10, 2), nullable=False, default=0)
    min_stock_alert   = Column(Numeric(10, 2), nullable=False, default=0)
    unit_price        = Column(Numeric(10, 2))
    last_restock_date = Column(Date)
    supplier          = Column(String(100))
    created_at        = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'feed_name', name='uq_feed_name_per_owner'),
    )

    # relationships
    owner             = relationship("User", back_populates="feed_inventories", foreign_keys=[user_id])
    feeding_schedules = relationship("FeedingSchedule", back_populates="feed", cascade="all, delete-orphan")


class FeedingSchedule(Base):
    __tablename__ = "feeding_schedules"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)  
    animal_type  = Column(String(10), nullable=False)   
    feed_id      = Column(Integer, ForeignKey("feed_inventory.id"), nullable=False)
    feeding_time = Column(Time, nullable=False)
    portion_kg   = Column(Numeric(10, 2), nullable=False)
    is_active    = Column(Boolean, default=True)
    notes        = Column(Text)
    created_at   = Column(DateTime, server_default=func.now())

    # relationships
    owner = relationship("User", back_populates="feeding_schedules", foreign_keys=[user_id])
    feed  = relationship("FeedInventory", back_populates="feeding_schedules")