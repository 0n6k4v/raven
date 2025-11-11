# AGENTS.md

## Project Overview

โปรเจคนี้เป็น Monorepo ที่ประกอบด้วยหลายบริการหลัก ได้แก่ `ai-service-api`, `backend-api`, `db-service`, และ `frontend` — แต่ละบริการแยกความรับผิดชอบชัดเจน (AI inference, REST API, ฐานข้อมูล, UI)

**Key Technologies:**
- Python (FastAPI) สำหรับ backend และ AI service
- PyTorch สำหรับโมเดล AI
- PostgreSQL สำหรับฐานข้อมูล
- Docker / docker-compose สำหรับรันบริการหลายตัวพร้อมกัน
- Frontend: Vite + React
- CSS: Tailwind

**Architecture:**
- แยกเป็นบริการย่อย (service separation) เพื่อให้พัฒนาและดีพลอยแยกส่วนได้
- Backend สื่อสารกับ AI service ผ่าน HTTP/REST และเก็บข้อมูลใน PostgreSQL

## Setup Commands

คำสั่งตัวอย่างสำหรับการเตรียมสภาพแวดล้อมทั่วไป (ปรับตาม OS/เวอร์ชันของคุณ):

- โคลน repo:

- รัน docker-compose (ถ้าต้องการตั้งค่าสภาพแวดล้อมทั้งหมดพร้อมกัน):

- ติดตั้ง dependencies แบบ local (ตัวอย่าง backend):


### Prerequisites

- ติดตั้ง Git, Docker และ Docker Compose
- ติดตั้ง Python 3.8+ และ pip
- ติดตั้ง Node.js 16+ และ npm/yarn (สำหรับ frontend)

### Environment Setup

1. ตรวจสอบไฟล์ config แต่ละ service ใน `backend-api/app/config` และ `ai-service-api/app` เพื่อดู environment variables ที่ต้องกำหนด
2. สร้างไฟล์ `.env` หรือกำหนด environment variables ในเครื่องของคุณตามที่แต่ละ service ต้องการ (DB URL, SECRET KEYS, CLOUDINARY ฯลฯ)
3. ถ้ารันแบบ local ให้ติดตั้ง dependencies ภายในแต่ละโฟลเดอร์ เช่น `pip install -r requirements.txt` สำหรับ backend/ai-service และ `npm install` สำหรับ frontend

**Local Dev Container**

โปรเจคมี `docker-compose.yml` ที่ออกแบบมาให้รันหลาย service พร้อมกันใน environment เดียว — ใช้สำหรับการพัฒนาเพื่อให้ backend, ai-service และ db สื่อสารกันได้โดยไม่ต้องตั้งค่าเพิ่มเติม

`
docker-compose -f docker-compose.prod.yml up --build
`

### Configuration

- เฟ้มการตั้งค่าของ backend อยู่ที่ `backend-api/app/config` (เช่น `db_config.py`, `auth_config.py`, `cloudinary_config.py`, `ai_config.py`)
- ใส่ค่า environment ที่จำเป็น เช่น `DATABASE_URL`, `SECRET_KEY`, `CLOUDINARY_URL`, `AI_SERVICE_URL` ก่อนรัน

## Development Workflow

- พัฒนาแยก service: รัน service ที่กำลังพัฒนาแบบ local และเชื่อมต่อกับ service อื่น ๆ ผ่าน network ของ Docker หรือ URL dev server
- ใช้ `uvicorn` สำหรับรัน backend/ai-service ในโหมด reload ขณะพัฒนา

### Project Structure

- `ai-service-api/` — โค้ดสำหรับ AI inference, โมเดลอยู่ใน `app/ai_models/`
- `backend-api/` — FastAPI backend แบ่งเป็น `controllers`, `models`, `routes`, `schemas`, `services`
- `db-service/` — Dockerfile และ `sql-init/` สำหรับสร้าง schema/initial data
- `frontend/` — Vite + React app (ไฟล์หลักอยู่ใน `src/`)


### Running Applications

**รันแบบ foreground (ดู logs แบบ realtime)**
```powershell
docker compose up --build
```

**หยุดและลบ containers, networks (ถ้าต้องการลบ volume ให้เพิ่ม -v)**
```powershell
docker compose down
docker compose down -v
```

### Accessing a Database

#### Excecute db-service container power shell

```powershell
docker compose exec db-service
```

Bash:
```bash
docker compose exec db-service psql -U postgres -d raven
```

**ตัวอย่าง psql queries ที่ใช้บ่อย (รันภายใน psql shell):**

```sql
-- แสดงรายการฐานข้อมูลทั้งหมด
\l

-- เปลี่ยน Database ai_detection
\c ai_detection

-- แสดงทุก table
\dt

-- แสดง schema ของ table users
\d users

-- นับจำนวน users
SELECT COUNT(*) FROM users;

-- แสดง username, email, role ทั้งหมด
SELECT u.user_id, u.email, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id;

-- ลบข้อมูล users ทั้งหมด (ระวัง!)
DELETE FROM users;

-- แสดง logs/history
SELECT * FROM history LIMIT 10;

-- ออกจาก psql
\q
```

**เข้า bash shell ของ container (ถ้าต้องการ):**

PowerShell:
```powershell
docker compose exec db-service /bin/bash
```

**หมายเหตุ:**
- Database name คือ `raven` (หรือตรวจสอบจาก `POSTGRES_DB` ใน `.env`)
- Default username คือ `postgres`
- ถ้า container หยุดอยู่ ให้รัน `docker compose up -d` ก่อน
- การแก้ไขข้อมูลโดยตรงอาจมีผลต่อ application — ระวังการ DELETE/UPDATE


## Testing Instructions


## Code Style Guidelines

### File Organization

### Dependencies

### Code Comments

## Build and Deployment
### Building Projects

**Run the full stack (development)**

PowerShell:
```powershell
$Env:DOCKER_BUILDKIT = "1"
docker compose up --build
```

Bash:
```bash
DOCKER_BUILDKIT=1 docker compose up --build
```

### Development Container

- ใช้ `docker-compose.yml` สำหรับรันหลาย container พร้อมกันในสเตจการพัฒนา

### Performance Considerations

- สำหรับ AI inference ให้พิจารณาใช้ GPU และปรับ batch size ให้เหมาะสม
- ฐานข้อมูล: ใส่ index และใช้ pagination เมื่อ query ผลลัพธ์จำนวนมาก

### Security Notes

- หลีกเลี่ยงการเก็บ secrets ใน repo — ใช้ environment variables หรือ secret manager
- ตั้งค่า CORS ให้จำกัดแหล่งที่มาที่เชื่อถือได้
- ตรวจสอบและ validate input ด้วย Pydantic schemas

## References

### Official references

- Docker BuildKit (build acceleration): https://docs.docker.com/develop/develop-images/build_enhancements/
- Docker Buildx (buildx CLI for advanced build features & cache): https://docs.docker.com/buildx/working-with-buildx/
- Docker Compose (v2) docs: https://docs.docker.com/compose/
- Buildx cache-to/cache-from docs: https://docs.docker.com/build/buildkit/cache/
