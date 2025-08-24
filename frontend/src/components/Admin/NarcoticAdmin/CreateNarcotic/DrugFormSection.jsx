import React, { useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import Dropdown from '../../../common/Dropdown';

// ==================== UTILS ====================
const findFormById = (forms, id) => {
    if (!forms || id === undefined || id === null) return null;
    return forms.find((f) => f && f.id?.toString() === id?.toString()) || null;
};

// ==================== CUSTOM HOOKS ====================
const useHandleDrugFormChange = (drugForms, setFormData, setEvidenceType) =>
    useCallback(
        (value) => {
            setFormData((prev) => ({ ...prev, formId: value }));

            const selected = findFormById(drugForms, value);
            setEvidenceType(selected?.name ?? '');
        },
        [drugForms, setFormData, setEvidenceType]
    );

// ==================== MAIN COMPONENTS ====================
const DrugFormSection = ({ formData, setFormData, setEvidenceType, drugForms = [], isLoadingDrugForms = false }) => {
    const handleChange = useHandleDrugFormChange(drugForms, setFormData, setEvidenceType);

    const value = useMemo(() => (formData?.formId ?? ''), [formData?.formId]);

    const options = useMemo(() => (Array.isArray(drugForms) ? drugForms.map(f => ({
      value: String(f.id ?? f.value ?? ''),
      label: f.name ?? f.label ?? String(f.id ?? '')
    })) : []), [drugForms]);

    const placeholder = isLoadingDrugForms ? 'กำลังโหลดรูปแบบ...' : 'เลือกรูปแบบยา';

    return (
        <section className="bg-white rounded-lg p-6 shadow-sm" aria-labelledby="drug-form-section-title">
            <h2 id="drug-form-section-title" className="text-lg font-medium mb-5">รูปแบบยาเสพติดพยาน</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                    <Dropdown
                        id="drug-form"
                        name="drugForm"
                        value={value}
                        options={options}
                        onChange={handleChange}
                        placeholder={placeholder}
                        disabled={isLoadingDrugForms}
                        aria-label="เลือกรูปแบบยา"
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