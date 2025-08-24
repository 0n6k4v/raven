import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import Dropdown from '../../../common/Dropdown';

// ==================== CONSTANTS ====================
const DRUG_TYPES = [
  { value: "", label: "เลือกชนิดยาเสพติด" },
  { value: "methamphetamine", label: "ยาบ้า (เมทแอมเฟตามีน)" },
  { value: "marijuana", label: "กัญชา" },
  { value: "heroin", label: "เฮโรอีน" },
  { value: "cocaine", label: "โคเคน" },
  { value: "kratom", label: "กระท่อม" },
  { value: "other", label: "อื่นๆ" },
];

const DRUG_CATEGORIES = [
  { value: "", label: "เลือกประเภทยาเสพติด" },
  { value: "stimulant", label: "กระตุ้นประสาท" },
  { value: "depressant", label: "กดประสาท" },
  { value: "hallucinogen", label: "หลอนประสาท" },
  { value: "opioid", label: "โอปิออยด์" },
  { value: "cannabis", label: "กัญชาและอนุพันธ์" },
];

const CONSUMPTION_METHODS = [
  { id: "smoking", value: "smoking", label: "สูบ/สูดดม" },
  { id: "oral", value: "oral", label: "รับประทาน" },
  { id: "injection", value: "injection", label: "ฉีด" },
  { id: "other", value: "other", label: "อื่นๆ" },
];

const SIDE_EFFECTS = [
  { id: "anxious", value: "anxious", label: "วิตกกังวล" },
  { id: "paranoid", value: "paranoid", label: "หวาดระแวง" },
  { id: "hallucination", value: "hallucination", label: "ประสาทหลอน" },
  { id: "insomnia", value: "insomnia", label: "นอนไม่หลับ" },
  { id: "depression", value: "depression", label: "ซึมเศร้า" },
  { id: "physical", value: "physical", label: "อาการทางกาย" },
];

// ==================== UTILS ====================
const toggleArrayItem = (array = [], item) =>
  array.includes(item) ? array.filter((i) => i !== item) : [...array, item];

// ==================== CUSTOM HOOKS ====================
const useAdditionalInfoHandlers = (formData, setFormData) => {
  const onSelectChange = useCallback(
    (key) => (e) =>
      setFormData((prev) => ({
        ...prev,
        [key]: e.target.value,
      })),
    [setFormData]
  );

  const onCheckboxToggle = useCallback(
    (key) => (value) =>
      setFormData((prev) => ({
        ...prev,
        [key]: toggleArrayItem(prev?.[key] ?? [], value),
      })),
    [setFormData]
  );

  const onTextChange = useCallback(
    (key) => (e) =>
      setFormData((prev) => ({
        ...prev,
        [key]: e.target.value,
      })),
    [setFormData]
  );

  return { onSelectChange, onCheckboxToggle, onTextChange };
};

// ==================== PRESENTATIONAL COMPONENTS ====================
const SelectField = React.memo(function SelectField({ id, label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={id}>
        {label}
      </label>
      <Dropdown
        id={id}
        value={value}
        options={options}
        onChange={(val) => onChange({ target: { value: val } })}
        className="w-full"
      />
    </div>
  );
});

SelectField.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};

const CheckboxItem = React.memo(function CheckboxItem({ id, checked, onChange, label }) {
  return (
    <div className="flex items-center">
      <input
        id={id}
        name={id}
        type="checkbox"
        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-checked={checked}
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
});

CheckboxItem.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

const CheckboxGroup = React.memo(function CheckboxGroup({ items, selected = [], onToggle, columns = 2 }) {
  const gridCols = columns === 2 ? "sm:grid-cols-2" : "md:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-2`}>
      {items.map((it) => (
        <CheckboxItem
          key={it.id}
          id={it.id}
          label={it.label}
          checked={selected.includes(it.value)}
          onChange={() => onToggle(it.value)}
        />
      ))}
    </div>
  );
});

CheckboxGroup.propTypes = {
  items: PropTypes.array.isRequired,
  selected: PropTypes.array,
  onToggle: PropTypes.func.isRequired,
  columns: PropTypes.number,
};

const Textarea = React.memo(function Textarea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200 resize-none"
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={onChange}
    />
  );
});

Textarea.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
};

// ==================== MAIN COMPONENTS ====================
const AdditionalInfoForm = ({ formData, setFormData }) => {
  const safeForm = useMemo(
    () => ({
      drugType: formData?.drugType ?? "",
      drugCategory: formData?.drugCategory ?? "",
      consumptionMethods: formData?.consumptionMethods ?? [],
      consumptionMethodOther: formData?.consumptionMethodOther ?? "",
      sideEffects: formData?.sideEffects ?? [],
      effect: formData?.effect ?? "",
    }),
    [formData]
  );

  const { onSelectChange, onCheckboxToggle, onTextChange } = useAdditionalInfoHandlers(setFormData ? formData : formData, setFormData);

  const handleDrugTypeChange = onSelectChange("drugType");
  const handleDrugCategoryChange = onSelectChange("drugCategory");
  const toggleConsumption = onCheckboxToggle("consumptionMethods");
  const toggleSideEffect = onCheckboxToggle("sideEffects");
  const handleConsumptionOther = onTextChange("consumptionMethodOther");
  const handleEffectText = onTextChange("effect");

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-5">ข้อมูลเพิ่มเติม</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <SelectField
          id="drugType"
          label="ชนิดยา"
          value={safeForm.drugType}
          options={DRUG_TYPES}
          onChange={handleDrugTypeChange}
        />
        <SelectField
          id="drugCategory"
          label="ประเภทของยาเสพติด"
          value={safeForm.drugCategory}
          options={DRUG_CATEGORIES}
          onChange={handleDrugCategoryChange}
        />
      </div>

      {/* วิธีการเสพ - Consumption Methods */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">วิธีการเสพ</label>
        <CheckboxGroup
          items={CONSUMPTION_METHODS}
          selected={safeForm.consumptionMethods}
          onToggle={toggleConsumption}
          columns={2}
        />
        <input
          type="text"
          placeholder="ระบุวิธีการเสพอื่นๆ (ถ้ามี)"
          className="mt-2 w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200"
          value={safeForm.consumptionMethodOther}
          onChange={handleConsumptionOther}
          aria-label="อื่นๆ วิธีการเสพ"
        />
      </div>

      {/* ผลข้างเคียง - Side Effects */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">ผลข้างเคียงที่พบ</label>
        <div className="mb-2">
          <CheckboxGroup
            items={SIDE_EFFECTS}
            selected={safeForm.sideEffects}
            onToggle={toggleSideEffect}
            columns={3}
          />
        </div>
        <Textarea
          value={safeForm.effect}
          onChange={handleEffectText}
          placeholder="ระบุผลข้างเคียงเพิ่มเติม (ถ้ามี)"
          rows={2}
        />
      </div>
    </div>
  );
};

AdditionalInfoForm.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
};

export default React.memo(AdditionalInfoForm);