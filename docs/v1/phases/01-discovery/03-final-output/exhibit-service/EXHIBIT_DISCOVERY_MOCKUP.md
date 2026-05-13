# ExhibitDiscovery Model Mockup

## Database Schema

```sql
-- Exhibit Table (Catalog)
CREATE TABLE exhibits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100),      -- 'firearm', 'narcotic'
    subcategory VARCHAR(100),   -- 'pistol', 'rifle', 'methamphetamine'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- ExhibitDiscovery Table (บันทึกการค้นพบวัตถุพยาน)
CREATE TABLE exhibit_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exhibit_id UUID NOT NULL REFERENCES exhibits(id),
    
    -- Discovery Time
    discovered_date DATE NOT NULL,
    discovered_time TIME,
    discovered_by VARCHAR(20) NOT NULL REFERENCES users(user_id),
    
    -- Location (อ้างอิง Location Service)
    subdistrict_id INTEGER REFERENCES subdistricts(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS Point
    
    -- AI Analysis Result
    ai_confidence DECIMAL(5,2),  -- 0-100
    ai_result JSONB,             -- ผลจาก AI Service
    
    -- Verification Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'rejected', 'corrected')),
    verified_by VARCHAR(20) REFERENCES users(user_id),
    verified_at TIMESTAMP,
    verification_note TEXT,
    
    -- Discovery Details
    photo_url TEXT,
    quantity DECIMAL(10,2),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    modified_at TIMESTAMP DEFAULT NOW(),
    modified_by VARCHAR(20) REFERENCES users(user_id)
);

-- Indexes
CREATE INDEX idx_exhibit_discoveries_exhibit_id ON exhibit_discoveries(exhibit_id);
CREATE INDEX idx_exhibit_discoveries_status ON exhibit_discoveries(status);
CREATE INDEX idx_exhibit_discoveries_discovered_by ON exhibit_discoveries(discovered_by);
CREATE INDEX idx_exhibit_discoveries_location ON exhibit_discoveries USING GIST(location);
```

---

## Example Data Flow

### Scenario: Field Officer พบปืน Glock G19 ที่กรุงเทพ

**Step 1: User ถ่ายภาพและอัปโหลด**
```json
POST /v1/exhibits/upload
{
  "images": ["file.jpg"],
  "exhibit_type_hint": "firearm"
}

Response:
{
  "upload_id": "uuid-upload-001",
  "image_urls": ["https://cdn.example.com/exhibits/uuid-upload-001.jpg"],
  "status": "uploaded"
}
```

**Step 2: Exhibit Service เรียก AI Service**
```json
POST /v1/ai/analyze (internal)
{
  "image_url": "https://cdn.example.com/exhibits/uuid-upload-001.jpg",
  "analysis_type": "firearm"
}

Response from AI Service:
{
  "analysis_id": "uuid-ai-001",
  "candidates": [
    {
      "brand": "Glock",
      "model": "G19",
      "confidence": 0.95,
      "firearm_id": "uuid-glock-g19"  -- อ้างอิง Firearm Service
    },
    {
      "brand": "Glock", 
      "model": "G17",
      "confidence": 0.78,
      "firearm_id": "uuid-glock-g17"
    }
  ]
}
```

**Step 3: Exhibit Service สร้าง Exhibit (ถ้ายังไม่มี)**
```sql
-- ตรวจสอบว่ามี Glock G19 ในระบบหรือยัง
-- ถ้ามีแล้ว ใช้ ID เดิม
-- ถ้ายังไม่มี สร้างใหม่

INSERT INTO exhibits (id, category, subcategory)
VALUES ('uuid-exhibit-glock-g19', 'firearm', 'pistol');
```

**Step 4: User เลือก Candidate และบันทึก ExhibitDiscovery**
```json
POST /v1/exhibit-discoveries
{
  "exhibit_id": "uuid-exhibit-glock-g19",
  "discovered_date": "2026-03-01",
  "discovered_time": "14:30:00",
  "subdistrict_id": 123,  -- อ้างอิง Location Service
  "latitude": 13.7563,
  "longitude": 100.5018,
  "ai_analysis": {
    "analysis_id": "uuid-ai-001",
    "selected_candidate": {
      "firearm_id": "uuid-glock-g19",
      "confidence": 0.95
    }
  },
  "photo_url": "https://cdn.example.com/exhibits/uuid-upload-001.jpg",
  "notes": "พบในที่เกิดเหตุ คดีขโมยร้านทอง"
}

Response:
{
  "discovery_id": "uuid-discovery-001",
  "exhibit_id": "uuid-exhibit-glock-g19",
  "status": "pending",
  "message": "บันทึกสำเร็จ รอ Domain Expert ยืนยัน"
}
```

**Step 5: ExhibitDiscovery ถูกบันทึกลง Database**
```sql
INSERT INTO exhibit_discoveries (
    id, exhibit_id, discovered_date, discovered_time, discovered_by,
    subdistrict_id, location, ai_confidence, ai_result, status, 
    photo_url, notes, created_at
) VALUES (
    'uuid-discovery-001',
    'uuid-exhibit-glock-g19',
    '2026-03-01',
    '14:30:00',
    'officer-001',
    123,
    ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326),
    95.00,
    '{"analysis_id": "uuid-ai-001", "selected_candidate": {"firearm_id": "uuid-glock-g19", "confidence": 0.95}}'::jsonb,
    'pending',
    'https://cdn.example.com/exhibits/uuid-upload-001.jpg',
    'พบในที่เกิดเหตุ คดีขโมยร้านทอง',
    NOW()
);
```

**Step 5.5: โครงสร้าง ai_result (JSON)**

```json
{
  "analysis_id": "uuid-ai-001",
  "analysis_type": "firearm",
  "image_url": "https://cdn.example.com/exhibits/uuid-upload-001.jpg",
  "requested_at": "2026-03-01T14:30:00Z",
  "completed_at": "2026-03-01T14:30:15Z",
  
  "candidates": [
    {
      "rank": 1,
      "confidence": 0.95,
      "firearm_id": "uuid-glock-g19",
      "brand": "Glock",
      "model": "G19",
      "mechanism": "Semi-automatic",
      "caliber": "9mm",
      "reference_images": [
        "https://cdn.example.com/firearms/glock-g19-001.jpg"
      ]
    },
    {
      "rank": 2,
      "confidence": 0.78,
      "firearm_id": "uuid-glock-g17",
      "brand": "Glock",
      "model": "G17",
      "mechanism": "Semi-automatic",
      "caliber": "9mm",
      "reference_images": [
        "https://cdn.example.com/firearms/glock-g17-001.jpg"
      ]
    }
  ],
  
  "selected_candidate": {
    "rank": 1,
    "firearm_id": "uuid-glock-g19",
    "confidence": 0.95,
    "selected_by": "officer-001",
    "selected_at": "2026-03-01T14:35:00Z"
  },
  
  "segmentation": {
    "enabled": true,
    "segmented_image_url": "https://cdn.example.com/exhibits/uuid-upload-001-segmented.jpg",
    "bounding_box": {
      "x": 120,
      "y": 80,
      "width": 400,
      "height": 300
    }
  },
  
  "raw_model_output": {
    "model_version": "firearm-v2.1",
    "inference_time_ms": 1250,
    "detection_confidence": 0.98
  }
}
```

---

## Domain Expert Verification Flow

**Step 6: Domain Expert ตรวจสอบ**
```json
GET /v1/exhibit-discoveries?status=pending

Response:
{
  "exhibit_discoveries": [
    {
      "discovery_id": "uuid-discovery-001",
      "exhibit": {
        "id": "uuid-exhibit-glock-g19",
        "category": "firearm",
        "firearm_details": {  -- ดึงจาก Firearm Service
          "brand": "Glock",
          "model": "G19",
          "mechanism": "Semi-automatic"
        }
      },
      "discovered_at": "2026-03-01 14:30:00",
      "discovered_by": "officer-001",
      "location": {
        "province": "Bangkok",
        "district": "Pathum Wan",
        "subdistrict": "Rong Mueang"
      },
      "ai_result": {
        "candidates": [...],
        "selected_confidence": 0.95
      },
      "photo_url": "https://cdn.example.com/exhibits/uuid-upload-001.jpg",
      "notes": "พบในที่เกิดเหตุ คดีขโมยร้านทอง"
    }
  ]
}
```

**Step 7: Domain Expert ยืนยันหรือแก้ไข**
```json
PATCH /v1/exhibit-discoveries/uuid-discovery-001/verify
{
  "status": "confirmed",  -- หรือ "rejected", "corrected"
  "verification_note": "ตรวจสอบแล้วถูกต้อง เป็น Glock G19 จริง",
  "corrected_firearm_id": null  -- ถ้าแก้ไขให้ระบุ ID ใหม่
}

Response:
{
  "discovery_id": "uuid-discovery-001",
  "status": "confirmed",
  "verified_by": "expert-001",
  "verified_at": "2026-03-01T16:45:00Z"
}
```

---

## Query Examples

### ค้นหาวัตถุพยานที่พบในช่วง 30 วัน
```sql
SELECT 
    d.id as discovery_id,
    d.discovered_date,
    d.status,
    e.category,
    e.subcategory,
    ST_AsText(d.location) as location
FROM exhibit_discoveries d
JOIN exhibits e ON d.exhibit_id = e.id
WHERE d.discovered_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY d.discovered_date DESC;
```

### ค้นหาปืน Glock ที่พบในพื้นที่ใกล้เคียง
```sql
SELECT 
    d.id,
    d.discovered_date,
    d.location,
    ST_Distance(
        d.location::geography,
        ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326)::geography
    ) as distance_meters
FROM exhibit_discoveries d
JOIN exhibits e ON d.exhibit_id = e.id
WHERE e.category = 'firearm'
  AND d.ai_result->>'selected_brand' = 'Glock'
  AND ST_DWithin(
      d.location::geography,
      ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326)::geography,
      5000  -- 5km
  )
ORDER BY distance_meters;
```

### สถิติการยืนยัน AI โดย Domain Expert
```sql
SELECT 
    status,
    COUNT(*) as count,
    AVG(ai_confidence) as avg_confidence
FROM exhibit_discoveries
WHERE discovered_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status;
```

---

## Entity Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                     Exhibit Service                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────────────────┐     │
│  │   Exhibit    │         │   ExhibitDiscovery       │     │
│  │  (Catalog)   │ 1     N │   (Event/Record)         │     │
│  ├──────────────┤◄────────┤──────────────────────────┤     │
│  │ id           │         │ id                       │     │
│  │ category     │         │ exhibit_id (FK)          │     │
│  │ subcategory  │         │ discovered_date          │     │
│  │              │         │ discovered_by            │     │
│  └──────────────┘         │ location (PostGIS)       │     │
│                           │ ai_confidence            │     │
│                           │ ai_result (JSON)         │     │
│                           │ status                   │     │
│                           │ verified_by              │     │
│                           └──────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

       │                              │
       │ 1:N                          │ N:1
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│ Firearm      │              │    User      │
│  Service     │              │   (Auth)     │
└──────────────┘              └──────────────┘

       │                              │
       │ N:1                          │ N:1
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│   Narcotic   │              │   Location   │
│   Service    │              │   Service    │
└──────────────┘              └──────────────┘
```
