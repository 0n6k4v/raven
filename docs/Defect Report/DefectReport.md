# Defect Report & Task List: /evidenceProfile

**Last Updated By:** Kawee

**Last Updated At:** 14/11/2025 | 14:38

เอกสารนี้ใช้สำหรับติดตามข้อบกพร่อง (Defects) และงานที่ต้องปรับปรุง (Technical Tasks) สำหรับฟีเจอร์ `evidenceProfile` และส่วนที่เกี่ยวข้อง

---

## Priority / Status Guide

**คำอธิบายสั้น ๆ:** 

ตารางด้านล่างเป็นแนวทางมาตรฐานสำหรับจัดลำดับความสำคัญ (Priority) และสถานะงาน (Status) — พร้อมเวลาเป้าหมายการตอบกลับและการแก้ไขโดยประมาณ และตัวอย่างประกอบ

| Priority | รหัส | ผลกระทบ / ความรุนแรง | ความเร่งด่วน | เวลาเป้าหมายตอบกลับ | เวลาเป้าหมายแก้ไข (Resolution) | ตัวอย่าง |
|---|---:|---|---|---:|---:|---|
| Critical | P0 / Blocker | ระบบหลักล่มหรือข้อมูลเสียหาย กระทบผู้ใช้เป็นวงกว้าง | สูงสุด (Immediate) | 15–60 นาที | 4–24 ชั่วโมง (หรือ hotfix ทันที) | Production down, DB corruption, security breach |
| High | P1 / Major | ฟีเจอร์สำคัญใช้งานไม่ได้ ทำให้กระทบการทำงานของผู้ใช้หลายราย | สูง | 1–4 ชั่วโมง | 1–3 วัน (patch / release) | API หลักตอบ 500, ฟังก์ชันชำรุดที่มี workaround ยาก |
| Medium | P2 / Normal | ปัญหาที่ลดทอนประสบการณ์ แต่มี workaround | ปานกลาง | ภายใน 1 วันทำการ | 3–7 วัน หรือใน sprint ถัดไป | UI ไม่แสดงบางส่วน, ข้อมูลซ้อนทับใน edge case |
| Low | P3 / Minor | ข้อเสนอปรับปรุง, cosmetic หรือข้อผิดพลาดที่ไม่กระทบการใช้งาน | ต่ำ | 2–5 วันทำการ | ต่อไปใน release ปกติ / backlog | Typo, alignment, เพิ่ม tooltip, UX enhancement |

**สถานะ (Statuses) — Workflow แบบมาตรฐาน (ตาราง)**

| Status | ความหมาย | คำกระทำที่คาดหวัง / Notes |
|---|---|---|
| New / Open | รายงานใหม่ยังไม่ได้ triage | Assign owner, กำหนด Priority และระบุ Steps to reproduce |
| Triaged / Backlog | ผ่านการประเมินแล้ว ถูกจัดเข้ากลุ่ม backlog | ประเมิน effort, กำหนด milestone หรือ sprint |
| Accepted / Planned | รับงานแล้ว วางแผนจะทำใน sprint หรือ release ที่กำหนด | วางแผนงาน, ระบุ assignee และ due date |
| In Progress | กำลังพัฒนา / กำลังทำงาน | อัพเดตความคืบหน้าเป็นระยะ, เปิด PR เมื่อพร้อม |
| Blocked | งานหยุดเพราะ dependency หรือขาดข้อมูล | ระบุ blocker กับ owner ของ blocker และ dependency ที่ต้องแก้ |
| In Review / QA | ส่งให้ review หรือทดสอบ | Reviewer/QA ให้ feedback หรืออนุมัติสำหรับ release |
| Resolved / Ready for Release | แก้ไขเรียบร้อย ผ่าน QA รอรวมใน release | ระบุ PR/Build และแผน release |
| Done / Closed | ปิดงานแล้ว (deploy/merge เสร็จและยืนยันว่าไม่มีปัญหาซ้ำ) | บันทึกเวลาแก้ไขสุดท้ายและปิด ticket |

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

### ☐ `BUG-010`: [Major] Save action in `RecordBottomBar` fails (backend missing)

* **ID:** `BUG-010`
* **Status:** `Open`
* **Severity:** Major
* **Priority:** Medium
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/save-to-record` — frontend file `frontend/src/components/SaveToHistory/RecordBottomBar.jsx`
* **Steps to Reproduce (STR):**
    1. เปิดหน้า `/evidenceProfile/save-to-record`
    2. กรอกข้อมูลตำแหน่งหรือเลือกจากแผนที่ให้ครบตามที่ต้องการ
    3. กดปุ่ม `บันทึก` ด้านล่าง (RecordBottomBar)

* **Actual Result:**
    - ปุ่มตอบสนอง (UI state changes to saving) แต่การเรียก API ล้มเหลวหรือได้รับ response ว่า endpoint ยังไม่มี/ไม่ถูกต้อง — ข้อมูลไม่ถูกบันทึกลงระบบ

* **Expected Result:**
    - ปุ่มควรส่ง `FormData` ไปยัง endpoint backend (`POST /api/history`) และได้รับการตอบรับว่าบันทึกสำเร็จ จากนั้นนำผู้ใช้ไปยังหน้าประวัติพร้อมข้อความยืนยัน

* **Notes / Suggestions:**
    - ตรวจสอบว่า backend API สำหรับ `POST /api/history` ถูกพัฒนาและตอบรับ `multipart/form-data` ตามที่ `RecordBottomBar` ส่ง (ภาพ + metadata)
    - ตัว `RecordBottomBar` ใช้ `API_CONFIG.BASE_URL` + `ENDPOINTS.HISTORY` — จึงแนะนำให้ backend implement endpoint ที่สอดคล้องกับการเรียกนี้ หรือปรับค่า `API_CONFIG` ให้ชี้ไปยัง endpoint ที่มีอยู่
    - เพิ่ม unit/integration test ฝั่ง backend เพื่อยืนยันการรับ `image`, `subdistrict_id`, `latitude`, `longitude` และฟิลด์ที่จำเป็นอื่น ๆ

### ☐ `BUG-011`: [High] `POST /api/history` returns 500 Internal Server Error when saving from UI

* **ID:** `BUG-011`
* **Status:** `Open`
* **Severity:** High
* **Priority:** P1 / Major
* **Assignee:** `@TBD`
* **Location:** `/evidenceProfile/save-to-record` (frontend `RecordBottomBar.jsx`) and `backend-api` endpoint `POST /api/history`
* **Steps to Reproduce (STR):**
    1. Open `/evidenceProfile/save-to-record` in the browser.
    2. Fill required fields (select `subdistrict`, choose location on map, or allow geolocation).
    3. Click the `บันทึก` (Save) button in `RecordBottomBar`.
* **Actual Result:**
    - Browser Network: `POST http://localhost:8000/api/history 500 (Internal Server Error)`
    - Frontend console logs show: `installHook.js:1 [RecordBottomBar] Save history error: Internal server error Error: Internal server error`.
    - Backend log shows: `INFO:     172.18.0.1:38900 - "POST /api/history HTTP/1.1" 500 Internal Server Error` (no stack trace in logs captured here).
    - Data is not persisted; user sees save failure.
* **Expected Result:**
    - Backend responds with `200` (or `201`) and returns a `HistoryWithExhibit` JSON payload. Frontend navigates to `/history` with success popup.
* **Notes / Triage Suggestions:**
    - This is a runtime server error — likely causes to check:
      - Inspect backend container logs for traceback: `docker compose logs backend-api --tail 200` or view stdout where uvicorn prints the exception.
      - Reproduce with `curl` (multipart/form-data) to see server response body and headers.
      - Verify DB connectivity and migrations/schema (missing column or constraint can raise exceptions during insert).
      - Verify Cloudinary / upload helper config: `upload_image_to_cloudinary` is called after commit — if it raises unexpectedly it should be caught, but upstream errors during DB insert can cause 500.
      - Confirm authentication dependency `get_current_active_user_from_cookie` is returning a valid user; unexpected None/invalid types may lead to downstream errors.
      - In dev environment, enable detailed exception tracebacks to get the Python stack trace from uvicorn for faster triage.
    - Quick triage commands (PowerShell):
```powershell
# Tail backend logs (recent)
docker compose logs -f backend-api

# Rebuild & run backend to reproduce locally (if needed)
docker compose build backend-api
docker compose up -d backend-api
``` 
    - Reproduce with curl (no cookie):
```bash
curl -v -X POST "http://localhost:8000/api/history" \
  -F "subdistrict_id=123" \
  -F "latitude=13.7563" \
  -F "longitude=100.5018" \
  -F "image=@/path/to/evidence.jpg"
```
* **Next actions recommended:**
    1. Get a full traceback from backend logs and attach it here.
    2. If traceback points to DB/model validation, add input validation or adjust schema accordingly.
    3. If it's an authentication/cookie issue, check cookie domain/SameSite and ensure `credentials: 'include'` sends the cookie.
    4. Consider adding a temporary error message in the backend (dev only) to include exception text in the 500 response for quick debugging.


## 3. Resolved Defects

### ✅ `BUG-001`: [Blocker] Map/loading problem on SaveToHistory after granting geolocation — Resolved

* **ID:** `BUG-001`
* **Status:** `Resolved`
* **Severity:** Blocker
* **Priority:** High
* **Assignee:** `@Frontend`
* **Resolved By:** `@Kawee`
* **Resolved At:** 14/11/2025
* **Files changed:**
    - `frontend/src/pages/SaveToHistory.jsx`
    - `frontend/src/components/SaveToHistory/RecordMap.jsx`
    - `frontend/src/components/SaveToHistory/RecordTabBar.jsx`
    - `frontend/src/components/SaveToHistory/RecordBottomBar.jsx`
* **Location:** `/evidenceProfile/save-to-record` (frontend page `frontend/src/pages/SaveToHistory.jsx`)
* **Summary (was):** After granting geolocation permission the map showed "กำลังโหลดแผนที่" and got stuck; tiles and marker did not render even when coordinates were available.

* **Resolution Notes:**
    - Root cause: Duplicate geolocation requests and a remount loop caused by `coordinates` being included in a memo/dependency chain. The map component was being re-created while tiles were still loading, causing it to get stuck in an initializing state after permission was granted.
    - Fixes applied:
        1. Centralized geolocation in the page parent (`SaveToHistory.jsx`) and removed `navigator.geolocation` calls from the child `RecordMap` component to avoid duplicate requests.
        2. Added a guarded coordinates setter to update state only when latitude/longitude materially change (small epsilon), preventing unnecessary state churn.
        3. Removed `coordinates` from `useMemo`/layout dependency arrays to avoid remounting the map when coordinates update.
    - Result: Map initializes once and correctly displays tiles/marker after geolocation permission is granted. Inputs remain editable while geo data resolves.

---

### ✅ `BUG-008`: [Major] `SaveToHistory` (desktop) — Fixed

* **ID:** `BUG-008`
* **Status:** `Resolved`
* **Severity:** Major
* **Priority:** High
* **Assignee:** `@Frontend`
* **Resolved By:** `@Kawee`
* **Resolved At:** 11/14/2025
* **Location:** `/evidenceProfile/save-to-record` — frontend page `frontend/src/pages/SaveToHistory.jsx`

* **Summary (was):** On desktop the page showed only `RecordTabBar` and `RecordBottomBar`, the input form did not render.

* **Resolution Notes:**
    - Fixed rendering logic in `frontend/src/pages/SaveToHistory.jsx`:
        - `DesktopLayout` now always renders `LocationFormFields` immediately instead of showing a blocking "กำลังโหลดข้อมูล..." placeholder. This ensures inputs are visible while geo data is loading.
        - Enabled initial geolocation request on mount for desktop so reverse-geocode can auto-fill province/district/subdistrict/place when permission is granted.
    - Minor UI adjustments applied to related components for consistent layout:
        - `frontend/src/components/SaveToHistory/RecordTabBar.jsx` — added desktop bottom border for visual separation.
        - `frontend/src/components/SaveToHistory/RecordBottomBar.jsx` — added desktop top border to match TabBar.

* **Files changed (summary):**
    - `frontend/src/pages/SaveToHistory.jsx`
    - `frontend/src/components/SaveToHistory/RecordTabBar.jsx`
    - `frontend/src/components/SaveToHistory/RecordBottomBar.jsx`

* **Verification / Notes:**
    - Verified desktop layout now displays input form and allows auto-fill when geolocation permission is granted. If geolocation is denied, inputs remain available for manual entry.

### ✅ `BUG-009`: [Major] Map not interactive on SaveToHistory — Resolved

* **ID:** `BUG-009`
* **Status:** `Resolved`
* **Severity:** Major
* **Priority:** Medium
* **Assignee:** `@Frontend`
* **Resolved By:** `@Kawee`
* **Resolved At:** 14/11/2025
* **Files changed:**
    - `frontend/src/pages/SaveToHistory.jsx`
    - `frontend/src/components/SaveToHistory/RecordMap.jsx`
* **Location:** `/evidenceProfile/save-to-record` (frontend page `frontend/src/pages/SaveToHistory.jsx`)
* **Summary (was):** Map did not behave interactively: marker wasn't created/moved on coordinate changes, no pan/zoom to coordinates, and drag/click interactions didn't update parent coordinates reliably.

* **Resolution Notes:**
    - Centralized geolocation logic in the page parent (`SaveToHistory.jsx`) and removed duplicate geolocation calls from `RecordMap` to avoid remount loops.
    - Introduced a guarded coordinates setter (`setCoordinatesIfChanged`) to avoid noisy updates when coordinates only change minimally.
    - Updated `RecordMap` to react to parent-provided `coordinates`: it now creates a single draggable marker (using an inline SVG `divIcon`), moves the marker when coordinates change, and pans/zooms to the location. Map clicks and marker drag events call back to the parent to update coordinates and trigger reverse-geocoding.
    - Mobile modal flow: the modal map now shows a preview of the reverse-geocoded address and requires explicit confirmation to apply the address to the main form (prevents accidental auto-insert while allowing preview).

* **Result:** Map is interactive as expected: markers are created/moved, pan/zoom occur on coordinate updates, and user drag/click updates coordinates which then trigger reverse-geocoding to fill the form.


## 4. Document Methodology & References (อ้างอิงแนวทางการเขียนเอกสาร)

เอกสารนี้ถูกร่างขึ้นโดยอ้างอิงแนวทางปฏิบัติ (Best Practices) ที่เป็นมาตรฐานในอุตสาหกรรมซอฟต์แวร์ เพื่อให้ทั้งมนุษย์และ AI Agents สามารถอ่าน, แก้ไข และติดตามผลได้

* **[ISO/IEC/IEEE 29119-3](https://www.iso.org/standard/63683.html):**
    * **อิทธิพล:** ใช้เป็นมาตรฐานสากลในการกำหนด "โครงสร้างเนื้อหา" (Content Structure) ของ Defect Report (เช่น Unique ID, STR, Actual/Expected Results, Severity)
    * *(หมายเหตุ: มาตรฐาน ISO เป็นเอกสารที่ต้องชำระเงิน ลิงก์นี้จะนำไปสู่หน้ารายละเอียดและบทคัดย่อ)*

* **[Docs-as-Code Methodology](https://www.writethedocs.org/guide/docs-as-code/):**
    * **อิทธิพล:** ใช้เป็น "ปรัชญา" (Philosophy) ในการเลือกใช้รูปแบบ Markdown (Plain text) เพื่อให้สามารถจัดเก็บใน Git, ทำ Version Control, และ Review ได้เหมือนโค้ด

* **[Issue Tracker Best Practices (Jira & GitHub)](https://www.atlassian.com/collaboration/jira-software/project-management/bug-tracking):**
    * **อิทธิพล:** ใช้เป็น "รูปแบบฟิลด์" (Field Schema) ที่อ้างอิงจากเครื่องมือ Issue Tracker ที่ใช้กันอย่างแพร่หลาย (เช่น `Status`, `Assignee`, `Priority`) เพื่อให้เกิดความคุ้นเคย
    * **อ่านเพิ่มเติม:** [GitHub - Mastering Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)