import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from database import engine
import models

models.Base.metadata.create_all(bind=engine)

# Migrasi ringan: pastikan kolom photo_url ada (idempoten, aman diulang)
with engine.begin() as conn:
    conn.execute(
        text("ALTER TABLE animals ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500)")
    )

# Folder upload
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(UPLOADS_DIR, "animals"), exist_ok=True)

from routers import (
    auth_router,
    animals,
    health_records,
    productions,
    feed_inventory,
    feeding_schedules,
    dashboard,
)

app = FastAPI(
    title="FarmTrack API",
    description="Backend untuk aplikasi manajemen kandang ternak FarmTrack",
    version="1.0.0",
)

# CORS: izinkan frontend React (Vite port 5173) mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router)
app.include_router(animals.router)
app.include_router(health_records.router)
app.include_router(productions.router)
app.include_router(feed_inventory.router)
app.include_router(feeding_schedules.router)
app.include_router(dashboard.router)

# Static files (foto hewan yang diupload)
# Diakses frontend lewat /api/uploads/... (proxy Vite membuang prefix /api)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.get("/")
def root():
    return {"message": "FarmTrack API is running", "docs": "/docs"}
