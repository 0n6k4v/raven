# Defect Report & Task List: /evidenceProfile

**Last Updated By:** Ong

**Last Updated At:** 11/11/2025 | 18:42

เอกสารนี้ใช้สำหรับติดตามข้อบกพร่อง (Defects) และงานที่ต้องปรับปรุง (Technical Tasks) สำหรับฟีเจอร์ `evidenceProfile` และส่วนที่เกี่ยวข้อง

---

## 1. Technical Tasks & Suggestions (Optimization)

### ☐ `TASK-001`: [Optimization] ปรับปรุงประสิทธิภาพการสลับ Tab ด้วย React 19.2 `<Activity />`

* **ID:** `TASK-001`
* **Status:** `To Do`
* **Priority:** Medium
* **Assignee:** `@TechLead`
* **Location:** `/evidenceProfile` (all tabs)
* **Description:**
    ปัจจุบัน การสลับ Tab ภายใน `/evidenceProfile` (โดยเฉพาะการสลับไปยัง `/evidenceProfile/history`) ทำให้เกิดการโหลดข้อมูลใหม่ทุกครั้ง (re-fetch/re-render) ซึ่งส่งผลต่อประสิทธิภาพและประสบการณ์ของผู้ใช้ (ดู `BUG-006` ประกอบ)
* **Suggestion:**
    พิจารณานำฟีเจอร์ `<Activity />` ที่เพิ่งเปิดตัวใน React 19.2 มาใช้ เพื่อจัดการสถานะ (state) ของ Tab ที่ไม่ได้ใช้งาน (inactive) ให้คงอยู่ และกลับมาทำงานต่อได้ทันทีเมื่อถูกเรียกใช้ ซึ่งจะช่วยแก้ปัญหาการโหลดใหม่ซ้ำซ้อน
* **Reference:**
    * React 19.2 Blog: `https://react.dev/blog/2025/10/01/react-19-2`

### ☐ `TASK-002`: [UX] เพิ่ม skeleton loading บนหน้า `/home` ด้วย Tailwind `animate-pulse`

* **ID:** `TASK-002`
* **Status:** `To Do`
* **Priority:** Medium
* **Assignee:** `@Frontend`
* **Location:** `/home`
* **Description:**
    เพิ่ม "skeleton loading components" เพื่อแสดง placeholder ของเนื้อหาขณะรอ API ตอบกลับ (แทนการแสดง spinner เดี่ยวหรือพื้นที่ว่าง)
* **Suggestion:**
    - ใช้ Tailwind `animate-pulse` ร่วมกับสีพื้นหลังแบบ `bg-gray-100`/`bg-gray-200` เพื่อสร้าง skeleton blocks
    - สร้าง reusable component เช่น `SkeletonCard` และนำไปใช้ใน list/grid ที่หน้า `/home`
    - ตรวจสอบให้แน่ใจว่า layout ของ skeleton มีขนาดและช่องว่างเท่ากับคอนเทนต์จริง เพื่อลด layout shift
* **Reference:**
    * Tailwind CSS Animation docs: `https://tailwindcss.com/docs/animation`


---

## 2. Active Defects (Bugs)

### ☐ `BUG-001`: [Blocker] Infinite update loop ในหน้า /save-to-record

* **ID:** `BUG-001`
* **Status:** `Open`
* **Severity:** Blocker
* **Priority:** High
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/save-to-record`
* **Steps to Reproduce (STR):**
    1.  ไปที่หน้า `/evidenceProfile/save-to-record`
    2.  สังเกตช่อง "จังหวัด" (Province) ที่ดึงข้อมูลจากพิกัด (Coordinates)
* **Actual Result:**
    ช่อง "จังหวัด" มีการอัปเดตค่าซ้ำๆ ตลอดเวลาไม่ยอมหยุด (Infinite update loop) คาดว่าเกิดจาก `useEffect` dependency ที่ไม่ถูกต้อง ส่งผลให้เกิดการ re-render และอาจเรียก API ซ้ำๆ
* **Expected Result:**
    การดึงข้อมูลจังหวัดจากพิกัดควรเกิดขึ้นเพียงครั้งเดียว (หรือเมื่อพิกัดต้นทางเปลี่ยน) และค่าต้องนิ่ง

### ☐ `BUG-002`: [Critical] หน้า /history/detail ไม่แสดงข้อมูล

* **ID:** `BUG-002`
* **Status:** `Open`
* **Severity:** Critical
* **Priority:** High
* **Assignee:** `@TBD`
* **Location:** `/history/detail`
* **Steps to Reproduce (STR):**
    1.  ไปที่ `/evidenceProfile/history`
    2.  คลิกเลือกดูประวัติรายการใดก็ได้ เพื่อไปยัง `/history/detail`
* **Actual Result:**
    หน้าเว็บ `/history/detail` โหลดขึ้นมา แต่ไม่ดึงข้อมูลประวัติของรายการที่เลือกมาแสดงผล (หน้าว่างเปล่า หรือแสดง Template)
* **Expected Result:**
    หน้าเว็บต้องแสดงรายละเอียดทั้งหมดของวัตถุพยานในประวัติที่เลือก

### ☐ `BUG-003`: [Critical] State loss เมื่อย้อนกลับจาก /history/detail

* **ID:** `BUG-003`
* **Status:** `Open`
* **Severity:** Critical
* **Priority:** High
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/history`, `/history/detail`
* **Steps to Reproduce (STR):**
    1.  ไปที่ `/evidenceProfile/history` และรอให้ข้อมูลโหลด
    2.  คลิกดูรายการประวัติ (ไปยัง `/history/detail`)
    3.  ใช้ปุ่ม "Back" ของเบราว์เซอร์เพื่อย้อนกลับมายัง `/evidenceProfile/history`
* **Actual Result:**
    ข้อมูลในตารางประวัติที่ `/evidenceProfile/history` หายไปทั้งหมด (List ว่าง) ผู้ใช้ต้องกด Refresh หรือสลับ Tab ใหม่เพื่อโหลดข้อมูล
* **Expected Result:**
    เมื่อกดย้อนกลับ หน้ารายการประวัติควรคงสถานะเดิม (Retain state) หรืออย่างน้อยที่สุดคือต้องโหลดข้อมูลกลับมาอัตโนมัติ (การใช้ `<Activity />` ใน `TASK-001` อาจช่วยแก้ปัญหานี้)

### ☐ `BUG-004`: [Major] ปุ่ม "Save รูปภาพ" ใช้งานไม่ได้

* **ID:** `BUG-004`
* **Status:** `Open`
* **Severity:** Major
* **Priority:** Medium
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile`
* **Steps to Reproduce (STR):**
    1.  ไปที่ `/evidenceProfile`
    2.  คลิกที่ปุ่ม "Save รูปภาพ"
* **Actual Result:**
    ไม่มีอะไรเกิดขึ้น (No action) ปุ่มไม่ทำงาน
* **Expected Result:**
    ระบบควรเริ่มกระบวนการบันทึกรูปภาพ

### ☐ `BUG-005`: [Major] Filter ใน /history ใช้งานไม่ได้

* **ID:** `BUG-005`
* **Status:** `Open`
* **Severity:** Major
* **Priority:** Medium
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/history`
* **Steps to Reproduce (STR):**
    1.  ไปที่แท็บ `/evidenceProfile/history`
    2.  ลองใช้ Filter (เช่น Search, Date range, Type)
* **Actual Result:**
    หน้าจอแสดงผล Filter (UI) แต่เมื่อเลือกหรือกรอกข้อมูล ฟังก์ชันการกรองไม่ทำงาน รายการที่แสดงผลไม่เปลี่ยนแปลง
* **Expected Result:**
    รายการประวัติต้องถูกกรองตามเงื่อนไขที่ผู้ใช้เลือก

### ☐ `BUG-006`: [Major] Icon ในแท็บ /map ไม่โหลด

* **ID:** `BUG-006`
* **Status:** `Open`
* **Severity:** Major
* **Priority:** Medium
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/map`
* **Steps to Reproduce (STR):**
    1.  ไปที่ `/evidenceProfile`
    2.  สลับไปแท็บ `/map`
* **Actual Result:**
    Icon ต่างๆ บนแผนที่ (เช่น Map pins, UI controls) ไม่แสดงผล หรือแสดงเป็นไอคอนเสีย (Broken image)
* **Expected Result:**
    Icon ทั้งหมดต้องแสดงผลอย่างถูกต้อง

### ☐ `BUG-007`: [Minor] Fullscreen Gallery Background ดำทึบ

* **ID:** `BUG-007`
* **Status:** `Open`
* **Severity:** Minor (UI/UX)
* **Priority:** Low
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/gallery`
* **Steps to Reproduce (STR):**
    1.  ไปที่แท็บ `/evidenceProfile/gallery`
    2.  คลิกดู "ภาพถ่าย" แบบ Fullscreen
    3.  (ตรวจสอบเช่นกัน) คลิกดู "ภาพเปรียบเทียบจากคลัง" แบบ Fullscreen
* **Actual Result:**
    พื้นหลัง (Backdrop/Overlay) ของโหมด Fullscreen เป็นสีดำทึบ (`#000000`) ทำให้ดูไม่สวยงาม
* **Expected Result:**
    พื้นหลังควรเป็นสีดำแบบกึ่งโปร่งแสง (Semi-transparent) เช่น `rgba(0, 0, 0, 0.8)` เพื่อให้ดูนุ่มนวลและรับรู้ว่ามี Context อยู่ด้านหลัง

---

### ☐ `BUG-008`: [Major] `SaveToHistory` (desktop) แสดงผลเฉพาะ `RecordTabBar` และ `RecordBottomBar`

* **ID:** `BUG-008`
* **Status:** `Open`
* **Severity:** Major
* **Priority:** High
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/save-to-record` — frontend page `frontend/src/pages/SaveToHistory.jsx`
* **Steps to Reproduce (STR):**
    1. เปิดแอปบนเครื่องเดสก์ท็อป (หน้าจอขนาด >= `md` breakpoint)
    2. ไปที่หน้า `SaveToHistory` (เมนูหรือเส้นทาง `/evidenceProfile/save-to-record`)
    3. สังเกตว่าหน้าจอแสดงผลเฉพาะ `RecordTabBar` ด้านบน และ `RecordBottomBar` ด้านล่าง เท่านั้น

* **Actual Result:**
    - บนเดสก์ท็อป ฟอร์มอินพุต (เช่น `จังหวัด`, `เขต/อำเภอ`, `แขวง/ตำบล`, `สถานที่`, `ถนน` ฯลฯ) ไม่แสดงขึ้น — เหลือเพียง `RecordTabBar` และ `RecordBottomBar` ทำให้ผู้ใช้ไม่สามารถกรอกข้อมูลได้

* **Expected Result:**
    - หน้า `SaveToHistory` ควรแสดงฟอร์มอินพุตทั้งหมดเช่นเดียวกับบนมือถือ รวมทั้ง `LocationFormFields`, รายการ `province/district/subdistrict` และปุ่มยืนยัน/บันทึก

* **Notes / Triage hints:**
    - เกี่ยวข้องกับไฟล์: `frontend/src/pages/SaveToHistory.jsx` (ดู `DesktopLayout`, `MobileLayout`, และ `LocationFormFields` ที่ประกาศภายในไฟล์)
    - ตรวจสอบเงื่อนไขการเรนเดอร์และคลาส CSS ที่ใช้ซ่อน/แสดงเลย์เอาต์ (เช่น `hidden md:flex` บน container ที่ห่อ `DesktopLayout`) และค่าพร็อพ `loading` / `geo.loading` ที่อาจปิดการแสดงผลฟอร์ม
    - ตรวจสอบว่า `DesktopLayout` ถูก mount และมีเนื้อหา (ไม่ถูกปิดด้วย CSS height/overflow หรือ z-index) และว่า `props.loading` ถูกตั้งค่าไม่ถูกต้องทำให้แสดง placeholder เท่านั้น


## 3. Document Methodology & References (อ้างอิงแนวทางการเขียนเอกสาร)

เอกสารนี้ถูกร่างขึ้นโดยอ้างอิงแนวทางปฏิบัติ (Best Practices) ที่เป็นมาตรฐานในอุตสาหกรรมซอฟต์แวร์ เพื่อให้ทั้งมนุษย์และ AI Agents สามารถอ่าน, แก้ไข และติดตามผลได้

* **[ISO/IEC/IEEE 29119-3](https://www.iso.org/standard/63683.html):**
    * **อิทธิพล:** ใช้เป็นมาตรฐานสากลในการกำหนด "โครงสร้างเนื้อหา" (Content Structure) ของ Defect Report (เช่น Unique ID, STR, Actual/Expected Results, Severity)
    * *(หมายเหตุ: มาตรฐาน ISO เป็นเอกสารที่ต้องชำระเงิน ลิงก์นี้จะนำไปสู่หน้ารายละเอียดและบทคัดย่อ)*

* **[Docs-as-Code Methodology](https://www.writethedocs.org/guide/docs-as-code/):**
    * **อิทธิพล:** ใช้เป็น "ปรัชญา" (Philosophy) ในการเลือกใช้รูปแบบ Markdown (Plain text) เพื่อให้สามารถจัดเก็บใน Git, ทำ Version Control, และ Review ได้เหมือนโค้ด

* **[Issue Tracker Best Practices (Jira & GitHub)](https://www.atlassian.com/collaboration/jira-software/project-management/bug-tracking):**
    * **อิทธิพล:** ใช้เป็น "รูปแบบฟิลด์" (Field Schema) ที่อ้างอิงจากเครื่องมือ Issue Tracker ที่ใช้กันอย่างแพร่หลาย (เช่น `Status`, `Assignee`, `Priority`) เพื่อให้เกิดความคุ้นเคย
    * **อ่านเพิ่มเติม:** [GitHub - Mastering Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)