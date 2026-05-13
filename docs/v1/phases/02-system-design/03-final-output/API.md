# Raven - API Specification

> **Version:** 1.0  
> **Generated:** 2026-02-28  
> **Based on:** Codebase Analysis

---

## 1. API Overview

| Attribute | Value |
|-----------|-------|
| **Base URL** | `http://localhost:8000/api` |
| **AI Service** | `http://localhost:8080/api` |
| **Protocol** | REST |
| **Authentication** | JWT Bearer Token |
| **Content-Type** | application/json |

---

## 2. Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/token` | Login & Get JWT Token | No |
| POST | `/auth/register` | Register New User | No |
| POST | `/auth/refresh` | Refresh Token | Yes |

### Request/Response Example

```json
// POST /auth/token
// Request
{
  "username": "user@example.com",
  "password": "password123"
}

// Response
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer"
}
```

---

## 3. User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List All Users | Yes (Admin) |
| GET | `/users/{id}` | Get User Details | Yes |
| POST | `/users` | Create New User | Yes (Admin) |
| PUT | `/users/{id}` | Update User | Yes |
| DELETE | `/users/{id}` | Delete User | Yes (Admin) |

---

## 4. Role Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/roles` | List All Roles | Yes |
| GET | `/roles/{id}` | Get Role Details | Yes |
| POST | `/roles` | Create New Role | Yes (Admin) |
| PUT | `/roles/{id}` | Update Role | Yes (Admin) |

---

## 5. Location Data Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/provinces` | List All Provinces | No |
| GET | `/provinces/{code}/districts` | Get Districts by Province | No |
| GET | `/districts` | List All Districts | No |
| GET | `/districts/{code}/subdistricts` | Get Subdistricts by District | No |
| GET | `/subdistricts` | List All Subdistricts | No |

---

## 6. Exhibit (Evidence) Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/exhibit` | List All Exhibits | Yes |
| GET | `/exhibit/{id}` | Get Exhibit Details | Yes |
| POST | `/exhibit` | Create New Exhibit | Yes |
| PUT | `/exhibit/{id}` | Update Exhibit | Yes |
| DELETE | `/exhibit/{id}` | Delete Exhibit | Yes |

---

## 7. Firearms Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/firearm` | List All Firearms | Yes |
| GET | `/firearm/{id}` | Get Firearm Details | Yes |
| POST | `/firearm` | Create New Firearm | Yes |
| PUT | `/firearm/{id}` | Update Firearm | Yes |
| DELETE | `/firearm/{id}` | Delete Firearm | Yes |

---

## 8. Narcotics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/narcotic` | List All Narcotics | Yes |
| GET | `/narcotic/{id}` | Get Narcotic Details | Yes |
| POST | `/narcotic` | Create New Narcotic | Yes |
| PUT | `/narcotic/{id}` | Update Narcotic | Yes |
| DELETE | `/narcotic/{id}` | Delete Narcotic | Yes |

---

## 9. History Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/history` | List All History | Yes |
| GET | `/history/{id}` | Get History Details | Yes |
| POST | `/history` | Create New History Record | Yes |
| PUT | `/history/{id}` | Update History | Yes |
| DELETE | `/history/{id}` | Delete History | Yes |

---

## 10. AI Inference Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/inference/segment` | Segment Objects in Image | Yes |
| POST | `/inference/firearm` | Analyze Firearm Image | Yes |
| POST | `/inference/narcotic` | Analyze Narcotic Image | Yes |

### Request Example

```json
// POST /inference/segment
// Content-Type: multipart/form-data
// Body: image (file)
```

---

## 11. Vector Search Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/vector/search` | Search Similar Images | Yes |

---

## 12. Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid Input |
| 401 | Unauthorized - Invalid Token |
| 403 | Forbidden - No Permission |
| 404 | Not Found - Resource Not Found |
| 500 | Internal Server Error |

### Error Response Example

```json
{
  "detail": "Error message here"
}
```

---

## 13. Related Documents

- [DATABASE.md](./DATABASE.md)
- [TDD.md](./TDD.md)
- [raven-reverse-engineering.md](../01-human-decisions/architecture-decisions/raven-reverse-engineering.md)
