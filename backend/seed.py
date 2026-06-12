"""
Seed data dummy FarmTrack.

Jalankan dari folder backend (dengan virtualenv & DB Postgres aktif):
    python seed.py

Skrip ini idempoten: bila dijalankan ulang, data demo lama dihapus dulu
lalu dibuat kembali. Juga membersihkan akun demo domain lama (@farmtrack.test)
yang ditolak EmailStr saat login.

Akun yang dibuat (domain .com agar lolos validasi EmailStr):
    owner       : demo@farmtrack.com     / demo123
    staff       : staff@farmtrack.com    / staff123
    veterinary  : dokter@farmtrack.com   / dokter123
"""
from datetime import date, time, timedelta

from database import SessionLocal, engine
import models
from auth import hash_password

# pastikan tabel ada
models.Base.metadata.create_all(bind=engine)

TODAY = date.today()

OWNER_EMAIL = "demo@farmtrack.com"
STAFF_EMAIL = "staff@farmtrack.com"
VET_EMAIL = "dokter@farmtrack.com"

# email demo yang mungkin pernah dibuat (untuk dibersihkan), termasuk domain lama .test
DEMO_EMAILS = [
    OWNER_EMAIL, STAFF_EMAIL, VET_EMAIL,
    "demo@farmtrack.test", "staff@farmtrack.test", "dokter@farmtrack.test",
]


def purge_demo(db):
    """Hapus semua user demo (apapun domainnya) beserta seluruh datanya."""
    users = db.query(models.User).filter(models.User.email.in_(DEMO_EMAILS)).all()
    if not users:
        return
    user_ids = [u.id for u in users]

    animal_ids = [a.id for a in db.query(models.Animal).filter(models.Animal.user_id.in_(user_ids)).all()]
    if animal_ids:
        db.query(models.Production).filter(models.Production.animal_id.in_(animal_ids)).delete(synchronize_session=False)
        db.query(models.HealthRecord).filter(models.HealthRecord.animal_id.in_(animal_ids)).delete(synchronize_session=False)
        db.query(models.Animal).filter(models.Animal.id.in_(animal_ids)).delete(synchronize_session=False)

    db.query(models.FeedingSchedule).filter(models.FeedingSchedule.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(models.FeedInventory).filter(models.FeedInventory.user_id.in_(user_ids)).delete(synchronize_session=False)
    # kosongkan handled_by yang menunjuk user demo (kalau ada catatan milik non-demo)
    db.query(models.HealthRecord).filter(models.HealthRecord.handled_by.in_(user_ids)).update({models.HealthRecord.handled_by: None}, synchronize_session=False)
    db.query(models.User).filter(models.User.id.in_(user_ids)).delete(synchronize_session=False)
    db.commit()


def create_user(db, email, **kwargs):
    user = models.User(email=email, **kwargs)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def main():
    db = SessionLocal()
    try:
        # bersihkan data demo lama (termasuk akun domain .test yang ditolak login)
        purge_demo(db)

        # 1) Owner demo
        owner = create_user(
            db, OWNER_EMAIL,
            name="Pak Budi",
            password_hash=hash_password("demo123"),
            role="owner",
            farm_name="Peternakan Maju Jaya",
            owner_id=None,
        )

        # 2) Staff & Veterinary (sub-user owner)
        staff = create_user(
            db, STAFF_EMAIL,
            name="Sari Staff",
            password_hash=hash_password("staff123"),
            role="staff",
            farm_name=owner.farm_name,
            owner_id=owner.id,
        )
        vet = create_user(
            db, VET_EMAIL,
            name="drh. Andi",
            password_hash=hash_password("dokter123"),
            role="veterinary",
            farm_name=owner.farm_name,
            owner_id=owner.id,
        )

        # 3) 10 hewan beragam
        # (tag, jenis, ras, gender, status, umur_hari, berat)
        animals_def = [
            ("SAPI-001", "sapi",    "Limousin",          "betina", "sehat", 900, 420.0),
            ("SAPI-002", "sapi",    "Simmental",         "betina", "sehat", 750, 390.5),
            ("SAPI-003", "sapi",    "Brahman",           "jantan", "sakit", 600, 510.0),
            ("SAPI-004", "sapi",    "Peranakan Ongole",  "jantan", "mati",  1200, 480.0),
            ("KMB-001",  "kambing", "Etawa",             "betina", "sehat", 400, 55.0),
            ("KMB-002",  "kambing", "Boer",              "betina", "sehat", 365, 48.5),
            ("AYM-001",  "ayam",    "Petelur Lohmann",   "betina", "sehat", 180, 1.8),
            ("AYM-002",  "ayam",    "Broiler",           "jantan", "sehat", 45, 2.2),
            ("DMB-001",  "domba",   "Merino",            "betina", "sehat", 500, 62.0),
            ("DMB-002",  "domba",   "Garut",             "jantan", "sakit", 430, 58.0),
        ]
        animals = {}
        for tag, jenis, ras, gender, status, umur, berat in animals_def:
            a = models.Animal(
                user_id=owner.id,
                tag_number=tag,
                animal_type=jenis,
                breed=ras,
                birth_date=TODAY - timedelta(days=umur),
                weight_kg=berat,
                gender=gender,
                status=status,
                purchase_date=TODAY - timedelta(days=max(umur - 60, 10)),
                notes=f"Data dummy {jenis} - {ras}",
            )
            db.add(a)
            animals[tag] = a
        db.commit()
        for a in animals.values():
            db.refresh(a)

        # 4) Catatan kesehatan (sebagian dengan jadwal vaksin mendatang)
        hr_def = [
            ("SAPI-003", "Kembung",            "Perut membesar, lesu",  "Pemberian obat kembung", "Tympanol",   14),
            ("DMB-002",  "Scabies",            "Gatal, bulu rontok",    "Salep antiparasit",      "Ivermectin",  7),
            ("SAPI-001", "Pemeriksaan rutin",  "Sehat",                 "Vaksinasi rutin",        "Vaksin SE",   30),
            ("KMB-001",  "Pemeriksaan rutin",  "Sehat",                 "Vitamin",                "Vitamin B",   21),
            ("AYM-001",  "Pemeriksaan rutin",  "Produksi telur normal", "Vaksinasi ND",           "Vaksin ND",   10),
        ]
        for tag, disease, symptoms, treatment, medicine, vac_in in hr_def:
            db.add(models.HealthRecord(
                animal_id=animals[tag].id,
                check_date=TODAY - timedelta(days=3),
                disease=disease,
                symptoms=symptoms,
                treatment=treatment,
                medicine_name=medicine,
                next_vaccine_date=TODAY + timedelta(days=vac_in),
                handled_by=vet.id,
            ))

        # 5) Produksi 7 hari terakhir (mengikuti pemetaan jenis hewan)
        susu_producers = {
            "SAPI-001": (12.0, 15.0, 7500),
            "SAPI-002": (10.0, 13.0, 7500),
            "KMB-001":  (2.0, 3.0, 15000),
            "KMB-002":  (1.5, 2.5, 15000),
        }
        for tag, (lo, hi, price) in susu_producers.items():
            for d in range(7):
                qty = round(lo + (hi - lo) * ((d % 3) / 2.0), 2)
                db.add(models.Production(
                    animal_id=animals[tag].id,
                    production_date=TODAY - timedelta(days=d),
                    product_type="susu",
                    quantity=qty,
                    unit="liter",
                    selling_price=price,
                    notes="Pemerahan harian",
                ))
        # telur (ayam petelur)
        for d in range(7):
            db.add(models.Production(
                animal_id=animals["AYM-001"].id,
                production_date=TODAY - timedelta(days=d),
                product_type="telur",
                quantity=float(25 + (d % 5)),
                unit="butir",
                selling_price=2500,
                notes="Panen telur harian",
            ))
        # wol (domba betina) - panen berkala, 1 catatan
        db.add(models.Production(
            animal_id=animals["DMB-001"].id,
            production_date=TODAY - timedelta(days=2),
            product_type="wol",
            quantity=3.5,
            unit="kg",
            selling_price=50000,
            notes="Cukur wol berkala",
        ))

        # 6) Stok pakan (satu di bawah ambang untuk menguji peringatan stok)
        feeds_def = [
            ("Rumput Gajah",     800.0, 200.0, 1500, "CV Hijau Subur"),
            ("Konsentrat Sapi",  150.0, 100.0, 5500, "PT Pakan Ternak"),
            ("Dedak Padi",        80.0, 100.0, 3000, "Toko Tani Makmur"),   # < ambang -> alert
            ("Voer Ayam",        120.0,  50.0, 8000, "PT Pakan Ternak"),
        ]
        feeds = {}
        for name, stock, minimum, price, supplier in feeds_def:
            f = models.FeedInventory(
                user_id=owner.id,
                feed_name=name,
                current_stock_kg=stock,
                min_stock_alert=minimum,
                unit_price=price,
                last_restock_date=TODAY - timedelta(days=5),
                supplier=supplier,
            )
            db.add(f)
            feeds[name] = f
        db.commit()
        for f in feeds.values():
            db.refresh(f)

        # 7) Jadwal pemberian pakan per jenis hewan
        sched_def = [
            ("sapi",    "Rumput Gajah",    time(7, 0),  25.0),
            ("sapi",    "Konsentrat Sapi", time(16, 0),  8.0),
            ("kambing", "Rumput Gajah",    time(7, 30),  5.0),
            ("ayam",    "Voer Ayam",       time(6, 30),  3.0),
            ("domba",   "Rumput Gajah",    time(8, 0),   4.0),
        ]
        for jenis, feed_name, jam, porsi in sched_def:
            db.add(models.FeedingSchedule(
                user_id=owner.id,
                animal_type=jenis,
                feed_id=feeds[feed_name].id,
                feeding_time=jam,
                portion_kg=porsi,
                is_active=True,
                notes=f"Jadwal {jenis}",
            ))

        db.commit()

        # ringkasan
        n_animals = db.query(models.Animal).filter(models.Animal.user_id == owner.id).count()
        print("=" * 50)
        print("SEED SELESAI")
        print("  Owner      : demo@farmtrack.com  / demo123")
        print("  Staff      : staff@farmtrack.com / staff123")
        print("  Veterinary : dokter@farmtrack.com/ dokter123")
        print(f"  Hewan      : {n_animals}")
        print(f"  Catatan kesehatan : {len(hr_def)}")
        print(f"  Pakan      : {len(feeds_def)} (1 di bawah ambang)")
        print(f"  Jadwal pakan : {len(sched_def)}")
        print("=" * 50)
    except Exception as e:
        db.rollback()
        print("GAGAL:", repr(e))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
