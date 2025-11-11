## Tips — คำสั่งสำคัญ (Argon2 / PostgreSQL dump)

ไฟล์นี้เก็บเฉพาะคำสั่งที่ใช้งานจริงตามที่ขอ: สร้าง/ตรวจสอบ Argon2 hash และสำรอง/คืนค่าฐานข้อมูล PostgreSQL

### 1) สร้าง Argon2 hash (ตัวอย่าง — POSIX)
```sh
python - <<'PY'
from argon2 import PasswordHasher
ph = PasswordHasher()
print(ph.hash("password"))
PY
```

### 2) ตรวจสอบ (verify) Argon2 hash กับ plaintext
POSIX (bash / sh):
```sh
export HASH='$argon2id$v=19$m=65536,t=3,p=4$2RYV9Z/HeFu4Vn611OmuiA$jxybpQMDX18V0V2ELU207sotrLInTwAnfxoaaq5Jp3w'
export TMP_PWD='user123'

python3 - <<'PY'
import os
from argon2 import PasswordHasher, exceptions
ph = PasswordHasher()
try:
    if ph.verify(os.environ['HASH'], os.environ['TMP_PWD']):
        print('MATCH')
except exceptions.VerifyMismatchError:
    print('NO MATCH')
except Exception as e:
    print('ERROR', e)
PY

unset TMP_PWD
unset HASH
```

PowerShell (pwsh):
```powershell
$env:HASH = '$argon2id$v=19$m=65536,t=3,p=4$2RYV9Z/HeFu4Vn611OmuiA$jxybpQMDX18V0V2ELU207sotrLInTwAnfxoaaq5Jp3w'
$env:TMP_PWD = 'user123'

python - <<'PY'
import os
from argon2 import PasswordHasher, exceptions
ph = PasswordHasher()
try:
    if ph.verify(os.environ['HASH'], os.environ['TMP_PWD']):
        print('MATCH')
except exceptions.VerifyMismatchError:
    print('NO MATCH')
except Exception as e:
    print('ERROR', e)
PY

# Remove env vars in PowerShell
Remove-Item Env:TMP_PWD
Remove-Item Env:HASH
```

---

### 3) PostgreSQL — สำรองฐานข้อมูล (pg_dump)
ทั้งคำสั่งทำงานจากเครื่อง host และใช้ `docker compose exec` เพื่อรันใน container

Plain SQL (UTF-8) — readable, editable:
```sh
docker compose exec -T db-service pg_dump -U postgres -d ai_detection --format=plain --encoding=UTF8 > ai_detection_dump.sql
```

Compressed custom format (smaller, ต้องใช้ pg_restore):
```sh
docker compose exec -T db-service pg_dump -U postgres -d ai_detection -Fc --encoding=UTF8 > ai_detection.dump
```

Dump เฉพาะตาราง `users` (plain SQL):
```sh
docker compose exec -T db-service pg_dump -U postgres -d ai_detection -t public.users --encoding=UTF8 > users_table_dump.sql
```

Gzip compressed plain SQL:
```sh
docker compose exec -T db-service pg_dump -U postgres -d ai_detection --format=plain --encoding=UTF8 | gzip > ai_detection_dump.sql.gz
```

### 4) คืนค่าจาก dump (restore)
Plain SQL restore:
```sh
docker compose exec -i db-service psql -U postgres -d ai_detection < ai_detection_dump.sql
```

Restore จาก custom format (.dump) using pg_restore (inside container):
```sh
docker compose exec -i db-service pg_restore -U postgres -d ai_detection /tmp/ai_detection.dump
```

หรือถ้าไฟล์อยู่บน host แล้วต้องการใช้ pg_restore จาก host (มี pg_restore ติดตั้ง):
```sh
pg_restore -U postgres -d ai_detection ai_detection.dump
```

---

### หมายเหตุสั้น ๆ
- ใช้ `-T` / `-t` กับ `docker compose exec` เพื่อส่ง stdout กลับไปยัง host เมื่อ redirect เป็นไฟล์
- ตรวจสอบ encoding เป็น UTF-8 ก่อนเปิดไฟล์ที่มีภาษาไทย

### References / เอกสารอ้างอิง
- argon2-cffi (Python): https://argon2-cffi.readthedocs.io/
- Passlib (overview about password hashing): https://passlib.readthedocs.io/
- PostgreSQL pg_dump documentation: https://www.postgresql.org/docs/current/app-pgdump.html
- PostgreSQL pg_restore documentation: https://www.postgresql.org/docs/current/app-pgrestore.html

-- End of Tips --
 
### Security Tips (คำแนะนำด้านความปลอดภัยสั้น ๆ)

- ใช้ Argon2 (argon2-cffi) สำหรับ password hashing เป็นค่าเริ่มต้น — ตั้งค่าพารามิเตอร์ (memory, time, parallelism) ให้เหมาะสมกับทรัพยากรของเซิร์ฟเวอร์
- อย่าเก็บ secrets ใน repo (.env ไว้ใน repo ห้ามเด็ดขาด). ใช้ secret manager หรือ environment variables ที่ถูกตั้งค่าใน runtime/CI
- บังคับใช้ HTTPS ใน production (redirect HTTP -> HTTPS) เพื่อป้องกันการดักข้อมูล credentials/authorization headers
- ไม่ควรใช้ DB trigger เพื่อ hash รหัสผ่าน — ให้ทำที่ application layer เพื่อให้สามารถควบคุม algorithm และเวอร์ชันได้ง่าย
- ถ้ามีการเปิดใช้งาน credentials/cookies กับ CORS ให้ระบุ origin ที่อนุญาตอย่างชัดเจนใน production (อย่าใช้ wildcard "*")
- เก็บค่า hash ที่ได้จาก Argon2 เป็น full encoded string (ตัวอย่างในไฟล์นี้) และตรวจสอบความยาวคอลัมน์ก่อนใส่ข้อมูล
- เพิ่ม rate-limiting และ lockout (e.g., 5 ผิดพลาดแล้วบล็อกชั่วคราว) บน endpoints ที่เกี่ยวกับการล็อกอินและการขอ token
- เก็บ log ที่สำคัญ (failed logins, password reset) แต่ไม่บันทึกรหัสผ่านหรือ token ใน log
- ให้รองรับการ migration ของ hash (rehash-on-login) — เมื่อ user เข้ามาล็อกอินและระบบตรวจพบ hash รุ่นเก่า ให้ re-hash เป็น Argon2 และอัพเดต DB ทันที
- แยกสิทธิ์การเข้าถึง DB (least privilege): user ของแอปควรมีสิทธิ์จำเป็นเท่านั้น (SELECT/INSERT/UPDATE ที่จำเป็น)
- ทำการทดสอบ penetration testing และ static analysis บ่อย ๆ (SAST/DAST) โดยเฉพาะเมื่อมีการเปลี่ยน authentication/authorisation

References (security):
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- NIST SP 800-63B (Digital Identity Guidelines): https://pages.nist.gov/800-63-3/
