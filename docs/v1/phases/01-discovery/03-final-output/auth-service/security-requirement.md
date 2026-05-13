# Security Requirements

> **เอกสารนี้กำหนดข้อกำหนดด้านความปลอดภัยสำหรับระบบ Raven**
> **เวอร์ชัน:** 1.0
> **วันที่:** มีนาคม 2569

---

## สารบัญ

1. [บทนำ](#1-บทนำ)
2. [ข้อกำหนดด้านการยืนยันตัวตน (Authentication)](#2-ข้อกำหนดด้านการยืนยันตัวตน-authentication)
3. [ข้อกำหนดด้านการอนุญาต (Authorization)](#3-ข้อกำหนดด้านการอนุญาต-authorization)
4. [ข้อกำหนดด้านการจัดเก็บ Password](#4-ข้อกำหนดด้านการจัดเก็บ-password)
5. [ข้อกำหนดด้าน Token Management](#5-ข้อกำหนดด้าน-token-management)
6. [ข้อกำหนดด้านความปลอดภัยของ API](#6-ข้อกำหนดด้านความปลอดภัยของ-api)
7. [ข้อกำหนดด้าน Session Management](#7-ข้อกำหนดด้าน-session-management)
8. [ข้อกำหนดด้าน Data Protection](#8-ข้อกำหนดด้าน-data-protection)
9. [ข้อกำหนดด้าน Compliance และ Logging](#9-ข้อกำหนดด้าน-compliance-และ-logging)

---

## 1. บทนำ

### 1.1 วัตถุประสงค์

เอกสารนี้กำหนดข้อกำหนดด้านความปลอดภัยสำหรับระบบ **Raven** ซึ่งเป็น Super App สำหรับเจ้าหน้าที่นิติวิทยาศาสตร์ โดยอ้างอิงจากมาตรฐานสากลและแนวปฏิบัติที่ดีด้านความปลอดภัย

### 1.2 ขอบเขต

เอกสารนี้ครอบคลุม:

- การยืนยันตัวตน (Authentication)
- การอนุญาต (Authorization)
- การจัดเก็บ Password
- การจัดการ Token
- ความปลอดภัยของ API
- การจัดการ Session
- การป้องกันข้อมูล
- Compliance และ Logging

### 1.3 Assumptions

- ระบบปัจจุบันใช้ **AAL1** (Single-factor Authentication)
- ระบบรองรับ **AAL2** (Multi-factor Authentication) สำหรับอนาคต
- ไม่รวม **IAL (Identity Proofing)** ในเวอร์ชันนี้ เนื่องจากเป็นระบบภายในที่ผู้ใช้ผ่านการคัดกรองจากหน่วยงานแล้ว

> **อ้างอิง:** [NIST SP 800-63-3](./references/NIST-SP-800-63-3.md) — Section 1, 6

---

## 2. ข้อกำหนดด้านการยืนยันตัวตน (Authentication)

### 2.1 Password Policy

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **ความยาวขั้นต่ำ** | Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 5.1.1 |
| **ความซับซ้อน** | ต้องประกอบด้วยตัวอักษรพิเศษ ตัวเลข และตัวพิมพ์ใหญ่-เล็ก | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 5.1.1 |
| **การตรวจสอบ** | ต้องตรวจสอบ password ใหม่กับรายการ password ที่ถูก compromise แล้ว | [OWASP Top 10](./references/OWASP-TOP-10.md) — A07:2021 |
| **การห้าม** | ห้ามใช้ password ที่อ่อนแอ เช่น "password", "12345678" | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 5.1.1 |

### 2.2 Rate Limiting

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Login Attempts** | จำกัดการพยายาม login ผิดไม่เกิน 5 ครั้ง จากนั้น lock 15 นาที | [OWASP Top 10](./references/OWASP-TOP-10.md) — A07:2021 |
| **API Requests** | จำกัด request rate ต่อ IP/User | [OWASP API Security Top 10](./references/OWASP-API-SECURITY-TOP-10.md) — API1:2023 |

### 2.3 Multi-Factor Authentication (สำหรับอนาคต)

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **AAL2 Readiness** | ระบบต้องรองรับ MFA สำหรับอนาคต | [NIST SP 800-63-3](./references/NIST-SP-800-63-3.md) — Section 6 |
| **Authenticator Types** | รองรับ TOTP (Time-based One-Time Password) | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 6 |

> **หมายเหตุ:** ในเวอร์ชันปัจจุบันใช้ AAL1 และเตรียมพร้อมสำหรับ AAL2

---

## 3. ข้อกำหนดด้านการอนุญาต (Authorization)

### 3.1 Role-Based Access Control (RBAC)

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Default Deny** | ปฏิเสธการเข้าถึงทุกอย่างโดยค่าเริ่มต้น เว้นแต่ได้รับอนุญาตชัดเจน | [OWASP Top 10](./references/OWASP-TOP-10.md) — A01:2021 |
| **Server-side Enforcement** | บังคับใช้ access control บน server-side เท่านั้น ไม่พึ่ง client-side | [OWASP Top 10](./references/OWASP-TOP-10.md) — A01:2021 |
| **Role Separation** | แต่ละ Role ต้องมีสิทธิ์เข้าถึงที่แตกต่างกันชัดเจน | [NIST SP 800-63-3](./references/NIST-SP-800-63-3.md) — Section 6 |

### 3.2 Roles Definition

| Role | สิทธิ์ |
|------|--------|
| **Field Officer** | บันทึกข้อมูลวัตถุพยาน, ดู Dashboard |
| **Domain Expert** | วิเคราะห์วัตถุพยาน, สร้างรายงาน |
| **Senior Officer** | จัดการผู้ใช้, ดูข้อมูลทั้งหมด, อนุมัติ |

### 3.3 Permission Checks

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Every Request** | ตรวจสอบสิทธิ์ทุกครั้งที่เข้าถึง protected resource | [OWASP Top 10](./references/OW10.md) —ASP-TOP- A01:2021 |
| **IDOR Prevention** | ป้องกันการเข้าถึงข้อมูลของผู้อื่นโดยการแก้ไข ID ใน URL | [OWASP Top 10](./references/OWASP-TOP-10.md) — A01:2021 |

---

## 4. ข้อกำหนดด้านการจัดเก็บ Password

### 4.1 Hashing Algorithm

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Algorithm** | ใช้ **Argon2id** เป็นหลัก | [ARGON2](./references/ARGON2.md) — Section 1 |
| **Alternative** | หาก Argon2id ไม่พร้อมใช้งาน ใช้ **scrypt** | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 4 |
| **Legacy** | bcrypt ใช้ได้เฉพาะกับ legacy system ที่ไม่สามารถอัปเกรดได้ | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 4.3 |
| **ห้ามใช้** | MD5, SHA-1, SHA-256 (plain) ห้ามใช้สำหรับ password hashing | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 4 |

### 4.2 Argon2id Parameters

| Parameter | ค่าที่แนะนำ | อ้างอิง |
|-----------|--------------|----------|
| **memory (m)** | อย่างน้อย 19 MiB | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 4.1 |
| **iterations (t)** | 2 รอบ | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 4.1 |
| **parallelism (p)** | 1 | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 4.1 |

### 4.3 Salt และ Pepper

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Salt** | ใช้ unique salt สำหรับทุก password | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 3.1 |
| **Pepper (Optional)** | พิจารณาใช้ pepper เพื่อเพิ่มการป้องกันเชิงลึก | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 3.2 |

---

## 5. ข้อกำหนดด้าน Token Management

### 5.1 JWT Structure

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Algorithm** | ใช้ **HS256** ขั้นต่ำ หรือ **RS256** | [RFC7519](./references/RFC7519.md) — Section 8 |
| **Required Claims** | ต้องมี: `iss`, `sub`, `aud`, `exp`, `iat` | [RFC7519](./references/RFC7519.md) — Section 4.1 |
| **JTI** | ใช้ JWT ID เพื่อป้องกัน replay attack | [RFC7519](./references/RFC7519.md) — Section 4.1.7 |

### 5.2 Token Expiration

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Access Token** | หมดอายุภายใน 30 นาที | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 6.1 |
| **Refresh Token** | หมดอายุภายใน 24 ชั่วโมง | [RFC6749](./references/RFC6749.md) — Section 1.5 |
| **Clock Skew** | อนุญาตให้มี leeway ไม่เกิน 1 นาที | [RFC7519](./references/RFC7519.md) — Section 4.1.4 |

### 5.3 Token Security

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Secure Transmission** | ส่งผ่าน HTTPS เท่านั้น | [RFC6749](./references/RFC6749.md) — Section 1.6 |
| **Token Validation** | ต้อง validate signature, expiration, issuer, audience ทุกครั้ง | [RFC7519](./references/RFC7519.md) — Section 7 |
| **Algorithm Validation** | ปฏิเสธ token ที่ใช้ algorithm ที่ไม่ได้รับอนุญาต | [RFC7519](./references/RFC7519.md) — Section 7.2 |

### 5.4 OAuth 2.0 Implementation

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Grant Type** | ใช้ **Authorization Code Flow** | [RFC6749](./references/RFC6749.md) — Section 4.1 |
| **PKCE** | รองรับ PKCE (Proof Key for Code Exchange) | [OpenID Connect](./references/OPENID.md) — Section 3 |
| **Client Authentication** | Confidential clients ต้อง authenticate กับ authorization server | [RFC6749](./references/RFC6749.md) — Section 2.3 |

---

## 6. ข้อกำหนดด้านความปลอดภัยของ API

### 6.1 OWASP API Security Top 10

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **API1:2023** | Broken Object Level Authorization — ตรวจสอบสิทธิ์ทุกครั้งที่เข้าถึง object | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API2:2023** | Broken Authentication — ใช้ authentication ที่แข็งแกร่งและจำกัด login attempts | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API3:2023** | Broken Object Property Level Authorization — ตรวจสอบสิทธิ์การเข้าถึงแต่ละ property | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API4:2023** | Unrestricted Resource Consumption — จำกัด request size และ time | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API5:2023** | Broken Function Level Authorization — ตรวจสอบว่า user มีสิทธิ์เรียก endpoint นั้น | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API6:2023** | Unrestricted Access to Sensitive Business Flows — ป้องกัน automated attacks | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API7:2023** | Server-Side Request Forgery — ตรวจสอบ URL ก่อนดึงข้อมูล | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API8:2023** | Security Misconfiguration — ตั้งค่าทุก component อย่างปลอดภัย | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API9:2023** | Improper Inventory Management — ติดตาม API versions และ endpoints | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |
| **API10:2023** | Unsafe Consumption of APIs — ตรวจสอบข้อมูลจาก API ภายนอก | [OWASP API Security](./references/OWASP-API-SECURITY-TOP-10.md) |

### 6.2 Input Validation

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Server-side Validation** | ตรวจสอบข้อมูลนำเข้าทุกครั้งบน server-side | [OWASP Top 10](./references/OWASP-TOP-10.md) — A03:2021 |
| **Allowlist** | ใช้ allowlist แทน denylist | [OWASP Top 10](./references/OWASP-TOP-10.md) — A03:2021 |
| **Parameterized Queries** | ใช้ parameterized queries ป้องกัน SQL Injection | [OWASP Top 10](./references/OWASP-TOP-10.md) — A03:2021 |

---

## 7. ข้อกำหนดด้าน Session Management

### 7.1 Session Configuration

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Session Timeout** | Session หมดอายุหลังไม่มีการใช้งาน 15-30 นาที | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 8 |
| **Absolute Timeout** | Session หมดอายุภายใน 8-12 ชั่วโมง แม้มีการใช้งาน | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 8 |
| **Session ID** | สุ่ม Session ID ด้วยความยาวเพียงพอ | [OWASP Top 10](./references/OWASP-TOP-10.md) — A07:2021 |

### 7.2 Session Security

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Secure Cookie** | ตั้ง `Secure` flag | [OWASP Top 10](./references/OWASP-TOP-10.md) — A02:2021 |
| **HttpOnly** | ตั้ง `HttpOnly` flag ป้องกัน XSS | [OWASP Top 10](./references/OWASP-TOP-10.md) — A03:2021 |
| **SameSite** | ตั้ง `SameSite=Strict` หรือ `Lax` | [OWASP Top 10](./references/OWASP-TOP-10.md) — A01:2021 |
| **Session Invalidation** | Invalidate session ทันทีหลัง logout | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 8 |

---

## 8. ข้อกำหนดด้าน Data Protection

### 8.1 Encryption

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **In Transit** | ใช้ HTTPS (TLS 1.2+) สำหรับการส่งข้อมูลทั้งหมด | [NIST SP 800-63B](./references/NIST-SP-800-63-3.md) — Section 6 |
| **At Rest** | เข้ารหัสข้อมูล sensitive ใน database | [OWASP Top 10](./references/OWASP-TOP-10.md) — A02:2021 |
| **Forward Secrecy** | รองรับ forward secrecy | [OWASP Top 10](./references/OWASP-TOP-10.md) — A02:2021 |

### 8.2 Sensitive Data

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Password** | เก็บเฉพาะ hash ไม่เก็บ plaintext | [OWASP Password Storage](./references/OWASP-Password-Storage.md) — Section 2 |
| **JWT** | ไม่เก็บข้อมูล sensitive ใน JWT payload (สามารถ decode ได้) | [RFC7519](./references/RFC7519.md) — Section 10 |
| **Data Minimization** | เก็บเฉพาะข้อมูลที่จำเป็น | [NIST SP 800-63-3](./references/NIST-SP-800-63-3.md) — Section 4 |

---

## 9. ข้อกำหนดด้าน Compliance และ Logging

### 9.1 Audit Logging

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Log Events** | บันทึก: login (สำเร็จ/ล้มเหลว), access control failure, sensitive operations | [OWASP Top 10](./references/OWASP-TOP-10.md) — A09:2021 |
| **Log Format** | ใช้รูปแบบที่ centralized log system อ่านได้ | [OWASP Top 10](./references/OWASP-TOP-10.md) — A09:2021 |
| **Log Protection** | ป้องกัน log injection และ unauthorized access | [OWASP Top 10](./references/OWASP-TOP-10.md) — A09:2021 |

### 9.2 Security Monitoring

| ข้อกำหนด | รายละเอียด | อ้างอิง |
|-----------|-------------|----------|
| **Alerting** | แจ้งเตือนเมื่อพบกิจกรรมน่าสงสัย | [OWASP Top 10](./references/OWASP-TOP-10.md) — A09:2021 |
| **Incident Response** | มี incident response plan และทดสอบ regularly | [OWASP Top 10](./references/OWASP-TOP-10.md) — A09:2021 |

---

## ภาคผนวก

### ตารางอ้างอิงเอกสาร

| เอกสาร | รายละเอียด |
|---------|-------------|
| [ARGON2](./references/ARGON2.md) | Password Hashing Algorithm |
| [NIST SP 800-63-3](./references/NIST-SP-800-63-3.md) | Digital Identity Guidelines |
| [OpenID Connect](./references/OPENID.md) | Authentication Protocol |
| [OWASP API Security Top 10](./references/OWASP-API-SECURITY-TOP-10.md) | API Security Risks |
| [OWASP Top 10](./references/OWASP-TOP-10.md) | Web Application Security Risks |
| [OWASP Password Storage](./references/OWASP-Password-Storage.md) | Password Storage Guidelines |
| [RFC6749](./references/RFC6749.md) | OAuth 2.0 Authorization Framework |
| [RFC7519](./references/RFC7519.md) | JSON Web Token (JWT) |

---

*เอกสารนี้สร้างขึ้นเพื่อกำหนดข้อกำหนดด้านความปลอดภัยสำหรับระบบ Raven โดยอ้างอิงจากมาตรฐานสากลและแนวปฏิบัติที่ดีด้านความปลอดภัย*