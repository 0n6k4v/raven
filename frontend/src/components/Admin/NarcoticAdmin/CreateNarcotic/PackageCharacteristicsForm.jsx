import React, { useCallback, memo } from 'react';
import PropTypes from 'prop-types';

// ==================== CONSTANTS ====================
const PLACEHOLDERS = {
    packageType: 'ระบุรูปแบบการห่อหุ้ม',
    packageMaterial: 'ระบุวัสดุที่ใช้ในการห่อหุ้ม',
    packageColor: 'ระบุสีของบรรจุภัณฑ์',
};

// ==================== CUSTOM HOOKS ====================
const usePackageFieldHandlers = (setPackageData) => {
    const handlerFor = useCallback(
        (field) => (e) => {
            const val = e?.target?.value ?? '';
            setPackageData((prev) => ({ ...prev, [field]: val }));
        },
        [setPackageData]
    );

    return { handlerFor };
};

// ==================== PRESENTATIONAL COMPONENTS ====================
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

// ==================== MAIN COMPONENT ====================
const PackageCharacteristicsForm = ({ packageData = {}, setPackageData }) => {
    const { handlerFor } = usePackageFieldHandlers(setPackageData);

    return (
        <section className="bg-white rounded-lg p-6 shadow-sm" aria-labelledby="package-characteristics-title">
            <h2 id="package-characteristics-title" className="text-lg font-medium mb-5">
                ลักษณะหีบห่อ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                <TextField
                    id="package-type"
                    label="รูปแบบการห่อหุ้ม"
                    value={packageData.packageType}
                    onChange={handlerFor('packageType')}
                    placeholder={PLACEHOLDERS.packageType}
                />
                <TextField
                    id="package-material"
                    label="วัสดุที่ใช้"
                    value={packageData.packageMaterial}
                    onChange={handlerFor('packageMaterial')}
                    placeholder={PLACEHOLDERS.packageMaterial}
                />
                <TextField
                    id="package-color"
                    label="สีของบรรจุภัณฑ์"
                    value={packageData.packageColor}
                    onChange={handlerFor('packageColor')}
                    placeholder={PLACEHOLDERS.packageColor}
                />
            </div>
        </section>
    );
};

PackageCharacteristicsForm.propTypes = {
    packageData: PropTypes.object,
    setPackageData: PropTypes.func.isRequired,
};

export default memo(PackageCharacteristicsForm);