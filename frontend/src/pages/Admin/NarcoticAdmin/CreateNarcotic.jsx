import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import DrugFormSection from '../../../components/Admin/NarcoticAdmin/CreateNarcotic/DrugFormSection.jsx';
import PillCharacteristicsForm from '../../../components/Admin/NarcoticAdmin/CreateNarcotic/PillCharacteristicsForm.jsx';
import PackageCharacteristicsForm from '../../../components/Admin/NarcoticAdmin/CreateNarcotic/PackageCharacteristicsForm.jsx';
import AdditionalInfoForm from '../../../components/Admin/NarcoticAdmin/CreateNarcotic/AdditionalInfoForm.jsx';
import ImageUploadSection from '../../../components/Admin/NarcoticAdmin/CreateNarcotic/ImageUploadSection.jsx';

// ==================== CONSTANTS ====================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const pillTypes = ['เม็ด', 'เม็ดยา', 'ยาเม็ด', 'แคปซูล', 'ยาแคปซูล'];
const packageTypes = ['หีบห่อ', 'ซอง', 'บรรจุภัณฑ์', 'แพคเกจ'];

// ==================== UTILS ====================
const isPillForm = (evidenceType) => pillTypes.includes(evidenceType);
const isPackageForm = (evidenceType) => packageTypes.includes(evidenceType);

const parseBase64String = (input) => {
  if (!input) return null;
  if (input.startsWith('data:')) {
    const [meta, b64] = input.split(',', 2);
    const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    return { mime, base64: b64 };
  }
  return { mime: 'image/jpeg', base64: input };
};

const base64ToFile = (base64, filename = 'image.jpg', mime = 'image/jpeg') => {
  const binary = atob(base64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
  return new File([u8], filename, { type: mime });
};

const parseJsonIfAny = async (res) => {
  const ct = res.headers.get('Content-Type') || '';
  const data = ct.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const err = new Error('API error');
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
};

// ==================== API HELPERS (kept local for now) ====================
const CreateExhibit = async (exhibitPayload) =>
  parseJsonIfAny(await fetch(`${BASE_URL}/exhibits`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exhibitPayload)
  }));

const CreateNarcotic = async (narcoticPayload) =>
  parseJsonIfAny(await fetch(`${BASE_URL}/narcotic`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(narcoticPayload)
  }));

const CreatePill = async (pillPayload) =>
  parseJsonIfAny(await fetch(`${BASE_URL}/narcotics/pill`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pillPayload)
  }));

const UploadNarcoticImage = async ({ exhibitId, narcoticId, file, description = '', priority = 0, image_type = 'example' }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', description);
  formData.append('priority', String(priority));
  formData.append('image_type', image_type);
  return parseJsonIfAny(await fetch(`${BASE_URL}/exhibits/${exhibitId}/narcotic/${narcoticId}/images`, {
    method: 'POST', credentials: 'include', body: formData
  }));
};

const CreateImageVector = async ({ file, narcoticId, imageId }) => {
  try {
    const classifyForm = new FormData();
    classifyForm.append('image', file);
    const classifyRes = await fetch(`${BASE_URL}/object-classify`, {
      method: 'POST', credentials: 'include', body: classifyForm
    });

    const classifyContentType = classifyRes.headers.get('Content-Type') || '';
    let classifyData = null;
    let croppedBase64 = null;
    let croppedFileForVector = null;

    if (classifyContentType.includes('application/json')) {
      classifyData = await classifyRes.json();
      croppedBase64 =
        classifyData?.objects?.[0]?.cropped_base64 ??
        classifyData?.objects?.find(o => o.cropped_base64)?.cropped_base64 ??
        classifyData?.cropped_base64 ?? null;
      if (croppedBase64) {
        const parsed = parseBase64String(croppedBase64);
        croppedFileForVector = base64ToFile(parsed.base64, `cropped_${imageId || 'img'}.jpg`, parsed.mime);
      }
    } else if (classifyContentType.startsWith('image/')) {
      const blob = await classifyRes.blob();
      const mime = blob.type || 'image/jpeg';
      const filename = `cropped_${imageId || 'img'}.jpg`;
      croppedFileForVector = new File([blob], filename, { type: mime });
      classifyData = { cropped: true, mime };
    }

    let convertResult = null;
    if (croppedFileForVector) {
      const convertForm = new FormData();
      convertForm.append('image', croppedFileForVector, croppedFileForVector.name);
      const convertRes = await fetch(`${BASE_URL}/convert_image_ref_to_vector`, {
        method: 'POST', credentials: 'include', body: convertForm
      });
      const convertContentType = convertRes.headers.get('Content-Type') || '';
      convertResult = convertContentType.includes('application/json') ? await convertRes.json() : await convertRes.text();
    }

    let vectorPayloadList = null;
    if (convertResult) {
      const vb = convertResult.vector_base64;
      if (Array.isArray(vb) && vb.length > 0) vectorPayloadList = vb.map(v => Number(v));
      else if (typeof vb === 'string' && vb.length > 0) {
        try {
          const b64 = vb.includes(',') ? vb.split(',')[1] : vb;
          const binaryStr = atob(b64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
          const floatArray = new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
          vectorPayloadList = Array.from(floatArray);
        } catch (decodeErr) {
          vectorPayloadList = null;
        }
      }
    }

    let savedVectorResponse = null;
    if (vectorPayloadList && vectorPayloadList.length > 0) {
      const saveBody = { narcotic_id: narcoticId, image_id: imageId, vector_data: vectorPayloadList };
      const saveRes = await fetch(`${BASE_URL}/narcotics/images/vector/save`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody)
      });
      const saveContentType = saveRes.headers.get('Content-Type') || '';
      savedVectorResponse = saveContentType.includes('application/json') ? await saveRes.json() : await saveRes.text();
      if (!saveRes.ok) {
        const err = new Error('Failed to save image vector on backend');
        err.response = { status: saveRes.status, data: savedVectorResponse };
        throw err;
      }
    }

    return { classify: classifyData, convert: convertResult, saved: savedVectorResponse };
  } catch (err) {
    throw err;
  }
};

// ==================== CUSTOM HOOKS ====================
const useDrugForms = () => {
  const [drugForms, setDrugForms] = useState([]);
  const [isLoadingDrugForms, setIsLoadingDrugForms] = useState(false);
  const [error, setError] = useState(null);

  const fetchDrugForms = useCallback(async () => {
    setIsLoadingDrugForms(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/drug-forms`, { credentials: 'include' });
      const data = await (res.headers.get('Content-Type')?.includes('application/json') ? res.json() : null);
      if (!res.ok) {
        const err = new Error('Fetch error');
        err.response = { status: res.status, data };
        throw err;
      }
      setDrugForms(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoadingDrugForms(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchDrugForms();
    return () => { mounted = false; };
  }, [fetchDrugForms]);

  return { drugForms, isLoadingDrugForms, error, refresh: fetchDrugForms };
};

const useImageHandlers = () => {
  const [images, setImages] = useState([]);
  const [actualImages, setActualImages] = useState([]);
  const [selectedThumb, setSelectedThumb] = useState(0);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...imageUrls]);
    setActualImages(prev => [...prev, ...files]);
    setSelectedThumb(prev => Math.max(0, prev));
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setImages(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    setActualImages(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    setSelectedThumb(prev => {
      const newLen = Math.max(0, images.length - 1);
      return Math.max(0, Math.min(prev, newLen - 1));
    });
  }, [images.length]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!active || !over) return;
    if (active.id !== over.id) {
      const oldIndex = images.findIndex(img => img === active.id);
      const newIndex = images.findIndex(img => img === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      setImages(prev => arrayMove(prev, oldIndex, newIndex));
      setActualImages(prev => arrayMove(prev, oldIndex, newIndex));
      setSelectedThumb(newIndex);
    }
  }, [images]);

  return {
    images, setImages,
    actualImages, setActualImages,
    selectedThumb, setSelectedThumb,
    handleImageUpload, handleRemoveImage, handleDragEnd
  };
};

const useNarcoticSubmit = ({ formData, pillData, evidenceType, actualImages, navigate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const exhibitData = await CreateExhibit({ category: 'ยาเสพติด', subcategory: formData.drugType || '' });
      if (!exhibitData?.id) {
        const err = new Error('ไม่สามารถสร้างรายการยาเสพติดได้');
        err.response = { status: 422, data: exhibitData };
        throw err;
      }
      const exhibitId = exhibitData.id;

      const narcoticPayload = {
        exhibit_id: exhibitId,
        form_id: parseInt(formData.formId) || '',
        characteristics: isPillForm(evidenceType) ? (pillData.characteristics || formData.characteristics || '') : (formData.characteristics || ''),
        drug_type: formData.drugType || '',
        drug_category: formData.drugCategory || '',
        consumption_method: formData.consumptionMethod || '',
        effect: formData.effect || '',
        weight_grams: formData.weightGrams ? parseFloat(formData.weightGrams) : null
      };

      const narcoticData = await CreateNarcotic(narcoticPayload);
      if (!narcoticData?.id) {
        const err = new Error('ไม่สามารถบันทึกข้อมูลยาเสพติดได้');
        err.response = { status: 422, data: narcoticData };
        throw err;
      }
      const narcoticId = narcoticData.id;

      if (isPillForm(evidenceType)) {
        const pillBody = {
          narcotic_id: narcoticId,
          color: pillData.color || '',
          diameter_mm: pillData.diameter_mm ? parseFloat(pillData.diameter_mm) : null,
          thickness_mm: pillData.thickness_mm ? parseFloat(pillData.thickness_mm) : null,
          edge_shape: pillData.edge_shape || '',
          characteristics: pillData.characteristics || '',
          edge_width_mm: pillData.edge_width_mm ? parseFloat(pillData.edge_width_mm) : null,
          weight_mg: pillData.weight_mg ? parseFloat(pillData.weight_mg) : null
        };
        await CreatePill(pillBody);
      }

      if (Array.isArray(actualImages) && actualImages.length > 0) {
        const uploadAndVectorPromises = actualImages.map(async (file, i) => {
          const uploadResp = await UploadNarcoticImage({
            exhibitId,
            narcoticId,
            file,
            description: `รูปภาพ ${formData.drugType || 'ยาเสพติด'} #${i + 1}`,
            priority: i,
            image_type: 'example'
          });

          const imageId = uploadResp?.data?.id ?? uploadResp?.id ?? null;
          if (!imageId) {
            const err = new Error('ไม่มี image id จากการอัปโหลด');
            err.response = { status: 422, data: uploadResp };
            throw err;
          }

          const vectorResult = await CreateImageVector({ file, narcoticId, imageId });
          return { upload: uploadResp, vector: vectorResult };
        });

        await Promise.all(uploadAndVectorPromises);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        try { navigate('/admin/narcotics/catalog-management'); } catch { /* intentionally silent */ }
      }, 1200);
    } catch (error) {
      if (error?.response) {
        const status = error.response.status;
        if (status === 401) setSubmitError('กรุณาเข้าสู่ระบบใหม่');
        else if (status === 422) {
          const errorMsg = error.response.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : 'ข้อมูลไม่ถูกต้อง';
          setSubmitError(`ข้อมูลไม่ถูกต้อง: ${errorMsg}`);
        } else {
          setSubmitError(`เกิดข้อผิดพลาด (${status}): ${error.response.data?.message || 'โปรดลองอีกครั้ง'}`);
        }
      } else if (error instanceof TypeError) {
        setSubmitError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ โปรดตรวจสอบการเชื่อมต่อของคุณ');
      } else {
        setSubmitError(`เกิดข้อผิดพลาด: ${error?.message || 'ไม่ทราบสาเหตุ'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, pillData, evidenceType, actualImages, navigate]);

  return { handleSubmit, isSubmitting, submitSuccess, submitError, setSubmitError };
};

// ==================== PRESENTATIONAL SUBCOMPONENTS (kept here for readability) ====================
const Header = React.memo(({ onBack }) => (
  <div className="flex items-center justify-between w-full py-4 pl-4">
    <div className="flex items-center">
      <button type="button" className="flex items-center text-[#990000] font-medium" onClick={onBack}>
        <ChevronLeft className="h-5 w-5 mr-1" />
        ย้อนกลับ
      </button>
    </div>
  </div>
));

const SuccessModal = React.memo(() => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold mb-2">บันทึกข้อมูลสำเร็จ</h2>
        <p className="text-gray-600">กำลังนำคุณไปยังหน้าแสดงรายการยาเสพติด...</p>
      </div>
    </div>
  </div>
));

const ErrorAlert = React.memo(({ message, onClose }) => (
  <div className="px-6 mb-4">
    <div className="mt-3 px-4 py-3 bg-red-50 border border-red-300 text-red-800 rounded-md" role="alert" aria-live="assertive">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <strong className="font-semibold">เกิดข้อผิดพลาด!</strong>
          <span className="block sm:inline ml-2">{message}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="ปิดข้อความผิดพลาด" className="ml-4 text-red-800 p-1 flex items-center justify-center">
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
));

const BottomBar = React.memo(({ onCancel, submitting }) => (
  <div className="w-full py-4 px-4 flex justify-end border-t border-gray-200 space-x-4 bg-white">
    <button type="button" onClick={onCancel} disabled={submitting} className="w-32 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60">
      ยกเลิก
    </button>
    <button type="submit" disabled={submitting} className={`w-32 py-2 bg-[#990000] rounded-lg text-white shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#7a0000] ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
      {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
    </button>
  </div>
));

// ==================== MAIN COMPONENT ====================
function CreateNarcoticCatalog() {
  const navigate = useNavigate();
  const [evidenceType, setEvidenceType] = useState('');
  const [formData, setFormData] = useState({
    drugType: '', drugCategory: '', characteristics: '', consumptionMethod: '', effect: '', weightGrams: '', formId: ''
  });
  const [pillData, setPillData] = useState({
    color: '', diameter_mm: '', thickness_mm: '', edge_shape: '', characteristics: '', edge_width_mm: '', weight_mg: ''
  });
  const [packageData, setPackageData] = useState({ packageType: '', packageMaterial: '', packageColor: '' });

  const { drugForms, isLoadingDrugForms } = useDrugForms();
  const {
    images, setImages, actualImages, setActualImages, selectedThumb, setSelectedThumb,
    handleImageUpload, handleRemoveImage, handleDragEnd
  } = useImageHandlers();

  const { handleSubmit, isSubmitting, submitSuccess, submitError, setSubmitError } =
    useNarcoticSubmit({ formData, pillData, evidenceType, actualImages, navigate });

  const sensors = useSensors(useSensor(PointerSensor));
  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  const drugFormProps = useMemo(() => ({
    formData, setFormData, evidenceType, setEvidenceType, drugForms, isLoadingDrugForms
  }), [formData, evidenceType, drugForms, isLoadingDrugForms]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full h-full bg-gray-100 shadow-sm overflow-hidden" aria-live="polite">
      <Header onBack={handleGoBack} />

      <div className="flex items-center justify-between w-full px-6">
        <h1 className="text-xl font-bold mb-4">เพิ่มยาเสพติด</h1>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            <DrugFormSection {...drugFormProps} />
            {isPillForm(evidenceType) && <PillCharacteristicsForm pillData={pillData} setPillData={setPillData} />}
            {isPackageForm(evidenceType) && <PackageCharacteristicsForm packageData={packageData} setPackageData={setPackageData} />}
            {evidenceType && <AdditionalInfoForm formData={formData} setFormData={setFormData} />}
          </div>

          <aside className="md:col-span-5 lg:col-span-4">
            <ImageUploadSection
              images={images} setImages={setImages} selectedThumb={selectedThumb} setSelectedThumb={setSelectedThumb}
              handleImageUpload={handleImageUpload} handleRemoveImage={handleRemoveImage} handleDragEnd={handleDragEnd}
              sensors={sensors}
            />
          </aside>
        </div>
      </main>

      {submitSuccess && <SuccessModal />}
      {submitError && <ErrorAlert message={submitError} onClose={() => setSubmitError(null)} />}

      <BottomBar onCancel={handleGoBack} submitting={isSubmitting} />
    </form>
  );
}

export default CreateNarcoticCatalog;