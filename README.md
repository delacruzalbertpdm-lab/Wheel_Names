# PulseDraw — Modern Simultaneous Random Player Selection System

**PulseDraw** is a full-stack Random Player Selection System built with **React (Vite + Tailwind CSS)** and **Python Django + Django REST Framework (DRF)**. Designed as a modern, broadcast-grade alternative to traditional spinning-wheel tools, PulseDraw features an interactive **Digital Spotlight Matrix & Simultaneous 3D Holographic Card Reveal** capable of selecting and revealing multiple winners simultaneously with cryptographic fairness.

---

## Key Features

- **Digital Spotlight Matrix & Simultaneous Reveal (Non-Wheel UI)**:
  - Displays all eligible participants as interactive cyber-glass tiles on stage.
  - High-speed digital spotlights scan the matrix, lock onto all $K$ winners simultaneously, and elevate them into holographic winner cards at center stage.
- **Cryptographic Backend Randomization (`secrets.SystemRandom`)**:
  - All random selection happens on the Django backend using Python's OS-backed CSPRNG (`secrets.SystemRandom().sample()`).
  - Guarantees **zero duplicate selections** within the same draw.
  - Uses atomic row locking (`select_for_update()`) and `idempotency_key` deduplication to prevent race conditions or double-click draw requests.
- **Flexible Eligibility Management**:
  - Choose between **Exclude Winners** (selected participants are automatically excluded from subsequent draws until reset) or **Keep Eligible** (winners remain in the pool for the next draw).
  - One-click **Reset Pool Eligibility** restores all participants to eligible status.
  - Pre-draw validation warns the administrator if the requested player count exceeds the currently eligible pool.
- **Comprehensive Participant Management & Batch Import**:
  - Add, edit, delete, search, filter by eligibility or department, and toggle individual eligibility.
  - Drag-and-drop **CSV (`.csv`)** and **Excel (`.xlsx`)** importer with automatic duplicate detection and a downloadable CSV template.
  - Includes 20 realistic sample participants out of the box.
- **Draw History & Audit Log**:
  - Persists every draw session with its timestamp, round title, pool snapshot, eligibility rule, and winner snapshots (`DrawWinner`), preserved even if a participant is later edited or deleted.
- **Supabase & PostgreSQL Ready**:
  - Uses UUID primary keys across all models and environment-driven database configuration (`dj-database-url`).

---

## Quick Start

### 1. Backend (Django + DRF)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_participants
python manage.py runserver 8000
```

Run backend unit tests:
```bash
python backend/manage.py test core
```

### 2. Frontend (React + Vite + Tailwind CSS)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Migrating to Supabase or PostgreSQL for Production

Update `backend/.env` with your Supabase or PostgreSQL connection string:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require
DB_CONN_MAX_AGE=600
```

Then run `python manage.py migrate` to initialize the schema on Supabase/PostgreSQL without any code changes.

