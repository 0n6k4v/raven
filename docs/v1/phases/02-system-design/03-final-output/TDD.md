# Raven - Technical Design Document (TDD)

> **Version:** 1.0  
> **Generated:** 2026-02-28  
> **Based on:** Codebase Analysis  

---

## 1. Architecture Overview

### 1.1 System Architecture

Raven ใช้ **Microservices Architecture** โดยมี Services ดังนี้:

| # | Service | Description |
|---|---------|-------------|
| 1 | **Frontend** | React + Vite Web Application  |
| 2 | **Auth Service** | จัดการ Authentication, Users, Roles |
| 3 | **Location Service** | จัดการ Province, District, Subdistrict |
| 4 | **Exhibit Service** | จัดการ Exhibits, Firearms, Narcotics |
| 5 | **AI Service** | AI Inference (PyTorch) |
| 6 | **History Service** | จัดการ History, Analytics |
| 7 | **Notification Service** | Email, Push Notifications |

**ทุก Service จะถูก Route โดย Traefik เป็น API Gateway**

```
                         ┌─────────────────────────────────────────┐
                         │              Frontend (Port 80)          │
                         │            React + Vite + Nginx          │
                         └──────────────────┬──────────────────────┘
                                            │
                         ┌──────────────────┴──────────────────────┐
                         ▼                                         ▼
                  ┌─────────────┐                           ┌─────────────┐
                  │   Traefik   │                           │ Auth Service│
                  │(API Gateway)│                           │(Port 8001) │
                  │ (Port 8000) │                           └──────┬──────┘
                  └─────┬───────┘                                  │
                        │                                          │
    ┌───────────────────┼───────────────────┼───────────────────┐   │
    ▼                   ▼                   ▼                   ▼   ▼
┌──────────┐      ┌──────────┐       ┌──────────┐       ┌──────────┐
│Exhibit   │      │ History  │       │ Location │       │AI Service │
│ Service  │      │ Service  │       │ Service  │       │(Port 8080)│
│(Port8002)│      │(Port8004)│       │(Port8005)│       └──────────┘
└────┬─────┘      └────┬─────┘       └────┬─────┘
     │                 │                   │
     ▼                 ▼                   ▼
┌──────────┐      ┌──────────┐       ┌──────────┐
│ExhibitDB │      │History DB│       │LocationDB│
└──────────┘      └──────────┘       └──────────┘
```

### 1.2 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React + Vite | React 18+, Vite 5+ |
| API Gateway | Traefik | v3 |
| Backend | FastAPI | 0.100+ |
| Database | PostgreSQL | 15+ |
| ORM | SQLAlchemy | 2.0+ |
| AI/ML | PyTorch | 2.0+ |
| Auth | JWT + Argon2 | - |
| Storage | Cloudinary | - |
| Deployment | Docker | Compose v2 |

---

## 2. Component Design

### 2.1 Frontend Component

| Component | Description | State Management |
|-----------|-------------|------------------|
| Login Page | User authentication | React Context |
| Dashboard | Statistics display | React Query |
| Evidence Form | Upload & analyze evidence | React Hook Form |
| History List | View discovery history | React Query |
| Map View | Geographic visualization | Leaflet |
| Profile | User profile management | React Context |

### 2.2 Backend Component

| Component | Responsibility |
|-----------|----------------|
| Auth Controller | JWT token management |
| User Controller | User CRUD operations |
| Exhibit Controller | Evidence management |
| Firearm Controller | Firearms CRUD |
| Narcotic Controller | Narcotics CRUD |
| History Controller | Discovery history CRUD |
| Inference Controller | AI inference orchestration |
| Vector Controller | Image similarity search |

### 2.3 AI Service Component

| Component | Responsibility |
|-----------|----------------|
| Model Manager | Load/unload AI models |
| Segment Service | Object detection & segmentation |
| Brand Classifier | Gun brand classification |
| Model Classifier | Gun model classification |
| Vector Service | Image embedding generation |

---

## 3. Data Flow

### 3.1 Evidence Analysis Flow

```
1. User uploads image
   │
   ▼
2. Frontend sends to Backend API
   │
   ▼
3. Backend saves to Cloudinary
   │
   ▼
4. Backend calls AI Service
   │
   ▼
5. AI Service runs models:
   - Segment Model → detect objects
   - Brand Model → classify brand
   - Model Model → classify model
   │
   ▼
6. AI Service returns results
   │
   ▼
7. Backend saves results to Database
   │
   ▼
8. Frontend displays results
```

### 3.2 History Recording Flow

```
1. User fills evidence details
   │
   ▼
2. Frontend validates input
   │
   ▼
3. Backend validates with Pydantic
   │
   ▼
4. Backend saves to Database:
   - Exhibit record
   - Firearm/Narcotic record
   - History record with location
   │
   ▼
5. Return success to Frontend
```

---

## 4. Security Design

### 4.1 Authentication Flow

```
User Login
     │
     ▼
Check credentials against database
     │
     ▼
Generate JWT token (30 min expiry)
     │
     ▼
Return token to client
     │
     ▼
Client includes token in Authorization header
```

### 4.2 Authorization Matrix

| Role | Own Data | Domain Data | All Data | Admin |
|------|----------|-------------|----------|-------|
| Field Officer | ✓ | ✗ | ✗ | ✗ |
| Domain Expert | ✓ | ✓ | ✗ | ✗ |
| Senior Officer | ✓ | ✓ | ✓ | ✓ |

---

## 5. Performance Considerations

### 5.1 Caching Strategy

| Resource | Cache Strategy | TTL |
|----------|---------------|-----|
| Province/District/Subdistrict | Static (load once) | 24 hours |
| User Profile | LRU Cache | 5 minutes |
| Evidence List | Query Cache | 1 minute |

### 5.2 Database Optimization

| Optimization | Implementation |
|-------------|----------------|
| Indexing | Add indexes on frequently queried columns |
| Pagination | Limit 20-50 records per page |
| Lazy Loading | Use lazy loading for relationships |
| Connection Pooling | SQLAlchemy connection pool |

### 5.3 AI Service Optimization

| Optimization | Implementation |
|-------------|----------------|
| Model Caching | Keep models in memory |
| GPU Utilization | Use CUDA if available |
| Batch Processing | Process multiple images together |
| Async Processing | Non-blocking inference |

---

## 6. Error Handling

### 6.1 Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 6.2 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Error |
| 503 | Service Unavailable |

---

## 7. Deployment

### 7.1 Docker Services

```yaml
services:
  traefik:
    image: traefik:v3.0
    ports: [8000:80]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  frontend:
    build: ./frontend
    ports: [80:80]
    resources:
      cpus: '0.50'
      memory: 512M

  auth-service:
    build: ./auth-service
    ports: [8001:8001]
    resources:
      cpus: '0.50'
      memory: 512M

  exhibit-service:
    build: ./exhibit-service
    ports: [8002:8002]
    resources:
      cpus: '1.00'
      memory: 1G

  notification-service:
    build: ./notification-service
    ports: [8003:8003]
    resources:
      cpus: '0.50'
      memory: 256M

  history-service:
    build: ./history-service
    ports: [8004:8004]
    resources:
      cpus: '0.50'
      memory: 512M

  location-service:
    build: ./location-service
    ports: [8005:8005]
    resources:
      cpus: '0.50'
      memory: 256M

  ai-service:
    build: ./ai-service-api
    ports: [8080:8080]
    resources:
      cpus: '2.00'
      memory: 4G
```

---

## 8. Related Documents

- [API.md](./API.md)
- [DATABASE.md](./DATABASE.md)
- [raven-reverse-engineering.md](../01-human-decisions/architecture-decisions/raven-reverse-engineering.md)
