import React, { useCallback, memo } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// DOMAIN LAYER - Configuration & Constants
// ============================================================================

const FORM_CONFIG = {
  PLACEHOLDERS: {
    CHARACTERISTICS: 'ระบุลักษณะเม็ดยา',
    EDGE_SHAPE: 'ระบุรูปทรงเม็ดยา',
    COLOR: 'ระบุสีของเม็ดยา',
    MEASUREMENT: '0.0',
  },
  DEFAULTS: {
    STEP: '0.1',
    MIN: '0',
  }
};

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const usePillFormHandlers = (setPillData) => {
  const handleChange = useCallback((key, value) => {
    const safeValue = value === null || value === undefined ? '' : value;
    setPillData(prev => ({ ...prev, [key]: safeValue }));
  }, [setPillData]);

  return { handleChange };
};

// ============================================================================
// PRESENTATION LAYER - Atomic Components
// ============================================================================

const TextField = memo(({ id, label, value, placeholder, onValueChange, className }) => (
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

const NumberField = memo(({ id, label, value, placeholder, onValueChange, unit, step = FORM_CONFIG.DEFAULTS.STEP, min = FORM_CONFIG.DEFAULTS.MIN }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value ?? ''}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200"
        placeholder={placeholder}
        aria-label={label}
      />
      {unit && (
        <span className="absolute inset-y-0 right-3 flex items-center text-gray-500 pointer-events-none text-sm">
          {unit}
        </span>
      )}
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const PillCharacteristicsForm = ({ pillData, setPillData, formData, setFormData }) => {
  const { handleChange } = usePillFormHandlers(setPillData);
  const { PLACEHOLDERS } = FORM_CONFIG;

  const handleWeightChange = useCallback((value) => {
    const safeValue = value === null || value === undefined ? '' : value;
    setFormData(prev => ({ ...prev, weight_grams: safeValue }));
  }, [setFormData]);

  return (
    <section className="bg-white rounded-lg p-6 shadow-sm" aria-labelledby="pill-characteristics-title">
      <h2 id="pill-characteristics-title" className="text-lg font-medium mb-5">
        ลักษณะเม็ดยา
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <TextField
          id="pill-characteristics"
          label="ลักษณะ"
          value={pillData.characteristics}
          onValueChange={(val) => handleChange('characteristics', val)}
          placeholder={PLACEHOLDERS.CHARACTERISTICS}
        />
        <TextField
          id="pill-edge-shape"
          label="รูปทรง"
          value={pillData.edge_shape}
          onValueChange={(val) => handleChange('edge_shape', val)}
          placeholder={PLACEHOLDERS.EDGE_SHAPE}
        />
        <TextField
          id="pill-color"
          label="สี"
          value={pillData.color}
          onValueChange={(val) => handleChange('color', val)}
          placeholder={PLACEHOLDERS.COLOR}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
        <NumberField
          id="pill-diameter-mm"
          label="เส้นผ่านศูนย์กลาง"
          value={pillData.diameter_mm}
          onValueChange={(val) => handleChange('diameter_mm', val)}
          placeholder={PLACEHOLDERS.MEASUREMENT}
          unit="มม."
        />
        <NumberField
          id="pill-thickness-mm"
          label="ความหนา"
          value={pillData.thickness_mm}
          onValueChange={(val) => handleChange('thickness_mm', val)}
          placeholder={PLACEHOLDERS.MEASUREMENT}
          unit="มม."
        />
        <NumberField
          id="pill-edge-width-mm"
          label="ความกว้างขอบ"
          value={pillData.edge_width_mm}
          onValueChange={(val) => handleChange('edge_width_mm', val)}
          placeholder={PLACEHOLDERS.MEASUREMENT}
          unit="มม."
        />
        <NumberField
          id="pill-weight-grams"
          label="น้ำหนัก"
          value={formData?.weight_grams}
          onValueChange={handleWeightChange}
          placeholder={PLACEHOLDERS.MEASUREMENT}
          unit="ก."
        />
      </div>
    </section>
  );
};

PillCharacteristicsForm.propTypes = {
  pillData: PropTypes.shape({
    characteristics: PropTypes.string,
    edge_shape: PropTypes.string,
    color: PropTypes.string,
    diameter_mm: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    thickness_mm: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    edge_width_mm: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  setPillData: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    weight_grams: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  setFormData: PropTypes.func.isRequired,
};

export default memo(PillCharacteristicsForm);