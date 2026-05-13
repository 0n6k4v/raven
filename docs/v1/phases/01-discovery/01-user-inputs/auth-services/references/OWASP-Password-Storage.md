# OWASP Password Storage Cheat Sheet

> **ที่มา:** [OWASP Cheat Sheet Series — Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
> **License:** Creative Commons Attribution-ShareAlike 4.0 International

---

## สารบัญ

1. [Introduction](#introduction)
2. [Background](#background)
   - [Hashing vs Encryption](#hashing-vs-encryption)
   - [เมื่อไหร่ที่ Password Hash ถูก Crack ได้](#เมื่อไหร่ที่-password-hash-ถูก-crack-ได้)
3. [วิธีเสริมความแข็งแกร่งให้ Password Storage](#วิธีเสริมความแข็งแกร่งให้-password-storage)
   - [Salting](#salting)
   - [Peppering](#peppering)
   - [การใช้ Work Factor](#การใช้-work-factor)
4. [Password Hashing Algorithms](#password-hashing-algorithms)
   - [Argon2id](#argon2id)
   - [scrypt](#scrypt)
   - [bcrypt](#bcrypt)
   - [PBKDF2](#pbkdf2)
   - [Parallel PBKDF2](#parallel-pbkdf2)
5. [การอัปเกรด Legacy Hash](#การอัปเกรด-legacy-hash)
   - [International Characters](#international-characters)

---

## Introduction

Cheat Sheet นี้ให้คำแนะนำวิธีที่ถูกต้องสำหรับการจัดเก็บ password เพื่อใช้ใน authentication เมื่อ password ถูกจัดเก็บ ต้องได้รับการป้องกันจากผู้โจมตีแม้ว่า application หรือ database จะถูกเจาะก็ตาม โชคดีที่ภาษาโปรแกรมและ framework สมัยใหม่ส่วนใหญ่มีฟังก์ชัน built-in ที่ช่วยจัดเก็บ password อย่างปลอดภัย

อย่างไรก็ตาม เมื่อผู้โจมตีได้รับ password hash ที่จัดเก็บไว้ พวกเขาสามารถ brute force hash ออฟไลน์ได้เสมอ ผู้ป้องกันระบบสามารถชะลอการโจมตีออฟไลน์ได้โดยเลือกใช้ hash algorithm ที่ใช้ทรัพยากรมากที่สุดเท่าที่จะทำได้

### ✅ สรุปคำแนะนำ

- ใช้ **Argon2id** โดยกำหนดค่าขั้นต่ำที่ memory 19 MiB, iteration count 2 และ parallelism 1
- หาก **Argon2id** ไม่พร้อมใช้งาน ให้ใช้ **scrypt** โดยกำหนด CPU/memory cost parameter ขั้นต่ำที่ 2^17, block size ขั้นต่ำที่ 8 (1024 bytes) และ parallelization parameter ที่ 1
- สำหรับ legacy system ที่ใช้ **bcrypt** ให้ใช้ work factor ที่ 10 ขึ้นไป และจำกัด password ที่ 72 bytes
- หากจำเป็นต้องปฏิบัติตาม **FIPS-140** ให้ใช้ **PBKDF2** โดยกำหนด work factor ที่ 600,000 ขึ้นไป และ internal hash function เป็น HMAC-SHA-256
- พิจารณาใช้ **pepper** เพื่อเพิ่มการป้องกันเชิงลึก (แม้ว่าโดยลำพังจะไม่ได้เพิ่มความปลอดภัยเพิ่มเติมมากนัก)

---

## Background

### Hashing vs Encryption

Hashing และ Encryption ต่างสามารถปกป้องข้อมูล sensitive ได้ แต่ในกรณีส่วนใหญ่ **password ควรถูก hash ไม่ใช่ encrypt**

**เหตุที่ควรใช้ Hashing:**
เนื่องจาก hashing เป็น one-way function (กล่าวคือ เป็นไปไม่ได้ที่จะ "ถอดรหัส" hash และได้รับค่า plaintext ดั้งเดิมกลับมา) จึงเป็นวิธีที่เหมาะสมที่สุดสำหรับการตรวจสอบ password แม้ว่าผู้โจมตีจะได้รับ password ที่ถูก hash มา พวกเขาก็ไม่สามารถใช้มันเพื่อเข้าสู่ระบบในฐานะเหยื่อได้

**เหตุที่ Encryption ไม่เหมาะ:**
เนื่องจาก encryption เป็น two-way function ผู้โจมตีสามารถดึง plaintext ดั้งเดิมจากข้อมูลที่เข้ารหัสได้ Encryption เหมาะสำหรับจัดเก็บข้อมูล เช่น ที่อยู่ของผู้ใช้ ซึ่งต้องแสดงเป็น plaintext ในโปรไฟล์ การ hash ที่อยู่จะทำให้ข้อมูลเป็นอักขระไม่มีความหมาย

**ข้อยกเว้น:**
Encryption ควรใช้กับ password เฉพาะในกรณีพิเศษที่จำเป็นต้องได้รับ plaintext password ดั้งเดิม เช่น เมื่อ application ต้องใช้ password เพื่อ authenticate กับระบบอื่นที่ไม่รองรับวิธีการ grant access แบบ programmatic สมัยใหม่ เช่น OpenID Connect (OIDC) เมื่อเป็นไปได้ควรใช้สถาปัตยกรรมทางเลือกเพื่อหลีกเลี่ยงความจำเป็นในการจัดเก็บ password ในรูปแบบที่เข้ารหัส

---

### เมื่อไหร่ที่ Password Hash ถูก Crack ได้

**Password ที่แข็งแกร่งซึ่งจัดเก็บด้วย hashing algorithm สมัยใหม่และปฏิบัติตาม best practices ควรเป็นไปไม่ได้ที่ผู้โจมตีจะ crack ได้** ความรับผิดชอบในการเลือก hashing algorithm สมัยใหม่เป็นของเจ้าของ application

อย่างไรก็ตาม มีสถานการณ์บางอย่างที่ผู้โจมตีสามารถ "crack" hash ได้ โดยทำตามขั้นตอนต่อไปนี้:

1. เลือก password ที่คิดว่าเหยื่อเลือกไว้ (เช่น `password1!`)
2. คำนวณ hash
3. เปรียบเทียบ hash ที่คำนวณกับ hash ของเหยื่อ ถ้าตรงกัน แสดงว่า crack hash สำเร็จและรู้ค่า plaintext ของ password แล้ว

โดยปกติ ผู้โจมตีจะทำกระบวนการนี้ซ้ำกับรายการ password candidate จำนวนมาก เช่น:

- รายการ password ที่ได้รับจากเว็บไซต์อื่นที่ถูกเจาะ
- Brute force (ลองทุก candidate ที่เป็นไปได้)
- Dictionary หรือ wordlist ของ password ทั่วไป

แม้ว่าจำนวนการ permutation จะมหาศาล แต่ด้วย hardware ความเร็วสูง (เช่น GPU) และ cloud service ที่มี server ให้เช่าจำนวนมาก ค่าใช้จ่ายสำหรับผู้โจมตีค่อนข้างน้อยในการ crack password ได้สำเร็จ โดยเฉพาะเมื่อไม่ได้ปฏิบัติตาม best practices สำหรับ hashing

---

## วิธีเสริมความแข็งแกร่งให้ Password Storage

### Salting

Salt คือ string ที่สุ่มขึ้นมาและมีลักษณะ unique ที่ถูกเพิ่มเข้าไปใน password แต่ละรหัสเป็นส่วนหนึ่งของกระบวนการ hashing เนื่องจาก salt มีความ unique สำหรับผู้ใช้แต่ละคน ผู้โจมตีจึงต้อง crack hash ทีละรายการโดยใช้ salt ที่เกี่ยวข้อง แทนที่จะคำนวณ hash ครั้งเดียวแล้วเปรียบเทียบกับ hash ที่จัดเก็บทุกรายการ ซึ่งทำให้การ crack hash จำนวนมากยากขึ้นอย่างมีนัยสำคัญ เนื่องจากเวลาที่ต้องใช้เพิ่มขึ้นตามสัดส่วนโดยตรงกับจำนวน hash

Salting ยังปกป้องจากการที่ผู้โจมตี pre-compute hash โดยใช้ rainbow table หรือการค้นหาจาก database อีกด้วย ท้ายสุด Salting หมายความว่าเป็นไปไม่ได้ที่จะระบุว่าผู้ใช้สองคนมี password เหมือนกันโดยไม่ต้อง crack hash ก่อน เนื่องจาก salt ที่ต่างกันจะทำให้ได้ hash ที่ต่างกัน แม้ว่า password จะเหมือนกัน

ใน modern password hashing function เช่น Argon2id, bcrypt และ PBKDF2 ต้องมีการระบุ salt เข้าไปด้วย อย่างไรก็ตาม implementation และ library ที่ใช้กันอย่างแพร่หลายส่วนใหญ่จะสร้างและจัดการ salt โดยอัตโนมัติภายใน ดังนั้น developer ส่วนใหญ่จึงไม่จำเป็นต้องจัดการการสร้าง salt เองเมื่อใช้ library เหล่านี้อย่างถูกต้อง

---

### Peppering

Peppering คือกลุ่มกลยุทธ์ที่สามารถใช้ร่วมกับ salting เพื่อเพิ่มชั้นการป้องกัน มันป้องกันไม่ให้ผู้โจมตีสามารถ crack hash ใด ๆ ได้หากพวกเขามีเพียงสิทธิ์เข้าถึง database เท่านั้น เช่น ถ้าพวกเขาใช้ประโยชน์จากช่องโหว่ SQL injection หรือได้รับสำเนาสำรองของ database

#### ข้อกำหนดทั่วไปสำหรับกลยุทธ์ Peppering

- Pepper ถูก**แชร์ระหว่าง password ที่จัดเก็บ** ไม่ใช่ unique สำหรับ password แต่ละรหัสเหมือน salt
- ต่างจาก salt, pepper ไม่ควรเป็น public และ**ไม่ควรถูกจัดเก็บร่วมกับ hash ที่สร้างขึ้น** pepper ควรถูกจัดเก็บแยกจาก password database
- Pepper เป็น secret ควรจัดเก็บใน "secrets vault" หรือ HSM (Hardware Security Module)
- หาก pepper ถูกเปิดเผย ต้องเปลี่ยน pepper ซึ่งไม่สามารถทำได้โดยไม่รู้ password ของผู้ใช้ ดังนั้นการเปลี่ยน pepper จะต้องบังคับให้ผู้ใช้ทุกคนที่ password ได้รับการป้องกันด้วย pepper เดิม reset password ของตน

#### Pre-hashing Peppers

ในกลยุทธ์นี้ pepper ถูกเพิ่มเข้าไปใน password ก่อนที่จะถูก hash โดย password hashing algorithm hash ที่คำนวณแล้วจะถูกจัดเก็บใน database ในกรณีนี้ pepper ควรเป็นค่าสุ่มที่สร้างขึ้นอย่างปลอดภัย

#### Post-hashing Peppers

ในกลยุทธ์นี้ password ถูก hash ตามปกติโดยใช้ password hashing algorithm hash ที่ได้จาก password จะถูก hash ซ้ำอีกครั้งโดยใช้ HMAC (เช่น HMAC-SHA256, HMAC-SHA512 ขึ้นอยู่กับความยาว output ที่ต้องการ) ก่อนที่จะจัดเก็บ hash ที่ได้ใน database ในกรณีนี้ pepper ทำหน้าที่เป็น HMAC key และควรสร้างขึ้นตามข้อกำหนดของ HMAC algorithm

---

### การใช้ Work Factor

Work factor คือจำนวน iteration ของ hashing algorithm ที่ทำสำหรับ password แต่ละรหัส (โดยปกติจะเป็น 2^work iterations) Work factor มักถูกจัดเก็บใน hash output มันทำให้การคำนวณ hash มีค่าใช้จ่ายทาง computational มากขึ้น ซึ่งช่วยลดความเร็วและ/หรือเพิ่มค่าใช้จ่ายที่ผู้โจมตีต้องใช้ในการ crack password hash

เมื่อเลือก work factor ต้องสร้างสมดุลระหว่างความปลอดภัยและประสิทธิภาพ แม้ว่า work factor ที่สูงกว่าจะทำให้ hash ยากต่อการ crack สำหรับผู้โจมตี มันก็จะชะลอกระบวนการตรวจสอบ login attempt ด้วย หาก work factor สูงเกินไป ประสิทธิภาพของ application อาจลดลง ซึ่งผู้โจมตีอาจใช้เพื่อทำ denial of service attack โดยการทำให้ CPU ของ server โหลดหนักด้วย login attempt จำนวนมาก

ไม่มีกฎตายตัวสำหรับ work factor ที่เหมาะสม ขึ้นอยู่กับประสิทธิภาพของ server และจำนวนผู้ใช้ใน application การกำหนด work factor ที่เหมาะสมต้องทดลองบน server จริงที่ application ใช้งาน โดยหลักทั่วไปแล้ว การคำนวณ hash ควรใช้เวลาน้อยกว่าหนึ่งวินาที

#### การอัปเกรด Work Factor

ข้อดีสำคัญของ work factor คือสามารถเพิ่มขึ้นได้เมื่อเวลาผ่านไปเมื่อ hardware มีประสิทธิภาพมากขึ้นและราคาถูกลง

วิธีที่พบบ่อยที่สุดในการอัปเกรด work factor คือรอจนกว่าผู้ใช้จะ authenticate ครั้งถัดไป แล้วจึง re-hash password ของพวกเขาด้วย work factor ใหม่ hash ที่แตกต่างกันจะมี work factor ที่ต่างกัน และ hash อาจไม่เคยถูก upgrade เลยหากผู้ใช้ไม่เคย login เข้ามาใน application อีก ขึ้นอยู่กับ application อาจเหมาะสมที่จะลบ password hash เก่าและกำหนดให้ผู้ใช้ reset password ในครั้งถัดไปที่ต้องการ login เพื่อหลีกเลี่ยงการจัดเก็บ hash เก่าที่มีความปลอดภัยน้อยกว่า

---

## Password Hashing Algorithms

hashing algorithm สมัยใหม่บางตัวได้รับการออกแบบมาเฉพาะสำหรับการจัดเก็บ password อย่างปลอดภัย ซึ่งหมายความว่าควรทำงานช้า (ต่างจาก algorithm เช่น MD5 และ SHA-1 ที่ออกแบบมาให้ทำงานเร็ว) และสามารถปรับความช้าได้โดยการเปลี่ยน work factor

ไม่จำเป็นต้องซ่อน password hashing algorithm ที่ application ใช้ ถ้าใช้ password hashing algorithm สมัยใหม่พร้อม configuration parameter ที่เหมาะสม การเปิดเผยต่อสาธารณะว่าใช้ algorithm ใดถือว่าปลอดภัย

เมื่อเลือก password hashing algorithm นักพัฒนาควรเลือก algorithm สมัยใหม่ที่ออกแบบมาเพื่อต้านทานทั้งการโจมตีด้วย GPU และ memory

**Algorithm ที่แนะนำสามตัว ได้แก่:**

### Argon2id

[Argon2](https://en.wikipedia.org/wiki/Argon2) ชนะการแข่งขัน Password Hashing Competition ในปี 2015 จากสามตัวแปรของ Argon2 ให้ใช้ตัวแปร **Argon2id** เนื่องจากให้แนวทางที่สมดุลในการต้านทานทั้ง side-channel attack และ GPU-based attack

Argon2id มีสาม parameter ที่สามารถกำหนดค่าได้:

| Parameter | ความหมาย |
|-----------|----------|
| `m` | memory size ขั้นต่ำ |
| `t` | จำนวน iteration ขั้นต่ำ |
| `p` | degree of parallelism |

**Configuration ที่แนะนำ** (ระดับการป้องกันเท่ากันทุกชุด แตกต่างเฉพาะ trade-off ระหว่าง CPU กับ RAM):

| m (memory) | t (iterations) | p (parallelism) | หมายเหตุ |
|-----------|---------------|-----------------|----------|
| 47104 (46 MiB) | 1 | 1 | ❌ ห้ามใช้กับ Argon2i |
| 19456 (19 MiB) | 2 | 1 | ❌ ห้ามใช้กับ Argon2i |
| 12288 (12 MiB) | 3 | 1 | ✅ |
| 9216 (9 MiB) | 4 | 1 | ✅ |
| 7168 (7 MiB) | 5 | 1 | ✅ |

Parameter เหล่านี้ควบคุมความแพงทาง computational ในการคำนวณ password hash การเพิ่ม memory, iteration count หรือ parallelism ทำให้การ crack password ช้าลงและมีค่าใช้จ่ายสูงขึ้นสำหรับผู้โจมตี ขณะที่ยังคง practical สำหรับ authentication request ที่ถูกกฎหมายเมื่อ tune อย่างเหมาะสม

---

### scrypt

[scrypt](http://www.tarsnap.com/scrypt/scrypt.pdf) คือ password-based key derivation function ที่สร้างโดย Colin Percival แม้ว่า Argon2id ควรเป็นตัวเลือกที่ดีที่สุดสำหรับ password hashing แต่ควรใช้ scrypt เมื่อ Argon2id ไม่พร้อมใช้งาน

เหมือนกับ Argon2id, scrypt มีสาม parameter:

| Parameter | ความหมาย |
|-----------|----------|
| `N` | memory cost parameter ขั้นต่ำ |
| `r` | block size |
| `p` | degree of parallelism |

**Configuration ที่แนะนำ** (ระดับการป้องกันใกล้เคียงกัน trade-off ระหว่าง parallelism กับ RAM):

| N | r | p | memory |
|---|---|---|--------|
| 2^17 | 8 (1024 bytes) | 1 | 128 MiB |
| 2^16 | 8 (1024 bytes) | 2 | 64 MiB |
| 2^15 | 8 (1024 bytes) | 3 | 32 MiB |
| 2^14 | 8 (1024 bytes) | 5 | 16 MiB |
| 2^13 | 8 (1024 bytes) | 10 | 8 MiB |

---

### bcrypt

[bcrypt](https://en.wikipedia.org/wiki/bcrypt) **ควรใช้เฉพาะ** สำหรับ password storage ใน legacy system ที่ Argon2 และ scrypt ไม่พร้อมใช้งานเท่านั้น

Work factor ควรสูงที่สุดเท่าที่ประสิทธิภาพของ verification server จะอนุญาต โดยมีขั้นต่ำที่ **10**

#### ขีดจำกัด Input ของ bcrypt

bcrypt มีขีดจำกัดความยาว input สูงสุดที่ **72 bytes** สำหรับ implementation ส่วนใหญ่ ดังนั้นควรบังคับให้ password มีความยาวสูงสุด 72 bytes (หรือน้อยกว่าหาก implementation ของ bcrypt ที่ใช้งานมีขีดจำกัดน้อยกว่า)

#### Pre-Hashing Password กับ bcrypt

วิธีทางเลือกคือ pre-hash password ที่ผู้ใช้ส่งมาด้วย fast algorithm เช่น SHA-2, HMAC หรือ BLAKE3 แล้วจึง hash ค่า hash ที่ได้ด้วย bcrypt (เช่น `bcrypt(base64(H($password)), $salt, $cost)`)

⚠️ วิธีนี้อาจ**เป็นอันตราย**เนื่องจาก:

**ปัญหา null byte:** bcrypt ดั้งเดิมรับ password string แบบ null-terminated หมายความว่า hash จะถูกใช้เฉพาะถึง null byte แรกใน hash value เท่านั้น ซึ่งเพิ่มโอกาสของ collision เมื่อรวม bcrypt กับ hash function อื่น สามารถหลีกเลี่ยงได้โดย encode hash value เป็น printable string ด้วย base64

**ปัญหา Password Shucking:** เป็นการโจมตีที่ใช้ประโยชน์จากข้อเท็จจริงที่ว่าง่ายต่อการตรวจสอบว่า `bcrypt(base64(H($password)), $salt, $cost)` ตรงกับ `bcrypt(base64($leaked_hash), $salt, $cost)` หรือไม่ ถ้า inner hash function H ถูกใช้กับ password เดียวกันที่อื่นและผู้โจมตีรู้ การ crack password สามารถลดลงเหลือเพียงการทำลาย hash function H เท่านั้น

> 🚨 การใช้ SHA-512 ล้วน ๆ (เช่น `bcrypt(base64(sha512($password)), $salt, $cost)`) เป็น **แนวปฏิบัติที่อันตราย** และมีความปลอดภัยเท่ากับการใช้ SHA-512 เพียงอย่างเดียว

**สูตรที่ถูกต้องหากจำเป็นต้องใช้ bcrypt กับ pre-hashing:**

```
bcrypt(base64(hmac-sha384(data:$password, key:$pepper)), $salt, $cost)
```

โดยเก็บ pepper แยกไว้ ไม่ให้อยู่ใน database

---

### PBKDF2

เนื่องจาก [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2) ได้รับการแนะนำโดย [NIST](https://pages.nist.gov/800-63-3/sp800-63b.html) และมี implementation ที่ผ่านการรับรอง FIPS-140 จึงควรเป็น algorithm ที่ต้องการเมื่อมีข้อกำหนดเหล่านี้

PBKDF2 algorithm ต้องการการเลือก internal hashing algorithm เช่น HMAC หรือ algorithm อื่น ๆ โดย **HMAC-SHA-256** ได้รับการสนับสนุนอย่างแพร่หลายและ NIST แนะนำ

Work factor สำหรับ PBKDF2 ถูก implement ผ่าน iteration count ซึ่งควรกำหนดค่าต่างกันตาม internal hashing algorithm ที่ใช้:

| Algorithm | Iteration Count ขั้นต่ำ |
|-----------|------------------------|
| PBKDF2-HMAC-SHA1 | 1,300,000 |
| PBKDF2-HMAC-SHA256 | 600,000 |
| PBKDF2-HMAC-SHA512 | 210,000 |

---

### Parallel PBKDF2

| Algorithm | Cost ขั้นต่ำ |
|-----------|-------------|
| PPBKDF2-SHA512 | 2 |
| PPBKDF2-SHA256 | 5 |
| PPBKDF2-SHA1 | 10 |

Configuration ข้างต้นมีระดับการป้องกันที่เทียบเท่ากัน (ตัวเลขตามการทดสอบด้วย RTX 4000 GPU ณ เดือนธันวาคม 2022)

#### PBKDF2 Pre-Hashing

เมื่อ PBKDF2 ถูกใช้กับ HMAC และ password ยาวกว่า block size ของ hash function (64 bytes สำหรับ SHA-256) password จะถูก pre-hash โดยอัตโนมัติ

> ⚠️ **ข้อควรระวัง:** Implementation บางส่วนทำการ conversion ในทุก iteration ซึ่งอาจทำให้การ hash password ยาวแพงกว่า password สั้นมาก ส่งผลให้เกิดช่องโหว่ denial of service ที่อาจเกิดขึ้น เช่นเดียวกับที่ประกาศใน Django ในปี 2013 การ pre-hash ด้วยตนเองสามารถลดความเสี่ยงนี้ได้ แต่ต้องเพิ่ม salt เข้าไปใน pre-hash step ด้วย

---

## การอัปเกรด Legacy Hash

application เก่าที่ใช้ hashing algorithm ที่มีความปลอดภัยน้อยกว่า เช่น MD5 หรือ SHA-1 สามารถอัปเกรดเป็น password hashing algorithm สมัยใหม่ได้ เมื่อผู้ใช้กรอก password (โดยปกติจะเป็นการ authenticate บน application) input นั้นควรถูก re-hash โดยใช้ algorithm ใหม่ นักพัฒนาควรหมดอายุ password ปัจจุบันของผู้ใช้และกำหนดให้พวกเขากรอก password ใหม่ เพื่อให้ hash เก่าที่มีความปลอดภัยน้อยกว่าไม่มีประโยชน์สำหรับผู้โจมตีอีกต่อไป

อย่างไรก็ตาม นี่หมายความว่า password hash เก่า (ที่มีความปลอดภัยน้อยกว่า) จะถูกจัดเก็บใน database จนกว่าผู้ใช้จะ login มีสองวิธีในการจัดการกับปัญหานี้:

### วิธีที่ 1 — หมดอายุและลบ Hash

หมดอายุและลบ password hash ของผู้ใช้ที่ไม่ได้ใช้งานเป็นเวลานาน และกำหนดให้พวกเขา reset password เพื่อ login อีกครั้ง แม้ว่าจะปลอดภัย แต่วิธีนี้ไม่เป็นมิตรกับผู้ใช้มากนัก การหมดอายุ password ของผู้ใช้จำนวนมากอาจทำให้เกิดปัญหาสำหรับ support staff หรืออาจถูกผู้ใช้ตีความว่าเป็นสัญญาณของการถูกเจาะ

### วิธีที่ 2 — ซ้อน Hash

ใช้ password hash ที่มีอยู่เป็น input สำหรับ algorithm ที่ปลอดภัยมากขึ้น เช่น หาก application เดิมจัดเก็บ password เป็น `md5($password)` สามารถอัปเกรดเป็น `bcrypt(md5($password))` ได้อย่างง่ายดาย การซ้อน hash หลีกเลี่ยงความจำเป็นในการรู้ password ดั้งเดิม อย่างไรก็ตามอาจทำให้ hash ง่ายต่อการ crack มากขึ้น hash เหล่านี้ควรถูกแทนที่ด้วย hash โดยตรงของ password ของผู้ใช้ในครั้งถัดไปที่ผู้ใช้ login

> 💡 **ข้อแนะนำ:** เมื่อเลือก password hashing method แล้ว จะต้องอัปเกรดในอนาคต ดังนั้นควรทำให้การอัปเกรด hashing algorithm ง่ายที่สุดเท่าที่จะเป็นไปได้ ระหว่างช่วงเปลี่ยนผ่านให้รองรับ hashing algorithm แบบผสมทั้งเก่าและใหม่ การใช้ hashing algorithm แบบผสมทำได้ง่ายกว่าหากจัดเก็บ algorithm และ work factor พร้อมกับ password ในรูปแบบมาตรฐาน เช่น [modular PHC string format](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md)

---

### International Characters

hashing library ต้องสามารถรับ character หลากหลายประเภทและควรเข้ากันได้กับ Unicode codepoint ทั้งหมด เพื่อให้ผู้ใช้สามารถใช้ character ที่มีอยู่บนอุปกรณ์สมัยใหม่ได้อย่างเต็มที่ โดยเฉพาะ mobile keyboard ผู้ใช้ควรสามารถเลือก password จากภาษาต่าง ๆ และรวม pictogram ได้

ก่อนการ hashing ไม่ควรลด entropy ของ input ของผู้ใช้ และ password hashing library ต้องสามารถรับ input ที่อาจมี NULL byte ได้

---

## สรุปเปรียบเทียบ Algorithm

| Algorithm | ความแนะนำ | ข้อดี | ข้อเสีย |
|-----------|-----------|-------|---------|
| **Argon2id** | ⭐⭐⭐ แนะนำอันดับ 1 | ต้านทานทั้ง GPU และ side-channel attack, ชนะ PHC 2015 | อาจไม่มีใน legacy system ทุกระบบ |
| **scrypt** | ⭐⭐ แนะนำอันดับ 2 | memory-hard, ต้านทาน GPU ได้ดี | ไม่มีใน FIPS-140 |
| **bcrypt** | ⭐ สำหรับ legacy เท่านั้น | ใช้งานมานาน, รองรับกว้าง | จำกัด 72 bytes, ไม่ต้านทาน GPU เท่า Argon2id |
| **PBKDF2** | ✅ เมื่อต้องการ FIPS-140 | มาตรฐาน NIST, FIPS-140 validated | ต้านทาน GPU น้อยกว่า Argon2id |
| MD5, SHA-1 | ❌ ห้ามใช้ | — | เร็วเกินไป ไม่เหมาะสำหรับ password |

---

*เอกสารนี้แปลและสรุปจาก [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)*
*License: Creative Commons Attribution-ShareAlike 4.0 International*