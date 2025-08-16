# React Code Refactoring Instructions

## ภาพรวม
กรุณาปรับปรุงโค้ด React ที่ให้มาตามแนวทางที่ดีที่สุดของ React 18 ในปี 2025

## หลักการสำคัญ

### 1. การแยก Components
- แยก UI Components ที่มีหน้าที่เฉพาะเจาะจง
- ใช้ functional components แทน class components
- ตั้งชื่อ component ให้สื่อความหมายและชัดเจน
- แยก presentational components และ container components

### 2. การแยก Custom Hooks
- สกัด logic ที่ใช้ร่วมกันออกมาเป็น custom hooks
- ตั้งชื่อ hook ขึ้นต้นด้วย "use"
- รวม state management และ side effects ที่เกี่ยวข้องกัน
- ทำให้ hooks สามารถนำกลับมาใช้ได้ (reusable)

### 3. การแยก Utility Functions
- แยกฟังก์ชันที่ไม่เกี่ยวข้องกับ React ออกมาเป็น utils
- สร้างฟังก์ชันที่ pure และไม่มี side effects
- จัดกลุ่มฟังก์ชันที่เกี่ยวข้องกันไว้ด้วยกัน

### 4. การจัดระเบียบโค้ด
- **เก็บส่วนประกอบทั้งหมดไว้ในไฟล์เดียวกัน** (ตามที่ระบุ)
- เรียงลำดับ: imports → constants → utils → custom hooks → components → main component
- ใช้ TypeScript interfaces/types หากเป็นไปได้
- เพิ่ม comments สำหรับ logic ที่ซับซ้อน

## แนวทางการปฏิบัติที่ดี (Best Practices)

### Performance
- ใช้ `React.memo()` สำหรับ components ที่ไม่ต้องการ re-render บ่อย
- ใช้ `useMemo()` และ `useCallback()` อย่างเหมาะสม
- หลีกเลี่ยงการสร้าง objects/arrays ใหม่ใน render

### State Management
- ใช้ `useState()` สำหรับ local state
- ใช้ `useReducer()` สำหรับ complex state logic
- ยกระดับ state ขึ้นไปที่ระดับที่เหมาะสม

### Error Handling
- เพิ่ม error boundaries หากจำเป็น
- จัดการ async operations ด้วย try-catch

### Accessibility
- เพิ่ม proper semantic HTML
- รองรับ keyboard navigation
- เพิ่ม ARIA attributes ตามความเหมาะสม

## ผลลัพธ์ที่คาดหวัง
- โค้ดที่อ่านง่าย มีโครงสร้างชัดเจน
- Components ที่แยกหน้าที่กันอย่างเหมาะสม
- Custom hooks ที่สามารถนำกลับมาใช้ได้
- Utils functions ที่เป็น pure functions
- ทุกอย่างอยู่ในไฟล์เดียวกันเพื่อความสะดวกในการดู