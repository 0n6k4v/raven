import React, { useCallback, memo } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// DOMAIN LAYER - Configuration & Constants
// ============================================================================

const FORM_CONFIG = {
  FIELDS: {
    TYPE: { id: 'package-type', label: 'รูปแบบการห่อหุ้ม', placeholder: 'ระบุรูปแบบการห่อหุ้ม' },
    MATERIAL: { id: 'package-material', label: 'วัสดุที่ใช้', placeholder: 'ระบุวัสดุที่ใช้ในการห่อหุ้ม' },
    COLOR: { id: 'package-color', label: 'สีของบรรจุภัณฑ์', placeholder: 'ระบุสีของบรรจุภัณฑ์' },
  }
};

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const usePackageFormHandlers = (setPackageData) => {
  const handleChange = useCallback((key, value) => {
    setPackageData(prev => ({ ...prev, [key]: value }));
  }, [setPackageData]);

  return { handleChange };
};

// ============================================================================
// PRESENTATION LAYER - Atomic Components
// ============================================================================

const TextInput = memo(({ id, label, value, placeholder, onValueChange, className }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      id={id}
      type="text"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200"
      placeholder={placeholder}
      aria-label={label}
    />
  </div>
));

TextInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  onValueChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const PackageCharacteristicsForm = ({ packageData = {}, setPackageData }) => {
  const { handleChange } = usePackageFormHandlers(setPackageData);
  const { TYPE, MATERIAL, COLOR } = FORM_CONFIG.FIELDS;

  return (
    <section className="bg-white rounded-lg p-6 shadow-sm" aria-labelledby="package-characteristics-title">
      <h2 id="package-characteristics-title" className="text-lg font-medium mb-5">
        ลักษณะหีบห่อ
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        <TextInput
          id={TYPE.id}
          label={TYPE.label}
          value={packageData.packageType}
          onValueChange={(val) => handleChange('packageType', val)}
          placeholder={TYPE.placeholder}
        />
        <TextInput
          id={MATERIAL.id}
          label={MATERIAL.label}
          value={packageData.packageMaterial}
          onValueChange={(val) => handleChange('packageMaterial', val)}
          placeholder={MATERIAL.placeholder}
        />
        <TextInput
          id={COLOR.id}
          label={COLOR.label}
          value={packageData.packageColor}
          onValueChange={(val) => handleChange('packageColor', val)}
          placeholder={COLOR.placeholder}
        />
      </div>
    </section>
  );
};

PackageCharacteristicsForm.propTypes = {
  packageData: PropTypes.shape({
    packageType: PropTypes.string,
    packageMaterial: PropTypes.string,
    packageColor: PropTypes.string,
  }),
  setPackageData: PropTypes.func.isRequired,
};

export default memo(PackageCharacteristicsForm);