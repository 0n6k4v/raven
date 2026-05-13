# 📋 Feature Development Progress by Access Role

เอกสารฉบับนี้ใช้สำหรับติดตามความคืบหน้าของฟีเจอร์ โดยจัดกลุ่มตามสิทธิ์การเข้าถึง (Access Role) และเรียงลำดับตามความสำคัญของสถานะ (To Do → Done)

---

## 🚦 Status Legend
| Icon | Status | Meaning |
| :---: | :--- | :--- |
| ⚪ | **To Do** | ยังไม่ได้เริ่มดำเนินการ (Backlog) |
| 🔴 | **Bug** | พบปัญหา/ข้อผิดพลาด ที่ต้องแก้ไขด่วน |
| 🟡 | **Migration** | รอพอร์ตโค้ดมาจาก Repository เก่า |
| 🔵 | **Refactor** | มีโค้ดแล้ว แต่กำลังปรับปรุงโครงสร้างให้ดีขึ้น |
| 🟢 | **Done** | เสร็จสมบูรณ์ (Production Ready) |

---

## 📊 Overall Summary
| Status | Count |
| :--- | :---: |
| ⚪ To Do | 4/67 |
| 🟡 Migration | 12/67 |
| 🔵 Refactor | 30/67 |
| 🔴 Bug | 2/67 |
| 🟢 Done | 19/67 |
| **Total** | **67** |

---

## General User Features
**Summary:** ⚪ 1/16 | 🟡 3/16 | 🔵 7/16 | 🔴 0/16 | 🟢 5/16
**Total:** = 16 รายการ

### ⚪ To Do (1 รายการ)
**ชื่อ:** Notification

### 🟡 Migration (3 รายการ)
**ชื่อ:** /catalog
**ชื่อ:** /dashboard
**ชื่อ:** /map

### 🔵 Refactor (7 รายการ)
**ชื่อ:** /history
**คำอธิบาย:** Filter ยังกรองจาก Location ไม่ได้

**ชื่อ:** /history/detail
**คำอธิบาย:** 1. Data Mismatch 2. Download ภาพยังไม่ได้

**ชื่อ:** /evidenceProfile
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/gallery
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/history
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/map
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/save-to-record
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

### 🟢 Done 5 รายการ
**ชื่อ:** /home
**ชื่อ:** /camera
**ชื่อ:** /upload
**ชื่อ:** /imagePreview
**ชื่อ:** /candidateShow

---

## 🔫 Firearm Admin
**Summary:** ⚪ 1/16 | 🟡 3/16 | 🔵 8/16 | 🔴 0/16 | 🟢 4/16
**Total:** 16 รายการ

### ⚪ To Do (1 รายการ)
**ชื่อ:** Notification

### 🟡 Migration (3 รายการ)
**ชื่อ:** /catalog
**ชื่อ:** /dashboard
**ชื่อ:** /map

### 🔵 Refactor (8 รายการ)
**ชื่อ:** Home

**ชื่อ:** /history
**คำอธิบาย:** Filter ยังกรองจาก Location ไม่ได้

**ชื่อ:** /history/detail
**คำอธิบาย:** 1. Data Mismatch 2. Download ภาพยังไม่ได้

**ชื่อ:** /evidenceProfile
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/gallery
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/history
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/map
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/save-to-record
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

### 🟢 Done 4 (รายการ)
**ชื่อ:** /camera
**ชื่อ:** /upload
**ชื่อ:** /imagePreview
**ชื่อ:** /candidateShow

---

## 💊 Narcotic Admin
**Summary:** ⚪ 1/18 | 🟡 3/18 | 🔵 8/18 | 🔴 0/18 | 🟢 6/18
**Total:** 18 รายการ

### ⚪ To Do (1 รายการ)
**ชื่อ:** Notification
**คำอธิบาย:** ยังไม่เริ่ม

### 🟡 Migration (3 รายการ)
**ชื่อ:** /admin/narcotics/edit/
**ชื่อ:** upload คดียาเสพติด
**ชื่อ:** แสดงผลคดียาเสพติด

### 🔵 Refactor (8 รายการ)
**ชื่อ:** /admin/narcotics/create-narcotic

**ชื่อ:** /history
**คำอธิบาย:** Filter ยังกรองจาก Location ไม่ได้

**ชื่อ:** /history/detail
**คำอธิบาย:** 1. Data Mismatch 2. Download ภาพยังไม่ได้

**ชื่อ:** /evidenceProfile
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/gallery
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/history
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/map
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/save-to-record
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

### 🟢 Done (6 รายการ)
**ชื่อ:** /home
**ชื่อ:** /camera
**ชื่อ:** /upload
**ชื่อ:** /imagePreview
**ชื่อ:** /candidateShow
**ชื่อ:** /admin/narcotics/catalog-management

---

## ⚡ Super Admin
**Summary:** ⚪ 1/17  | 🟡 3/17 | 🔵 7/17 | 🔴 2/17 | 🟢 4/17
**Total:** 17 รายการ

### ⚪ To Do (1 รายการ)
**ชื่อ:** Notification
**คำอธิบาย:** ยังไม่เริ่ม

### 🟡 Migration (3 รายการ)
**ชื่อ:** /catalog
**คำอธิบาย:** ยังไม่ได้เอามาจาก Repo เก่า

**ชื่อ:** /dashboard
**คำอธิบาย:** ยังไม่ได้เอามาจาก Repo เก่า

**ชื่อ:** /map
**คำอธิบาย:** ยังไม่ได้เอามาจาก Repo เก่า

### 🔵 Refactor (7 รายการ)
**ชื่อ:** /history
**คำอธิบาย:** Filter ยังกรองจาก Location ไม่ได้

**ชื่อ:** /history/detail
**คำอธิบาย:** 1. Data Mismatch 2. Download ภาพยังไม่ได้

**ชื่อ:** /evidenceProfile
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/gallery
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/history
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/map
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

**ชื่อ:** /evidenceProfile/save-to-record
**คำอธิบาย:** Data Mismatch // อยู่ระหว่างการรวมศูนย์ Data Source

### 🔴 Bug (2 รายการ)
**ชื่อ:** /createUser

**Note:** UX ปุ่ม Upload ยังมีปัญหาเล็กน้อย

**ชื่อ:** /userManagement

**Note:** Pagination แสดงข้อมูลผิด

### 🟢 Done (4 รายการ)

**ชื่อ:** /home

**ชื่อ:** /camera

**ชื่อ:** /upload

**ชื่อ:** /edit-user