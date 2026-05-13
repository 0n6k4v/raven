import React, { useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import Dropdown from '../../../../components/ui/Dropdown';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class DrugFormService {
  static findFormById(forms, id) {
    if (!Array.isArray(forms) || id == null) return null;
    return forms.find(f => f && String(f.id) === String(id)) || null;
  }

  static toDropdownOptions(forms) {
    if (!Array.isArray(forms)) return [];
    return forms.map(f => ({
      value: String(f.id ?? f.value ?? ''),
      label: f.name ?? f.label ?? String(f.id ?? '')
    }));
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useDrugFormSelection = (drugForms, setFormData, setEvidenceType) => {
  return useCallback((selectedValue) => {
    setFormData(prev => ({ ...prev, formId: selectedValue }));

    const selectedForm = DrugFormService.findFormById(drugForms, selectedValue);
    setEvidenceType(selectedForm?.name ?? '');
  }, [drugForms, setFormData, setEvidenceType]);
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const SectionTitle = memo(({ children }) => (
  <h2 id="drug-form-section-title" className="text-lg font-medium mb-5">
    {children}
  </h2>
));

const DrugFormSection = ({ 
  formData, 
  setFormData, 
  setEvidenceType, 
  drugForms = [], 
  isLoadingDrugForms = false 
}) => {
  const handleSelectionChange = useDrugFormSelection(drugForms, setFormData, setEvidenceType);
  
  const dropdownOptions = useMemo(() => DrugFormService.toDropdownOptions(drugForms), [drugForms]);
  const currentValue = useMemo(() => formData?.formId ?? '', [formData?.formId]);
  const placeholderText = isLoadingDrugForms ? 'กำลังโหลดรูปแบบ...' : 'เลือกรูปแบบยา';

  return (
    <section className="bg-white rounded-lg p-6 shadow-sm" aria-labelledby="drug-form-section-title">
      <SectionTitle>รูปแบบยาเสพติดพยาน</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Dropdown
            id="drug-form"
            name="drugForm"
            value={currentValue}
            options={dropdownOptions}
            onChange={handleSelectionChange}
            placeholder={placeholderText}
            disabled={isLoadingDrugForms}
            aria-label="เลือกรูปแบบยา"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
};

DrugFormSection.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  setEvidenceType: PropTypes.func.isRequired,
  drugForms: PropTypes.array,
  isLoadingDrugForms: PropTypes.bool,
};

export default memo(DrugFormSection);