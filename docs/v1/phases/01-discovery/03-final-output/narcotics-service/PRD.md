# Narcotics Service - PRD

---

**Document Type**: REQUIRED   
**Document Status**: Draft   
**Version**: 1.0   
**Last Updated**: 2026-03-02   
**Owner**: Product Manager   
**Stakeholders**: Engineering Lead, Design Lead, Business Lead, AI Agent Protocol

---

## 1. Overview

### 1.1 Problem Statement

**Real World Problems in Forensic Science:**

1. **ความยากในการจำแนกยาเสพติด**: เจ้าหน้าที่นิติวิทยาศาสตร์มักพบยาเสพติดในรูปแบบต่างๆ (เม็ด, ผง, ของเหลว) และต้องใช้ความเชี่ยวชาญสูงในการระบุประเภทยา การเปรียบเทียบกับตัวอย่างใน Catalog แบบเดิมใช้เวลานานและไม่แม่นยำ

2. **ความไม่สามารถเชื่อมโยงคดี**: ไม่มีระบบ Big Data ที่ช่วยหาความเชื่อมโยงระหว่างยาเสพติดที่พบในคดีต่างๆ ทำให้ไม่สามารถติดตามแหล่งที่มาหรือเครือข่ายค้ายาได้

### 1.2 Goals

1. สร้างระบบ Catalog สำหรับยาเสพติดที่มีภาพตัวอย่างและ Vector Embeddings สำหรับ Similarity Search
2. พัฒนา AI-powered Similarity Search ที่ช่วยเจ้าหน้าที่ค้นหายาเสพติดที่คล้ายกันจาก Catalog โดยอัตโนมัติ
3. บันทึกประวัติการค้นพบยาเสพติดเพื่อสร้าง Big Data และหาความเชื่อมโยงในอนาคต
4. มีระบบ Verification โดย Domain Expert เพื่อให้ข้อมูลถูกต้องตามมาตรฐานศาล

### 1.3 Scope

**In Scope:**
- Narcotic Catalog Management (CRUD)
- Similarity Search ด้วย Vector Embeddings
- ExhibitDiscovery Integration (บันทึกการค้นพบ)
- Domain Expert Verification
- Admin Interface สำหรับจัดการ Catalog

**Out of Scope:**
- DrugForm เป็น Catalog แยก (เก็บเป็น Text Field ก่อน)
- ChemicalCompound เป็น Catalog แยก (เก็บเป็น Text ก่อน)
- Real-time Drug Detection (ใช้ Catalog-based Similarity Search)
- Integration กับระบบภายนอก

### 1.4 Key Differences from Firearms Service

| Aspect | Firearms | Narcotics |
|--------|----------|-----------|
| AI Approach | Classification (Brand → Model) | Similarity Search |
| Catalog | Brand + Model + Firearm | Narcotic + Example Images + Vectors |
| Multi-step | 2 Steps (Brand, then Model) | 1 Step (Similarity Search) |
| Multiple Selection | 1 Candidate | 1 Candidate (แต่เก็บเป็น JSON) |
| Images | Reference URLs | Embedded with Vectors |

---

## 2. User Roles

เหมือนกับ Firearms Service:

| Role | Description |
|------|-------------|
| **Field Officer** | เจ้าหน้าที่ภาคสนาม - บันทึกการค้นพบยาเสพติด, ถ่ายภาพ, ใช้ AI ค้นหา |
| **Domain Expert** | ผู้เชี่ยวชาญด้านยาเสพติด - ตรวจสอบและยืนยันข้อมูล (Verification) |
| **Senior Officer** | ผู้บังคับบัญชา - จัดการ Catalog, ดู Statistics |
| **System Admin** | ผู้ดูแลระบบ - จัดการ Users, Roles |

---

## 3. User Flows

### 3.1 Catalog Management Flow (Admin/Senior Officer)

```
[Admin] 
  → View Narcotic Catalog 
  → Add New Narcotic 
    → Enter: drug_type, drug_legal_category, characteristics, consumption_method, effect
    → Upload Example Images (1+)
    → System generates Vector Embeddings for each image
    → Save to Catalog
  → Edit/Delete Narcotic
```

### 3.2 Discovery Flow (Field Officer)

```
[Field Officer]
  → Select "Narcotics" Track
  → Upload 1 Image
    → AI Service generates Vector for the image
    → Compare Vector vs Catalog (Similarity Search)
    → Return top_k candidates with similarity scores
  → User selects 1 Candidate (or "Unknown")
  → Enter additional details (weight, etc.)
  → Save as ExhibitDiscovery (Status: "pending_verification")
```

### 3.3 Verification Flow (Domain Expert)

```
[Domain Expert]
  → View Pending Narcotic Discoveries
  → Review AI Result + User Selection
  → Verify: 
    - Correct → Status: "verified"
    - Incorrect → Reject with notes → Status: "rejected"
```

---

## 4. Features

### FR-NARC-001: View Narcotic Catalog
**Priority:** High  
**Description:** แสดงรายการยาเสพติดทั้งหมดใน Catalog พร้อมข้อมูลและภาพตัวอย่าง

### FR-NARC-002: Search Narcotic Catalog
**Priority:** High  
**Description:** ค้นหายาเสพติดใน Catalog ด้วย drug_type, drug_legal_category, characteristics

### FR-NARC-003: Create Narcotic Catalog Entry
**Priority:** High  
**Description:** สร้างรายการยาเสพติดใหม่ใน Catalog พร้อม Upload ภาพตัวอย่าง

### FR-NARC-004: Update Narcotic Catalog Entry
**Priority:** Medium  
**Description:** แก้ไขข้อมูลยาเสพติดใน Catalog

### FR-NARC-005: Delete Narcotic Catalog Entry
**Priority:** Medium  
**Description:** ลบรายการยาเสพติดใน Catalog

### FR-NARC-006: Similarity Search
**Priority:** High  
**Description:** ค้นหายาเสพติดที่คล้ายกันจาก Catalog โดยใช้ Vector Similarity (Threshold ≥ 0.7)

### FR-NARC-007: Record Narcotic Discovery
**Priority:** High  
**Description:** บันทึกการค้นพบยาเสพติดพร้อมข้อมูล AI Result (Candidates, Selected, Vectors)

### FR-NARC-008: Verify Narcotic Discovery
**Priority:** High  
**Description:** Domain Expert ตรวจสอบและยืนยันการค้นพบยาเสพติด

### FR-NARC-009: View Narcotic Discovery History
**Priority:** Medium  
**Description:** แสดงประวัติการค้นพบยาเสพติดทั้งหมด

### FR-NARC-010: Manage Example Images
**Priority:** Medium  
**Description:** จัดการภาพตัวอย่างใน Catalog (เพิ่ม, ลบ, ตั้ง priority)

---

## 5. Technical Architecture

### 5.1 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                    Backend API (FastAPI)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Narcotic   │  │   Exhibit   │  │    Auth     │          │
│  │  Controller │  │  Controller │  │  Controller │          │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘          │
└─────────┼─────────────────┼──────────────────────────────────┘
          │                 │
┌─────────▼─────────────────▼──────────────────────────────────┐
│                    AI Service API                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Vector Service  │  │ Narcotic Model  │                   │
│  │ (Embedding)     │  │ (narcotic_model.pt)                │
│  └────────┬────────┘  └─────────────────┘                   │
└───────────┼─────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│               PostgreSQL + pgvector                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  narcotics    │  │narcotic_example│  │narcotics_image│   │
│  │               │  │    _images     │  │    _vectors   │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Key Design Decisions

1. **Database-per-Service**: Narcotics ใช้ Database แยกจาก Services อื่น
2. **Vector Storage**: ใช้ pgvector ใน PostgreSQL สำหรับเก็บ Image Embeddings
3. **Catalog Images with Vectors**: ภาพตัวอย่างใน Catalog จะมี Vector Embeddings ด้วย (ต่างจาก Firearms ที่มีแค่ Reference URLs)
4. **JSON for Candidates**: เก็บ AI Candidates เป็น JSON (เหมือน Firearms) เพื่อความยืดหยุ่น

---

## 6. API Design

### 6.1 Catalog Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/narcotics` | List all narcotics in catalog |
| GET | `/v1/narcotics/{id}` | Get narcotic details with images |
| POST | `/v1/narcotics` | Create new narcotic catalog entry |
| PUT | `/v1/narcotics/{id}` | Update narcotic |
| DELETE | `/v1/narcotics/{id}` | Delete narcotic |
| POST | `/v1/narcotics/{id}/images` | Add example image to catalog |
| DELETE | `/v1/narcotics/{id}/images/{image_id}` | Delete example image |

### 6.2 Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/narcotics/search-similar` | Similarity search (AI) |
| POST | `/v1/narcotic-discoveries` | Save discovery (from Exhibit) |
| GET | `/v1/narcotic-discoveries` | List discoveries |
| GET | `/v1/narcotic-discoveries/{id}` | Get discovery details |
| PUT | `/v1/narcotic-discoveries/{id}/verify` | Verify discovery |

### 6.3 Example Request/Response

**POST `/v1/narcotics/search-similar`**

Request:
```json
{
  "images": ["base64_image1", "base64_image2"],
  "top_k": 5,
  "similarity_threshold": 0.7
}
```

Response:
```json
{
  "candidates": [
    {
      "narcotic_id": 1,
      "drug_type": "ยาบ้า",
      "drug_legal_category": "Category 1",
      "similarity": 0.85,
      "matched_image_url": "https://..."
    },
    {
      "narcotic_id": 2,
      "drug_type": "ไอซ์",
      "drug_legal_category": "Category 1",
      "similarity": 0.72,
      "matched_image_url": "https://..."
    }
  ]
}
```

---

## 7. Data Models

### 7.1 Core Entities

```typescript
// Catalog: Narcotic
interface Narcotic {
  id: UUID;
  drug_type: string;              // ประเภทที่เรียกกัน (เช่น "ยาบ้า", "ไอซ์")
  drug_legal_category: string;    // ประเภททางกฎหมาย (เช่น "Category 1")
  characteristics: string;         // ลักษณะทั่วไป
  consumption_method: string;      // วิธีใช้ (สูบ, ฉีด, กิน)
  effect: string;                  // ฤทธิ์ยา
  chemical_compound: string;       // สารเคมี (Text)
  example_images: NarcoticExampleImage[];
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at?: Timestamp;
}

// Catalog: Example Image with Vector
interface NarcoticExampleImage {
  id: UUID;
  narcotic_id: UUID;               // FK to Narcotic
  image_url: string;
  image_vector: number[];         // 16000-dim vector
  description?: string;
  priority?: number;              // ลำดับความสำคัญ
  image_type?: string;            // ประเภทภาพ
  created_at: Timestamp;
}

// Discovery: เชื่อมกับ Exhibit Service
interface NarcoticDiscovery {
  id: UUID;
  exhibit_id: UUID;               // FK to Exhibit (ExhibitDiscovery)
  narcotic_id?: UUID;             // FK to Narcotic Catalog (ถ้าเลือกจาก Catalog)
  is_unknown: boolean;            // true = ไม่พบใน Catalog
  
  // AI Result (JSON)
  ai_result: {
    candidates: {
      narcotic_id: UUID;
      drug_type: string;
      similarity: number;
      matched_image_url: string;
    }[];
    selected_narcotic_id?: UUID;
    selected_is_unknown: boolean;
    vectors: string[];            // Base64 vectors ของภาพที่ upload
  };
  
  // Discovery Details (ข้อมูลจริงที่พบ)
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

### 7.2 Database Schema (SQL)

```sql
-- Catalog: Narcotics
CREATE TABLE narcotics (
  id SERIAL PRIMARY KEY,
  drug_type VARCHAR(100) NOT NULL,
  drug_legal_category VARCHAR(100),
  characteristics TEXT,
  consumption_method VARCHAR(100),
  effect TEXT,
  chemical_compound TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Catalog: Example Images with Vectors
CREATE TABLE narcotic_example_images (
  id SERIAL PRIMARY KEY,
  narcotic_id INTEGER REFERENCES narcotics(id) ON DELETE CASCADE,
  image_url TEXT,
  image_vector VECTOR(16000),    -- pgvector
  description TEXT,
  priority INTEGER,
  image_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discovery: เก็บใน Exhibit Service เป็น JSON ใน ai_result field
-- (เชื่อมผ่าน exhibit_id ไปยัง ExhibitDiscovery)
```

---

## 8. AI Integration

### 8.1 Similarity Search Flow

```
1. User uploads 1 image (from discovery scene)
2. AI Service generates Vector for the image
   - Use: narcotic_model.pt + vector_service
3. Compare the vector against Catalog vectors
   - Use: pgvector cosine similarity (<=>)
   - Filter: similarity >= 0.7
4. Return top_k candidates with scores
5. User selects 1 candidate (or "Unknown")
6. Save to ExhibitDiscovery with:
   - All candidates (JSON)
   - Selected ID (or is_unknown = true)
   - Vector (for future analysis)
```

### 8.2 Key Differences from Firearms

| Aspect | Firearms | Narcotics |
|--------|----------|-----------|
| AI Output | Brand + Model Classification | Similarity Scores |
| Catalog Images | Brand/Model references | Images + Vectors (1+ per narcotic) |
| Discovery Image | 1 image | 1 image |
| Unknown Option | Yes | Yes |
| Verification | Yes | Yes |

---

## 9. Security & Roles

### 9.1 Permission Matrix

| Feature | Field Officer | Domain Expert | Senior Officer | Admin |
|---------|--------------|---------------|----------------|-------|
| View Catalog | ✅ | ✅ | ✅ | ✅ |
| Search Catalog | ✅ | ✅ | ✅ | ✅ |
| Create Catalog | ❌ | ❌ | ✅ | ✅ |
| Update Catalog | ❌ | ❌ | ✅ | ✅ |
| Delete Catalog | ❌ | ❌ | ❌ | ✅ |
| Similarity Search | ✅ | ✅ | ✅ | ✅ |
| Record Discovery | ✅ | ✅ | ✅ | ✅ |
| Verify Discovery | ❌ | ✅ | ✅ | ✅ |
| View Statistics | ❌ | ✅ | ✅ | ✅ |

---

## 10. Future Ideas (Not in Scope)

### 10.1 DrugForm Catalog
**Description:** แยก DrugForm เป็น Catalog แยก (เม็ด, ผง, ของเหลว, ใบ, ยาง) แทนที่จะเก็บเป็น Text Field

**Benefits:**
- มาตรฐานกว่า
- สามารถเก็บข้อมูลเพิ่มเติมต่อรูปแบบได้
- Admin จัดการง่ายกว่า

### 10.2 ChemicalCompound Catalog
**Description:** แยก ChemicalCompound เป็น Catalog สำหรับสารเคมี (MDMA, Methamphetamine, Caffeine, etc.)

**Benefits:**
- จัดการสารเคมีที่พบในยาเสพติดได้ละเอียดกว่า
- สามารถเก็บ Percentage ได้
- มีประโยชน์ในการวิเคราะห์แหล่งที่มา

### 10.3 Advanced AI Classification
**Description:** เพิ่ม AI Classification นอกเหนือจาก Similarity Search

**Benefits:**
- ระบุประเภทยาโดยตรง (ไม่ต้องเทียบกับ Catalog)
- ทำงานได้แม้ไม่มี Catalog
- ช่วยในกรณี Unknown

---

## 11. Timeline

**สัปดาห์นี้:**

| Week | Tasks |
|------|-------|
| 1 | Database Schema Design + Migration |
| 2 | Catalog CRUD APIs + Image Upload |
| 3 | Similarity Search Integration |
| 4 | Discovery Flow + Verification |
| 5 | Frontend Integration |
| 6 | Testing + Bug Fixes |

---

## 12. Acceptance Criteria

1. **Catalog Management:** Admin สามารถ Create/Read/Update/Delete รายการยาเสพติดใน Catalog พร้อมภาพตัวอย่างได้
2. **Similarity Search:** เมื่อ Upload ภาพ ระบบต้องค้นหายาเสพติดที่คล้ายกันจาก Catalog ด้วย Vector Similarity ≥ 0.7
3. **Multiple Images:** รองรับการ Upload หลายภาพพร้อมกัน และเทียบแต่ละภาพกับ Catalog
4. **Discovery Recording:** บันทึกการค้นพบพร้อม AI Result (Candidates JSON, Selected, Vectors)
5. **Verification:** Domain Expert สามารถ Verify/Reject การค้นพบได้
6. **Integration:** เชื่อมต่อกับ Exhibit Service ผ่าน ExhibitDiscovery ได้
7. **Roles:** ควบคุมการเข้าถึงตาม Role ที่กำหนด

---

## 13. References

- [PRD Template](../PRD-TEMPLATE.md)
- [Exhibit Service PRD](../exhibit-service/PRD.md)
- [Firearm Service PRD](../firearm-service/PRD.md)
- [Portability Requirements](../portability-requirements.md)