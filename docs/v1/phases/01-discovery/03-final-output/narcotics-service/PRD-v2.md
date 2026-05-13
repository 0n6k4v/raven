# PRD: Narcotics Service

---

**Document Type**: REQUIRED   
**Document Status**: Draft   
**Version**: 1.0   
**Last Updated**: 2026-03-02   
**Owner**: Product Manager   
**Stakeholders**: Engineering Lead, Design Lead, Business Lead, AI Agent Protocol

---

## ✅ PRD Review Checklist
> ตรวจสอบก่อน submit — ย้ายมาไว้ต้นเอกสารเพื่อให้เห็นก่อนเสมอ

### Phase 1: Discovery Requirements
- [x] Vision Statement ชัดเจนใน 1-2 ประโยค
- [x] Problem Statement มี research backing อ้างอิงได้
- [x] Value Proposition ระบุครบทุก segment
- [x] Personas มี pain points และ goals ชัดเจน
- [x] Success Metrics วัดผลได้จริง มีค่า baseline
- [x] Non-scope ระบุชัดเจนว่าไม่ทำอะไรใน v1 นี้
- [x] Assumptions ถูก list ออกมาและแยกจาก Risks
- [x] Constraints ครบทั้ง Timeline, Team, Technical

### Phase 2: Content Quality
- [x] มีข้อมูลครบทั้ง 3 contexts (Business, User, Technical)
- [x] Acceptance Criteria วัดผลได้จริง ไม่กำกวม
- [x] Business Rules อยู่ในรูป Human-Readable ตาม Enterprise Grade
- [x] AI สามารถ parse และ generate code ได้จากเอกสารนี้

### Phase 3: Traceability
- [x] Requirements เชื่อมโยงไปยัง source documents
- [x] Research Backing table ครบถ้วน
- [x] Decision Log บันทึก decisions ที่สำคัญแล้ว
- [x] Reference Documents ครบถ้วน

---

## 1. Executive Summary (For Stakeholders)

### 1.1 Vision Statement
สร้างระบบจัดการยาเสพติดด้วย AI-powered Similarity Search ที่ช่วยเจ้าหน้าที่นิติวิทยาศาสตร์จำแนกและบันทึกการค้นพบยาเสพติดได้อย่างแม่นยำและมีมาตรฐาน ช่วยอำนวยความสะดวกในการสืบสวน

### 1.2 Problem Statement
เจ้าหน้าที่นิติวิทยาศาสตร์ประสบปัญหาในการจำแนกยาเสพติดเนื่องจาก
1. ยาเสพติดมีหลายรูปแบบ (เม็ด, ผง, ของเหลว) แต่การจำแนกแบบ Manual มีข้อจำกัดทำให้การจำแนกใช้เวลานานและหาความเชื่อมโยงได้ยาก
2. ไม่มีระบบ Big Data สำหรับเชื่อมโยงคดียาเสพติดที่พบในหลายพื้นที่
3. ข้อมูลที่บันทึกไม่สมบูรณ์และไม่เป็นมาตรฐานกลางสำหรับใช้งานร่วมกัน

#### Research Backing
| Source Type | Source | Key Finding | Date |
|-------------|--------|-------------|------|
| Codebase Analysis | backend-api/app/models/narcotic_model.py | มีโครงสร้างข้อมูลยาเสพติดแล้ว | 2026-03-02 |
| Codebase Analysis | ai-service-api/app/services/narcotic_service.py | มี AI vector embedding สำหรับยาเสพติด | 2026-03-02 |
| Feature Requirements | ideation.md | มี 2 Tracks: อาวุธปืน และ ยาเสพติด | 2026-03-02 |

### 1.3 Proposed Solution
ระบบ Narcotics Service ที่ใช้ AI Similarity Search เปรียบเทียบภาพยาเสพติดกับ Catalog พร้อมทั้งบันทึกการค้นพบเข้ากับ ExhibitDiscovery และมีการยืนยันโดย Domain Expert

### 1.4 Value Proposition by Segment

| Segment | Pain Points | Value Proposition | Key Benefit |
|---------|-------------|-------------------|-------------|
| Field Officer | ต้องใช้เวลานานในการจำแนกยาเสพติด | AI Similarity Search ช่วยหายาที่คล้ายกันจาก Catalog อัตโนมัติ | บันทึกการค้นพบได้รวดเร็ว |
| Domain Expert | ต้องตรวจสอบข้อมูลยาเสพติดที่ไม่สมบูรณ์ | ระบบ Verification ช่วยยืนยันความถูกต้อง | ข้อมูลมีมาตรฐานสำหรับศาล |
| Senior Officer | ไม่สามารถเชื่อมโยงคดียาเสพติดในพื้นที่ต่างๆ | Big Data บันทึกการค้นพบทุกครั้ง | หาความเชื่อมโยงในอนาคตได้ |

### 1.5 Success Metrics

| Metric | Baseline | Target | Timeline | Measurement Method |
|--------|----------|--------|----------|--------------------|
| จำนวนการค้นพบยาเสพติดที่บันทึก | 0 | 100+ รายการ/เดือน | 3 เดือน | System Analytics |
| Similarity Search Accuracy | N/A | >85% | 3 เดือน | User Feedback |
| Verification Completion Rate | N/A | >90% | 3 เดือน | System Analytics |
| Catalog Coverage (ยาเสพติดที่มีในระบบ) | 0 | 50+ รายการ | 6 เดือน | Database Count |

### 1.6 Strategic Alignment
- **Product Roadmap**: Raven Phase 2 - Narcotics Track
- **Technical Vision**: Database-per-Service Microservices Architecture
- **Architecture Decisions**: ใช้ pgvector สำหรับ Similarity Search

---

## 2. Scope (For All Stakeholders)

> Section นี้สำคัญพอๆ กับ functional requirements — ต้องระบุให้ชัดก่อนเริ่ม build

### 2.1 In Scope (v1)
- [x] Narcotic Catalog Management (CRUD)
- [x] Example Images with Vector Embeddings ใน Catalog
- [x] Similarity Search ด้วย Vector (threshold ≥ 0.7)
- [x] Multiple Image Upload สำหรับ Catalog (1+ images per narcotic entry)
- [x] ExhibitDiscovery Integration สำหรับบันทึกการค้นพบ
- [x] Domain Expert Verification Workflow
- [x] Admin Interface สำหรับจัดการ Catalog

### 2.2 Non-Scope (v1)
- [ ] DrugForm เป็น Catalog แยก (เก็บเป็น Text Field ก่อน)
- [ ] ChemicalCompound เป็น Catalog แยก (เก็บเป็น Text ก่อน)
- [ ] AI Classification นอกเหนือจาก Similarity Search
- [ ] Integration กับระบบภายนอก (เช่น ตำรวจ, ศาล)
- [ ] Real-time Drug Detection

### 2.3 Assumptions

| ID | Assumption | Confidence | Validation Method | Owner |
|----|------------|------------|-------------------|-------|
| A-001 | มี AI model สำหรับสร้าง Vector embedding ของภาพยาเสพติดแล้ว | High | ตรวจสอบจาก ai-service-api | AI Team |
| A-002 | pgvector ถูกติดตั้งและพร้อมใช้งาน | High | ตรวจสอบจาก db-service | DevOps |
| A-003 | ผู้ใช้จะ upload ภาพคุณภาพดีพอสำหรับ AI วิเคราะห์ | Medium | User training | Product |

### 2.4 Constraints

| ID | Type | Description | Source | Impact |
|----|------|-------------|--------|--------|
| CON-001 | Technical | ใช้ PostgreSQL + pgvector สำหรับ Vector storage | Existing Architecture | ต้องใช้ Similarity Search |
| CON-002 | Technical | Vector dimension ต้องตรงกับ AI model | ai-service-api | 16000-dim vectors |
| CON-003 | Timeline | สัปดาห์นี้ | User Request | 6-week delivery |

---

## 3. User Context (For UX + Dev + AI)

### 3.1 Target Users

| Persona | ประเภทผู้ใช้ | ลักษณะทั่วไป | ปัญหาที่พบ | เป้าหมาย |
|---------|-----------|------------|----------|---------|
| Field Officer | เจ้าหน้าที่นิติวิทยาศาสตร์ภาคสนาม | - อายุ 25-45 ปี<br>- ความชำนาญเทคโนโลยีปานกลาง<br>- ทำงานภาคสนาม<br>- ใช้มือถือบันทึกข้อมูล<br>- ถ่ายภาพวัตถุพยาน | - ใช้เวลานานในการจำแนกยาเสพติด<br>- ไม่แน่ใจว่าจำแนกถูกต้อง<br>- ต้องบันทึกข้อมูลหลายระบบ | - บันทึกการค้นพบได้รวดเร็ว<br>- ได้ข้อมูลที่ถูกต้องจาก AI<br>- มีหลักฐานที่ใช้ในศาลได้ |
| Domain Expert | ผู้เชี่ยวชาญด้านยาเสพติด | - อายุ 35-55 ปี<br>- ความชำนาญเทคโนโลยีปานกลาง<br>- ทำงานบน Desktop<br>- ตรวจสอบและยืนยันข้อมูลเป็นงานหลัก<br>- ออกตรวจสนามบางครั้ง | - ข้อมูลยาเสพติดไม่สมบูรณ์<br>- ต้องตรวจสอบหลายระบบ<br>- ไม่มีมาตรฐานข้อมูล | - ยืนยันข้อมูลได้รวดเร็ว<br>- มีข้อมูลมาตรฐานสำหรับศาล<br>- สามารถติดตามประวัติได้ |

### 3.2 Segment Pain Points Comparison

| Pain Point | Field Officer | Domain Expert | Senior Officer | Impact |
|------------|---------------|---------------|----------------|--------|
| จำแนกยาเสพติดยาก | ✅ มี | ✅ มี | ❌ ไม่มี | High |
| ข้อมูลไม่สมบูรณ์ | ✅ มี | ✅ มี | ✅ มี | High |
| ไม่เชื่อมโยงคดี | ❌ ไม่มี | ❌ ไม่มี | ✅ มี | Medium |
| ต้องใช้หลายระบบ | ✅ มี | ✅ มี | ❌ ไม่มี | Medium |

### 3.3 Use Cases by Persona

| Use Case ID | Use Case Name | Field Officer | Domain Expert | Senior Officer | Priority |
|-------------|---------------|---------------|---------------|---------------|----------|
| UC-NARC-001 | ค้นหายาเสพติดใน Catalog | ✅ | ✅ | ✅ | P0 |
| UC-NARC-002 | บันทึกการค้นพบยาเสพติด | ✅ | ❌ | ❌ | P0 |
| UC-NARC-003 | Similarity Search ด้วย AI | ✅ | ✅ | ✅ | P0 |
| UC-NARC-004 | ตรวจสอบและยืนยันการค้นพบ | ❌ | ✅ | ✅ | P0 |
| UC-NARC-005 | จัดการ Catalog ยาเสพติด | ❌ | ❌ | ✅ | P1 |
| UC-NARC-006 | ดูประวัติการค้นพบ | ✅ | ✅ | ✅ | P1 |

### 3.4 User Stories

**Format: Job Story**
> When [situation], I want to [motivation], so I can [expected outcome]

| ID | Persona | Job Story | Priority | AC Ref |
|----|---------|-----------|----------|--------|
| JS-NARC-001 | Field Officer | When I find drugs at a crime scene, I want to upload photos for AI analysis, so I can quickly identify the type of drug | P0 | AC-001 |
| JS-NARC-002 | Field Officer | When AI returns multiple candidates, I want to select the correct one or mark as unknown, so I can record accurate discovery | P0 | AC-002 |
| JS-NARC-003 | Domain Expert | When there are pending discoveries, I want to verify or reject them with notes, so I can ensure data accuracy for court | P0 | AC-003 |
| JS-NARC-004 | Senior Officer | When I need to manage the drug catalog, I want to add/edit/delete narcotic entries with images, so I can maintain accurate catalog for AI comparison | P1 | AC-004 |

### 3.5 User Journey

**Current State (As-Is):**
- Field Officer ถ่ายภาพ → ส่งให้ผู้เชี่ยวชาญ → รอผลวิเคราะห์ → บันทึกข้อมูล → ใช้เวลา 2-3 วัน

**Future State (To-Be):**
- Field Officer ถ่ายภาพ → AI Similarity Search (ไม่กี่วินาที) → เลือก Candidate → บันทึก → Domain Expert Verify → เสร็จใน 1 วัน

**Pain Points ที่แก้ใน v1:**
| Pain Point | Solution |
|------------|----------|
| ใช้เวลานานในการจำแนก | AI Similarity Search อัตโนมัติ |
| ข้อมูลไม่มาตรฐาน | Verification Workflow + Required Fields |
| ไม่เชื่อมโยงคดี | Big Data บันทึกทุกการค้นพบ |

---

## 4. Functional Requirements (For Dev + AI)

### 4.1 Feature Overview (จัดตาม Service Groups)

#### Narcotics Service

| Feature ID | Feature Name | คำอธิบาย | Dependencies | Complexity | Priority |
|------------|--------------|-----------|-------------|------------|----------|
| FR-NARC-001 | View Narcotic Catalog | แสดงรายการยาเสพติดทั้งหมดใน Catalog | None | Low | P0 |
| FR-NARC-002 | Search Narcotic Catalog | ค้นหายาเสพติดด้วย drug_type, drug_legal_category | None | Low | P0 |
| FR-NARC-003 | Create Narcotic Catalog | สร้างรายการยาเสพติดใหม่ + Upload ภาพตัวอย่าง | AI Service (Vector) | Medium | P0 |
| FR-NARC-004 | Update Narcotic Catalog | แก้ไขข้อมูลยาเสพติด | None | Low | P1 |
| FR-NARC-005 | Delete Narcotic Catalog | ลบรายการยาเสพติด | None | Low | P1 |
| FR-NARC-006 | Similarity Search | ค้นหายาเสพติดที่คล้ายกันด้วย Vector (threshold ≥ 0.7) | AI Service, pgvector | High | P0 |
| FR-NARC-007 | Record Discovery | บันทึกการค้นพบยาเสพติดพร้อม AI Result | Exhibit Service | Medium | P0 |
| FR-NARC-008 | Verify Discovery | Domain Expert ตรวจสอบและยืนยันการค้นพบ | None | Medium | P0 |
| FR-NARC-009 | View Discovery History | แสดงประวัติการค้นพบยาเสพติด | None | Low | P1 |
| FR-NARC-010 | Manage Example Images | จัดการภาพตัวอย่างใน Catalog | AI Service | Medium | P1 |

#### Exhibit Service (Integration)

| Feature ID | Feature Name | คำอธิบาย | Dependencies | Complexity | Priority |
|------------|--------------|-----------|-------------|------------|----------|
| FR-EXHIBITION-001 | Create ExhibitDiscovery (Narcotics) | สร้างการค้นพบยาเสพติดผ่าน ExhibitDiscovery | Narcotics Service | Medium | P0 |

### 4.2 Use Cases

#### UC-NARC-001: Similarity Search for Narcotics

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-NARC-001 |
| **Use Case Name** | ค้นหายาเสพติดที่คล้ายกันด้วย AI |
| **Goal** | หายาเสพติดที่คล้ายกับภาพที่ upload จาก Catalog |
| **Actor** | Field Officer, Domain Expert, Senior Officer |
| **Feature ID** | FR-NARC-006 |
| **Preconditions** | - มี Narcotic Catalog ที่มีภาพตัวอย่างและ Vectors - User login แล้ว |
| **Postconditions** | - แสดง candidates ที่มี similarity ≥ 0.7 |
| **Main Flow** | 1. User upload 1 image (จากการค้นพบ) 2. AI Service สร้าง Vector สำหรับภาพนั้น 3. ระบบเปรียบเทียบกับ Catalog Vectors 4. แสดง top_k candidates พร้อม similarity scores |
| **System Logic** | ใช้ pgvector cosine similarity (<=>) สำหรับเปรียบเทียบ vectors |
| **Edge Cases** | - ไม่มี candidate ที่ similarity ≥ 0.7 → แสดง "ไม่พบตัวที่คล้าย" - Upload ภาพไม่ valid → แสดง error - Vector generation failed → retry with error message |

---

#### UC-NARC-002: Record Narcotic Discovery

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-NARC-002 |
| **Use Case Name** | บันทึกการค้นพบยาเสพติด |
| **Goal** | บันทึกการค้นพบยาเสพติดพร้อมข้อมูล AI Result |
| **Actor** | Field Officer |
| **Feature ID** | FR-NARC-007 |
| **Preconditions** | - User login แล้วเป็น Field Officer - ผ่าน Similarity Search แล้ว |
| **Postconditions** | - สร้าง ExhibitDiscovery พร้อม ai_result JSON - Status = "pending_verification" |
| **Main Flow** | 1. User เลือก 1 Candidate (หรือ "Unknown") 2. User ใส่ข้อมูลเพิ่มเติม (weight, notes) 3. ระบบบันทึกลง ExhibitDiscovery 4. แสดงผลสำเร็จ |
| **System Logic** | - บันทึก candidates JSON (ทุกตัวที่ AI ส่งมา) - บันทึก selected_id หรือ is_unknown = true - บันทึก vectors ทั้งหมด (base64) |
| **Edge Cases** | - User ไม่เลือก Candidate → แสดง error - Network fail ขณะบันทึก → retry - Duplicate discovery → allow (คนละเวลา/สถานที่) |

---

#### UC-NARC-003: Verify Narcotic Discovery

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-NARC-003 |
| **Use Case Name** | ตรวจสอบและยืนยันการค้นพบยาเสพติด |
| **Goal** | Domain Expert ยืนยันความถูกต้องของการค้นพบ |
| **Actor** | Domain Expert, Senior Officer |
| **Feature ID** | FR-NARC-008 |
| **Preconditions** | - User login แล้วเป็น Domain Expert หรือ Senior Officer - มี pending discoveries |
| **Postconditions** | - Status เปลี่ยนเป็น "verified" หรือ "rejected" - บันทึก verified_by, verified_at, verification_notes |
| **Main Flow** | 1. Domain Expert ดูรายการ pending 2. ดู AI Result + User Selection + ข้อมูลเพิ่มเติม 3. เลือก Verify หรือ Reject 4. ใส่ notes (ถ้าต้องการ) 5. บันทึก |
| **System Logic** | - ถ้า Verify → status = "verified" - ถ้า Reject → status = "rejected" + notes |
| **Edge Cases** | - Verify ซ้ำ → แสดง error - Reject โดยไม่มี notes → allow - Network fail → retry |

---

### 4.3 Detailed Requirements

#### FR-NARC-006: Similarity Search
**Priority**: P0
**Owner**: AI Team + Backend Team

**Description**:
ค้นหายาเสพติดที่คล้ายกันจาก Catalog โดยใช้ Vector Similarity โดยมี threshold ที่ 0.7 ขึ้นไป

**Acceptance Criteria**:
- [ ] Catalog: รองรับการ upload 1+ images ต่อ 1 รายการยาเสพติด
- [ ] Discovery: รองรับการ upload 1 image ต่อ 1 การค้นพบ
- [ ] สร้าง Vector สำหรับภาพที่ upload
- [ ] เปรียบเทียบกับ Catalog Vectors ทั้งหมด
- [ ] แสดง candidates ที่มี similarity ≥ 0.7
- [ ] แสดง similarity score ในรูปแบบตัวเลข (0-1)
- [ ] ถ้าไม่มี candidate ให้แสดง "ไม่พบตัวที่คล้าย" พร้อม option "Unknown"
- [ ] Response time < 5 วินาทีสำหรับ 1 ภาพ

**Technical Notes** (สำหรับ Dev + AI Agents):
- API Endpoint: POST `/v1/narcotics/search-similar`
- Request Body:
```json
{
  "images": ["base64_image1", "base64_image2"],
  "top_k": 5,
  "similarity_threshold": 0.7
}
```
- Response:
```json
{
  "candidates": [
    {
      "narcotic_id": 1,
      "drug_type": "ยาบ้า",
      "drug_legal_category": "Category 1",
      "similarity": 0.85,
      "matched_image_url": "https://..."
    }
  ]
}
```
- ใช้ pgvector cosine similarity (`<=>`)
- Vector dimension: 16000

---

#### FR-NARC-007: Record Narcotic Discovery
**Priority**: P0
**Owner**: Backend Team

**Description**:
บันทึกการค้นพบยาเสพติดพร้อมข้อมูล AI Result (Candidates JSON, Selected ID, Vectors)

**Acceptance Criteria**:
- [ ] บันทึก selected_narcotic_id หรือ is_unknown = true
- [ ] บันทึก candidates JSON (ทุกตัวที่ AI ส่งมา)
- [ ] บันทึก vectors ทั้งหมดเป็น base64
- [ ] บันทึก weight_grams, notes
- [ ] สร้าง ExhibitDiscovery ใน Exhibit Service
- [ ] ตั้งค่า status = "pending_verification"
- [ ] บันทึก discovered_by (user_id)

**Technical Notes** (สำหรับ Dev + AI Agents):
- API Endpoint: POST `/v1/narcotic-discoveries`
- ผ่าน Exhibit Service (เหมือน Firearms)
- เก็บ ai_result เป็น JSONB ในฐานข้อมูล

---

#### FR-NARC-008: Verify Narcotic Discovery
**Priority**: P0
**Owner**: Backend Team

**Description**:
Domain Expert ตรวจสอบและยืนยันการค้นพบยาเสพติด

**Acceptance Criteria**:
- [ ] แสดงรายการ pending discoveries
- [ ] ดู AI Result + User Selection + ข้อมูลเพิ่มเติม
- [ ] Verify หรือ Reject ได้
- [ ] ใส่ verification_notes ได้
- [ ] บันทึก verified_by, verified_at
- [ ] เปลี่ยน status เป็น "verified" หรือ "rejected"

**Technical Notes** (สำหรับ Dev + AI Agents):
- API Endpoint: PUT `/v1/narcotic-discoveries/{id}/verify`
- Request Body:
```json
{
  "action": "verify" | "reject",
  "notes": "optional string"
}
```

---

### 4.4 Business Rules

> กฎเกณฑ์ทางธุรกิจที่ต้องปฏิบัติตาม จัดทำเป็นภาษาที่อ่านเข้าใจได้ง่ายสำหรับทุก Stakeholder
> จัดแบ่งตาม Service เพื่อให้ AI Agents สามารถ parse และ implement ได้ถูกต้อง

---

#### 4.4.1 General Business Rules

| Rule ID | Rule Name | Description | Severity |
|---------|------------|-------------|----------|
| BR-NARC-001 | Similarity Threshold | ต้องแสดงเฉพาะ candidates ที่มี similarity ≥ 0.7 | Blocking |
| BR-NARC-002 | Required Fields | drug_type และ drug_legal_category ต้องมีใน Catalog | Blocking |
| BR-NARC-003 | Image Required | ต้องมีภาพอย่างน้อย 1 ภาพใน Catalog สำหรับ Similarity Search | Warning |
| BR-NARC-004 | Unknown Selection | ถ้าไม่มี candidate ที่ similarity ≥ 0.7 ต้องแสดง "Unknown" ให้เลือก | Info |

---

#### 4.4.2 Narcotics Service Business Rules

##### BR-NARC-005: Catalog Image Upload

| Element | Description |
|---------|-------------|
| **Rule ID** | BR-NARC-005 |
| **Rule Name** | ภาพตัวอย่างใน Catalog ต้องมี Vector |
| **Description** | เมื่อ Admin upload ภาพตัวอย่างเข้า Catalog ระบบต้องสร้าง Vector Embeddings โดยอัตโนมัติ |
| **Condition** | Admin upload ภาพผ่าน API `/v1/narcotics/{id}/images` |
| **Action** | AI Service สร้าง vector และบันทึกลงฐานข้อมูลทันที |
| **Severity** | Blocking |

##### BR-NARC-006: Discovery Selection

| Element | Description |
|---------|-------------|
| **Rule ID** | BR-NARC-006 |
| **Rule Name** | ต้องเลือก Candidate หรือ Unknown |
| **Description** | เมื่อบันทึกการค้นพบ ต้องมีการเลือก Candidate หรือ "Unknown" |
| **Condition** | User submit discovery form |
| **Action** | ถ้าไม่เลือก → แสดง error "กรุณาเลือกยาเสพติดหรือ Unknown" |
| **Severity** | Blocking |

##### BR-NARC-007: Verification Authority

| Element | Description |
|---------|-------------|
| **Rule ID** | BR-NARC-007 |
| **Rule Name** | เฉพาะ Domain Expert ขึ้นไปเท่านั้นที่ Verify ได้ |
| **Description** | การ Verify การค้นพบต้องทำโดย Domain Expert หรือ Senior Officer เท่านั้น |
| **Condition** | User เรียก API verify |
| **Action** | ตรวจสอบ role ก่อน ถ้าไม่ใช่ → return 403 Forbidden |
| **Severity** | Blocking |

---

## 5. Non-Functional Requirements (For Dev + Architecture)

### 5.1 Performance
| Metric | Requirement | Measurement Tool |
|--------|-------------|------------------|
| Similarity Search Response | p95 < 5s | APM |
| Catalog List Response | p95 < 500ms | APM |
| Image Upload | < 10s per image | Manual |

### 5.2 Scalability
- รองรับ 100 concurrent users
- Catalog รองรับ 1000+ รายการยาเสพติด
- Vector storage รองรับ 10000+ images

### 5.3 Security & Compliance
- Authentication: JWT (เหมือน Auth Service)
- Role-based Access Control: Field Officer, Domain Expert, Senior Officer, Admin
- Data Encryption: at-rest และ in-transit
- PDPA Compliance: ข้อมูลยาเสพติดเป็นข้อมูลอ่อนไหว

### 5.4 Reliability
- Uptime: 99.5%
- Error rate: < 1%
- Recovery: RTO 4 hours, RPO 1 hour

### 5.5 Accessibility
- WCAG 2.1 AA
- Support สำหรับ Screen Reader

---

## 6. Acceptance Criteria (For QA + AI Testing)

### 6.1 Scenario-Based AC

**AC-001: Similarity Search - Happy Path**
```gherkin
Given มี Narcotic Catalog ที่มียาเสพติดอย่างน้อย 3 รายการ
And แต่ละรายการมีภาพตัวอย่างพร้อม Vector
When Field Officer upload ภาพยาบ้า 1 ภาพ
Then ระบบแสดง candidates ที่มี similarity ≥ 0.7
And แสดง drug_type และ similarity score
```

**AC-002: Record Discovery - Unknown**
```gherkin
Given Field Officer เรียก Similarity Search แล้วไม่พบ candidate
When Field Officer เลือก "Unknown"
And กรอก weight_grams = 500
And กดบันทึก
Then ระบบบันทึกเป็น ExhibitDiscovery พร้อม is_unknown = true
And Status = "pending_verification"
```

**AC-003: Verify Discovery**
```gherkin
Given Domain Expert เห็นรายการ pending discovery
When Domain Expert กด Verify
Then Status เปลี่ยนเป็น "verified"
And verified_by = Domain Expert ID
And verified_at = current timestamp
```

### 6.2 Edge Cases
| Case | Expected Behavior |
|------|-------------------|
| Upload ภาพไม่ valid | แสดง error message ชัดเจน |
| Vector generation fail | แสดง error + ให้ retry |
| Network fail ขณะบันทึก | เก็บ state ไว้ + retry |
| Verify ซ้ำ | แสดง error "Already verified" |
| ไม่มี candidate ≥ 0.7 | แสดง "ไม่พบตัวที่คล้าย" + Unknown |

---

## 7. UI/UX Specifications

### 7.1 Design Assets
- **Figma (Dev Mode)**: [URL]
- **Design System / Component Library**: [URL]
- **Responsive Breakpoints**: Mobile 375px | Tablet 768px | Desktop 1440px

### 7.2 Key Interactions

| State | Trigger | Behavior | Duration |
|-------|---------|----------|----------|
| Loading | Uploading image | Spinner animation | - |
| Success | Save completed | Toast notification | 3s |
| Error | API failed | Error message + retry button | - |

### 7.3 Copy & Content
```json
{
  "screens": {
    "catalog_list": {
      "title": "Catalog ยาเสพติด",
      "subtitle": "จัดการรายการยาเสพติดในระบบ",
      "primary_cta": "เพิ่มรายการใหม่",
      "search_placeholder": "ค้นหาด้วยชื่อหรือประเภท"
    },
    "similarity_search": {
      "title": "ค้นหายาเสพติด",
      "subtitle": "อัพโหลดภาพเพื่อค้นหาความคล้ายคลึง",
      "primary_cta": "ค้นหา",
      "no_result": "ไม่พบตัวที่คล้าย กรุณาเลือก Unknown"
    }
  }
}
```

---

## 8. Data Requirements

### 8.1 Data Models

```typescript
// Catalog: Narcotic
interface Narcotic {
  id: UUID;
  drug_type: string;              // ประเภทที่เรียกกัน (เช่น "ยาบ้า", "ไอซ์")
  drug_legal_category: string;    // ประเภททางกฎหมาย (เช่น "Category 1")
  characteristics: string;       // ลักษณะทั่วไป
  consumption_method: string;    // วิธีใช้ (สูบ, ฉีด, กิน)
  effect: string;                 // ฤทธิ์ยา
  chemical_compound: string;      // สารเคมี (Text)
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at?: Timestamp;
}

// Catalog: Example Image with Vector
interface NarcoticExampleImage {
  id: UUID;
  narcotic_id: UUID;
  image_url: string;
  image_vector: number[];         // 16000-dim vector
  description?: string;
  priority?: number;
  image_type?: string;
  created_at: Timestamp;
}

// Discovery: เชื่อมกับ Exhibit Service
interface NarcoticDiscovery {
  id: UUID;
  exhibit_id: UUID;
  narcotic_id?: UUID;
  is_unknown: boolean;
  
  ai_result: {
    candidates: {
      narcotic_id: UUID;
      drug_type: string;
      similarity: number;
      matched_image_url: string;
    }[];
    selected_narcotic_id?: UUID;
    selected_is_unknown: boolean;
    vectors: string[];
  };
  
  weight_grams?: number;
  discovered_at: Timestamp;
  discovered_by: UUID;
  status: "pending_verification" | "verified" | "rejected";
  verified_by?: UUID;
  verified_at?: Timestamp;
  verification_notes?: string;
  
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 8.2 Analytics & Tracking

| Event | Properties | Purpose |
|-------|------------|---------|
| similarity_search | user_id, image_count, result_count | วัดการใช้งาน AI |
| discovery_created | user_id, selected_narcotic_id, is_unknown | วัดการบันทึก |
| discovery_verified | verifier_id, status | วัดการ verify |

---

## 9. Technical Considerations

### 9.1 Architecture Overview

```
C4Context
    title System Context - Narcotics Service

    Person(field_officer, "Field Officer", "เจ้าหน้าที่นิติวิทยาศาสตร์ภาคสนาม")
    Person(domain_expert, "Domain Expert", "ผู้เชี่ยวชาญด้านยาเสพติด")
    Person(senior_officer, "Senior Officer", "ผู้บังคับบัญชา")

    System(narcotics_service, "Narcotics Service", "จัดการ Catalog + Similarity Search")
    System(exhibit_service, "Exhibit Service", "จัดการ ExhibitDiscovery")
    System(ai_service, "AI Service", "Vector Embedding + Model Inference")
    System(database, "PostgreSQL + pgvector", "Vector storage")

    Rel(field_officer, narcotics_service, "บันทึกการค้นพบ, ค้นหา")
    Rel(field_officer, ai_service, "AI Analysis")
    Rel(domain_expert, narcotics_service, "Verify")
    Rel(senior_officer, narcotics_service, "จัดการ Catalog")
    Rel(narcotics_service, exhibit_service, "บันทึก Discovery")
    Rel(narcotics_service, ai_service, "Vector generation")
    Rel(narcotics_service, database, "CRUD + Vector search")
```

### 9.2 Dependencies & Integrations
| System | Type | Risk Level | Fallback |
|--------|------|------------|----------|
| Exhibit Service | Internal | Medium | บันทึกใน Narcotics ก่อน |
| AI Service | Internal | High | แสดง error + ให้ retry |
| PostgreSQL + pgvector | Internal | High | ใช้ text search แทน |

### 9.3 Risks

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R-001 | Vector search performance ช้าเมื่อมีข้อมูลเยอะ | Medium | High | Index optimization + pagination | DevOps |
| R-002 | AI model ไม่ accurate | Medium | Medium | ใช้ threshold 0.7 + Unknown option | AI Team |
| R-003 | User upload ภาพคุณภาพต่ำ | High | Medium | เพิ่ม image validation + guidelines | Product |

---

## 10. Release Plan (For All Stakeholders)

### 10.1 Phases
| Phase | Scope | Timeline | Success Criteria |
|-------|-------|----------|------------------|
| Alpha | Internal testing | Week 1-2 | Zero critical bugs |
| Beta | Field Officers | Week 3-4 | 50+ discoveries recorded |
| GA | All users | Week 5-6 | 100+ discoveries, >90% verified |

### 10.2 Rollback Criteria
- Error rate > 5%
- Similarity Search p95 > 10s
- Critical security vulnerability

---

## 11. AI Collaboration Notes (For AI Agents)

### 11.1 Code Generation Standards
```yaml
standards:
  language: "Python"
  framework: "FastAPI"
  testing: "pytest"
  database: "PostgreSQL + pgvector"
```

### 11.2 API Conventions
- RESTful API with JSON
- JWT Authentication
- Role-based access control

### 11.3 Key Differences from Firearms
| Aspect | Firearms | Narcotics |
|--------|----------|-----------|
| AI Approach | Classification (Brand → Model) | Similarity Search |
| Catalog | Brand + Model + Firearm | Narcotic + Images + Vectors |
| Images | Reference URLs | Embedded with Vectors |
| Multiple Images | 1 image | 1+ images |

---

## References

- [PRD Template](../PRD-TEMPLATE.md)
- [Exhibit Service PRD](../exhibit-service/PRD.md)
- [Firearm Service PRD](../firearm-service/PRD.md)
- [Portability Requirements](../portability-requirements.md)