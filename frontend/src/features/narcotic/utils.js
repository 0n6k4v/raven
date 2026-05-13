import { AuthPolicy, AUTH_DEPARTMENTS } from '../auth/utils';

export const NARCOTIC_CONSTANTS = {
  PILL_TYPES: ['เม็ด', 'เม็ดยา', 'ยาเม็ด', 'แคปซูล', 'ยาแคปซูล'],
  PACKAGE_TYPES: ['หีบห่อ', 'ซอง', 'บรรจุภัณฑ์', 'แพคเกจ'],
};

export const FORM_OPTIONS = {
  DRUG_TYPES: [
    { value: "", label: "เลือกชนิดยาเสพติด" },
    { value: "methamphetamine", label: "ยาบ้า (เมทแอมเฟตามีน)" },
    { value: "marijuana", label: "กัญชา" },
    { value: "heroin", label: "เฮโรอีน" },
    { value: "cocaine", label: "โคเคน" },
    { value: "kratom", label: "กระท่อม" },
    { value: "other", label: "อื่นๆ" },
  ],
  DRUG_CATEGORIES: [
    { value: "", label: "เลือกประเภทยาเสพติด" },
    { value: "stimulant", label: "กระตุ้นประสาท" },
    { value: "depressant", label: "กดประสาท" },
    { value: "hallucinogen", label: "หลอนประสาท" },
    { value: "opioid", label: "โอปิออยด์" },
    { value: "cannabis", label: "กัญชาและอนุพันธ์" },
  ],
  CONSUMPTION_METHODS: [
    { id: "smoking", value: "smoking", label: "สูบ/สูดดม" },
    { id: "oral", value: "oral", label: "รับประทาน" },
    { id: "injection", value: "injection", label: "ฉีด" },
    { id: "other", value: "other", label: "อื่นๆ" },
  ],
  SIDE_EFFECTS: [
    { id: "anxious", value: "anxious", label: "วิตกกังวล" },
    { id: "paranoid", value: "paranoid", label: "หวาดระแวง" },
    { id: "hallucination", value: "hallucination", label: "ประสาทหลอน" },
    { id: "insomnia", value: "insomnia", label: "นอนไม่หลับ" },
    { id: "depression", value: "depression", label: "ซึมเศร้า" },
    { id: "physical", value: "physical", label: "อาการทางกาย" },
  ]
};

export const NarcoticMapper = {
  getLabel: (options, value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  },
  
  mapConsumptionMethods: (methodString) => {
    if (!methodString || methodString === '-') return '-';
    return methodString.split(', ')
      .map(val => {
        const option = FORM_OPTIONS.CONSUMPTION_METHODS.find(opt => opt.value === val);
        return option ? option.label : val;
      })
      .join(', ');
  },

  mapCombinedEffects: (effectString) => {
    if (!effectString || effectString === '-') return '-';
    
    const parts = effectString.split('; ');
    if (parts.length === 0) return '-';

    const sideEffectsMapped = parts[0].split(', ')
      .map(val => {
        const option = FORM_OPTIONS.SIDE_EFFECTS.find(opt => opt.value === val);
        return option ? option.label : val;
      })
      .join(', ');

    if (parts.length > 1) {
      return `${sideEffectsMapped}; ${parts[1]}`;
    }

    return sideEffectsMapped;
  }
};

export const NarcoticAccessPolicy = {
  canManageCatalog: (user) => {
    return AuthPolicy.isDepartmentAdmin(user, AUTH_DEPARTMENTS.NARCOTICS);
  }
};

export class NarcoticPayloadBuilder {
  static toNarcotic(formData, exhibitId, isPillType, pillData) {
    const consumptionMethod = Array.isArray(formData.consumptionMethods) && formData.consumptionMethods.length > 0
      ? formData.consumptionMethods.join(', ')
      : (formData.consumption_method || null);

    const sideEffectsText = Array.isArray(formData.sideEffects) && formData.sideEffects.length > 0
      ? formData.sideEffects.join(', ')
      : '';
    const effectText = formData.effect || '';
    const combinedEffect = [sideEffectsText, effectText].filter(Boolean).join('; ') || null;

    return {
      exhibit_id: exhibitId,
      form_id: parseInt(formData.formId) || '',
      characteristics: isPillType 
        ? (pillData.characteristics || formData.characteristics) 
        : formData.characteristics,
      drug_type: formData.drug_type,
      drug_category: formData.drug_category,
      consumption_method: consumptionMethod,
      effect: combinedEffect,
      weight_grams: formData.weight_grams ? parseFloat(formData.weight_grams) : null
    };
  }

  static toPill(narcoticId, pillData) {
    return {
      narcotic_id: narcoticId,
      color: pillData.color,
      diameter_mm: pillData.diameter_mm ? parseFloat(pillData.diameter_mm) : null,
      thickness_mm: pillData.thickness_mm ? parseFloat(pillData.thickness_mm) : null,
      edge_shape: pillData.edge_shape,
      characteristics: pillData.characteristics,
      edge_width_mm: pillData.edge_width_mm ? parseFloat(pillData.edge_width_mm) : null
    };
  }
}