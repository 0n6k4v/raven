# Argon2

> **Argon2** คือ password-hashing function ที่ชนะการแข่งขัน [Password Hashing Competition (PHC)](https://password-hashing.net)
> นี่คือ reference implementation ที่เขียนด้วยภาษา C

---

## ภาพรวม

Argon2 เป็น password-hashing function ที่รวบรวมแนวคิดล่าสุดในการออกแบบ memory-hard function สามารถนำไปใช้สำหรับ:

- การเก็บ credential (password hashing)
- การทำ key derivation
- การใช้งานอื่น ๆ ที่เกี่ยวข้อง

การออกแบบมุ่งเน้นที่อัตราการเติม memory สูงสุดและการใช้ computing unit หลายตัวพร้อมกันได้อย่างมีประสิทธิภาพ พร้อมทั้งป้องกัน tradeoff attack โดยอาศัยโครงสร้าง cache และ memory ของโปรเซสเซอร์รุ่นใหม่

---

## รูปแบบ (Variants)

Argon2 มีสามรูปแบบ ได้แก่ **Argon2i**, **Argon2d**, และ **Argon2id**

| Variant | ลักษณะเด่น | เหมาะสำหรับ |
|---|---|---|
| **Argon2d** | ใช้ data-dependent memory access — เร็วกว่า ต้านทาน GPU cracking attack ได้ดี | แอปพลิเคชันที่ไม่มีความเสี่ยงจาก side-channel timing attack เช่น cryptocurrency |
| **Argon2i** | ใช้ data-independent memory access — ช้ากว่าแต่ปลอดภัยกว่าต่อ side-channel | password hashing และ password-based key derivation |
| **Argon2id** | ผสมผสานระหว่าง Argon2i และ Argon2d | ใช้งานทั่วไปที่ต้องการความสมดุลระหว่างความปลอดภัยทั้งสองด้าน |

---

## Parameters

Argon2 ทั้งสามรูปแบบรับ parameter ร่วมกัน ดังนี้

- **time cost** — จำนวนรอบการคำนวณ (iterations) กำหนดเวลาที่ใช้ในการประมวลผล
- **memory cost** — ปริมาณ memory ที่ใช้ หน่วยเป็น kibibyte
- **parallelism** — จำนวน thread ที่ทำงานพร้อมกัน

รายละเอียด spec และเหตุผลในการออกแบบอยู่ในไฟล์ `argon2-specs.pdf`

---

## การติดตั้งและ Build

รันคำสั่ง `make` เพื่อ build:

- ไฟล์ executable `argon2`
- static library `libargon2.a`
- shared library `libargon2.so` (หรือ `libargon2.dylib` บน macOS)

> **หมายเหตุ:** บน macOS ควรระบุ installation prefix เช่น `make PREFIX=/usr`

หลัง build ให้รัน `make test` เพื่อตรวจสอบความถูกต้องของผลลัพธ์
จากนั้นติดตั้งด้วย `sudo make install PREFIX=/usr`

---

## การใช้งาน

### Command-line Utility

`argon2` เป็น command-line utility สำหรับทดสอบ Argon2 instance บนระบบของคุณ

```
Usage:  ./argon2 [-h] salt [-i|-d|-id] [-t iterations] [-m memory] [-p parallelism] [-l hash length] [-e|-r] [-v (10|13)]
        Password is read from stdin
Parameters:
        salt            Salt ที่ใช้ ต้องมีความยาวอย่างน้อย 8 ตัวอักษร
        -i              ใช้ Argon2i (ค่าเริ่มต้น)
        -d              ใช้ Argon2d
        -id             ใช้ Argon2id
        -t N            กำหนดจำนวน iterations เป็น N (ค่าเริ่มต้น = 3)
        -m N            กำหนด memory เป็น 2^N KiB (ค่าเริ่มต้น 12)
        -p N            กำหนด parallelism เป็น N threads (ค่าเริ่มต้น 1)
        -l N            กำหนดความยาว hash output เป็น N bytes (ค่าเริ่มต้น 32)
        -e              แสดงเฉพาะ encoded hash
        -r              แสดงเฉพาะ raw bytes ของ hash
        -v (10|13)      เวอร์ชันของ Argon2 (ค่าเริ่มต้นคือเวอร์ชันล่าสุด ปัจจุบันคือ 13)
        -h              แสดงวิธีใช้งาน
```

**ตัวอย่าง:** hash คำว่า "password" โดยใช้ "somesalt" เป็น salt, ทำ 2 iterations, ใช้ memory 64 MiB, ใช้ 4 thread, และกำหนด output hash ขนาด 24 bytes

```bash
$ echo -n "password" | ./argon2 somesalt -t 2 -m 16 -p 4 -l 24
Type:           Argon2i
Iterations:     2
Memory:         65536 KiB
Parallelism:    4
Hash:           45d7ac72e76f242b20b77b9bf9bf9d5915894e669a24e6c6
Encoded:        $argon2i$v=19$m=65536,t=2,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG
0.188 seconds
Verification ok
```

---

### Library (libargon2)

`libargon2` มี API ทั้งระดับต่ำ (low-level) และระดับสูง (high-level) สำหรับใช้งาน Argon2

#### Parameters พิเศษที่ควรรู้

นอกจาก parameter หลักสามตัว (time, memory, parallelism) ยังมี parameter สำคัญอีกสามตัว:

1. **`secret`** — ใช้สำหรับ keyed hashing ช่วยให้ส่ง secret key เข้ามาขณะ hash ได้ แม้ salt และ hash จะถูกขโมย ผู้โจมตียังไม่สามารถ brute-force หา password ได้หากไม่มี key นี้
2. **`ad` (associated data)** — ใช้รวมข้อมูลเพิ่มเติมลงใน hash value ทำงานคล้าย `secret` และ `salt` แต่ใช้สำหรับข้อมูลประเภทอื่น
3. **`flags`** — กำหนดว่า memory ส่วนใดควรถูกลบอย่างปลอดภัย เช่น ตั้งค่า `ARGON2_FLAG_CLEAR_PASSWORD` หรือ `ARGON2_FLAG_CLEAR_SECRET` เพื่อลบ field เหล่านั้นหลังใช้งาน

#### ตัวอย่างโค้ด C

ตัวอย่างด้านล่างแสดงการ hash คำว่า "password" ด้วย Argon2i โดยใช้ทั้ง high-level API และ low-level API
โดยกำหนด `t_cost = 2`, `m_cost = 2^16 KiB` (64 MiB), `parallelism = 1`

```c
#include "argon2.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define HASHLEN 32
#define SALTLEN 16
#define PWD "password"

int main(void)
{
    uint8_t hash1[HASHLEN];
    uint8_t hash2[HASHLEN];

    uint8_t salt[SALTLEN];
    memset( salt, 0x00, SALTLEN );

    uint8_t *pwd = (uint8_t *)strdup(PWD);
    uint32_t pwdlen = strlen((char *)pwd);

    uint32_t t_cost = 2;            // 2-pass computation
    uint32_t m_cost = (1<<16);      // 64 mebibytes memory usage
    uint32_t parallelism = 1;       // number of threads and lanes

    // high-level API
    argon2i_hash_raw(t_cost, m_cost, parallelism, pwd, pwdlen, salt, SALTLEN, hash1, HASHLEN);

    // low-level API
    argon2_context context = {
        hash2,  /* output array */
        HASHLEN,
        pwd,
        pwdlen,
        salt,
        SALTLEN,
        NULL, 0, /* optional secret data */
        NULL, 0, /* optional associated data */
        t_cost, m_cost, parallelism, parallelism,
        ARGON2_VERSION_13,
        NULL, NULL,
        ARGON2_DEFAULT_FLAGS
    };

    int rc = argon2i_ctx( &context );
    if(ARGON2_OK != rc) {
        printf("Error: %s\n", argon2_error_message(rc));
        exit(1);
    }
    free(pwd);

    for( int i=0; i<HASHLEN; ++i ) printf( "%02x", hash1[i] ); printf( "\n" );
    if (memcmp(hash1, hash2, HASHLEN)) {
        for( int i=0; i<HASHLEN; ++i ) printf( "%02x", hash2[i] );
        printf("\nfail\n");
    }
    else printf("ok\n");
    return 0;
}
```

Compile ด้วย: `gcc test.c libargon2.a -Isrc -o test`

> **หมายเหตุ:** ในตัวอย่างนี้ salt ถูกตั้งเป็น `0x00` ทั้งหมดเพื่อความง่าย แต่ในการใช้งานจริงควรใช้ random salt เสมอ

#### การเรียกใช้รูปแบบอื่น

- ใช้ Argon2d แทน Argon2i: เรียก `argon2d_hash_raw` (high-level) หรือ `argon2d` (low-level)
- ใช้ Argon2id: เรียก `argon2id_hash_raw` (high-level) หรือ `argon2id` (low-level)
- ต้องการ encoded output แบบ crypt: เรียก `argon2i_hash_encoded`, `argon2d_hash_encoded`, หรือ `argon2id_hash_encoded`

ดูรายละเอียด API เพิ่มเติมได้ที่ไฟล์ `include/argon2.h`

---

### Benchmarks

รัน `make bench` เพื่อ build executable `bench` ซึ่งวัดเวลาการทำงานของ Argon2 instance ต่าง ๆ

```
$ ./bench
Argon2d 1 iterations  1 MiB 1 threads:  5.91 cpb 5.91 Mcycles
Argon2i 1 iterations  1 MiB 1 threads:  4.64 cpb 4.64 Mcycles
0.0041 seconds

Argon2d 1 iterations  4096 MiB 2 threads:  2.15 cpb 8788.08 Mcycles
Argon2i 1 iterations  4096 MiB 2 threads:  2.15 cpb 8821.59 Mcycles
13.0112 seconds
...
```

---

## Bindings สำหรับภาษาอื่น

มี binding พร้อมใช้งานสำหรับหลายภาษา (ควรอ่านเอกสารของแต่ละ binding ด้วย):

| ภาษา | ลิงก์ |
|---|---|
| Android (Java/Kotlin) | [argon2kt](https://github.com/lambdapioneer/argon2kt) |
| Dart | [dargon2](https://github.com/tmthecoder/dargon2) |
| Elixir | [argon2_elixir](https://github.com/riverrun/argon2_elixir) |
| Erlang | [eargon2](https://github.com/ergenius/eargon2) |
| Go | [go-argon2](https://github.com/tvdburgt/go-argon2) |
| Haskell | [argon2](https://hackage.haskell.org/package/argon2) |
| JavaScript (native) | [node-argon2](https://github.com/ranisalt/node-argon2) |
| JavaScript (browser) | [argon2-browser](https://github.com/antelle/argon2-browser) |
| JVM | [argon2-jvm](https://github.com/phxql/argon2-jvm) |
| Python (native) | [argon2](https://pypi.python.org/pypi/argon2) |
| Python (ffi) | [argon2_cffi](https://pypi.python.org/pypi/argon2_cffi) |
| Ruby | [ruby-argon2](https://github.com/technion/ruby-argon2) |
| Rust | [argon2-rs](https://github.com/quininer/argon2-rs) |
| C#/.NET CoreCLR | [Konscious.Security.Cryptography](https://github.com/kmaragon/Konscious.Security.Cryptography) |
| Perl | [crypt-argon2](https://github.com/Leont/crypt-argon2) |
| Swift | [Argon2Swift](https://github.com/tmthecoder/Argon2Swift) |
| R | [argon2](https://cran.r-project.org/package=argon2) |
| OCaml | [ocaml-argon2](https://github.com/Khady/ocaml-argon2) |

---

## Test Suite

มี test suite สองชุด ได้แก่ชุดที่ทดสอบ hash function ในระดับต่ำ และชุดที่ทดสอบ high-level API สามารถ build และรันทั้งสองชุดได้ด้วยคำสั่งเดียว:

```bash
make test
```

---

## ทรัพย์สินทางปัญญา (Intellectual Property)

ยกเว้นส่วนประกอบที่ระบุด้านล่าง โค้ด Argon2 ใน repository นี้เป็นลิขสิทธิ์ © 2015 ของ Daniel Dinu, Dmitry Khovratovich (ผู้เขียนหลัก), Jean-Philippe Aumasson และ Samuel Neves และอนุญาตให้ใช้งานแบบ dual license ภายใต้:

- [CC0 License](https://creativecommons.org/about/cc0)
- [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0)

ส่วนเพิ่มเติม:

- **`src/encoding.c`** — copyright © 2015 Thomas Pornin ภายใต้ CC0 License
- **`src/blake2/`** — copyright © 2013–2015 Samuel Neves ภายใต้ CC0 License

License ทั้งหมดเข้ากันได้กับ GPL