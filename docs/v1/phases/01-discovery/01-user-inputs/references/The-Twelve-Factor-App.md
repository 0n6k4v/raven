# The Twelve-Factor App
### ระเบียบวิธีสำหรับการสร้าง Software-as-a-Service

> แปลจากต้นฉบับ: https://12factor.net/  
> เขียนโดย Adam Wiggins · อัปเดตล่าสุดปี 2017

---

## Introduction

ในยุคปัจจุบัน ซอฟต์แวร์มักถูกส่งมอบในรูปแบบบริการ ซึ่งเรียกว่า *web app* หรือ *software-as-a-service* **The Twelve-Factor App** คือระเบียบวิธี (methodology) สำหรับการสร้าง software-as-a-service ที่มีคุณสมบัติดังนี้:

- ใช้รูปแบบ **declarative** สำหรับ automation ของการตั้งค่า เพื่อลดเวลาและค่าใช้จ่ายสำหรับนักพัฒนาใหม่ที่เข้าร่วมโปรเจกต์
- มี **สัญญาที่ชัดเจน** กับระบบปฏิบัติการพื้นฐาน มอบ **portability สูงสุด** ระหว่าง execution environment ต่างๆ
- เหมาะสำหรับการ **deploy บน cloud platform** สมัยใหม่ โดยไม่จำเป็นต้องมี server หรือการบริหารระบบ
- **ลดความแตกต่าง** ระหว่าง development และ production ทำให้ **continuous deployment** เกิดขึ้นได้อย่างคล่องตัว
- สามารถ **scale ขึ้น** ได้โดยไม่ต้องเปลี่ยนแปลง tooling, สถาปัตยกรรม หรือแนวทางการพัฒนาอย่างมีนัยสำคัญ

ระเบียบวิธีนี้สามารถนำไปใช้กับ app ที่เขียนด้วยภาษาโปรแกรมใดก็ได้ และใช้ backing service (database, queue, memory cache ฯลฯ) ในรูปแบบใดก็ได้

---

## Background

ผู้เขียนเอกสารนี้ได้มีส่วนร่วมโดยตรงในการพัฒนาและ deploy app หลายร้อยตัว และได้เห็นการพัฒนา การดำเนินงาน และการ scale ของ app หลายแสนตัวผ่านการทำงานบน platform ของ Heroku

เอกสารนี้สังเคราะห์ประสบการณ์และการสังเกตทั้งหมดจาก software-as-a-service app ที่หลากหลายในโลกจริง เป็นการตกผลึกแนวทางปฏิบัติที่เหมาะสมที่สุดสำหรับการพัฒนา app โดยให้ความสนใจเป็นพิเศษกับพลวัตของการเติบโตตามธรรมชาติของ app เมื่อเวลาผ่านไป, พลวัตของการทำงานร่วมกันระหว่างนักพัฒนาใน codebase และการหลีกเลี่ยงต้นทุนของ software erosion

---

## Who should read this document?

นักพัฒนาทุกคนที่สร้าง application ซึ่งทำงานเป็น service รวมถึง ops engineer ที่ deploy หรือบริหาร application เหล่านั้น

---

## 12 Factor Summary

| # | Factor | หลักการ |
|:---:|---|---|
| I | Codebase | หนึ่ง codebase ถูก track ใน revision control, หลาย deploy |
| II | Dependencies | ประกาศและแยก dependency อย่างชัดเจน |
| III | Config | เก็บ config ไว้ใน environment |
| IV | Backing Services | มอง backing service เป็น attached resource |
| V | Build, Release, Run | แยก build stage และ run stage ออกจากกันอย่างเคร่งครัด |
| VI | Processes | รัน app เป็น stateless process หนึ่งตัวหรือมากกว่า |
| VII | Port Binding | เปิดให้บริการผ่าน port binding |
| VIII | Concurrency | ขยายระบบผ่าน process model |
| IX | Disposability | เพิ่มความแข็งแกร่งด้วยการ startup ที่รวดเร็วและ graceful shutdown |
| X | Dev/Prod Parity | รักษา development, staging และ production ให้คล้ายกันมากที่สุด |
| XI | Logs | มอง log เป็น event stream |
| XII | Admin Processes | รัน admin/management task เป็น one-off process |

---

## I. Codebase

### หนึ่ง codebase ถูก track ใน revision control, หลาย deploy

> https://12factor.net/codebase

Twelve-factor app จะถูก track ไว้ใน version control system เสมอ เช่น Git, Mercurial หรือ Subversion สำเนาของ revision tracking database เรียกว่า *code repository* หรือย่อว่า *code repo* หรือเพียงแค่ *repo*

**codebase** คือ repo เดียว (ในระบบ revision control แบบ centralized อย่าง Subversion) หรือชุดของ repo ที่มี root commit ร่วมกัน (ในระบบ revision control แบบ decentralized อย่าง Git)

ความสัมพันธ์ระหว่าง codebase กับ app เป็นแบบหนึ่งต่อหนึ่งเสมอ:

- ถ้ามี codebase หลายชุด นั่นไม่ใช่ app — แต่เป็น **distributed system** แต่ละ component ในระบบนั้นคือ app หนึ่งตัว และแต่ละตัวสามารถปฏิบัติตาม twelve-factor ได้อย่างอิสระ
- หลาย app แชร์ code เดียวกันเป็นการละเมิด twelve-factor ทางแก้คือแยก code ที่ใช้ร่วมกันออกเป็น library ที่ include ผ่าน dependency manager

มี codebase เดียวต่อ app หนึ่งตัว แต่จะมีหลาย deploy ของ app นั้น **deploy** คือ instance ที่กำลังทำงานของ app โดยทั่วไปหมายถึง production site และ staging site หนึ่งหรือหลายแห่ง นอกจากนี้ นักพัฒนาแต่ละคนยังมีสำเนาของ app ที่รันอยู่ใน local development environment ซึ่งนับว่าเป็น deploy ด้วย

codebase เดียวกันในทุก deploy แต่อาจมี version ที่แตกต่างกันที่ active อยู่ในแต่ละ deploy ตัวอย่างเช่น นักพัฒนาอาจมี commit บางส่วนที่ยังไม่ได้ deploy ไปยัง staging; staging อาจมี commit บางส่วนที่ยังไม่ได้ deploy ไปยัง production แต่ทั้งหมดแชร์ codebase เดียวกัน จึงสามารถระบุได้ว่าเป็น deploy ที่แตกต่างกันของ app เดียวกัน

<img src="https://12factor.net/images/codebase-deploys.png" style="background-color: white; padding: 10px; border-radius: 4px;" alt="Codebase Deploys">

---

## II. Dependencies

### ประกาศและแยก dependency อย่างชัดเจน

> https://12factor.net/dependencies

ภาษาโปรแกรมส่วนใหญ่มีระบบ packaging สำหรับแจกจ่าย support library เช่น CPAN สำหรับ Perl หรือ Rubygems สำหรับ Ruby library ที่ติดตั้งผ่าน packaging system สามารถติดตั้งแบบ system-wide (เรียกว่า "site packages") หรือ scoped ไว้ในไดเรกทอรีที่มี app (เรียกว่า "vendoring" หรือ "bundling")

**Twelve-factor app ไม่เคยพึ่งพา implicit existence ของ system-wide package** โดยประกาศ dependency ทั้งหมด อย่างสมบูรณ์และชัดเจน ผ่าน *dependency declaration manifest* นอกจากนี้ยังใช้เครื่องมือ *dependency isolation* ระหว่าง execution เพื่อให้แน่ใจว่าไม่มี implicit dependency "รั่วไหล" เข้ามาจากระบบโดยรอบ ทั้ง production และ development ใช้ dependency specification แบบเดียวกัน

ตัวอย่าง:
- **Ruby/Bundler:** `Gemfile` สำหรับ declaration + `bundle exec` สำหรับ isolation
- **Python:** `pip` สำหรับ declaration + `Virtualenv` สำหรับ isolation
- **C:** `Autoconf` สำหรับ declaration + static linking สำหรับ isolation

ไม่ว่า toolchain จะเป็นอะไร การ declaration และ isolation ต้องใช้ควบคู่กันเสมอ — มีแค่อย่างเดียวไม่เพียงพอ

ประโยชน์ของการประกาศ dependency อย่างชัดเจน: นักพัฒนาใหม่สามารถ checkout codebase ลงในเครื่อง development ได้ โดยมีแค่ language runtime และ dependency manager เป็น prerequisite แล้วสามารถตั้งค่าทุกอย่างที่จำเป็นสำหรับการรัน app ได้ด้วย *build command* เดียวที่ได้ผลแน่นอน เช่น `bundle install` สำหรับ Ruby/Bundler หรือ `lein deps` สำหรับ Clojure/Leiningen

Twelve-factor app ยังไม่พึ่งพา implicit existence ของ system tool ใดๆ เช่น ImageMagick หรือ `curl` แม้ tool เหล่านั้นอาจมีอยู่ในหลายระบบ แต่ไม่มีการรับประกันว่าจะมีในทุกระบบที่ app อาจรันในอนาคต หาก app จำเป็นต้องใช้ system tool ให้ vendor tool นั้นเข้าไปใน app

---

## III. Config

### เก็บ config ไว้ใน environment

> https://12factor.net/config

*config* ของ app คือทุกอย่างที่มีแนวโน้มจะแตกต่างกันระหว่าง deploy (staging, production, developer environment ฯลฯ) ซึ่งรวมถึง:

- Resource handle ไปยัง database, Memcached และ backing service อื่นๆ
- Credential ไปยัง external service เช่น Amazon S3 หรือ Twitter
- ค่าที่เฉพาะเจาะจงต่อแต่ละ deploy เช่น canonical hostname

บาง app เก็บ config เป็น constant ไว้ใน code ซึ่งเป็นการละเมิด twelve-factor ที่กำหนดให้ **แยก config จาก code อย่างเคร่งครัด** config แตกต่างกันอย่างมากระหว่าง deploy แต่ code ไม่เปลี่ยน

การทดสอบง่ายๆ ว่า app มี config ถูก factor ออกจาก code อย่างถูกต้องหรือไม่: ถามว่า codebase จะสามารถ open source ได้ทันทีตอนนี้เลยหรือไม่ โดยไม่ต้องเสี่ยงเปิดเผย credential ใดๆ

> **หมายเหตุ:** นิยาม "config" นี้ **ไม่รวม** internal application config เช่น `config/routes.rb` ใน Rails หรือวิธีที่ code module เชื่อมต่อกันใน Spring config ประเภทนี้ไม่เปลี่ยนแปลงระหว่าง deploy จึงควรอยู่ใน code

อีกแนวทางสำหรับ config คือการใช้ config file ที่ไม่ได้ check in ไปยัง revision control เช่น `config/database.yml` ใน Rails แม้จะดีกว่าการใช้ constant ที่ check in ไปยัง code repo แต่ก็ยังมีจุดอ่อน: ง่ายต่อการ check in config file ไปยัง repo โดยไม่ตั้งใจ, config file มีแนวโน้มกระจัดกระจายอยู่ในที่ต่างๆ และรูปแบบต่างๆ ทำให้ยากต่อการดูและจัดการ config ทั้งหมดในที่เดียว

**Twelve-factor app เก็บ config ใน *environment variable*** (มักย่อว่า *env var* หรือ *env*) env var เปลี่ยนแปลงได้ง่ายระหว่าง deploy โดยไม่ต้องเปลี่ยน code; ต่างจาก config file ตรงที่มีโอกาสน้อยมากที่จะถูก check in ไปยัง code repo โดยไม่ตั้งใจ; และต่างจาก config mechanism อื่นๆ เช่น Java System Properties ตรงที่เป็นมาตรฐานที่ไม่ขึ้นกับภาษาหรือ OS

ด้านหนึ่งของการจัดการ config คือการจัดกลุ่ม บาง app รวม config เป็นกลุ่มที่มีชื่อ (มักเรียกว่า "environment") ตามชื่อของ deploy เฉพาะ เช่น environment `development`, `test` และ `production` ใน Rails วิธีนี้ขยายตัวได้ไม่ดี: เมื่อมี deploy มากขึ้น ก็ต้องการชื่อ environment ใหม่ เช่น `staging` หรือ `qa` และเมื่อโปรเจกต์เติบโตขึ้น นักพัฒนาอาจเพิ่ม environment พิเศษของตนเอง เช่น `joes-staging` ทำให้เกิด config ที่ซับซ้อนเกินควร

ใน twelve-factor app env var คือ granular control แต่ละตัวเป็นอิสระจากกันโดยสมบูรณ์ env var ไม่ถูกจัดกลุ่มเป็น "environment" แต่ถูกจัดการอย่างอิสระสำหรับแต่ละ deploy นี่คือ model ที่ขยายตัวได้อย่างราบรื่นเมื่อ app เติบโตเป็น deploy มากขึ้นตลอดอายุการใช้งาน

---

## IV. Backing Services

### มอง backing service เป็น attached resource

> https://12factor.net/backing-services

*backing service* คือบริการใดๆ ที่ app เรียกใช้ผ่านเครือข่ายเป็นส่วนหนึ่งของการทำงานปกติ ตัวอย่างได้แก่:

- **datastore:** MySQL, CouchDB, PostgreSQL
- **messaging/queueing system:** RabbitMQ, Beanstalkd
- **SMTP service:** Postfix, Postmark
- **caching system:** Memcached
- **metric service:** New Relic, Loggly
- **binary asset service:** Amazon S3
- **API-accessible consumer service:** Twitter, Google Maps, Last.fm

**Code ของ twelve-factor app ไม่แยกแยะระหว่าง local service และ third-party service** สำหรับ app แล้ว ทั้งสองเป็น attached resource ที่เข้าถึงผ่าน URL หรือ locator/credential อื่นๆ ที่เก็บไว้ใน config

deploy ของ twelve-factor app ควรสามารถสลับ MySQL database ใน local ด้วย database ที่จัดการโดย third-party (เช่น Amazon RDS) ได้โดยไม่ต้องเปลี่ยน code ใดๆ ในทำนองเดียวกัน SMTP server ใน local ควรสามารถสลับกับ third-party SMTP service (เช่น Postmark) ได้โดยไม่ต้องเปลี่ยน code ในทั้งสองกรณี มีเพียง resource handle ใน config เท่านั้นที่ต้องเปลี่ยน

backing service แต่ละตัวที่แตกต่างกันคือ *resource* หนึ่งชิ้น ตัวอย่างเช่น MySQL database คือ resource; MySQL database สองตัว (ใช้สำหรับ sharding ที่ application layer) ถือเป็น resource ที่แตกต่างกันสองชิ้น Twelve-factor app มองว่า database เหล่านี้เป็น *attached resource* ซึ่งสื่อถึงการ coupling แบบหลวมๆ กับ deploy ที่แนบอยู่

<img src="https://12factor.net/images/attached-resources.png" style="background-color: white; padding: 10px; border-radius: 4px;" alt="Attached Resources">

Resource สามารถ attach และ detach จาก deploy ได้ตามต้องการ ตัวอย่างเช่น ถ้า database ของ app ทำงานผิดปกติเนื่องจากปัญหา hardware ผู้ดูแลระบบอาจ spin up database server ใหม่ที่ restore จาก backup ล่าสุด database production ปัจจุบัน detach ออก และ database ใหม่ attach เข้า — ทั้งหมดนี้โดยไม่ต้องเปลี่ยน code ใดๆ

---

## V. Build, Release, Run

### แยก build stage และ run stage ออกจากกันอย่างเคร่งครัด

> https://12factor.net/build-release-run

codebase ถูกแปลงเป็น deploy (ที่ไม่ใช่ development) ผ่าน 3 ขั้นตอน:

- **Build stage** คือกระบวนการแปลง code repo ให้กลายเป็น executable bundle ที่เรียกว่า *build* โดยใช้ version ของ code ณ commit ที่ระบุโดย deployment process, build stage จะ fetch vendor dependency และ compile binary กับ asset
- **Release stage** นำ build ที่ได้จาก build stage มารวมกับ config ของ deploy นั้นๆ *release* ที่ได้มีทั้ง build และ config พร้อมสำหรับการ execute ทันทีใน execution environment
- **Run stage** (หรือที่เรียกว่า "runtime") รัน app ใน execution environment โดย launch ชุดของ process ของ app ต่อ release ที่เลือก

<img src="https://12factor.net/images/release.png" style="background-color: white; padding: 10px; border-radius: 4px;" alt="Build, Release, Run">

**Twelve-factor app ใช้การแยกอย่างเคร่งครัดระหว่าง build, release และ run stage** ตัวอย่างเช่น การเปลี่ยน code ขณะ runtime เป็นไปไม่ได้ เนื่องจากไม่มีทางส่งการเปลี่ยนแปลงนั้นกลับไปยัง build stage

Deployment tool มักมี release management tool เช่น ความสามารถในการ rollback ไปยัง release ก่อนหน้า

**Release ทุกตัวควรมี release ID ที่ไม่ซ้ำกัน** เช่น timestamp ของ release (เช่น `2011-04-06-20:32:17`) หรือตัวเลขที่เพิ่มขึ้น (เช่น `v100`) Release เป็น append-only ledger และ release ไม่สามารถ mutate ได้เมื่อสร้างขึ้นแล้ว การเปลี่ยนแปลงใดๆ ต้องสร้าง release ใหม่

Build ถูก initiate โดยนักพัฒนาของ app เมื่อใดก็ตามที่มี code ใหม่ถูก deploy แต่ runtime execution ต่างกัน — อาจเกิดขึ้นอัตโนมัติ เช่น เมื่อ server รีบูต หรือ process ที่ crash ถูก restart โดย process manager ดังนั้น run stage ควรมี moving part น้อยที่สุดเท่าที่เป็นไปได้ เนื่องจากปัญหาที่ทำให้ app ไม่สามารถรันได้อาจเกิดขึ้นกลางดึกเมื่อไม่มีนักพัฒนาอยู่ด้วย

---

## VI. Processes

### รัน app เป็น stateless process หนึ่งตัวหรือมากกว่า

> https://12factor.net/processes

App ถูกรันใน execution environment เป็น process หนึ่งตัวหรือมากกว่า

ในกรณีที่ง่ายที่สุด code เป็น stand-alone script, execution environment คือ laptop ของนักพัฒนาที่มี language runtime ติดตั้งอยู่ และ process ถูก launch ผ่าน command line (เช่น `python my_script.py`) ในด้านตรงข้าม production deploy ของ app ที่ซับซ้อนอาจใช้ process type หลายแบบที่ instantiate เป็น process ที่กำลังรันหลายตัว

**Twelve-factor process เป็น stateless และ share-nothing** ข้อมูลใดๆ ที่ต้องการ persist ต้องเก็บไว้ใน stateful backing service ซึ่งโดยทั่วไปคือ database

Memory space หรือ filesystem ของ process สามารถใช้เป็น cache ชั่วคราวสำหรับ single-transaction ได้ ตัวอย่างเช่น download ไฟล์ขนาดใหญ่, ดำเนินการกับมัน และเก็บผลลัพธ์ใน database Twelve-factor app ไม่เคยสมมติว่าอะไรก็ตามที่ cache ไว้ใน memory หรือ disk จะยังคงมีอยู่ใน request หรือ job ในอนาคต เนื่องจากเมื่อมี process หลายตัวของแต่ละ type กำลังรัน โอกาสสูงที่ request ในอนาคตจะถูกให้บริการโดย process ที่ต่างออกไป แม้เมื่อรัน process เพียงตัวเดียว การ restart (triggered โดย code deploy, config change หรือ execution environment ย้าย process ไปยัง physical machine ที่ต่างกัน) ก็มักจะล้าง local state ทั้งหมด (เช่น memory และ filesystem)

บาง web system พึ่งพา "sticky sessions" — นั่นคือ cache session data ของผู้ใช้ไว้ใน memory ของ process ของ app และคาดว่า request ในอนาคตจาก visitor เดิมจะถูก route ไปยัง process เดิม **Sticky session เป็นการละเมิด twelve-factor และไม่ควรใช้หรือพึ่งพา** Session state data เหมาะสมที่จะเก็บใน datastore ที่มี time-expiration เช่น Memcached หรือ Redis

---

## VII. Port Binding

### เปิดให้บริการผ่าน port binding

> https://12factor.net/port-binding

Web app บางครั้งถูก execute ภายใน webserver container เช่น PHP app อาจรันเป็น module ภายใน Apache HTTPD หรือ Java app อาจรันภายใน Tomcat

**Twelve-factor app เป็น self-contained โดยสมบูรณ์** และไม่พึ่งพา runtime injection ของ webserver เข้ามาใน execution environment เพื่อสร้าง web-facing service Web app **export HTTP เป็น service โดยการ bind กับ port** และ listen request ที่เข้ามาบน port นั้น

ใน local development environment นักพัฒนาเยี่ยมชม service URL เช่น `http://localhost:5000/` เพื่อเข้าถึง service ที่ app export ออกมา เมื่อ deploy routing layer จะจัดการ route request จาก public-facing hostname ไปยัง port-bound web process

โดยทั่วไปสิ่งนี้ implement โดยการใช้ dependency declaration เพื่อเพิ่ม webserver library เข้าใน app เช่น Tornado สำหรับ Python, Thin สำหรับ Ruby หรือ Jetty สำหรับ Java และภาษา JVM-based อื่นๆ สิ่งนี้เกิดขึ้นทั้งหมดใน *user space* นั่นคือภายใน code ของ app สัญญากับ execution environment คือการ bind กับ port เพื่อให้บริการ request

HTTP ไม่ใช่ service เพียงอย่างเดียวที่สามารถ export ผ่าน port binding ได้ server software เกือบทุกประเภทสามารถรันผ่าน process ที่ bind กับ port และรอ incoming request ตัวอย่างเช่น ejabberd (พูด XMPP) และ Redis (พูด Redis protocol)

การ bind กับ port ยังหมายความว่า app หนึ่งสามารถกลายเป็น backing service สำหรับ app อื่นได้ โดยระบุ URL ของ backing app เป็น resource handle ใน config ของ consuming app

---

## VIII. Concurrency

### ขยายระบบผ่าน process model

> https://12factor.net/concurrency

โปรแกรมคอมพิวเตอร์ใดๆ เมื่อรันแล้ว จะถูกแทนด้วย process หนึ่งตัวหรือมากกว่า Web app มีรูปแบบการ execute process ที่หลากหลาย ตัวอย่างเช่น PHP process รันเป็น child process ของ Apache ที่ start ตามความต้องการตาม request volume; Java process ใช้แนวทางตรงข้าม โดย JVM มี uberprocess ขนาดใหญ่ตัวเดียวที่จองทรัพยากรระบบจำนวนมาก (CPU และ memory) ตั้งแต่เริ่มต้น และจัดการ concurrency ภายในผ่าน thread

**ใน twelve-factor app, process เป็น first class citizen** Process ใน twelve-factor app ได้รับแนวคิดมาจาก unix process model สำหรับการรัน service daemon โดยใช้ model นี้ นักพัฒนาสามารถออกแบบ app เพื่อจัดการกับ workload ที่หลากหลายโดยกำหนดงานแต่ละประเภทให้กับ *process type* ตัวอย่างเช่น HTTP request อาจถูกจัดการโดย web process และ long-running background task ถูกจัดการโดย worker process

สิ่งนี้ไม่ได้ห้ามให้ process แต่ละตัวจัดการ internal multiplexing ของตัวเองผ่าน thread ภายใน runtime VM หรือ async/evented model แต่ VM แต่ละตัวสามารถเติบโตได้ในขนาดจำกัด (vertical scale) ดังนั้น application ต้องสามารถ span หลาย process บน physical machine หลายเครื่องได้ด้วย

Process model โดดเด่นที่สุดเมื่อถึงเวลาต้อง scale ออก ลักษณะ share-nothing และ horizontally partitionable ของ twelve-factor app process หมายความว่าการเพิ่ม concurrency เป็น operation ที่ง่ายและเชื่อถือได้ อาร์เรย์ของ process type และจำนวน process ของแต่ละ type เรียกว่า *process formation*

Twelve-factor app process **ไม่ควร daemonize** หรือเขียน PID file แต่ให้พึ่งพา process manager ของระบบปฏิบัติการ (เช่น systemd, distributed process manager บน cloud platform หรือ Foreman ใน development) เพื่อจัดการ output stream, ตอบสนองต่อ process ที่ crash และจัดการ restart และ shutdown ที่ผู้ใช้ initiate

<img src="https://12factor.net/images/process-types.png" style="background-color: white; padding: 10px; border-radius: 4px;" alt="Process Types">

---

## IX. Disposability

### เพิ่มความแข็งแกร่งด้วยการ startup ที่รวดเร็วและ graceful shutdown

> https://12factor.net/disposability

**Process ของ twelve-factor app เป็น *disposable* หมายความว่าสามารถ start หรือ stop ได้ทันที** สิ่งนี้ช่วยให้ scale ได้อย่างยืดหยุ่นรวดเร็ว, deploy code หรือ config change ได้อย่างรวดเร็ว และ production deploy มีความแข็งแกร่ง

Process ควรพยายาม **ลด startup time** โดย ideally process ใช้เวลาเพียงไม่กี่วินาทีนับจากคำสั่ง launch จนถึงที่พร้อมรับ request หรือ job startup time ที่สั้นให้ความ agility มากขึ้นสำหรับ release process และการ scale ขึ้น

Process **shutdown อย่าง graceful เมื่อได้รับ SIGTERM** signal จาก process manager:

**สำหรับ web process:** graceful shutdown ทำได้โดยหยุด listen บน service port (ปฏิเสธ request ใหม่), ปล่อยให้ request ปัจจุบันเสร็จสิ้น แล้วจึง exit HTTP request ควรสั้น (ไม่เกินสองสามวินาที) หรือในกรณีของ long polling client ควร reconnect ใหม่อย่างต่อเนื่องเมื่อ connection หาย

**สำหรับ worker process:** graceful shutdown ทำได้โดย return job ปัจจุบันกลับไปยัง work queue ตัวอย่างเช่น บน RabbitMQ worker สามารถส่ง `NACK`; บน Beanstalkd job จะถูก return ไปยัง queue อัตโนมัติเมื่อ worker disconnect สิ่งนี้หมายความว่า job ทั้งหมดต้องเป็น *reentrant* ซึ่งโดยทั่วไปทำได้โดยห่อผลลัพธ์ใน transaction หรือทำให้ operation เป็น *idempotent*

Process ควร **แข็งแกร่งต่อการตายกะทันหัน** ด้วยเช่นกัน ในกรณีที่ hardware ล้มเหลวอย่างไม่คาดคิด แนวทางที่แนะนำคือการใช้ queueing backend ที่แข็งแกร่ง เช่น Beanstalkd ที่ return job ไปยัง queue เมื่อ client disconnect หรือ timeout Twelve-factor app ถูกออกแบบสถาปัตยกรรมให้จัดการกับการยุติที่ไม่คาดคิดและไม่ graceful ได้

---

## X. Dev/Prod Parity

### รักษา development, staging และ production ให้คล้ายกันมากที่สุด

> https://12factor.net/dev-prod-parity

ในอดีตมีช่องว่างขนาดใหญ่ระหว่าง development (นักพัฒนาแก้ไข code ใน local deploy) และ production (deploy ที่กำลังรันที่ผู้ใช้ end user เข้าถึง) ช่องว่างเหล่านี้ปรากฏใน 3 ด้าน:

- **Time gap:** นักพัฒนาอาจทำงานกับ code ที่ใช้เวลาเป็นวัน สัปดาห์ หรือแม้แต่เดือนกว่าจะขึ้น production
- **Personnel gap:** นักพัฒนาเขียน code แต่ ops engineer เป็นคน deploy
- **Tools gap:** นักพัฒนาอาจใช้ Nginx, SQLite และ OS X ในขณะที่ production deploy ใช้ Apache, MySQL และ Linux

**Twelve-factor app ถูกออกแบบสำหรับ continuous deployment โดยรักษาช่องว่างระหว่าง development และ production ให้เล็กน้อย**

| | Traditional app | Twelve-factor app |
|---|---|---|
| เวลาระหว่าง deploy | สัปดาห์ | ชั่วโมง |
| ผู้เขียน code กับผู้ deploy code | คนละคน | คนเดียวกัน |
| Dev environment กับ production environment | แตกต่างกัน | คล้ายกันมากที่สุด |

Backing service เช่น database, queueing system หรือ cache เป็นพื้นที่หนึ่งที่ dev/prod parity มีความสำคัญ หลายภาษามี library ที่ช่วยให้เข้าถึง backing service ได้ง่ายขึ้น รวมถึง *adapter* ไปยัง service ประเภทต่างๆ:

| ประเภท | ภาษา | Library | Adapter |
|---|---|---|---|
| Database | Ruby/Rails | ActiveRecord | MySQL, PostgreSQL, SQLite |
| Queue | Python/Django | Celery | RabbitMQ, Beanstalkd, Redis |
| Cache | Ruby/Rails | ActiveSupport::Cache | Memory, filesystem, Memcached |

นักพัฒนาบางครั้งชอบใช้ backing service แบบเบาใน local environment ในขณะที่ production ใช้ service ที่จริงจังกว่า เช่น ใช้ SQLite ใน local แต่ใช้ PostgreSQL ใน production

**Twelve-factor developer ต้านทานการใช้ backing service ที่แตกต่างกันระหว่าง development และ production** แม้ adapter จะทำให้ความแตกต่างระหว่าง backing service เหล่านั้นเป็น abstract ไปในทางทฤษฎี ความแตกต่างระหว่าง backing service ทำให้เกิด incompatibility เล็กๆ น้อยๆ ทำให้ code ที่ทำงานและผ่าน test ใน development หรือ staging ล้มเหลวใน production

Local service แบบเบาน่าดึงดูดน้อยลงกว่าเดิม Modern backing service เช่น Memcached, PostgreSQL และ RabbitMQ ติดตั้งและรันได้ไม่ยาก ด้วย packaging system สมัยใหม่ เช่น Homebrew และ apt-get หรือด้วย declarative provisioning tool เช่น Chef และ Puppet ร่วมกับ light-weight virtual environment เช่น Docker และ Vagrant ช่วยให้นักพัฒนาสามารถรัน local environment ที่ใกล้เคียงกับ production environment ได้

---

## XI. Logs

### มอง log เป็น event stream

> https://12factor.net/logs

*Log* ให้ visibility ในพฤติกรรมของ app ที่กำลังรัน ใน server-based environment มักถูกเขียนลงในไฟล์บน disk (เรียกว่า "logfile") แต่นั่นเป็นเพียงรูปแบบ output เท่านั้น

Log คือ stream ของ event ที่รวบรวมตามเวลา จาก output stream ของ process ที่กำลังรันทั้งหมดและ backing service ใน raw form โดยทั่วไปเป็น text format ที่มีหนึ่ง event ต่อหนึ่งบรรทัด Log ไม่มีจุดเริ่มต้นหรือสิ้นสุดที่แน่นอน แต่ไหลอย่างต่อเนื่องตราบใดที่ app ยังทำงานอยู่

**Twelve-factor app ไม่กังวลเรื่อง routing หรือ storage ของ output stream ของตัวเอง** ไม่ควรพยายามเขียนหรือจัดการ logfile แต่ process ที่กำลังรันแต่ละตัวเขียน event stream ของตัวเอง โดยไม่มี buffer ไปยัง `stdout` ระหว่าง local development นักพัฒนาจะดู stream นี้ใน foreground ของ terminal เพื่อสังเกตพฤติกรรมของ app

ใน staging หรือ production deploy stream ของแต่ละ process จะถูก capture โดย execution environment รวมเข้ากับ stream อื่นๆ ทั้งหมดจาก app และ route ไปยัง destination ปลายทางหนึ่งหรือหลายแห่งสำหรับการดูและเก็บถาวรระยะยาว destination เหล่านี้ไม่สามารถมองเห็นหรือ configure ได้โดย app แต่ถูกจัดการโดย execution environment ทั้งหมด มี open-source log router เช่น Logplex และ Fluentd สำหรับจุดประสงค์นี้

Event stream ของ app สามารถ route ไปยังไฟล์ หรือดูผ่าน realtime tail ใน terminal ที่สำคัญที่สุด stream สามารถส่งไปยัง log indexing และ analysis system เช่น Splunk หรือ general-purpose data warehousing system เช่น Hadoop/Hive ซึ่งให้ความสามารถและความยืดหยุ่นอย่างมากในการวิเคราะห์พฤติกรรมของ app เมื่อเวลาผ่านไป รวมถึง:

- ค้นหา event เฉพาะในอดีต
- graphing เทรนด์ขนาดใหญ่ (เช่น request ต่อนาที)
- active alert ตาม heuristic ที่ผู้ใช้กำหนด (เช่น alert เมื่อจำนวน error ต่อนาทีเกิน threshold ที่กำหนด)

```
Process ทุกตัว
    │ stdout (ไม่มี buffer)
    ▼
Execution Environment
    │ รวบรวมและ route
    ├──► Terminal (local dev)
    ├──► File archive
    └──► Log analysis system (Splunk, ELK, Datadog ฯลฯ)
                │
                └──► Dashboard · Alert · Historical search
```

---

## XII. Admin Processes

### รัน admin/management task เป็น one-off process

> https://12factor.net/admin-processes

Process formation คืออาร์เรย์ของ process ที่ใช้ทำ regular business ของ app (เช่น จัดการ web request) ขณะที่รันอยู่ แยกจากนั้น นักพัฒนามักต้องการทำ one-off administrative หรือ maintenance task สำหรับ app เช่น:

- รัน database migration (เช่น `manage.py migrate` ใน Django, `rake db:migrate` ใน Rails)
- รัน console (หรือที่เรียกว่า REPL shell) เพื่อรัน code ตามอำเภอใจหรือตรวจสอบ model ของ app กับ database จริง ภาษาส่วนใหญ่มี REPL โดยการรัน interpreter โดยไม่มี argument (เช่น `python` หรือ `perl`) หรือในบางกรณีมีคำสั่งแยก (เช่น `irb` สำหรับ Ruby, `rails console` สำหรับ Rails)
- รัน one-time script ที่ commit ไว้ใน repo ของ app (เช่น `php scripts/fix_bad_records.php`)

One-off admin process ควรรันใน environment ที่เหมือนกันกับ long-running process ปกติของ app โดยรันต่อ release ใดๆ ใช้ codebase และ config เดียวกันกับ process ใดๆ ที่รันต่อ release นั้น admin code ต้องส่งมาพร้อม application code เพื่อหลีกเลี่ยงปัญหา synchronization

เทคนิค dependency isolation เดิมควรใช้กับ process type ทั้งหมด ตัวอย่างเช่น ถ้า Ruby web process ใช้คำสั่ง `bundle exec thin start` ดังนั้น database migration ควรใช้ `bundle exec rake db:migrate` ในทำนองเดียวกัน Python program ที่ใช้ Virtualenv ควรใช้ vendored `bin/python` สำหรับการรันทั้ง Tornado webserver และ `manage.py` admin process ใดๆ

Twelve-factor สนับสนุนภาษาที่มี REPL shell พร้อมใช้งานและสามารถรัน one-off script ได้ง่าย ใน local deploy นักพัฒนา invoke one-off admin process โดยตรงด้วย shell command ภายใน checkout directory ของ app ใน production deploy นักพัฒนาสามารถใช้ ssh หรือ remote command execution mechanism อื่นที่ execution environment ของ deploy นั้นมีให้ เพื่อรัน process ดังกล่าว

```bash
# ตัวอย่าง one-off admin process

# Database migration
$ bundle exec rake db:migrate          # Ruby/Rails
$ python manage.py migrate            # Python/Django

# Interactive REPL
$ rails console                       # Rails
$ python manage.py shell              # Django

# One-time fix script
$ bundle exec ruby scripts/fix.rb     # Ruby
$ python scripts/fix_bad_records.py   # Python
```

---

## สรุป

| Factor | หลักการ | เป้าหมาย |
|---|---|---|
| **I. Codebase** | หนึ่ง repo, หลาย deploy | Traceability และ consistency |
| **II. Dependencies** | ประกาศและแยกอย่างชัดเจน | Reproducible environment |
| **III. Config** | เก็บใน environment variable | Portability และ security |
| **IV. Backing Services** | มองเป็น attached resource | Loose coupling |
| **V. Build/Release/Run** | แยก stage อย่างเคร่งครัด | Rollback และ predictability |
| **VI. Processes** | Stateless, share-nothing | Horizontal scaling |
| **VII. Port Binding** | Self-contained, bind port | Service composability |
| **VIII. Concurrency** | Scale ผ่าน process model | Elastic scaling |
| **IX. Disposability** | Start เร็ว, stop graceful | Robustness และ agility |
| **X. Dev/Prod Parity** | Environment ใกล้เคียงกัน | Continuous deployment |
| **XI. Logs** | Event stream ไปยัง stdout | Observability |
| **XII. Admin Processes** | One-off process ใน codebase | Consistency และ safety |

---

*แปลจาก https://12factor.net/ · เขียนโดย Adam Wiggins · อัปเดตล่าสุดปี 2017 · © Salesforce, Inc.*