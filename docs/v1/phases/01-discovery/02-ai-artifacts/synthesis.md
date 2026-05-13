# Raven - Synthesis

> **Generated:** 2026-02-28  
> **Source:** Codebase Analysis + ideation.md

---

## 1. Project Vision

**Raven** คือ Super App สำหรับเจ้าหน้าที่นิติวิทยาศาสตร์ ที่ช่วยวิเคราะห์วัตถุพยานด้วย AI และสร้าง Big Data เพื่อหาความเชื่อมโยงในคดี

---

## 2. Key Insights จาก Codebase

### 2.1 Current Implementation

| Feature | Status | รายละเอียด |
|---------|--------|------------|
| User Authentication | ✅ พร้อมใช้งาน | JWT + Argon2 password hashing |
| Role Management | ✅ พร้อมใช้งาน | 3 Roles: Field Officer, Domain Expert, Senior Officer |
| AI Firearms Analysis | ✅ พร้อมใช้งาน | Brand + Model classification |
| Object Segmentation | ✅ พร้อมใช้งาน | YOLO-based segmentation |
| Evidence Management | ✅ พร้อมใช้งาน | Firearms + Narcotics |
| History Recording | ✅ พร้อมใช้งาน | บันทึก location ด้วย PostGIS |
| Geolocation Data | ✅ พร้อมใช้งาน | Province/District/Subdistrict |
| Image Storage | ✅ พร้อมใช้งาน | Cloudinary integration |
| Vector Search | ✅ พร้อมใช้งาน | pgvector for image similarity |

### 2.2 Tech Stack ที่ใช้

- **Backend:** FastAPI + SQLAlchemy
- **AI:** PyTorch + YOLO
- **Database:** PostgreSQL + pgvector + PostGIS
- **Frontend:** React + Vite
- **Storage:** Cloudinary
- **Deployment:** Docker Compose

### 2.3 Architecture Pattern

**Microservices** ที่ประกอบด้วย:
- `frontend` (Port 80)
- `backend-api` (Port 8000)
- `ai-service` (Port 8080)
- `db-service` (Port 5432)

---

## 3. Pain Points ที่พบ

### 3.1 จาก Requirements (ideation.md)

| Pain Point | Impact |
|------------|--------|
| ต้องวิเคราะห์วัตถุพยานด้วยตาวางละเอียด | ใช้เวลานาน |
| ต้องการหาความเชื่อมโยงระหว่างคดี | ยากทำด้วยตนเอง |
| ต้องการสถิติและ Insight | ต้องรวบรวมเอง |
| ต้องควบคุมสิทธิ์การเข้าถึง | ข้อมูลสำคัญ |

### 3.2 จาก Codebase Analysis

| Pain Point | สถานะ |
|------------|--------|
| AI Narcotics Analysis | ✅ มีโมเดลแล้ว (narcotic_model.pt) แต่ยังไม่มี API Endpoint |
| Dashboard Statistics | ❌ ยังไม่มี |
| Export Reports | ❌ ยังไม่มี |
| Notification System | ❌ ยังไม่มี |
| Audit Trail | ❌ ยังไม่มี |

---

## 4. User Groups

### 4.1 Primary Users

| User Group | Description | Use Case |
|------------|-------------|----------|
| **เจ้าหน้าที่หน้างาน** | เจ้าหน้าที่ภาคสนาม | ถ่ายภาพ, วิเคราะห์, บันทึกประวัติ |
| **Domain Expert** | ผู้เชี่ยวชาญเฉพาะทาง | ตรวจสอบ, Label, จัดการ Catalog |
| **เจ้าหน้าที่ระดับสูง** | ผู้บริหาร | ดูสถิติ, จัดการ User |

### 4.2 User Journey

```
เจ้าหน้าที่หน้างาน
    │
    ▼
[ถ่ายภาพวัตถุพยาน]
    │
    ▼
[ส่งให้ AI วิเคราะห์]
    │
    ▼
[บันทึกประวัติการค้นพบ]
    │
    ▼
[แชร์/Export รายงาน]
```

---

## 5. Features Summary

### 5.1 ที่มีอยู่แล้ว (Completed)

- User Authentication & Authorization
- Role-based Access Control (3 Roles)
- AI Firearms Classification (Brand + Model)
- Object Segmentation
- Evidence (Firearms/Narcotics) Management
- History Recording with Geolocation
- Province/District/Subdistrict Lookup
- Image Upload to Cloud
- Vector-based Image Similarity Search

### 5.2 ที่ยังต้องทำ (Pending)

- AI Narcotics Analysis
- Dashboard & Statistics
- Connection/Link Analysis
- Report Export
- Notifications
- Audit Trail

---

## 6. Constraints & Assumptions

### 6.1 Technical Constraints

- AI Models ต้อง Train เอง (Private Data)
- ต้องรองรับหลาย User พร้อมกัน
- User ใช้งานผ่าน Web App (มือถือ)
- Image Storage ใช้ Cloud

### 6.2 Business Constraints

- ต้องมี Audit Trail
- ต้อง Track การแชร์
- ต้องมี Notification
- ข้อมูลต้องเก็บตามกฎหมาย

---

## 7. Next Steps

1. ตอบคำถามที่ยังไม่ได้ตอบใน ideation.md
2. เชื่อมต่อ AI Narcotics API Endpoint
3. ออกแบบ Dashboard & Statistics
4. สร้าง PRD ฉบับสมบูรณ์
5. ดำเนินการ Phase 2: System Design

---

## 8. Related Documents

- [ideation.md](../01-user-inputs/ideation.md)
- [PRD.md](../03-final-output/PRD.md)
- [raven-reverse-engineering.md](../01-human-decisions/architecture-decisions/raven-reverse-engineering.md)
