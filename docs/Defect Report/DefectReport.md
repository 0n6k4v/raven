# Defect Report & Task List: /evidenceProfile

**Last Updated By:** Kawee

**Last Updated At:** 20/11/2025 | 0:08

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

### ☐ `TASK-003`: [UX / Mobile] ปรับปรุงการแสดงผลไฟล์ `UserProfile.jsx` บน Mobile

* **ID:** `TASK-003`
* **Status:** `To Do`
* **Priority:** Medium
* **Assignee:** `@Frontend`
* **Location:** `frontend/src/pages/Admin/SuperAdmin/UserProfile.jsx`
* **Description:**
    ปรับปรุงมุมมองโปรไฟล์ผู้ใช้บนมือถือให้ใช้งานสะดวกและอ่านง่ายขึ้น โดยคำนึงถึงการจัดวาง (layout), การตัดคำและการแสดงผลของอีเมล์/ชื่อที่ยาว รวมถึง touch targets ของปุ่มต่าง ๆ
* **Changes / Suggestions:**
    - ลดขนาด avatar บนหน้าจอมือถือเป็น `w-24 h-24` และเก็บ `w-28 h-28` บนหน้าจอขนาดเล็กขึ้นไป
    - เพิ่ม margin (`mx-3 my-4`) และลด padding บางส่วน (`px-4 py-5`) เพื่อไม่ให้ UI ชิดขอบจอ
    - แปลงแผนผังข้อมูลเป็น `grid grid-cols-1 sm:grid-cols-2` เพื่อให้ข้อมูลล้นได้อย่างเป็นระเบียบ
    - ปรับให้ `email` และตัวหนังสือยาวมี `break-words` และ `max-w-[65%]` เพื่อไม่ให้หลุดขอบจอ
    - เพิ่ม `aria-label` และ `focus` styles เพื่อรองรับการเข้าถึงและขนาด touch target
* **Files changed (planned):** `frontend/src/pages/Admin/SuperAdmin/UserProfile.jsx`
* **To verify:**
    1. เปิดหน้า `/user-profile/:id` บนมือถือหรือใน responsive mode (mobile width)
    2. ตรวจสอบว่า avatar, ชื่อ, อีเมล์, และฟิลด์ต่าง ๆ ไม่ล้นออกขอบ และข้อความยาวจะตัด/wrap ถูกต้อง
    3. ตรวจสอบ touch target ของปุ่มดูภาพเต็ม และปุ่มย้อนกลับว่ากดง่าย

### ☐ `TASK-004`: [UX / Mobile] ปรับปรุงการแสดงผลไฟล์ `UserManagement.jsx` บน Mobile

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

```powershell
# Tail backend logs (recent)
docker compose logs -f backend-api

# Rebuild & run backend to reproduce locally (if needed)
docker compose build backend-api
docker compose up -d backend-api
``` 


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

### ✅ `BUG-010`: [Major] Save action in `RecordBottomBar` fails — Resolved

* **ID:** `BUG-010`
* **Status:** `Resolved`
* **Severity:** Major
* **Priority:** Medium
* **Assignee:** `@Frontend`, `@Backend`
* **Resolved By:** `@Kawee`
* **Resolved At:** 20/11/2025
* **Location:** `/evidenceProfile/save-to-record` — frontend file `frontend/src/components/SaveToHistory/RecordBottomBar.jsx`
* **Files changed:**
    - `frontend/src/components/SaveToHistory/RecordBottomBar.jsx` — ensured proper FormData key names, `credentials: 'include'`, improved validation and error handling
    - `backend-api/app/routes/history.py` — implemented `POST /history` endpoint and centralized request error handling
    - `backend-api/app/controllers/history_controller.py` — implemented `create_history`, validations, coordinate handling, DB commit flow, and cloudinary image upload
    - `backend-api/app/schemas/history_schema.py` — added validators for date/time and AI confidence fields
    - `backend-api/app/config/cloudinary_config.py` — updated `upload_image_to_cloudinary` to accept `UploadFile` and return secure URL
* **Summary (was):** Save button in the frontend didn't result in a persisted history record because backend endpoint or handling was missing / incompatible.

* **Resolution Notes:**
    - Implemented `POST /api/history` endpoint to accept `multipart/form-data` containing `image` and metadata.
    - Added defensive server-side validation for required fields (subdistrict_id, latitude, longitude) and numeric casting for latitude/longitude & AI confidence.
    - Cloudinary upload is now integrated and wrapped in a try/catch so that upload failures don't crash the whole request.
    - Updated frontend `RecordBottomBar.jsx` FormData builder to align with backend schema and to always send `image` as a File when available.
    - Added better error handling (error message extraction) and success navigation in the frontend.
* **Result / Verification:**
    - Frontend `RecordBottomBar` sends a `POST /api/history` request with `multipart/form-data` and `credentials: include`.
    - Verified network call returns `201 Created` and the record appears in DB with `photo_url` set to Cloudinary secure URL.
    - UI navigates to `/history` with success popup.

### ✅ `BUG-011`: [High] `POST /api/history` returns 500 Internal Server Error when saving from UI — Resolved

* **ID:** `BUG-011`
* **Status:** `Resolved`
* **Severity:** High
* **Priority:** P1 / Major
* **Assignee:** `@Backend`
* **Resolved By:** `@Kawee`
* **Resolved At:** 20/11/2025
* **Location:** `/evidenceProfile/save-to-record` (frontend `RecordBottomBar.jsx`) and `backend-api` endpoint `POST /api/history`
* **Files changed:**
    - `backend-api/app/routes/history.py` — added `handle_exceptions` wrapper and `POST /history` route using Pydantic models
    - `backend-api/app/controllers/history_controller.py` — improved error handling, coordinate validation, commit/rollback flow, and prevented unhandled exceptions from leaking as 500s
    - `backend-api/app/schemas/history_schema.py` — reinforced field validators for `discovery_date`, `discovery_time`, and `ai_confidence` shape
    - `frontend/src/components/SaveToHistory/RecordBottomBar.jsx` — validation and better error handling to prevent invalid payloads from reaching server
* **Summary (was):** Saving a new history record produced a 500 Internal Server Error in some scenarios (e.g., invalid payload, missing fields, cloudinary errors), leaving the user without feedback and without a saved record.

* **Resolution Notes:**
    - Added explicit validation and checks on the backend controller to verify fields (e.g., coordinates numeric, latitude/longitude within bounds) and to convert types safely.
    - Cleaned up error handling in `create_history` with structured exception catching and improved logs to include tracebacks (dev environment) while returning friendly 4xx errors for client-side input issues.
    - Wrapped cloudinary uploads in a try/catch; if the upload fails, a warning is logged and the request still returns success if the DB record persisted, or returns suitable error details.
    - Fixed a missing/incorrect required-fields check (previously enforced purely optional fields); backend now only enforces required fields correctly.
    - Adjusted the frontend validation to avoid malformed requests (e.g., ensure `ai_confidence` exists or is allowed to be omitted per schema) and to display human-friendly error messages.
* **Result / Verification:**
    - Reproduced saving flow using `curl` and via the UI: `POST /api/history` now returns `201` with JSON payload or `400` with a descriptive error for invalid input instead of 500.
    - Backend logs contain stacktrace information when exceptions occur in dev mode, improving triage, and non-fatal errors (like image upload fail) are logged but do not cause 500.
    - Validation checks prevent previously malformed requests from making it to DB code that raised uncaught exceptions.

* **Next actions recommended:**
    1. Get a full traceback from backend logs and attach it here for future triage (dev environment should capture stack trace).
    2. Add unit/integration tests for `POST /api/history` including multipart upload and field validation cases (success, missing required fields, invalid coordinates, cloudinary upload failure).
    3. If an authentication/cookie issue recurs, validate cookie domain/SameSite and ensure `credentials: 'include'` is used consistently in frontend requests.
    4. Consider adding an incident-level monitor/alert for recurring 500 errors on `/api/history` to detect regressions early.


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