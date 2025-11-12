# Security Requirements Document: [Project Name]

## 1. Introduction
เอกสารนี้ระบุข้อกำหนดด้านความปลอดภัย (Security Requirements) ทั้งในเชิงฟังก์ชันการทำงาน (Functional) และข้อกำหนดที่ไม่ได้เป็นฟังก์ชันการทำงาน (Non-Functional) สำหรับ [Project Name]

ข้อกำหนดทั้งหมดจะถูกระบุด้วย ID (เช่น `PS-NFR1`) เพื่อให้สามารถติดตามและทดสอบได้

---

## 2. Password Storage (PS)

ข้อกำหนดในส่วนนี้อ้างอิงหลักการจาก [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### Non-Functional Requirements (NFR)

* **[PS-NFR1] Storage Mechanism (Hashing vs. Encryption):**
    * **Description:** รหัสผ่านต้องถูกจัดเก็บในรูปแบบที่ไม่สามารถย้อนกลับ (Reverse) มาเป็นข้อความเดิมได้
    * **Requirement:** ระบบ**ต้อง**ใช้การ **Hashing** (ฟังก์ชันทางเดียว) ในการจัดเก็บรหัสผ่าน
    * **Requirement:** ระบบ**ห้าม**ใช้วิธีการ **Encryption** (การเข้ารหัสแบบสองทาง) ในการจัดเก็บรหัสผ่านโดยเด็ดขาด

* **[PS-NFR2] Hashing Algorithm Selection:**
    * **Description:** ระบบต้องใช้อัลกอริทึม Hashing ที่ทันสมัย ทำงานช้า (Slow) และใช้ทรัพยากร (Memory-hard) เพื่อต้านทานการโจมตีแบบ Offline Brute-force
    * **Requirement (Primary):** ระบบ**ต้อง**ใช้ **Argon2id** เป็นอัลกอริทึมหลัก
    * **Requirement (Fallback):** หากไม่สามารถใช้ Argon2id ได้ ให้ใช้ **scrypt** หรือ **bcrypt** เป็นลำดับรอง
    * **Requirement (FIPS):** หากจำเป็นต้องปฏิบัติตามมาตรฐาน FIPS-140 ให้ใช้ **PBKDF2**
    * **Requirement (Prohibited):** ระบบ**ห้าม**ใช้อัลกอริทึมที่ทำงานเร็ว (Fast Hash) เช่น **MD5**, **SHA-1**, **SHA-256** (ที่ทำงานเพียงรอบเดียว) ในการจัดเก็บรหัสผ่าน

* **[PS-NFR3] Algorithm Configuration (Argon2id):**
    * **Description:** การกำหนดค่า Argon2id ต้องเป็นไปตามคำแนะนำขั้นต่ำ
    * **Requirement:** หากใช้ Argon2id (ตามข้อ `PS-NFR2`) **ต้อง**กำหนดค่าขั้นต่ำ: **Memory 19 MiB**, **Iterations 2** (t=2), และ **Parallelism 1** (p=1)

* **[PS-NFR4] Algorithm Configuration (Legacy/Fallback):**
    * **Description:** การกำหนดค่าอัลกอริทึมทางเลือกต้องเป็นไปตามคำแนะนำขั้นต่ำ
    * **Requirement:** หากใช้ **bcrypt** (ตามข้อ `PS-NFR2`) **ต้อง**กำหนดค่า Work Factor ขั้นต่ำที่ **10**
    * **Requirement:** หากใช้ **PBKDF2** (ตามข้อ `PS-NFR2`) **ต้อง**ใช้กับ **HMAC-SHA-256** และกำหนดค่า Iterations ขั้นต่ำที่ **600,000**

* **[PS-NFR5] Unique User Salting:**
    * **Description:** ระบบต้องป้องกันการโจมตีแบบ Rainbow Table โดยการใช้ Salt ที่ไม่ซ้ำกัน
    * **Requirement:** ระบบ**ต้อง**สร้างค่า **Salt** ที่เป็นค่าสุ่ม (Cryptographically Secure Random) และ **ไม่ซ้ำกัน (Unique)** สำหรับผู้ใช้แต่ละคน (Per-user salt)
    * **Requirement:** Salt **ต้อง**ถูกจัดเก็บไว้ในฐานข้อมูลควบคู่กับค่า Hash ของรหัสผ่านนั้นๆ
    * *(Note: อัลกอริทึมใน `PS-NFR2` เช่น Argon2id, scrypt, bcrypt และ PBKDF2 จะจัดการเรื่องการสร้างและจัดเก็บ Salt โดยอัตโนมัติเมื่อใช้งานอย่างถูกต้อง)*

* **[PS-NFR6] Configurable Work Factor:**
    * **Description:** ความซับซ้อน (Work Factor, Iterations, Memory cost) ของการ Hash **ต้อง**สามารถปรับเปลี่ยนได้ในอนาคต
    * **Requirement:** ค่า Parameters (เช่น work factor, iterations, memory) **ต้อง**ถูกกำหนดไว้ใน Configuration file (ห้าม Hardcode) เพื่อให้สามารถปรับเพิ่มความซับซ้อนได้ เมื่อฮาร์ดแวร์ประมวลผลเร็วขึ้น

* **[PS-NFR7] (Optional) System Pepper:**
    * **Description:** (Optional) เพื่อเพิ่มการป้องกันเชิงลึก (Defense in Depth) ระบบ**ควร (SHOULD)** ใช้ Pepper
    * **Requirement:** หากมีการใช้ Pepper, ค่า Pepper **ต้อง**เป็นความลับของระบบ และ**ห้าม**จัดเก็บไว้ในฐานข้อมูลเดียวกับรหัสผ่าน
    * **Requirement:** Pepper **ต้อง**ถูกจัดเก็บในที่ปลอดภัย เช่น Secret Manager, HSM, หรือ Environment Variable

* **[PS-NFR8] Legacy Hash Upgrading:**
    * **Description:** ระบบ**ต้อง**มีกลไกในการอัปเกรด Hash ที่ล้าสมัย (เช่น MD5, SHA1) ไปเป็นอัลกอริทึมสมัยใหม่
    * **Requirement:** เมื่อผู้ใช้ Login ด้วยรหัสผ่านที่ใช้ Hash อัลกอริทึมเก่า และการยืนยันตัวตนสำเร็จ, ระบบ**ต้อง**ทำการ Re-hash รหัสผ่านนั้นใหม่ด้วยอัลกอริทึมปัจจุบัน (ตามข้อ `PS-NFR2`)
    * **Requirement:** ระบบ**ต้อง**บันทึกค่า Hash ใหม่และ Salt ใหม่ และลบค่า Hash เก่าทิ้ง

* **[PS-NFR9] International Character Support:**
    * **Description:** ระบบต้องรองรับรหัสผ่านที่เป็นอักขระสากล
    * **Requirement:** กระบวนการ Hashing **ต้อง**รองรับอักขระ **Unicode** ทั้งหมด (รวมถึง NULL byte) เพื่อให้ผู้ใช้สามารถตั้งรหัสผ่านเป็นภาษาต่างๆ หรือมี Emojis ได้
    * **Requirement:** ระบบ**ห้าม**ตัด (truncate) รหัสผ่านก่อนทำการ Hashing