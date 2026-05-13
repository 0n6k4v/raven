# Raven - Clarification Questions

> **Generated:** 2026-02-28  
> **Priority:** High - ต้องตอบก่อนดำเนินการต่อ

---

## 1. AI Analysis

### Q1: การวิเคราะห์ยาเสพติด (Narcotics AI)

| Priority | Question |
|----------|----------|
| **High** | ต้องการให้ AI วิเคราะห์อะไรบ้าง? |

**Options:**
- [ ] ตรวจจับว่าเป็นยาเสพติดหรือไม่
- [ ] ระบุชนิด (ยาบ้า, ไอซ์, กัญชา, เฮโรอีน, โคเคน)
- [ ] ประมาณน้ำหนัก/จำนวน
- [ ] ตรวจจับรูปร่างเม็ดยา

**Context:** มี narcotic_model.pt อยู่แล้วใน ai_models/ แต่ยังไม่มี API endpoint

---

### Q2: การ Export รายงาน

| Priority | Question |
|----------|----------|
| **Medium** | รูปแบบรายงานที่ต้องการเป็นอะไร? |

**Options:**
- [ ] PDF
- [ ] Excel
- [ ] Word
- [ ] อื่น ๆ: __________

**Context:** ยังไม่มีระบบ Export ในโค้ด

---

### Q3: การ Train โมเดล

| Priority | Question |
|----------|----------|
| **Medium** | Domain Expert สามารถ Upload ข้อมูล Train เองได้เลย หรือต้องมี Admin อนุมัติก่อน? |

**Options:**
- [ ] Train เองได้เลย
- [ ] ต้อง Admin อนุมัติก่อน

**Context:** Permissions มีแล้วว่า Domain Expert สามารถ Train โมเดลได้

---

## 2. Dashboard & Statistics

### Q4: Dashboard Statistics

| Priority | Question |
|----------|----------|
| **Medium** | Dashboard ควรแสดงอะไรบ้าง? |

**Options:**
- [ ] จำนวนวัตถุพยานทั้งหมด
- [ ] แยกตามประเภท (ปืน/ยา)
- [ ] Trend ตามเวลา (รายเดือน/ปี)
- [ ] Heatmap แผนที่
- [ ] ยี่ห้อ/รุ่นที่พบบ่อย

**Context:** ยังไม่มีระบบ Dashboard ในโค้ด

---

## 3. Connections & Links

### Q5: Connection Analysis

| Priority | Question |
|----------|----------|
| **Medium** | ต้องการหาความเชื่อมโยงแบบไหน? |

**Options:**
- [ ] Link by Person (คนเดียวกัน)
- [ ] Link by Location (สถานที่ใกล้เคียง)
- [ ] Link by Time (ช่วงเวลาใกล้เคียง)
- [ ] Link by Pattern (ลักษณะเหมือนกัน)

**Context:** มี History table ที่เก็บ location แล้ว สามารถใช้หา connections ได้

---

## 4. Data Retention

### Q6: Data Retention Policy

| Priority | Question |
|----------|----------|
| **Low** | เก็บข้อมูลไว้นานแค่ไหน? |

**Options:**
- [ ] ตลอดไป
- [ ] X ปี
- [ ] ตามกฎหมาย: __________

**Context:** ต้องเก็บตามกฎหมายนิติวิทยาศาสตร์

---

## 5. User Management

### Q7: User Registration

| Priority | Question |
|----------|----------|
| **Medium** | User สมัครเองได้ไหม หรือต้องมี Admin สร้างให้? |

**Options:**
- [ ] สมัครเองได้
- [ ] Admin สร้างให้เท่านั้น
- [ ] Admin อนุมัติหลังสมัคร

**Context:** มี Register API แล้ว

---

## 6. Summary

### Questions by Priority

| Priority | Count | Questions |
|----------|-------|-----------|
| **High** | 1 | Q1: Narcotics AI Analysis |
| **Medium** | 5 | Q2: Export, Q3: Train, Q4: Dashboard, Q5: Connections, Q7: Registration |
| **Low** | 1 | Q6: Data Retention |

---

## 7. Related Documents

- [ideation.md](../01-user-inputs/ideation.md)
- [synthesis.md](./synthesis.md)
- [personas_draft.md](./personas_draft.md)
