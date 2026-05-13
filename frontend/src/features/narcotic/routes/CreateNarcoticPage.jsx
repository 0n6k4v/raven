import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Lock, ArrowLeft } from 'lucide-react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { NarcoticService } from '../services';
import { useUser } from '../../auth';
import Loading from '../../../components/ui/Loading';
import DrugFormSection from '../components/NarcoticEditor/DrugFormSection';
import PillCharacteristicsForm from '../components/NarcoticEditor/PillCharacteristicsForm';
import PackageCharacteristicsForm from '../components/NarcoticEditor/PackageCharacteristicsForm';
import AdditionalInfoForm from '../components/NarcoticEditor/AdditionalInfoForm';
import ImageUploadSection from '../components/NarcoticEditor/ImageUploadSection';

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useNarcoticAuthorization = () => {
  const { user, isLoading: isAuthLoading } = useUser();
  const isAuthorized = useMemo(() => NarcoticService.canManage(user), [user]);
  return { isAuthorized, isAuthLoading };
};

const useEvidenceTypeCheck = () => {
  return useMemo(() => ({
    isPill: (type) => NarcoticService.constants.PILL_TYPES.includes(type),
    isPackage: (type) => NarcoticService.constants.PACKAGE_TYPES.includes(type),
  }), []);
};

const useNarcoticFormState = () => {
  const [evidenceType, setEvidenceType] = useState('');
  const [formData, setFormData] = useState({ drug_type: '', drug_category: '', characteristics: '', consumption_method: '', effect: '', weight_grams: '', formId: '' });
  const [pillData, setPillData] = useState({ color: '', diameter_mm: '', thickness_mm: '', edge_shape: '', characteristics: '', edge_width_mm: '' });
  const [packageData, setPackageData] = useState({ packageType: '', packageMaterial: '', packageColor: '' });
  
  return {
    evidenceType, setEvidenceType,
    formData, setFormData,
    pillData, setPillData,
    packageData, setPackageData
  };
};

const useImageManager = () => {
  const [images, setImages] = useState([]);
  const [actualImages, setActualImages] = useState([]);
  const [selectedThumb, setSelectedThumb] = useState(0);

  const handleUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newUrls = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newUrls]);
    setActualImages(prev => [...prev, ...files]);
    setSelectedThumb(prev => Math.max(0, prev));
  }, []);

  const handleRemove = useCallback((index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setActualImages(prev => prev.filter((_, i) => i !== index));
    setSelectedThumb(prev => Math.max(0, Math.min(prev, images.length - 2)));
  }, [images.length]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    const oldIndex = images.indexOf(active.id);
    const newIndex = images.indexOf(over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setImages(prev => arrayMove(prev, oldIndex, newIndex));
      setActualImages(prev => arrayMove(prev, oldIndex, newIndex));
      setSelectedThumb(newIndex);
    }
  }, [images]);

  return { images, setImages, actualImages, selectedThumb, setSelectedThumb, handleUpload, handleRemove, handleDragEnd };
};

const useSubmitOrchestrator = (navigate) => {
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  const submit = useCallback(async ({ formData, pillData, evidenceType, actualImages }) => {
    setStatus({ submitting: true, success: false, error: null });
    try {
      await NarcoticService.createFullNarcoticFlow({
        formData,
        pillData,
        evidenceType,
        actualImages
      });

      setStatus({ submitting: false, success: true, error: null });
      setTimeout(() => navigate('/admin/narcotics/catalog-management'), 1200);
    } catch (err) {
      let msg = err.message || 'Unknown error';
      if (err.response?.status === 401) msg = 'กรุณาเข้าสู่ระบบใหม่';
      if (err.response?.status === 422) msg = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      setStatus({ submitting: false, success: false, error: msg });
    }
  }, [navigate]);

  return { status, submit, clearError: () => setStatus(prev => ({ ...prev, error: null })) };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const ForbiddenView = memo(({ onBack }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 p-6 text-center">
    <div className="bg-red-50 p-6 rounded-full mb-6 border border-red-100 shadow-sm">
      <Lock size={64} className="text-red-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
    <p className="text-gray-500 mb-8 max-w-sm">บัญชีของคุณไม่ได้รับอนุญาตให้เพิ่มข้อมูลในส่วนนี้ กรุณาติดต่อผู้ดูแลระบบ</p>
    <button onClick={onBack} className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium text-gray-700 shadow-sm active:scale-95">
      <ArrowLeft size={20} /> กลับไปหน้าแสดงรายการ
    </button>
  </div>
));

const PageHeader = memo(({ onBack }) => (
  <div className="flex items-center justify-between w-full py-4 pl-4 bg-white border-b border-gray-200 sticky top-0 z-10">
    <button type="button" onClick={onBack} className="flex items-center text-[#990000] font-medium hover:opacity-80 transition-opacity">
      <ChevronLeft className="h-5 w-5 mr-1" /> ย้อนกลับ
    </button>
  </div>
));

const PageFooter = memo(({ isSubmitting }) => (
  <div className="w-full py-4 px-6 flex justify-end border-t border-gray-200 bg-white sticky bottom-0 z-10 shadow-inner-sm">
    <button type="submit" disabled={isSubmitting} className={`w-32 py-2 rounded-lg text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#7a0000] ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#990000] hover:opacity-95'}`}>
      {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
    </button>
  </div>
));

const AlertBanner = memo(({ message, onClose }) => (
  <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-300 text-red-800 rounded-md flex justify-between items-center animate-in fade-in">
    <div><strong className="font-semibold">เกิดข้อผิดพลาด!</strong> <span className="ml-2">{message}</span></div>
    <button onClick={onClose} className="text-red-800 p-1 hover:bg-red-100 rounded-full"><X size={16} /></button>
  </div>
));

const SuccessPopup = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm animate-in fade-in">
    <div className="bg-white p-8 rounded-xl shadow-2xl text-center transform scale-100 transition-transform">
      <div className="text-green-500 text-6xl mb-4">✓</div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800">บันทึกข้อมูลสำเร็จ</h2>
      <p className="text-gray-500">กำลังนำคุณไปยังหน้าแสดงรายการ...</p>
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const CreateNarcoticPage = () => {
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));

  const { isAuthorized, isAuthLoading } = useNarcoticAuthorization();
  
  const typeChecker = useEvidenceTypeCheck();
  const { evidenceType, setEvidenceType, formData, setFormData, pillData, setPillData, packageData, setPackageData } = useNarcoticFormState();
  const imageManager = useImageManager();
  const { status, submit, clearError } = useSubmitOrchestrator(navigate);
  
  const [drugForms, setDrugForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;

    const loadForms = async () => {
      setLoadingForms(true);
      try {
        const data = await NarcoticService.fetchDrugForms();
        setDrugForms(data);
      } catch (e) {
        console.error("Failed to load drug forms", e);
      } finally {
        setLoadingForms(false);
      }
    };
    loadForms();
  }, [isAuthorized]);

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({ formData, pillData, evidenceType, actualImages: imageManager.actualImages });
  };

  const drugFormProps = useMemo(() => ({
    formData, setFormData, evidenceType, setEvidenceType, drugForms, isLoadingDrugForms: loadingForms
  }), [formData, evidenceType, drugForms, loadingForms]);

  if (isAuthLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loading /></div>;
  if (!isAuthorized) return <ForbiddenView onBack={() => navigate('/admin/narcotics/catalog-management')} />;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full h-full bg-gray-50 overflow-hidden">
      <PageHeader onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-6 pb-2"><h1 className="text-2xl font-bold text-gray-800">เพิ่มยาเสพติด</h1></div>
        
        {status.error && <AlertBanner message={status.error} onClose={clearError} />}

        <div className="px-6 pb-6 pt-4 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            <DrugFormSection {...drugFormProps} />
            {typeChecker.isPill(evidenceType) && <PillCharacteristicsForm pillData={pillData} setPillData={setPillData} formData={formData} setFormData={setFormData} />}
            {typeChecker.isPackage(evidenceType) && <PackageCharacteristicsForm packageData={packageData} setPackageData={setPackageData} />}
            {evidenceType && <AdditionalInfoForm formData={formData} setFormData={setFormData} />}
          </div>

          <aside className="md:col-span-5 lg:col-span-4">
            <div className="sticky top-6">
              <ImageUploadSection
                images={imageManager.images}
                setImages={imageManager.setImages}
                selectedThumb={imageManager.selectedThumb}
                setSelectedThumb={imageManager.setSelectedThumb}
                handleImageUpload={imageManager.handleUpload}
                handleRemoveImage={imageManager.handleRemove}
                handleDragEnd={imageManager.handleDragEnd}
                sensors={sensors}
              />
            </div>
          </aside>
        </div>
      </div>

      <PageFooter isSubmitting={status.submitting} />
      {status.success && <SuccessPopup />}
    </form>
  );
};

export default CreateNarcoticPage;