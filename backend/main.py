from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
import models

# buat semua tabel saat startup
models.Base.metadata.create_all(bind=engine)

from routers import auth_router, animals, health_records, productions, feed_inventory, feeding_schedules, dashboard

app = FastAPI(
    title="FarmTrack API",
    description="Backend untuk aplikasi manajemen kandang ternak FarmTrack",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────
# Izinkan frontend React (Vite default port 5173) mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(animals.router)
app.include_router(health_records.router)
app.include_router(productions.router)
app.include_router(feed_inventory.router)
app.include_router(feeding_schedules.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "FarmTrack API is running", "docs": "/docs"}
