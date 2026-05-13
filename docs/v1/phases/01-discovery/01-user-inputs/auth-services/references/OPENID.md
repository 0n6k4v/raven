# OpenID Connect ทำงานอย่างไร

> **แหล่งที่มา:** [https://openid.net/connect/](https://openid.net/connect/)  
> **เผยแพร่โดย:** OpenID Foundation

---

## OpenID Connect คืออะไร?

OpenID Connect คือ authentication protocol ที่ออกแบบมาให้สามารถทำงานร่วมกันได้ (interoperable) โดยสร้างอยู่บน OAuth 2.0 framework (IETF RFC 6749 และ 6750) โดยช่วยลดความซับซ้อนในการยืนยันตัวตน (verify identity) ของ user ผ่านกระบวนการ authentication ที่ทำโดย Authorization Server และสามารถดึงข้อมูล user profile ได้อย่าง interoperable ในรูปแบบ REST

OpenID Connect ช่วยให้นักพัฒนา application และ website สามารถเปิด sign-in flow และรับ verifiable assertion เกี่ยวกับ user ได้ทั้งบน Web-based client, mobile client, และ JavaScript client นอกจากนี้ specification suite ยังรองรับการขยายเพิ่มเติม (extensible) เพื่อรองรับฟีเจอร์ optional ต่าง ๆ เช่น การเข้ารหัส identity data (encryption), การค้นหา OpenID Provider (discovery), และการออกจากระบบ (session logout)

สำหรับนักพัฒนา OpenID Connect ให้คำตอบที่ปลอดภัยและตรวจสอบได้สำหรับคำถามที่ว่า *"ตัวตนของบุคคลที่กำลังใช้ browser หรือ mobile app ที่เชื่อมต่ออยู่ขณะนี้คือใคร?"* และที่สำคัญที่สุดคือ ช่วยขจัดภาระในการตั้งค่า จัดเก็บ และจัดการ password ซึ่งมักเป็นสาเหตุหลักของ credential-based data breach

---

## OpenID Connect ทำงานอย่างไร?

OpenID Connect ช่วยสร้าง Internet identity ecosystem ผ่านการ integrate ที่ง่าย, การตั้งค่าที่รักษา security และ privacy, ความสามารถ interoperable, การรองรับ client และอุปกรณ์ที่หลากหลาย รวมถึงการเปิดโอกาสให้ entity ใดก็ตามสามารถเป็น OpenID Provider (OP) ได้

### Protocol Flow (ภาพรวม)

OpenID Connect protocol โดยสรุปมีขั้นตอนดังนี้:

| ขั้นตอน | ผู้กระทำ | การกระทำ |
|---------|---------|----------|
| 1 | End User | **เปิดหน้าเว็บ** หรือ web application ผ่าน browser |
| 2 | End User | **คลิก sign-in** และกรอก username กับ password |
| 3 | RP (Client) | **ส่ง request** ไปยัง OpenID Provider (OP) |
| 4 | OP | **ทำการ authenticate User** และรับ authorization |
| 5 | OP | **ตอบกลับด้วย Identity Token** และปกติจะมี **Access Token** ด้วย |
| 6 | RP | สามารถ **ส่ง request** พร้อม Access Token ไปยังอุปกรณ์ของ User |
| 7 | UserInfo Endpoint | **ส่งคืน Claim** ต่าง ๆ เกี่ยวกับ End-User |

---

## Key Concepts (คำศัพท์สำคัญ)

### Authentication (การยืนยันตัวตน)

กระบวนการที่ปลอดภัยในการยืนยันและสื่อสารว่าบุคคลที่ใช้ application หรือ browser อยู่นั้นเป็นผู้ที่อ้างว่าตนเป็นจริง ๆ

### Client

Client คือ software ที่ร้องขอ token ไม่ว่าจะเพื่อ authenticate user หรือเพื่อเข้าถึง resource (มักเรียกว่า relying party หรือ RP) Client จะต้อง register กับ OP ก่อนใช้งาน Client อาจเป็น web application, native mobile application, desktop application เป็นต้น

### Relying Party (RP)

RP ย่อมาจาก Relying Party คือ application หรือ website ที่มอบหมายหน้าที่ authentication ของ user ให้แก่ IDP

### OpenID Provider (OP) / Identity Provider (IDP)

OpenID Provider (OP) คือ entity ที่ implement OpenID Connect และ OAuth 2.0 protocol โดย OP อาจถูกเรียกตาม role ที่ทำหน้าที่ เช่น security token service, identity provider (IDP), หรือ authorization server

### Identity Token

Identity Token แสดงถึงผลลัพธ์ของกระบวนการ authentication อย่างน้อยที่สุดจะต้องมี identifier ของ user (เรียกว่า `sub` หรือ subject claim) และข้อมูลเกี่ยวกับวิธีและเวลาที่ user ทำการ authenticate รวมถึงอาจมี identity data เพิ่มเติมได้

### User

User คือบุคคลที่ใช้ registered client เพื่อเข้าถึง resource ต่าง ๆ

---

## คำถามที่พบบ่อย (FAQ)

### ทำไมนักพัฒนาถึงควรใช้ OpenID Connect?

เพราะใช้งานง่าย เชื่อถือได้ ปลอดภัย และช่วยขจัดการจัดเก็บและบริหารจัดการ password ของผู้ใช้ นอกจากนี้ยังช่วยให้ประสบการณ์ sign-up และ registration ดีขึ้น ลดอัตราการละทิ้งเว็บไซต์ (website abandonment) ยิ่งไปกว่านั้น authentication framework ที่ใช้ public-key encryption อย่าง OpenID Connect ยังช่วยเพิ่มความปลอดภัยของ Internet โดยรวม โดยมอบความรับผิดชอบในการยืนยันตัวตน user ให้แก่ service provider ที่มีความเชี่ยวชาญสูงสุด

### OpenID Connect ใช้งานกับ native app และ mobile app ได้ไหม?

ได้ ปัจจุบัน Android operating system มี system-level API ในตัวที่รองรับ OpenID Connect service อยู่แล้ว นอกจากนี้ยังสามารถเข้าถึง OpenID Connect ผ่าน built-in system browser บน mobile และ desktop platform ได้ โดยมี library หลายตัวที่กำลังพัฒนาอยู่เพื่อทำให้กระบวนการนี้ง่ายขึ้น

### OAuth 2.0 คืออะไร และเกี่ยวข้องกับ OpenID Connect อย่างไร?

OAuth 2.0 คือ framework ที่ IETF กำหนดขึ้นใน RFC 6749 และ 6750 (เผยแพร่ปี 2012) เพื่อสนับสนุนการพัฒนา authentication และ authorization protocol โดยมี standardized message flow ที่หลากหลายบนพื้นฐาน JSON และ HTTP ซึ่ง OpenID Connect นำ flow เหล่านี้มาใช้เพื่อให้บริการด้าน Identity

### OpenID Connect ต่างจาก OpenID 2.0 อย่างไร?

OpenID Connect มีความคล้ายคลึงกันในเชิง architecture กับ OpenID 2.0 และในความเป็นจริง ทั้งสอง protocol แก้ปัญหาที่คล้ายกันมาก อย่างไรก็ตาม OpenID 2.0 ใช้ XML และ custom message signature scheme ซึ่งในทางปฏิบัติบางครั้งนักพัฒนาทำให้ถูกต้องได้ยาก จนทำให้ OpenID 2.0 implementation บางครั้ง interoperate กันไม่ได้โดยไม่ทราบสาเหตุ

OAuth 2.0 ซึ่งเป็นรากฐานของ OpenID Connect ได้มอบหมายการ encryption ที่จำเป็นให้กับ TLS infrastructure ในตัวของ Web (เรียกอีกว่า HTTPS หรือ SSL) ซึ่ง implement อยู่ทั้งฝั่ง client และ server platform อย่างทั่วถึง OpenID Connect ใช้ JSON Web Token (JWT) data structure มาตรฐานในกรณีที่ต้องใช้ signature สิ่งเหล่านี้ทำให้ OpenID Connect ง่ายต่อการ implement อย่างมาก และในทางปฏิบัติส่งผลให้มี interoperability ที่ดีกว่าอย่างชัดเจน

### OpenID Connect เกี่ยวข้องกับ FIDO Alliance อย่างไร?

FIDO Alliance คือองค์กรที่ศึกษาและพัฒนาเทคโนโลยี authentication ที่ไม่ใช้ password สมาชิกบางส่วนของ OpenID Foundation ก็เป็นสมาชิกของ FIDO Alliance ด้วย โดยทำงานพัฒนาเทคโนโลยี authentication ที่สามารถนำมาใช้กับ OpenID Provider ได้

### OpenID Connect เกี่ยวข้องกับ SAML อย่างไร?

Security Assertion Markup Language (SAML) คือ federation technology ที่ใช้ XML ซึ่งนำมาใช้ใน enterprise และ academic บางกรณี OpenID Connect สามารถรองรับ use case เดียวกันได้ แต่ใช้ protocol ที่เรียบง่ายกว่าในรูปแบบ JSON/REST OpenID Connect ถูกออกแบบมาให้รองรับทั้ง native app และ mobile application ในขณะที่ SAML ออกแบบมาสำหรับ Web-based application เท่านั้น SAML และ OpenID Connect จะอยู่ร่วมกันไปอีกนาน โดยแต่ละตัวจะถูก deploy ในสถานการณ์ที่เหมาะสมกับตัวเอง

### ใครสามารถเป็น IDP หรือ OP ได้บ้าง?

การออกแบบ OpenID Connect protocol เปิดกว้างเพื่อส่งเสริม ecosystem ของ IDP ที่หลากหลาย แม้ว่า IDP ชั้นนำในปัจจุบันจะเป็น cloud service provider รายใหญ่อย่าง Google และ Microsoft แต่ OpenID Connect เปิดโอกาสให้ OP หลายรูปแบบสำหรับ website, application, client, และอุปกรณ์ต่าง ๆ

### OpenID Connect รักษา privacy ได้ไหม?

OpenID Connect กำหนด personal attribute ชุดหนึ่งที่สามารถแลกเปลี่ยนระหว่าง Identity Provider และ application ที่ใช้งาน และมีขั้นตอน approval (หรือที่เรียกว่า authorization) เพื่อให้ user สามารถยินยอม (consent) หรือปฏิเสธการแชร์ข้อมูลดังกล่าวได้

---

## OpenID Connect Specification Suite

OpenID Connect ประกอบด้วย specification หลายชุดที่ครอบคลุมแต่ละด้าน:

| Specification | รายละเอียด |
|---------------|------------|
| **Core** | Authentication ที่สร้างบน OAuth 2.0, กำหนด ID Token และ UserInfo Endpoint |
| **Discovery** | OpenID Provider Metadata — วิธีที่ client ค้นหา configuration ของ OP |
| **Dynamic Registration** | Client Registration API |
| **Session Management** | การจัดการ login session และ logout |
| **Front-Channel Logout** | Logout โดยไม่ใช้ back-channel |
| **Back-Channel Logout** | Logout ผ่าน back-channel |
| **FAPI 2.0** | Security profile สำหรับ Financial-grade API |
| **MODRNA** | Mobile authentication profile |

---

## เปรียบเทียบ: OpenID Connect vs SAML vs OAuth 2.0

| คุณสมบัติ | OAuth 2.0 | SAML 2.0 | OpenID Connect |
|-----------|-----------|----------|----------------|
| **วัตถุประสงค์หลัก** | Authorization | Authentication / Federation | Authentication + Identity |
| **รูปแบบข้อมูล** | JSON/HTTP | XML | JSON/JWT/HTTP |
| **รองรับ mobile** | ✅ | ❌ | ✅ |
| **รองรับ web** | ✅ | ✅ | ✅ |
| **รองรับ native app** | ✅ | ❌ | ✅ |
| **Identity layer** | ❌ | ✅ | ✅ |
| **ความซับซ้อนในการ implement** | ปานกลาง | สูง | ต่ำ |

---

## Related Resources

- 🔗 [Explore All Specifications](https://openid.net/developers/specs/)
- 🔗 [Certified OpenID Connect Implementations](https://openid.net/developers/certified-openid-connect-implementations/)
- 🔗 [JWT, JWS, JWE, JWK, and JWA Implementations](https://openid.net/developers/jwt-jws-jwe-jwk-and-jwa-implementations/)
- 🔗 [How to Certify Your Implementation](https://openid.net/how-to-certify-your-implementation/)
- 🔗 [AB/Connect Working Group](https://openid.net/wg/connect/)

### RFC ที่เกี่ยวข้อง

| RFC | รายละเอียด |
|-----|------------|
| RFC 6749 | OAuth 2.0 Authorization Framework |
| RFC 6750 | OAuth 2.0 Bearer Token Usage |
| RFC 7519 | JSON Web Token (JWT) |
| RFC 7515 | JSON Web Signature (JWS) |
| RFC 7516 | JSON Web Encryption (JWE) |
| RFC 7517 | JSON Web Key (JWK) |
| RFC 7518 | JSON Web Algorithms (JWA) |

---

## ติดต่อและข้อมูล Foundation

**OpenID Foundation**  
2603 Camino Ramon, Suite 200  
San Ramon, CA 94583, United States

- Phone: +1 925-275-6639  
- Email: [help@oidf.org](mailto:help@oidf.org)  
- Website: [https://openid.net](https://openid.net)

---

*© OpenID Foundation — สงวนลิขสิทธิ์*  
*แหล่งที่มา: https://openid.net/connect/*