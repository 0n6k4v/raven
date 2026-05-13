# OWASP Top Ten
### ความเสี่ยงด้านความปลอดภัย 10 อันดับแรกของ Web Application

> **แหล่งที่มา:** [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)
> **เวอร์ชันปัจจุบัน:** OWASP Top 10:2021 (เวอร์ชัน 2025 Release Candidate อยู่ระหว่างการพัฒนา)

---

## OWASP คืออะไร?

**OWASP (Open Worldwide Application Security Project)** คือองค์กรไม่แสวงหากำไรที่ทำงานด้านการพัฒนา web application security โดย **OWASP Top Ten** เป็นเอกสารมาตรฐานด้านการสร้างความตระหนักรู้ (awareness document) สำหรับนักพัฒนาและผู้เชี่ยวชาญด้านความปลอดภัย

เอกสารฉบับนี้แสดงถึงฉันทามติกว้างๆ เกี่ยวกับความเสี่ยงด้านความปลอดภัยที่วิกฤติที่สุดของ web application และได้รับการยอมรับทั่วโลกในฐานะจุดเริ่มต้นของการเขียนโค้ดอย่างปลอดภัย

**ทำไมจึงสำคัญ?**
การนำ OWASP Top 10 ไปปรับใช้ถือเป็นก้าวแรกที่มีประสิทธิภาพที่สุดในการเปลี่ยนแปลงวัฒนธรรมการพัฒนาซอฟต์แวร์ขององค์กรไปสู่การสร้างโค้ดที่ปลอดภัยมากขึ้น

---

## วิธีการจัดทำ OWASP Top 10:2021

ฉบับปี 2021 นี้อิงข้อมูลมากกว่าเดิม โดย:

- คัดเลือก **8 หมวดหมู่** จากข้อมูลจริงที่ได้รับการ contribute จากองค์กรต่างๆ ทั่วโลก ครอบคลุมมากกว่า 500,000 แอปพลิเคชัน
- คัดเลือก **2 หมวดหมู่** จาก community survey ที่ถามผู้เชี่ยวชาญด้าน application security ว่าความเสี่ยงใดสำคัญแต่อาจยังไม่สะท้อนในข้อมูล
- มุ่งเน้น **root cause** (สาเหตุต้นตอ) มากกว่า symptom (อาการ) เพื่อให้แนวทางการแก้ไขชัดเจนยิ่งขึ้น
- แต่ละหมวดหมู่มี CWE (Common Weakness Enumeration) เฉลี่ย 19.6 รายการ

---

## ภาพรวม OWASP Top 10:2021

| อันดับ | รหัส | ชื่อ | สถานะ (เทียบกับปี 2017) |
|---|---|---|---|
| 1 | A01 | Broken Access Control | ↑ เลื่อนขึ้นจากอันดับ 5 |
| 2 | A02 | Cryptographic Failures | ↑ เลื่อนขึ้นจากอันดับ 3 |
| 3 | A03 | Injection | ↓ ลงจากอันดับ 1 |
| 4 | A04 | Insecure Design | 🆕 หมวดใหม่ |
| 5 | A05 | Security Misconfiguration | ↓ ลงจากอันดับ 6 |
| 6 | A06 | Vulnerable and Outdated Components | ↑ เลื่อนขึ้นจากอันดับ 9 |
| 7 | A07 | Identification and Authentication Failures | ↓ ลงจากอันดับ 2 |
| 8 | A08 | Software and Data Integrity Failures | 🆕 หมวดใหม่ |
| 9 | A09 | Security Logging and Monitoring Failures | ↑ เลื่อนขึ้นจากอันดับ 10 |
| 10 | A10 | Server-Side Request Forgery (SSRF) | 🆕 หมวดใหม่ |

---

## รายละเอียดแต่ละหมวดหมู่

---

### 🔴 A01:2021 — Broken Access Control

**เลื่อนขึ้นจากอันดับ 5 สู่อันดับ 1 — ความเสี่ยงอันดับหนึ่งของ web application**

**Access control** คือกลไกที่ควบคุมว่าผู้ใช้สามารถทำอะไรได้บ้างภายในระบบ เมื่อ access control ล้มเหลว ผู้โจมตีสามารถเข้าถึงข้อมูล ปรับเปลี่ยน หรือทำลายข้อมูลโดยไม่ได้รับอนุญาต รวมถึงดำเนินการฟังก์ชันที่เกินสิทธิ์ของตน

**ข้อมูลสถิติ:** พบใน 94% ของแอปพลิเคชันที่ทดสอบ, อัตราการเกิด (incidence rate) เฉลี่ย 3.81%, พบ CWE มากกว่า 318,000 ครั้ง

**ช่องโหว่ที่พบบ่อย:**
- ผู้ใช้สามารถเข้าถึง URL หรือ API ที่ควรจำกัดเฉพาะ admin ได้โดยตรง
- การแก้ไข primary key ใน URL เพื่อเข้าถึงข้อมูลของผู้ใช้อื่น (Insecure Direct Object Reference)
- การ bypass access control โดยแก้ไข JWT token หรือ cookie เพื่อยกระดับสิทธิ์
- Path traversal ที่ทำให้เข้าถึงไฟล์นอกขอบเขตที่อนุญาต
- CORS misconfiguration ที่อนุญาต API access จาก origin ที่ไม่น่าเชื่อถือ
- เข้าถึง API โดยไม่มี authentication ใน POST, PUT, DELETE request

**แนวทางป้องกัน:**
- ใช้หลักการ deny by default — ปฏิเสธการเข้าถึงทุกอย่างโดยค่าเริ่มต้น เว้นแต่จะได้รับอนุญาตชัดเจน
- บังคับใช้ access control บน server-side ทุกครั้ง ไม่ใช่แค่บน client
- ปิดการใช้งาน directory listing บน web server
- บันทึก log การล้มเหลวของ access control และแจ้งเตือนเมื่อพบการโจมตี

**CWE ที่เกี่ยวข้อง:** CWE-200, CWE-201, CWE-352 (Cross-Site Request Forgery)

---

### 🔴 A02:2021 — Cryptographic Failures

**เลื่อนขึ้นจากอันดับ 3 — เดิมรู้จักในชื่อ "Sensitive Data Exposure"**

หมวดหมู่นี้มุ่งเน้นที่ความล้มเหลวที่เกี่ยวกับ **cryptography** ซึ่งมักนำไปสู่การเปิดเผยข้อมูลสำคัญหรือระบบถูก compromise ชื่อใหม่สะท้อนสาเหตุต้นตอได้แม่นยำกว่า

**ข้อมูลที่ต้องป้องกันเป็นพิเศษ ได้แก่:** password, หมายเลขบัตรเครดิต, ข้อมูลสุขภาพ, ข้อมูลส่วนบุคคล, ความลับทางธุรกิจ — โดยเฉพาะข้อมูลที่อยู่ภายใต้กฎหมายอย่าง GDPR หรือมาตรฐานอย่าง PCI DSS

**ช่องโหว่ที่พบบ่อย:**
- ส่งข้อมูลสำคัญผ่าน HTTP แบบ plain text (ไม่ใช้ HTTPS)
- เข้ารหัสด้วย algorithm ที่ล้าสมัยหรืออ่อนแอ เช่น MD5, SHA1, RC4, DES
- ใช้ default crypto key, key ที่อ่อนแอ, หรือ key ที่ไม่ได้หมุนเวียนอย่างเหมาะสม
- เก็บ password โดยไม่ใช้ hashing หรือใช้ hash ที่ไม่มี salt
- ส่ง cookie ที่มีข้อมูลสำคัญโดยไม่ตั้ง `Secure` flag

**แนวทางป้องกัน:**
- จัดประเภทข้อมูลและกำหนดระดับการป้องกันตามความสำคัญ
- ห้ามเก็บข้อมูลสำคัญโดยไม่จำเป็น (data minimization)
- เข้ารหัสข้อมูล at rest และ in transit ด้วย algorithm ที่ทันสมัย
- ใช้ authenticated encryption แทน plain encryption
- ใช้ฟังก์ชัน hash ที่เหมาะสมสำหรับ password เช่น Argon2, bcrypt, scrypt
- บังคับใช้ HTTPS กับ forward secrecy

**CWE ที่เกี่ยวข้อง:** CWE-259 (Hard-coded Password), CWE-327 (Broken Crypto Algorithm), CWE-331 (Insufficient Entropy)

---

### 🔴 A03:2021 — Injection

**ลงจากอันดับ 1 แต่ยังคงอันตรายสูง**

**Injection** เกิดขึ้นเมื่อแอปพลิเคชันส่งข้อมูลที่ไม่น่าเชื่อถือไปยัง interpreter โดยที่ข้อมูลนั้นถูกตีความเป็นคำสั่งหรือ query ทำให้ผู้โจมตีสามารถแก้ไขพฤติกรรมของระบบได้

**ประเภทการโจมตี:** SQL Injection, NoSQL Injection, OS Command Injection, LDAP Injection, XSS (Cross-site Scripting), Header Injection

**ข้อมูลสถิติ:** ทดสอบใน 94% ของแอปพลิเคชัน, incidence rate สูงสุด 19%, พบ CWE มากกว่า 274,000 ครั้ง

**แอปพลิเคชันมีความเสี่ยงเมื่อ:**
- ข้อมูลจากผู้ใช้ไม่ถูก validate, filter, หรือ sanitize
- dynamic query หรือ call ไปยัง interpreter ถูก construct โดยรวม input ของผู้ใช้โดยตรง
- ข้อมูลที่เป็นอันตรายถูกใช้ใน ORM search parameter
- ข้อมูลที่ส่งเข้าไม่ได้รับการ validate, filter, หรือ sanitize โดย application

**แนวทางป้องกัน:**
- ใช้ parameterized query หรือ prepared statement แทนการต่อ string ตรงๆ
- ใช้ ORM (Object Relational Mapping) ที่ปลอดภัย
- ทำ input validation ฝั่ง server โดยใช้ allowlist (whitelist)
- ใช้ LIMIT และ SQL control อื่นๆ เพื่อจำกัดผลลัพธ์ที่ query คืนกลับมา
- ทดสอบด้วย automated tools ก่อน deploy

**ตัวอย่าง SQL Injection:**
```sql
-- Query ที่เสี่ยง
"SELECT * FROM users WHERE name = '" + username + "'"

-- ผู้โจมตีใส่: ' OR '1'='1
-- ผลลัพธ์: SELECT * FROM users WHERE name = '' OR '1'='1'
-- ทำให้ได้ข้อมูลผู้ใช้ทั้งหมด
```

**CWE ที่เกี่ยวข้อง:** CWE-79 (Cross-site Scripting), CWE-89 (SQL Injection), CWE-73 (External Control of File Name)

---

### 🟠 A04:2021 — Insecure Design

**🆕 หมวดหมู่ใหม่ที่เน้นความเสี่ยงระดับการออกแบบและสถาปัตยกรรม**

**Insecure design** คือหมวดหมู่กว้างที่ครอบคลุมจุดอ่อนประเภท "การออกแบบหรือการควบคุมที่ขาดหายไปหรือไม่มีประสิทธิภาพ" สำคัญคือต้องแยกแยะระหว่าง insecure design (ความผิดพลาดระดับแนวคิด) กับ insecure implementation (การ implement ที่ผิดพลาด) — ทั้งสองมีสาเหตุและการแก้ไขที่แตกต่างกัน

**ชุมชนนักพัฒนาต้องเคลื่อนไปสู่ "Shift-Left"** คือนำ security เข้ามาตั้งแต่ขั้นตอนออกแบบ ไม่ใช่แค่การทดสอบหลัง code เสร็จ

**แนวทางป้องกัน:**
- สร้าง **Secure Design Lifecycle** — รวบรวม requirement ด้านความปลอดภัยตั้งแต่ต้น
- ทำ **Threat Modeling** ในทุก session การออกแบบ — ระบุภัยคุกคาม, กระแสข้อมูล, และจุดควบคุม
- ใช้ **Secure Design Pattern** และ reference architecture ที่พิสูจน์แล้ว
- แยกส่วน (segregate) tenant ทุก tier ด้วยการออกแบบตั้งแต่ต้น
- จำกัดการใช้งาน resource ต่อผู้ใช้หรือ service (rate limiting ระดับ design)
- เขียน unit test และ integration test เพื่อตรวจสอบว่า security control ทำงานถูกต้อง

**ตัวอย่างช่องโหว่:**
- ระบบ credential recovery ที่ใช้ "security question" (ถูกห้ามตาม NIST 800-63b) — คำตอบอาจถูกคนอื่นรู้ได้
- ระบบจองโรงภาพยนตร์ที่ไม่จำกัดจำนวน group booking — ผู้โจมตีจองที่นั่งทั้งหมดครั้งเดียวได้
- เว็บ e-commerce ที่ไม่มีการป้องกัน bot สำหรับสินค้าขาดตลาด

**CWE ที่เกี่ยวข้อง:** CWE-209, CWE-256, CWE-501, CWE-522 (รวม 40 CWE — มากที่สุดในทุกหมวด)

---

### 🟠 A05:2021 — Security Misconfiguration

**ลงจากอันดับ 6 แต่ยังคงแพร่หลายมาก**

**Security misconfiguration** เกิดจากการตั้งค่าระบบ, framework, cloud service, หรือแอปพลิเคชันที่ไม่ปลอดภัย ซึ่งมักเกิดจากความประมาทหรือขาดกระบวนการจัดการที่เป็นระบบ

**ข้อมูลสถิติ:** พบใน 90% ของแอปพลิเคชันที่ทดสอบ, incidence rate เฉลี่ย 4.51%

**ช่องโหว่ที่พบบ่อย:**
- ใช้ account หรือ password เริ่มต้น (default) โดยไม่เปลี่ยน
- เปิด feature หรือ port ที่ไม่จำเป็น — ยิ่งมี attack surface มากยิ่งเสี่ยง
- ปล่อย error message ที่มีรายละเอียดระบบ (stack trace) ให้ผู้ใช้เห็น
- ไม่ตั้ง security header ที่เหมาะสม (Content-Security-Policy, X-Frame-Options ฯลฯ)
- ไม่ลบ sample application, default page, หรือ documentation ออกจาก production server
- ตั้งค่า permission ของ cloud storage ผิด (เช่น S3 bucket สาธารณะโดยไม่ตั้งใจ)

**แนวทางป้องกัน:**
- สร้างกระบวนการ hardening ที่ทำซ้ำได้ และ deploy environment ที่เหมือนกัน (development, QA, production)
- ทบทวนและอัปเดต configuration อย่างสม่ำเสมอ โดยเฉพาะหลัง patch ใหม่
- ใช้ minimal platform — ติดตั้งเฉพาะ component, feature, และ framework ที่จำเป็นจริงๆ
- ส่ง security directive ไปยัง client เช่น Security Header
- ทดสอบ configuration อัตโนมัติในทุก environment

---

### 🟠 A06:2021 — Vulnerable and Outdated Components

**เลื่อนขึ้นจากอันดับ 9 — ปัญหา software supply chain ที่เติบโต**

**Component** ได้แก่ library, framework, และ module ต่างๆ ที่ทำงานด้วยสิทธิ์เดียวกันกับแอปพลิเคชัน ดังนั้นช่องโหว่ใน component ใดก็ตามอาจส่งผลร้ายแรงต่อระบบทั้งหมด

**ความเสี่ยงเกิดขึ้นเมื่อ:**
- ไม่ทราบ version ของ component ทั้งหมดที่ใช้ (รวม transitive dependency)
- ใช้ software ที่ไม่ได้รับการสนับสนุน, มีช่องโหว่ที่รู้อยู่แล้ว, หรือไม่ได้รับ security patch
- ไม่ทดสอบ compatibility ของ library ที่อัปเดตแล้ว
- ไม่ fix configuration ของ platform ที่เปลี่ยนไปตามการ update

**ตัวอย่างเหตุการณ์จริง:** CVE-2017-5638 ช่องโหว่ Apache Struts 2 ที่ทำให้เกิด remote code execution — นำไปสู่การรั่วไหลของข้อมูลในกรณี Equifax breach ที่ส่งผลกระทบต่อผู้คนกว่า 147 ล้านคน

**แนวทางป้องกัน:**
- ทำ inventory component ทั้งหมดรวมถึง version และ dependency ลำดับที่สอง (transitive dependency)
- ลบ dependency, feature, component, file และ documentation ที่ไม่ใช้ออก
- ติดตามช่องโหว่ใหม่ผ่าน CVE, NVD และ security mailing list ของ library ที่ใช้
- ใช้ software composition analysis (SCA) tool เช่น OWASP Dependency-Check
- ดาวน์โหลด component จากแหล่งอย่างเป็นทางการผ่าน secure link เท่านั้น
- ใช้ signed package เพื่อลดความเสี่ยงจากการที่ component ถูกดัดแปลง

---

### 🟡 A07:2021 — Identification and Authentication Failures

**ลงจากอันดับ 2 — เดิมรู้จักในชื่อ "Broken Authentication"**

หมวดหมู่นี้ครอบคลุมความล้มเหลวทั้งในกระบวนการ **identification** (การระบุตัวตน) และ **authentication** (การพิสูจน์ตัวตน) รวมถึงการจัดการ session ที่ไม่ปลอดภัย

**ช่องโหว่ที่พบบ่อย:**
- อนุญาตให้ใช้ password ที่อ่อนแอหรือเดาได้ง่าย เช่น "password123"
- ไม่มี rate limiting บน login — เปิดช่องให้ brute-force หรือ credential stuffing
- ใช้ plain text, encrypted (ไม่ใช่ hashed), หรือ weak hash ในการเก็บ password
- ไม่มีหรือมี multi-factor authentication (MFA) ที่ไม่มีประสิทธิภาพ
- Session timeout ไม่ถูกตั้งอย่างเหมาะสม — ผู้ใช้ปิดเบราว์เซอร์แต่ session ยังคงอยู่
- Session ID ถูกเปิดเผยใน URL
- ไม่ invalidate session ID อย่างถูกต้องหลัง logout

**แนวทางป้องกัน:**
- บังคับใช้ **Multi-factor Authentication (MFA)** โดยเฉพาะสำหรับ admin และบัญชีสำคัญ
- ไม่ deploy ระบบที่มี default credential อย่างเด็ดขาด
- ตรวจสอบ password ใหม่กับรายการ password ที่รู้ว่าถูก compromise แล้ว (เช่น Have I Been Pwned)
- จำกัด login attempt และแจ้งเตือนเมื่อพบการพยายาม login ผิดปกติ
- ใช้ secure session manager ฝั่ง server ที่สร้าง random session ID ที่มีความยาวเพียงพอ
- Invalidate session ID ทันทีหลัง logout และ timeout

---

### 🟡 A08:2021 — Software and Data Integrity Failures

**🆕 หมวดหมู่ใหม่ที่เน้นความปลอดภัยของ CI/CD pipeline และ software supply chain**

หมวดหมู่นี้เกี่ยวกับโค้ดและโครงสร้างพื้นฐานที่ **ไม่ป้องกันการละเมิด integrity** ตัวอย่างคือแอปพลิเคชันที่ใช้ plugin, library, หรือ module จากแหล่งที่ไม่น่าเชื่อถือ รวมถึง insecure CI/CD pipeline ที่เปิดช่องให้ malicious code แทรกเข้าสู่ production

**ความเสี่ยงหลัก:**
- auto-update mechanism ที่ไม่ตรวจสอบ digital signature ก่อนติดตั้ง
- ดาวน์โหลด library จาก CDN หรือ repository ที่ไม่ผ่านการตรวจสอบ integrity
- CI/CD pipeline ที่ไม่มี security control เพียงพอ เปิดช่องให้ inject malicious code
- insecure deserialization — อ่าน serialized object ที่ผู้โจมตีสามารถดัดแปลงได้
- typosquatting — package ชื่อคล้ายกับของจริงแต่เป็น malicious

**ตัวอย่างการโจมตีจริง:** **SolarWinds attack (2020)** — ผู้โจมตีแทรก backdoor เข้าไปใน software update ของ SolarWinds Orion ทำให้กว่า 18,000 องค์กรได้รับ update ที่มี malware โดยไม่รู้ตัว

**แนวทางป้องกัน:**
- ใช้ **digital signature** เพื่อตรวจสอบว่า software หรือ data มาจากแหล่งที่คาดหวัง
- ให้ library และ dependency ดึงข้อมูลจาก trusted repository เท่านั้น
- ใช้ OWASP Dependency Check หรือ OWASP CycloneDX เพื่อตรวจสอบ component
- ตรวจสอบว่า CI/CD pipeline มี access control, separation, และ configuration ที่เหมาะสม
- ห้ามส่งข้อมูล serialized ที่ไม่ได้เข้ารหัสหรือ signed ไปยัง untrusted client

**CWE ที่เกี่ยวข้อง:** CWE-829, CWE-494 (Download Without Integrity Check), CWE-502 (Deserialization of Untrusted Data)

---

### 🟡 A09:2021 — Security Logging and Monitoring Failures

**เลื่อนขึ้นจากอันดับ 10 — เดิมรู้จักในชื่อ "Insufficient Logging & Monitoring"**

**Logging และ monitoring** เป็นกลไกสำคัญในการตรวจจับ, ยกระดับ, และตอบสนองต่อการโจมตีที่กำลังเกิดขึ้น หากขาดสิ่งเหล่านี้ การโจมตีจะไม่ถูกตรวจพบ ผู้โจมตีอาจอยู่ในระบบได้นานโดยไม่มีใครรู้

**ข้อมูลสถิติ:** ช่องโหว่นี้ยากต่อการทดสอบอัตโนมัติ แต่ส่งผลโดยตรงต่อความสามารถในการตรวจจับและ forensics

**สัญญาณของความล้มเหลว:**
- ไม่บันทึก login ที่ล้มเหลว, การเข้าถึงสิทธิ์สูง, หรือ input validation ที่ล้มเหลว
- Warning และ error ของแอปพลิเคชันไม่ถูก log หรือ log ข้อความไม่ชัดเจน
- ไม่มีการ monitor log ของแอปพลิเคชันและ API เพื่อหากิจกรรมน่าสงสัย
- Log เก็บอยู่แค่ภายใน — ผู้โจมตีที่ compromise ระบบสามารถลบหลักฐานได้
- ไม่มี alerting ที่มีประสิทธิภาพสำหรับ active attack ที่กำลังเกิดขึ้น

**แนวทางป้องกัน:**
- Log event สำคัญ: login (สำเร็จและล้มเหลว), access control failure, input validation failure
- สร้าง log ในรูปแบบที่ log management solution อ่านได้ง่าย
- ส่ง log ไปยัง centralized system ที่แยกออกจากระบบหลัก (SIEM)
- ตั้ง alert เมื่อพบกิจกรรมน่าสงสัยและตอบสนองได้อย่างรวดเร็ว
- ทดสอบ incident response plan อย่างสม่ำเสมอ
- ป้องกัน log injection attack

---

### 🟢 A10:2021 — Server-Side Request Forgery (SSRF)

**🆕 เพิ่มจาก community survey อันดับ 1 — ความเสี่ยงที่ชุมชนความปลอดภัยระบุว่าสำคัญมาก**

**SSRF** เกิดขึ้นเมื่อ web application ดึงข้อมูลจาก URL ที่ระบุโดยผู้ใช้ **โดยไม่ตรวจสอบความถูกต้องของ URL** ผู้โจมตีสามารถบังคับให้ server ส่ง request ไปยัง destination ที่ไม่คาดหมาย แม้จะมี firewall, VPN, หรือ network ACL ปกป้องอยู่ก็ตาม

**ความอันตราย:** เนื่องจากสถาปัตยกรรม web application สมัยใหม่มักใช้ cloud service, container, และ microservice ที่มักมี internal endpoint — ช่องโหว่ SSRF ทำให้ผู้โจมตีสามารถ:
- เข้าถึง internal service ที่ไม่ได้เปิดให้สาธารณะ (เช่น metadata service บน cloud)
- สแกน internal network
- เข้าถึง credential บน cloud provider metadata service (เช่น AWS EC2 Instance Metadata)
- Bypass firewall rule

**ตัวอย่างการโจมตี:**
```
# ผู้โจมตีส่ง URL ที่เป็นอันตราย
POST /api/fetch-image HTTP/1.1
{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}

# Server ดึงข้อมูลจาก AWS metadata service แล้วส่ง IAM credential กลับมา
```

**แนวทางป้องกัน:**
- แบ่ง network layer เพื่อแยก functionality การดึงข้อมูล remote resource ออกจากส่วนอื่น
- ใช้ allowlist ของ URL ที่อนุญาต แทนการ blacklist
- ปิด HTTP redirect บน firewall สำหรับ request ที่ไม่จำเป็น
- ไม่ส่ง raw response จาก server กลับไปยัง client โดยตรง

---

## การเปรียบเทียบ OWASP Top 10:2017 กับ 2021

```
2017                          2021
────────────────────────────────────────────────
A1: Injection              ─→  A03: Injection (ลงอันดับ)
A2: Broken Authentication  ─→  A07: Auth Failures (ลงอันดับ)
A3: Sensitive Data Exposure─→  A02: Cryptographic Failures (ขึ้นอันดับ)
A4: XML External Entities  ─→  รวมใน A03: Injection
A5: Broken Access Control  ─→  A01: Broken Access Control (ขึ้นอันดับ 1!)
A6: Security Misconfig.    ─→  A05: Security Misconfiguration
A7: XSS                    ─→  รวมใน A03: Injection
A8: Insecure Deserialization→  รวมใน A08: S&D Integrity Failures
A9: Outdated Components    ─→  A06: Vulnerable Components (ขึ้นอันดับ)
A10: Insufficient Logging  ─→  A09: Logging & Monitoring Failures
              🆕 A04: Insecure Design
              🆕 A08: Software & Data Integrity Failures
              🆕 A10: Server-Side Request Forgery (SSRF)
```

---

## วิธีนำ OWASP Top 10 ไปใช้ในองค์กร

**สำหรับนักพัฒนา (Developers):**
- ศึกษาและทำความเข้าใจแต่ละหมวดหมู่พร้อมตัวอย่าง
- ใช้ OWASP Cheat Sheet Series เป็นคู่มืออ้างอิง
- รวม security testing เข้าใน CI/CD pipeline (SAST, DAST)

**สำหรับองค์กร:**
- ใช้ OWASP Top 10 เป็น baseline ขั้นต่ำ ไม่ใช่เป้าหมายสูงสุด
- พิจารณาใช้ OWASP ASVS (Application Security Verification Standard) สำหรับ requirement ที่ละเอียดกว่า
- จัด security training สำหรับทีมพัฒนาทุกคน
- ทำ penetration testing อย่างน้อยปีละครั้ง

---

## แหล่งข้อมูลเพิ่มเติม

- [OWASP Top 10:2021 (ฉบับเต็ม)](https://owasp.org/Top10/2021/)
- [OWASP Top 10:2025 Release Candidate](https://owasp.org/Top10/2025/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/IndexTopTen.html)
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

---

*เอกสารนี้แปลและสรุปจาก OWASP Top 10:2021 ซึ่งเผยแพร่โดย OWASP Foundation ภายใต้ [Creative Commons Attribution Share-Alike 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/)*