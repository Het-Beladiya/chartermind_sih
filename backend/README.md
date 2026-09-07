# Maritime Freight Forecasting API Backend

Production-ready FastAPI backend for bulk dry cargo shipping optimization (Coal, Iron Ore, Bauxite, Grain) between global origins (Australia, Indonesia, South Africa, Mozambique, Russia) and Indian East Coast ports (Paradip, Dhamra, Vizag, Haldia, Kolkata).

---

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.x (Async with `asyncpg`)
- **Database**: PostgreSQL 15+
- **Migrations**: Alembic
- **Validation**: Pydantic v2 & `pydantic-settings`
- **Security**: Firebase Admin SDK (JWT token verification & auto-provisioning)
- **CORS**: Configured for React + Vite + TypeScript frontend

---

## Quick Start Setup Guide

### 1. Create and Activate Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate on Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Activate on Linux / macOS
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup PostgreSQL Database

Make sure PostgreSQL 15+ is installed and running locally, then create the database:

```bash
# Using PostgreSQL CLI
createdb -U postgres sih_freight_db
```

> **Note**: If prompted for password, enter your PostgreSQL user password.

### 4. Setup Firebase Authentication Service Account

1. Open the [Firebase Console](https://console.firebase.google.com).
2. Select or create your project (`maritime-freight` / `sih-freight`).
3. Click on the gear icon ⚙️ next to **Project Overview** → select **Project Settings**.
4. Navigate to the **Service Accounts** tab.
5. Click **Generate new private key** → **Generate key**.
6. A JSON file will download. Rename it to `serviceAccount.json` and move it directly into the `backend/` directory.

*(Optional Cloud Deploy)*: Alternatively, paste the raw contents of the JSON key into the `FIREBASE_SERVICE_ACCOUNT_JSON` variable in `.env`.

> **Development Mode**: If `DEBUG=True` and no service account is present, the API will run in mock authentication mode (accepting demo tokens such as `Bearer demo-charterer`), allowing you to test endpoints immediately without blocking.

### 5. Configure Environment Variables

Edit `backend/.env` to configure your database credentials and Firebase Project ID:

```env
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/sih_freight_db
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccount.json
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=True
APP_NAME=SIH Freight Forecasting API
API_VERSION=v1
```

### 6. Run the FastAPI Dev Server

```bash
uvicorn app.main:app --reload --port 8000
```

Once running, access:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Root Health Check**: [http://localhost:8000/](http://localhost:8000/)
- **API Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## Seed Initial Test Data (Dev Mode)

When `DEBUG=True`, you can seed historical rate benchmarks and live port snapshots:

```bash
# Seed 90 days of historical freight rates
curl -X POST http://localhost:8000/api/v1/seed/freight-rates -H "Authorization: Bearer demo-admin"

# Seed live port snapshots for all 5 ports
curl -X POST http://localhost:8000/api/v1/seed/port-snapshots -H "Authorization: Bearer demo-admin"
```

---

## API Routers Overview

| Router | Prefix | Description |
|---|---|---|
| `auth` | `/api/v1/auth` | Firebase token verification & user profile management |
| `cargo` | `/api/v1/cargo` | Bulk cargo demand parcels & booking CRUD |
| `vessel` | `/api/v1/vessel` | Fleet specs, suitability scoring & port compatibility |
| `port` | `/api/v1/port` | East Coast Indian ports & live queue snapshots |
| `voyage` | `/api/v1/voyage` | Core voyage planning, cost breakdown & simulation |
| `forecast` | `/api/v1/forecast` | ML freight rate time-series projections & timing advisory |
| `risk` | `/api/v1/risk` | 5-vector maritime risk assessment engine |
| `contract` | `/api/v1/contract` | Spot vs Multiple-Voyage Contract of Affreightment (CoA) |
| `simulator` | `/api/v1/simulator` | Real-time What-If scenario modeling pipeline |
| `alerts` | `/api/v1/alerts` | Operational notices & delay warnings |
| `reports` | `/api/v1/reports` | Archival of comprehensive charter evaluation dossiers |
| `seed` | `/api/v1/seed` | Development mock data generation (Debug only) |
