# 🛠 Strict Code Preservation & Full-File Policy

คุณต้องปฏิบัติตามกฎเหล็กด้านวิศวกรรมซอฟต์แวร์ดังต่อไปนี้อย่างเคร่งครัด ในการแก้ไขโค้ดทุกครั้ง:

### 1. No Code Omission (ห้ามตัดทอนโค้ด)
- **Full File Output Only:** ห้ามใช้คอมเมนต์ประเภท `// ... (rest of code)`, `// ... (existing logic)` หรือ Placeholder ใดๆ โดยเด็ดขาด 
- **Line-by-Line Respect:** โค้ดทุกบรรทัดที่ไม่เกี่ยวข้องกับการแก้ไขโดยตรง "ต้อง" ถูกคัดลอกมาวางไว้เหมือนเดิม 100% ห้ามตกหล่นแม้แต่ตัวอักษรเดียว

### 2. Strict Logic Preservation (รักษากลไกเดิม)
- **Fragile Logic Check:** ห้ามลบหรือแก้ไข Logic เกี่ยวกับ `useRef`, `AbortController`, `isMounted` refs, `useEffect` cleanups, และ `Sorting logic` ของเดิม เว้นแต่จะมีคำสั่งเฉพาะเจาะจงให้เปลี่ยน
- **State Integrity:** ตรวจสอบว่า State ย่อยๆ (เช่น popupCountdown, rowsPerPage) และ Helper functions ภายในไฟล์ยังอยู่ครบถ้วน

### 3. Structural & Architectural Integrity
- **No Refactoring Bias:** ห้ามทำการ Refactor, เปลี่ยนชื่อตัวแปร หรือเปลี่ยนโครงสร้าง Folder/Architecture เองโดยพละการ 
- **Consistency:** รักษา Coding Style, การเว้นวรรค และรูปแบบการเขียนเดิมของโปรเจกต์ไว้

### 4. Verification Protocol (ขั้นตอนการตรวจสอบ)
ก่อนจะส่งคำตอบ (Output) ให้ผู้ใช้ คุณต้องทำ "Internal Self-Check" ดังนี้:
1. **Compare:** เทียบโค้ดที่กำลังจะส่งกับโค้ดต้นฉบับแบบบรรทัดต่อบรรทัด
2. **Scan for Missing:** ตรวจสอบว่ามีกลไกสำคัญ (เช่น Abort logic หรือ Refs) หายไปหรือไม่
3. **Audit:** ตรวจดูว่ามีการใช้ Placeholder (`// ...`) หลุดไปใน Output หรือไม่

### 5. Conflict Reporting
- หากพบว่าคำสั่งแก้ไขใหม่ขัดแย้งกับ Logic เดิมที่มีอยู่ ให้ "แจ้งเตือนและถาม" ก่อนดำเนินการ ห้ามตัดสินใจลบโค้ดทิ้งเองเงียบๆ

---
**เป้าหมายสูงสุด:** ผู้ใช้ต้องสามารถก๊อปปี้โค้ดทั้งหมดไปวางทับไฟล์เดิมได้ทันที (Copy-Paste Ready) โดยที่ระบบเดิมไม่พัง