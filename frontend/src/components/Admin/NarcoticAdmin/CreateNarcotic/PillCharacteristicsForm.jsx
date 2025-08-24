import React, { useCallback, memo } from 'react';
import PropTypes from 'prop-types';

// ==================== CONSTANTS ====================
const PLACEHOLDERS = {
    characteristics: 'ระบุลักษณะเม็ดยา',
    edge_shape: 'ระบุรูปทรงเม็ดยา',
    color: 'ระบุสีของเม็ดยา',
    measurement: '0.0',
};

const NUMBER_FIELD_DEFAULTS = {
    step: '0.1',
    min: '0',
};

// ==================== UTILS ====================
const normalizeInputValue = (raw) => (raw === undefined || raw === null ? '' : raw);

// ==================== CUSTOM HOOKS ====================
const usePillFieldHandlers = (setPillData) => {
    const textHandlerFor = useCallback(
        (field) => (e) => {
            const val = normalizeInputValue(e?.target?.value);
            setPillData((prev) => ({ ...prev, [field]: val }));
        },
        [setPillData]
    );

    const numberHandlerFor = useCallback(
        (field) => (e) => {
            const raw = e?.target?.value;
            const val = raw === '' ? '' : raw;
            setPillData((prev) => ({ ...prev, [field]: val }));
        },
        [setPillData]
    );

    return { textHandlerFor, numberHandlerFor };
};

// ==================== PRESENTATIONAL SUB-COMPONENTS ====================
const TextField = memo(({ id, label, value, placeholder, onChange, ariaLabel }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
        </label>
        <input
            id={id}
            aria-label={ariaLabel || label}
            type="text"
            value={value ?? ''}
            onChange={onChange}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200"
            placeholder={placeholder}
        />
    </div>
));

TextField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string,
};

const NumberField = memo(({ id, label, value, placeholder, onChange, step = NUMBER_FIELD_DEFAULTS.step, min = NUMBER_FIELD_DEFAULTS.min, unit }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
        </label>
        <div className="relative">
            <input
                id={id}
                aria-label={label}
                type="number"
                step={step}
                min={min}
                value={value ?? ''}
                onChange={onChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#990000] transition-all duration-200"
                placeholder={placeholder}
            />
            {unit && <span className="absolute right-3 top-3 text-gray-500 pointer-events-none">{unit}</span>}
        </div>
    </div>
));

NumberField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    step: PropTypes.string,
    min: PropTypes.string,
    unit: PropTypes.string,
};

// ==================== MAIN COMPONENT ====================
const PillCharacteristicsForm = ({ pillData, setPillData }) => {
    const { textHandlerFor, numberHandlerFor } = usePillFieldHandlers(setPillData);

    return (
        <section className="bg-white rounded-lg p-6 shadow-sm" aria-labelledby="pill-characteristics-title">
            <h2 id="pill-characteristics-title" className="text-lg font-medium mb-5">
                ลักษณะเม็ดยา
            </h2>

            {/* Visual characteristics - first row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <TextField
                    id="pill-characteristics"
                    label="ลักษณะ"
                    value={pillData.characteristics}
                    onChange={textHandlerFor('characteristics')}
                    placeholder={PLACEHOLDERS.characteristics}
                />
                <TextField
                    id="pill-edge-shape"
                    label="รูปทรง"
                    value={pillData.edge_shape}
                    onChange={textHandlerFor('edge_shape')}
                    placeholder={PLACEHOLDERS.edge_shape}
                />
                <TextField
                    id="pill-color"
                    label="สี"
                    value={pillData.color}
                    onChange={textHandlerFor('color')}
                    placeholder={PLACEHOLDERS.color}
                />
            </div>

            {/* Measurements - second row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                <NumberField
                    id="pill-diameter-mm"
                    label="เส้นผ่านศูนย์กลาง (มม.)"
                    value={pillData.diameter_mm}
                    onChange={numberHandlerFor('diameter_mm')}
                    placeholder={PLACEHOLDERS.measurement}
                    unit="มม."
                />
                <NumberField
                    id="pill-thickness-mm"
                    label="ความหนา (มม.)"
                    value={pillData.thickness_mm}
                    onChange={numberHandlerFor('thickness_mm')}
                    placeholder={PLACEHOLDERS.measurement}
                    unit="มม."
                />
                <NumberField
                    id="pill-edge-width-mm"
                    label="ความกว้างขอบ (มม.)"
                    value={pillData.edge_width_mm}
                    onChange={numberHandlerFor('edge_width_mm')}
                    placeholder={PLACEHOLDERS.measurement}
                    unit="มม."
                />
                <NumberField
                    id="pill-weight-mg"
                    label="น้ำหนัก (มก.)"
                    value={pillData.weight_mg}
                    onChange={numberHandlerFor('weight_mg')}
                    placeholder={PLACEHOLDERS.measurement}
                    unit="มก."
                />
            </div>
        </section>
    );
};

PillCharacteristicsForm.propTypes = {
    pillData: PropTypes.object.isRequired,
    setPillData: PropTypes.func.isRequired,
};

export default memo(PillCharacteristicsForm);