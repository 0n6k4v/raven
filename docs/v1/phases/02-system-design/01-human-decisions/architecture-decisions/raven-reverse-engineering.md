# Raven - Forensic Science Super App

> **Project Name:** Raven  
> **Type:** Monorepo Microservices  
> **Last Updated:** 2026-02-28

---

## 1. Project Overview

**Raven** คือ Super App สำหรับเจ้าหน้าที่นิติวิทยาศาสตร์ โดยมีหลักการทำงานหลักดังนี้:

1. **วิเคราะห์วัตถุพยานด้วย AI** - ตรวจจับและจำแนกอาวุธปืนและยาเสพติด
2. **บันทึกประวัติการค้นพบ** - สร้าง Big Data เพื่อหาความเชื่อมโยง
3. **Dashboard สถิติ** - แสดงผลข้อมูลเชิงลึกสำหรับผู้บริหาร
4. **Role-based Access Control** - ควบคุมสิทธิ์การเข้าถึงอย่างเข้มงวด

---

## 2. Architecture Overview

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Frontend                                      │
│                    (React + Vite Web App)                               │
│                         Port: 80                                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP/REST
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
┌───────────────────┐                   ┌───────────────────┐
│   Backend API     │                   │   AI Service      │
│   (FastAPI)       │ ◄─────────────────►│   (FastAPI +      │
│   Port: 8000      │    REST/Internal   │    PyTorch)       │
└────────┬──────────┘                   │   Port: 8080      │
         │                              └────────┬──────────┘
         │                                         │
         │ PostgreSQL + pgvector                  │ Model Files
         │ (Port: 5432)                           │ (.pt files)
         ▼                                         ▼
┌───────────────────┐                   ┌───────────────────┐
│   Database       │                   │   AI Models       │
│   (db-service)   │                   │   Storage         │
└───────────────────┘                   └───────────────────┘
         │
         │ Cloudinary API
         ▼
┌───────────────────┐
│   Cloud Storage   │
│   (Images)        │
└───────────────────┘
```

### 2.2 Services (Microservices)

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| **frontend** | React + Vite + Nginx | 80 | Web Application |
| **backend-api** | FastAPI + SQLAlchemy | 8000 | REST API |
| **ai-service** | FastAPI + PyTorch | 8080 | AI Inference |
| **db-service** | PostgreSQL + pgvector | 5432 | Database |

### 2.3 Technology Stack

| Category | Technology | Version/Library |
|----------|------------|-----------------|
| **Backend** | FastAPI | Python 3.8+ |
| **AI/ML** | PyTorch | Torch models |
| **Database** | PostgreSQL | 15+ |
| **Vector DB** | pgvector | For image similarity |
| **Frontend** | React | Vite |
| **Auth** | JWT + Argon2 | passlib |
| **Image Storage** | Cloudinary | - |
| **Deployment** | Docker | Compose v2 |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │    Role     │       │   Exhibit   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │◄──────│ id          │       │ id          │
│ user_id     │       │ role_name   │       │ category    │
│ email       │       │ description │       │ subcategory │
│ password    │       └─────────────┘       └──────┬──────┘
│ firstname   │               │                    │
│ lastname    │               │                    │
│ role_id     │───────────────┘                    │
│ department  │                                      │
└──────┬──────┘                              ┌──────┴──────┐
       │                                        │             │
       │                                        ▼             ▼
       │                               ┌───────────┐ ┌───────────┐
       │                               │  Firearm  │ │  Narcotic │
       │                               ├───────────┤ ├───────────┤
       │                               │ id        │ │ id        │
       │                               │ exhibit_id│◄─│ exhibit_id│
       │                               │ mechanism │ │ drug_type │
       │                               │ brand     │ │ form_id   │
       │                               │ model     │ │ weight    │
       │                               └───────────┘ └──────┬──────┘
       │                                                     │
       │                        ┌────────────────
       ▼                       ────────────┘ ▼
┌─────────────┐       ┌─────────────────┐
│  History    │       │ NarcoticPill    │
├─────────────┤       ├─────────────────┤
│ id          │       │ narcotic_id     │
│ exhibit_id  │       │ color           │
│ discovered_by│      │ diameter_mm     │
│ discovery_date│     │ thickness_mm    │
│ location    │       │ edge_shape      │
│ photo_url   │       └─────────────────┘
└─────────────┘
```

### 3.2 Tables Detail

#### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| **users** | ข้อมูลผู้ใช้งาน | user_id, email, password (hashed), role_id, department |
| **roles** | บทบาทผู้ใช้งาน | role_name, description |
| **exhibits** | วัตถุพยานหลัก | category, subcategory |
| **history** | ประวัติการค้นพบ | exhibit_id, discovered_by, discovery_date, location (Geometry) |

#### Firearms Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| **firearms** | ข้อมูลอาวุธปืน | exhibit_id, mechanism, brand, series, model |
| **ammunitions** | ข้อมูลกระสุน | type, caliber, manufacturer |
| **firearm_ammunitions** | ความสัมพันธ์ปืน-กระสุน | firearm_id, ammunition_id |
| **firearm_example_images** | ตัวอย่างภาพปืน | firearm_id, image_url |

#### Narcotics Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| **narcotics** | ข้อมูลยาเสพติด | exhibit_id, form_id, drug_type, weight_grams |
| **drug_forms** | รูปแบบยา | name |
| **chemical_compounds** | สารเคมี | name, description |
| **narcotics_chemical_compounds** | ความสัมพันธ์ยา-สารเคมี | narcotic_id, compound_id, percentage |
| **narcotic_example_images** | ตัวอย่างภาพยา | narcotic_id, image_url, priority |
| **narcotics_image_vectors** | Vector ของภาพยา | narcotic_id, image_id, image_vector (pgvector) |
| **narcotics_pills** | ข้อมูลเม็ดยา | narcotic_id, color, diameter_mm, thickness_mm |

#### Geolocation Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| **provinces** | จังหวัด | code, name_th, name_en |
| **districts** | อำเภอ | code, province_code, name_th |
| **subdistricts** | ตำบล | code, district_code, name_th, postal_code |

---

## 4. API Endpoints

### 4.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/token` | Login และรับ JWT token |
| POST | `/api/auth/register` | ลงทะเบียนผู้ใช้ใหม่ |

### 4.2 User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | รายชื่อผู้ใช้ทั้งหมด |
| GET | `/api/users/{id}` | รายละเอียดผู้ใช้ |
| POST | `/api/users` | สร้างผู้ใช้ใหม่ |
| PUT | `/api/users/{id}` | แก้ไขข้อมูลผู้ใช้ |
| DELETE | `/api/users/{id}` | ลบผู้ใช้ |

### 4.3 Role Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles` | รายชื่อ Roles |
| GET | `/api/roles/{id}` | รายละเอียด Role |

### 4.4 Location Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/provinces` | รายชื่อจังหวัด |
| GET | `/api/districts` | รายชื่ออำเภอ |
| GET | `/api/subdistricts` | รายชื่อตำบล |

### 4.5 Exhibit (Evidence)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exhibit` | รายชื่อวัตถุพยาน |
| POST | `/api/exhibit` | สร้างวัตถุพยานใหม่ |
| GET | `/api/exhibit/{id}` | รายละเอียดวัตถุพยาน |

### 4.6 Firearms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/firearm` | รายชื่ออาวุธปืน |
| POST | `/api/firearm` | เพิ่มอาวุธปืน |
| GET | `/api/firearm/{id}` | รายละเอียดอาวุธปืน |

### 4.7 Narcotics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/narcotic` | รายชื่อยาเสพติด |
| POST | `/api/narcotic` | เพิ่มยาเสพติด |
| GET | `/api/narcotic/{id}` | รายละเอียดยาเสพติด |

### 4.8 History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | ประวัติการค้นพบทั้งหมด |
| POST | `/api/history` | บันทึกการค้นพบใหม่ |
| GET | `/api/history/{id}` | รายละเอียดการค้นพบ |

### 4.9 AI Inference (Backend → AI Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inference/segment` | ส่งภาพไป segment |
| POST | `/api/inference/firearm` | วิเคราะห์อาวุธปืน |
| POST | `/api/inference/narcotic` | วิเคราะห์ยาเสพติด |

### 4.10 AI Inference (AI Service API)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/object-classify` | ตรวจจับวัตถุในภาพ |
| POST | `/api/firearm-brand-classify` | จำแนกยี่ห้อปืน |
| POST | `/api/firearm-model-classify` | จำแนกรุ่นปืน |

### 4.11 Vector Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vector/search` | ค้นหาความคล้ายคลึงของภาพ |

---

## 5. AI Models

### 5.1 Model Files Location

```
ai-service-api/app/ai_models/
├── segment_model.pt              # Object segmentation model
├── narcotics/
│   └── narcotic_model.pt         # Narcotics classification model (~54MB)
└── firearms/
    ├── brand/
    │   └── gun_brand.pt          # Gun brand classification
    └── model/
        ├── Baretta_Model/best.pt
        ├── Browning_Model/best.pt
        ├── Colt_Model/best.pt
        ├── CZ_Model/best.pt
        ├── Glock_Model/best.pt
        ├── Kimber_Model/best.pt
        ├── Norinco_Model/best.pt
        ├── SIG_Model/best.pt
        ├── Smith&Wesson_Model/best.pt
        └── Walther_Model/best.pt
```

### 5.2 AI Inference Flow

```
User Upload Image
       │
       ▼
┌──────────────────┐
│  Segment Model   │ ◄── ตรวจจับวัตถุในภาพ
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Brand Model     │────►│  Model Model     │
│  (gun_brand.pt) │     │  (e.g., CZ_75)   │
└──────────────────┘     └──────────────────┘
```

---

## 6. Security

### 6.1 Authentication

- **JWT Token** สำหรับ Authentication
- **Argon2** สำหรับ Password Hashing
- Token expiration: 30 นาที (configurable)

### 6.2 Authorization

- **Role-based Access Control (RBAC)**
- 3 Roles: Field Officer, Domain Expert, Senior Officer
- Permission แต่ละ Role แตกต่างกัน

### 6.3 API Security

- CORS configured for specific origins
- Input validation ด้วย Pydantic
- Password ไม่เก็บใน plain text

---

## 7. Infrastructure

### 7.1 Docker Services

```yaml
services:
  frontend:
    ports: [80]
    resources: 0.50 CPU, 512MB
  
  backend-api:
    ports: [8000]
    resources: 1.00 CPU, 1GB
  
  ai-service:
    ports: [8080]
    resources: 2.00 CPU, 4GB  # GPU recommended
  
  db-service:
    ports: [5432]
    resources: 0.50 CPU, 512MB
```

### 7.2 Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| DATABASE_URL | backend-api | PostgreSQL connection string |
| AI_SERVICE_URL | backend-api | AI service endpoint |
| SECRET_KEY | backend-api | JWT secret key |
| CLOUDINARY_* | backend-api | Cloud storage config |
| MODEL_PATH | ai-service | Path to AI models |

---

## 8. Development Status

### 8.1 Completed Features

- [x] User Authentication (JWT + Argon2)
- [x] Role-based Access Control
- [x] AI Firearms Analysis (Brand + Model)
- [x] AI Object Segmentation
- [x] AI Narcotics Model (พร้อมใช้งาน แต่ยังไม่มี API Endpoint)
- [x] Evidence Management (Firearms + Narcotics)
- [x] History Recording with Geolocation
- [x] Geolocation Data (Province/District/Subdistrict)
- [x] Image Upload to Cloudinary
- [x] Vector Search (pgvector)

### 8.2 In Progress / Pending

- [ ] เชื่อมต่อ AI Narcotics API Endpoint
- [ ] Dashboard Statistics
- [ ] Connection/Link Analysis
- [ ] Export Reports
- [ ] Notification System
- [ ] Audit Trail

---

## 9. File Structure

```
raven/
├── ai-service-api/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── routes/               # API routes
│   │   │   ├── inference.py      # AI inference endpoints
│   │   │   └── vector.py         # Vector search
│   │   ├── services/             # Business logic
│   │   │   ├── model_segment_service.py
│   │   │   ├── model_brand_service.py
│   │   │   ├── model_firearm_model_service.py
│   │   │   └── narcotic_service.py
│   │   └── ai_models/            # AI model files (.pt)
│   ├── Dockerfile
│   └── requirements.txt
│
├── backend-api/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config/               # Configuration
│   │   │   ├── db_config.py     # Database config
│   │   │   ├── auth_config.py   # JWT config
│   │   │   └── cloudinary_config.py
│   │   ├── controllers/          # Business logic
│   │   ├── models/              # SQLAlchemy models
│   │   ├── routes/              # API routes
│   │   ├── schemas/             # Pydantic schemas
│   │   └── services/            # Services
│   ├── Dockerfile
│   └── requirements.txt
│
├── db-service/
│   ├── Dockerfile
│   ├── sql-init/                # SQL initialization
│   │   └── 02-docker_backup.sql # Schema + data
│   └── .env
│
├── frontend/
│   ├── src/                     # React source
│   ├── Dockerfile
│   └── .env
│
├── docs/                        # Documentation
│   └── v1/
│       ├── phases/
│       │   ├── 01-discovery/
│       │   └── 02-system-design/
│       └── README.md
│
├── docker-compose.yml
├── AGENTS.md
└── .env
```

---

## 10. Related Documentation

- [ideation.md](phases/01-discovery/01-user-inputs/ideation.md) - Requirements & Features
- [PRD.md](phases/01-discovery/03-final-output/PRD.md) - Product Requirements Document
- [SecurityRequirements.md](../Requirements/SecurityRequirements.md) - Security Requirements
