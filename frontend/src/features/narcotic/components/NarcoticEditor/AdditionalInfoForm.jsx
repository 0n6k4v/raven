import React, { useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import Dropdown from '../../../../components/ui/Dropdown';
import { FORM_OPTIONS } from '../../utils';

// ============================================================================
// APPLICATION LAYER - Custom Hooks
// ============================================================================

const useFormHandlers = (setFormData) => {
  const handleChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, [setFormData]);

  const handleToggleArray = useCallback((key, item) => {
    setFormData(prev => {
      const currentArray = prev?.[key] ?? [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      return { ...prev, [key]: newArray };
    });
  }, [setFormData]);

  return { handleChange, handleToggleArray };
};

// ============================================================================
// PRESENTATION LAYER - Atomic Components
// ============================================================================

const SelectField = memo(({ id, label, value, options, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={id}>
      {label}
    </label>
    <Dropdown
      id={id}
      value={value}
      options={options}
      onChange={onChange}
      className="w-full"
    />
  </div>
));

const CheckboxItem = memo(({ id, checked, onChange, label }) => (
  <div className="flex items-center">
    <input
      id={id}
      type="checkbox"
      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <label htmlFor={id} className="ml-2 block text-sm text-gray-700 cursor-pointer">
      {label}
    </label>
  </div>
));

const CheckboxGroup = memo(({ items, selected = [], onToggle, columns = 2 }) => {
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

const TextAreaField = memo(({ value, onChange, placeholder, rows = 2 }) => (
  <textarea
    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200 resize-none"
    placeholder={placeholder}
    rows={rows}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
));

const TextInput = memo(({ value, onChange, placeholder }) => (
  <input
    type="text"
    className="mt-2 w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const AdditionalInfoForm = ({ formData, setFormData }) => {
  const data = useMemo(() => ({
    drug_type: formData?.drug_type ?? "",
    drug_category: formData?.drug_category ?? "",
    consumptionMethods: formData?.consumptionMethods ?? [],
    consumptionMethodOther: formData?.consumptionMethodOther ?? "",
    sideEffects: formData?.sideEffects ?? [],
    effect: formData?.effect ?? "",
  }), [formData]);

  const { handleChange, handleToggleArray } = useFormHandlers(setFormData);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-5">ข้อมูลเพิ่มเติม</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <SelectField
          id="drug_type"
          label="ชนิดยา"
          value={data.drug_type}
          options={FORM_OPTIONS.DRUG_TYPES}
          onChange={(val) => handleChange("drug_type", val)}
        />
        <SelectField
          id="drug_category"
          label="ประเภทของยาเสพติด"
          value={data.drug_category}
          options={FORM_OPTIONS.DRUG_CATEGORIES}
          onChange={(val) => handleChange("drug_category", val)}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">วิธีการเสพ</label>
        <CheckboxGroup
          items={FORM_OPTIONS.CONSUMPTION_METHODS}
          selected={data.consumptionMethods}
          onToggle={(val) => handleToggleArray("consumptionMethods", val)}
          columns={2}
        />
        <TextInput 
          value={data.consumptionMethodOther}
          onChange={(val) => handleChange("consumptionMethodOther", val)}
          placeholder="ระบุวิธีการเสพอื่นๆ (ถ้ามี)"
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">ผลข้างเคียงที่พบ</label>
        <div className="mb-2">
          <CheckboxGroup
            items={FORM_OPTIONS.SIDE_EFFECTS}
            selected={data.sideEffects}
            onToggle={(val) => handleToggleArray("sideEffects", val)}
            columns={3}
          />
        </div>
        <TextAreaField
          value={data.effect}
          onChange={(val) => handleChange("effect", val)}
          placeholder="ระบุผลข้างเคียงเพิ่มเติม (ถ้ามี)"
        />
      </div>
    </div>
  );
};

AdditionalInfoForm.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
};

export default memo(AdditionalInfoForm);