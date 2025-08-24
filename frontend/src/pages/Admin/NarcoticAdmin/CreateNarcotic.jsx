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

// ==================== UTILS ====================
const isPillForm = (evidenceType) => {
    const pillTypes = ['เม็ด', 'เม็ดยา', 'ยาเม็ด', 'แคปซูล', 'ยาแคปซูล'];
    return pillTypes.includes(evidenceType);
};
const isPackageForm = (evidenceType) => {
    const packageTypes = ['หีบห่อ', 'ซอง', 'บรรจุภัณฑ์', 'แพคเกจ'];
    return packageTypes.includes(evidenceType);
};
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// ==================== CUSTOM HOOKS ====================
const getDrugForms = async () => {
  try {
    const response = await api.get(`${BASE_URL}/drug-forms`);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching drug forms:', error);
    throw error;
  }
};

// ==================== MAIN COMPONENT ====================
function CreateNarcoticCatalog() {
    const navigate = useNavigate();
    const [evidenceType, setEvidenceType] = useState("");
    const [formData, setFormData] = useState({
        drugType: "",
        drugCategory: "",
        characteristics: "",
        consumptionMethod: "",
        effect: "",
        weightGrams: "",
        formId: ""
    });
    const [pillData, setPillData] = useState({
        color: "",
        diameter_mm: "",
        thickness_mm: "",
        edge_shape: "",
        characteristics: "",
        edge_width_mm: "",
        weight_mg: ""
    });
    const [packageData, setPackageData] = useState({
        packageType: "",
        packageMaterial: "",
        packageColor: ""
    });

    const [images, setImages] = useState([]);
    const [actualImages, setActualImages] = useState([]);
    const [selectedThumb, setSelectedThumb] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [drugForms, setDrugForms] = useState([]);
    const [isLoadingDrugForms, setIsLoadingDrugForms] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchDrugForms = async () => {
            setIsLoadingDrugForms(true);
            try {
                const data = await getDrugForms();
                if (mounted) setDrugForms(data || []);
            } catch (err) {
                console.error('Error fetching drug forms:', err);
                setSubmitError('ไม่สามารถโหลดข้อมูลรูปแบบยาเสพติดได้');
            } finally {
                if (mounted) setIsLoadingDrugForms(false);
            }
        };
        fetchDrugForms();
        return () => { mounted = false; };
    }, []);

    const sensors = useSensors(useSensor(PointerSensor));

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
            const newLen = images.length - 1;
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

    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            const exhibitResponse = await api.post(`${BASE_URL}/exhibits`, {
                exhibit: {
                    category: 'ยาเสพติด',
                    subcategory: formData.drugType || ''
                }
            });

            if (!exhibitResponse?.data?.id) throw new Error('ไม่สามารถสร้างรายการยาเสพติดได้');
            const exhibitId = exhibitResponse.data.id;

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

            const narcoticResponse = await api.post(`${BASE_URL}/narcotic`, narcoticPayload);
            if (!narcoticResponse?.data?.id) throw new Error('ไม่สามารถบันทึกข้อมูลยาเสพติดได้');
            const narcoticId = narcoticResponse.data.id;

            if (isPillForm(evidenceType)) {
                await api.post(`${BASE_URL}/narcotics/pill`, {
                    narcotic_id: narcoticId,
                    color: pillData.color || '',
                    diameter_mm: pillData.diameter_mm ? parseFloat(pillData.diameter_mm) : null,
                    thickness_mm: pillData.thickness_mm ? parseFloat(pillData.thickness_mm) : null,
                    edge_shape: pillData.edge_shape || '',
                    characteristics: pillData.characteristics || '',
                    edge_width_mm: pillData.edge_width_mm ? parseFloat(pillData.edge_width_mm) : null,
                    weight_mg: pillData.weight_mg ? parseFloat(pillData.weight_mg) : null
                });
            }

            for (let i = 0; i < actualImages.length; i++) {
                try {
                    const imageFormData = new FormData();
                    imageFormData.append('file', actualImages[i]);
                    imageFormData.append('description', `รูปภาพ ${formData.drugType || 'ยาเสพติด'} #${i + 1}`);
                    imageFormData.append('priority', String(i));
                    imageFormData.append('image_type', 'example');

                    const imageResponse = await api.post(
                        `${BASE_URL}/exhibits/${exhibitId}/narcotic/${narcoticId}/images`,
                        imageFormData,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );

                    if (imageResponse?.data?.id) {
                        const vectorFormData = new FormData();
                        vectorFormData.append('file', actualImages[i]);
                        vectorFormData.append('narcotic_id', narcoticId);
                        vectorFormData.append('image_id', imageResponse.data.id);
                        await api.post(`${BASE_URL}/narcotics/images/vector`, vectorFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    }
                } catch (imgErr) {
                    console.error('Image upload error', imgErr);
                }
            }

            setSubmitSuccess(true);
            setTimeout(() => navigate('/selectCatalogType/drugs-catalog'), 1500);
        } catch (error) {
            console.error('Error creating narcotic:', error);
            if (error?.response) {
                const status = error.response.status;
                if (status === 401) setSubmitError('กรุณาเข้าสู่ระบบใหม่');
                else if (status === 422) {
                    const errorMsg = error.response.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : 'ข้อมูลไม่ถูกต้อง';
                    setSubmitError(`ข้อมูลไม่ถูกต้อง: ${errorMsg}`);
                } else {
                    setSubmitError(`เกิดข้อผิดพลาด (${status}): ${error.response.data?.message || 'โปรดลองอีกครั้ง'}`);
                }
            } else if (error?.request) {
                setSubmitError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ โปรดตรวจสอบการเชื่อมต่อของคุณ');
            } else {
                setSubmitError(`เกิดข้อผิดพลาด: ${error?.message || 'ไม่ทราบสาเหตุ'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, pillData, evidenceType, actualImages, navigate]);

    const handleGoBack = useCallback(() => navigate(-1), [navigate]);

    const drugFormProps = useMemo(() => ({
        formData, setFormData, evidenceType, setEvidenceType, drugForms, isLoadingDrugForms
    }), [formData, evidenceType, drugForms, isLoadingDrugForms]);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col w-full h-full bg-gray-100 shadow-sm overflow-hidden" aria-live="polite">
            {/* Header with back button */}
            <div className="flex items-center justify-between w-full py-4 pl-4">
                <div className="flex items-center">
                    <button type="button" className="flex items-center text-[#990000] font-medium" onClick={handleGoBack}>
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        ย้อนกลับ
                    </button>
                </div>
            </div>
            
            {/* Page Title */}
            <div className="flex items-center justify-between w-full px-6">
                <h1 className="text-xl font-bold mb-4">เพิ่มยาเสพติด</h1>
            </div>

            {/* Content area with scroll */}
            <main className="flex-1 overflow-auto">
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column - Adjusted to be more balanced */}
                    <div className="md:col-span-7 lg:col-span-8 space-y-6">
                        {/* Drug Form Section */}
                        <DrugFormSection {...drugFormProps} />

                        {/* Pill Characteristics Form */}
                        {isPillForm(evidenceType) && <PillCharacteristicsForm pillData={pillData} setPillData={setPillData} />}

                        {/* Package Characteristics Form */}
                        {isPackageForm(evidenceType) && <PackageCharacteristicsForm packageData={packageData} setPackageData={setPackageData} />}

                        {/* Additional Information Form */}
                        {evidenceType && <AdditionalInfoForm formData={formData} setFormData={setFormData} />}
                    </div>

                    {/* Right Column */}
                    <aside className="md:col-span-5 lg:col-span-4">
                        <ImageUploadSection
                            images={images}
                            setImages={setImages}
                            selectedThumb={selectedThumb}
                            setSelectedThumb={setSelectedThumb}
                            handleImageUpload={handleImageUpload}
                            handleRemoveImage={handleRemoveImage}
                            handleDragEnd={handleDragEnd}
                            sensors={sensors}
                        />
                    </aside>
                </div>
            </main>

            {/* Success Message */}
            {submitSuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <div className="text-center">
                            <div className="text-green-500 text-5xl mb-4">✓</div>
                            <h2 className="text-xl font-bold mb-2">บันทึกข้อมูลสำเร็จ</h2>
                            <p className="text-gray-600">กำลังนำคุณไปยังหน้าแสดงรายการยาเสพติด...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Inline error alert placed above bottom action bar (not fixed) */}
            {submitError && (
              <div className="px-6 mb-4">
                <div
                  className="mt-3 px-4 py-3 bg-red-50 border border-red-300 text-red-800 rounded-md"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <strong className="font-semibold">เกิดข้อผิดพลาด!</strong>
                      <span className="block sm:inline ml-2">{submitError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      aria-label="ปิดข้อความผิดพลาด"
                      className="ml-4 text-red-800 p-1 flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fixed Bottom Bar */}
            <div className="w-full py-4 px-4 flex justify-end border-t border-gray-200 space-x-4 bg-white">
                <button
                    type="button"
                    onClick={handleGoBack}
                    disabled={isSubmitting}
                    className="w-32 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-32 py-2 bg-[#990000] rounded-lg text-white shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#7a0000] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </div>
        </form>
    );
}

export default CreateNarcoticCatalog;