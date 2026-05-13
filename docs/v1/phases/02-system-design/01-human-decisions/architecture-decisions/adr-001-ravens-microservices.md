# ADR-001: Raven Microservices Architecture

> **ID:** adr-001  
> **Title:** เปลี่ยนจาก Shared Database เป็น True Microservices  
> **Date:** 2026-02-28  
> **Status:** Proposed  
> **Decided by:** Development Team  

---

## Context

ปัจจุบันระบบ Raven ใช้ Shared Database Pattern โดย backend-api และ ai-service ใช้ PostgreSQL ร่วมกัน ซึ่งทำให้:
- **Coupling สูง** - ถ้า schema เปลี่ยน ทุก service กระทบ
- **Scale ไม่ยืดหยุ่น** - ทุก service ใช้ resource เท่ากัน
- **Maintenance ยาก** - ต้อง deploy ทุกอย่างพร้อมกัน

---

## Decision

เปลี่ยน Architecture เป็น **True Microservices** โดยแต่ละ Service มี Database เป็นของตัวเอง:

### Architecture ใหม่:

```
                         ┌─────────────────────────────────────────┐
                         │              Frontend (Port 80)          │
                         │            React + Vite + Nginx          │
                         └──────────────────┬──────────────────────┘
                                            │
                         ┌──────────────────┴──────────────────────┐
                         ▼                                         ▼
                  ┌─────────────┐                           ┌─────────────┐
                  │API Gateway  │                           │ Auth Service│
                  │(Port 8000) │                           │(Port 8001) │
                  │  /api/*    │                           │  /auth/*   │
                  └─────┬───────┘                           └──────┬──────┘
                        │                                        │
                        └────────────────┬───────────────────────┘
                                         ▼
                    ┌─────────────────────────────────────────────────────┐
                    │              All Services (Behind API Gateway)       │
                    ├───────────────┬───────────────┬─────────────────────┤
                    │ exhibit-svc   │history-svc   │  ai-service         │
                    │ (Port 8002)   │(Port 8004)  │  (Port 8080)       │
                    │ /exhibit/*    │/history/*    │  /inference/*      │
                    │ /firearm/*    │              │                    │
                    │ /narcotic/*   │              │                    │
                    ├───────────────┼───────────────┼─────────────────────┤
                    │location-svc    │notification-svc│                    │
                    │ (Port 8005)   │ (Port 8003)  │                    │
                    │ /location/*   │ /notify/*     │                    │
                    └───────────────┴───────────────┴─────────────────────┘
                                         │
         ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
         ▼             ▼             ▼             ▼             ▼             ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  User DB │ │ ExhibitDB│ │History DB│ │Vector DB │ │Location DB│ │          │
    │(Postgres)│ │(Postgres)│ │(Postgres)│ │(pgvector)│ │(Postgres)│ │          │
    └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Services ที่จะแยก:

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| **api-gateway** | 8000 | - | Routing, Auth, Rate Limiting |
| **auth-service** | 8001 | User DB | Authentication, Users, Roles |
| **exhibit-service** | 8002 | Exhibit DB | Exhibits, Firearms, Narcotics |
| **notification-service** | 8003 | - | Email, Push Notifications |
| **history-service** | 8004 | History DB | History, Analytics |
| **location-service** | 8005 | Location DB | Province, District, Subdistrict |
| **ai-service** | 8080 | Vector DB | AI Inference |

---

## Alternatives Considered

| Option | Pros | Cons | Why Not Chosen |
|--------|------|------|----------------|
| **A: คงไว้ (Shared DB)** | ง่าย, เร็ว | Coupling สูง, Scale ยาก | ไม่ Best Practice |
| **B: ลอง Monolith** | ง่ายสุด | ไม่ Scale | ขนาดโปรเจคใหญ่เกินไป |
| **C: Serverless** | Scale อัตโนมัติ | Cost สูง, Cold Start | ไม่เหมาะกับ AI |
| **D: True Microservices** (เลือก) | Loose Coupling, Scale ได้ดี | ซับซ้อน | Best Practice |

---

## Consequences

### Positive:

- ** Loose Coupling** - แต่ละ service เปลี่ยนได้โดยไม่กระทบ
- ** Independent Scaling** - AI service scale ได้อิสระ
- ** Team Autonomy** - ทีมแยกกัน develop ได้
- ** Fault Isolation** - service ตายไม่ลากทั้งระบบ
- ** Technology Flexibility** - แต่ละ service ใช้ tech ต่างกันได้

### Negative:

- ** Complexity** - ต้องจัดการหลาย services
- ** Network Latency** - ต้องเรียกข้าม service
- ** Data Consistency** - ยากกว่า monolithic
- ** Operational Overhead** - ต้องมี CI/CD, Monitoring

### Risks:

- **Migration** - ต้องย้าย data จาก DB เดียวไปหลาย DB
- **Testing** - Integration testing ยากขึ้น
- **Debugging** - ต้อง trace ข้าม services

---

## Implementation Plan

### Phase 1: สัปดาห์ที่ 1-2
1. แยก auth-service ออกมาก่อน (ง่ายสุด)
2. สร้าง User Database ใหม่

### Phase 2: สัปดาห์ที่ 3-4
1. ย้าย User management ไป auth-service
2. แยก history-service

### Phase 3: สัปดาห์ที่ 5-6
1. สร้าง Exhibit Database
2. ย้าย CRUD ไป exhibit-service

### Phase 4: สัปดาห์ที่ 7
1. ตั้ง API Gateway
2. Deploy ทั้งระบบ

---

## Related ADRs

- adr-002: API Gateway Selection
- adr-003: Database per Service Strategy
- adr-004: Event-Driven Communication
