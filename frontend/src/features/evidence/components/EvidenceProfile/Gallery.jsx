import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { PiImageBroken } from 'react-icons/pi';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class GalleryImageEntity {
  constructor(img, fallbackName = '') {
    this.url = (img.image_url || img.url || '').trim();
    this.id = img.id || this.url;
    this.name = img.description || fallbackName;
    this.description = img.description || '';
    this.priority = typeof img.priority === 'number' ? img.priority : Infinity;
  }

  static fromRaw(img, fallbackName) {
    return new GalleryImageEntity(img, fallbackName);
  }
}

class GalleryService {
  static buildCollection(evidenceData, firearmInfo) {
    const fallbackName = this._getFallbackName(evidenceData, firearmInfo);
    const rawImages = this._extractAllSources(evidenceData, firearmInfo);
    
    if (!rawImages.length) return [];

    const map = new Map();
    rawImages.forEach(img => {
      const entity = GalleryImageEntity.fromRaw(img, fallbackName);
      if (!entity.url) return;

      const existing = map.get(entity.url);
      if (!existing || entity.priority < existing.priority) {
        map.set(entity.url, entity);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  static _extractAllSources(ev, fi) {
    return [
      ...(ev?.example_images || []),
      ...(fi?.images || []),
      ...(fi?.exhibit?.images || []),
      ...(fi?.example_images || []),
      ...(fi?.exhibit?.example_images || [])
    ];
  }

  static _getFallbackName(ev, fi) {
    return ev?.drug_type || ev?.characteristics || 
           (fi ? `${fi.brand || ''} ${fi.model || fi.series || ''}`.trim() : '');
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useGallery(evidence, firearmInfo, userImageProp) {
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);

  useEffect(() => {
    const collection = GalleryService.buildCollection(evidence, firearmInfo);
    setGalleryImages(collection);
    
    setSelectedImage(prev => {
      if (!collection.length) return null;
      if (!prev) return collection[0];
      return collection.find(img => img.id === prev.id) || collection[0];
    });
  }, [evidence, firearmInfo]);

  const userImage = useMemo(() => {
    if (userImageProp) return userImageProp;
    if (typeof window !== 'undefined') return localStorage.getItem('analysisImage');
    return null;
  }, [userImageProp]);

  const selectById = useCallback((id) => {
    const found = galleryImages.find(img => img.id === id);
    if (found) setSelectedImage(found);
  }, [galleryImages]);

  return {
    userImage,
    galleryImages,
    selectedImage,
    modals: {
      user: { isOpen: userModalOpen, set: setUserModalOpen },
      gallery: { isOpen: galleryModalOpen, set: setGalleryModalOpen }
    },
    actions: { selectById, setSelectedImage }
  };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const NoImagePlaceholder = React.memo(({ title, sub }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-b border-gray-300 h-64 w-full">
    <PiImageBroken className="text-gray-400 text-5xl mb-2" />
    <p className="text-gray-600 text-center">{title || "การแสดงผลภาพถ่ายมีปัญหา"}</p>
    {sub && <p className="text-gray-400 text-sm text-center mt-1">{sub}</p>}
  </div>
));

const RemoteImage = React.memo(({ src, alt, className, onClick, onError }) => {
  if (!src) return <NoImagePlaceholder />;
  return <img src={src} alt={alt} className={className} onClick={onClick} onError={onError} />;
});

const ThumbnailItem = React.memo(({ img, isSelected, onClick, size }) => (
  <div
    role="button"
    tabIndex={0}
    aria-pressed={isSelected}
    onClick={() => onClick(img.id)}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick(img.id))}
    className={`flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-[#990000]/30 ${
      isSelected ? 'ring-2 ring-[#990000] border-transparent shadow-lg' : 'border border-gray-300 bg-white hover:shadow-sm'
    }`}
    style={{ width: `${size}px`, height: `${size}px` }}
  >
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <img
        src={img.url}
        alt={img.name}
        className="max-w-full max-h-full object-contain p-1"
        onError={(e) => {
          const p = e.target.parentNode;
          if (p) p.innerHTML = '<div class="text-[10px] text-center text-gray-400">Error</div>';
        }}
      />
    </div>
  </div>
));

const FullscreenPortal = React.memo(({ src, onClose, caption }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fadeIn">
      <button 
        className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full hover:bg-gray-700"
        onClick={onClose} 
      >
        <IoClose />
      </button>
      <img src={src} alt="Fullscreen" className="max-w-full max-h-[80vh] object-contain mb-4 px-4" />
      {caption && <div className="text-white text-center font-light tracking-wide">{caption}</div>}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const Gallery = ({ evidence, firearmInfo, userImage: userImageProp }) => {
  const { userImage, galleryImages, selectedImage, modals, actions } = useGallery(evidence, firearmInfo, userImageProp);

  const handleImageError = useCallback((e) => {
    e.target.style.display = 'none';
    const next = e.target.nextElementSibling;
    if (next) next.style.display = 'flex';
  }, []);

  return (
    <div className="bg-white h-full w-full pb-24">
      
      <div className="flex flex-col md:hidden">
        <div className="px-4">
          <div className="py-3">
            <h3 className="text-base font-medium block pb-2 border-b border-gray-300">ภาพถ่าย</h3>
          </div>
          <div className="flex justify-center items-center py-4">
            <RemoteImage
              src={userImage}
              alt="ภาพถ่ายหลักฐาน"
              className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
              onClick={() => userImage && modals.user.set(true)}
            />
          </div>
        </div>

        <div className="px-4">
          <div className="py-3">
            <h3 className="text-base font-medium block pb-2 border-b border-gray-300">ภาพเปรียบเทียบจากคลัง</h3>
          </div>
          <div className="py-2">
            {galleryImages.length > 0 ? (
              selectedImage ? (
                <div className="flex justify-center items-center py-4">
                  <RemoteImage
                    src={selectedImage.url}
                    alt="ภาพเปรียบเทียบ"
                    className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
                    onClick={() => modals.gallery.set(true)}
                    onError={handleImageError}
                  />
                </div>
              ) : <NoImagePlaceholder title="กำลังโหลดภาพ..." sub="โปรดรอสักครู่" />
            ) : <NoImagePlaceholder title="ไม่พบภาพเปรียบเทียบ" sub="ไม่มีภาพในฐานข้อมูล" />}

            <div className="mt-6 flex justify-center flex-wrap gap-4 pb-2">
              {galleryImages.map(img => (
                <ThumbnailItem 
                  key={img.id} 
                  img={img} 
                  isSelected={selectedImage?.id === img.id} 
                  onClick={actions.selectById} 
                  size={70} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-row pl-4 pr-4 relative h-full">
        <div className="w-1/2 h-full flex flex-col">
          <div className="p-3">
            <h3 className="text-base font-medium inline-block pb-2 border-b border-gray-300 w-full">ภาพถ่ายหลักฐาน</h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <RemoteImage
              src={userImage}
              alt="หลักฐานจริง"
              className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
              onClick={() => userImage && modals.user.set(true)}
            />
          </div>
          <div className="h-28" aria-hidden="true" />
        </div>

        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[80%] w-px bg-gray-300" aria-hidden="true" />

        <div className="w-1/2 h-full flex flex-col">
          <div className="p-3">
            <h3 className="text-base font-medium inline-block pb-2 border-b border-gray-300 w-full">ภาพจากฐานข้อมูล</h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {galleryImages.length > 0 ? (
              selectedImage ? (
                <RemoteImage
                  src={selectedImage.url}
                  alt="ภาพฐานข้อมูล"
                  className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
                  onClick={() => modals.gallery.set(true)}
                  onError={handleImageError}
                />
              ) : <NoImagePlaceholder title="กำลังโหลด..." />
            ) : <NoImagePlaceholder title="ไม่พบภาพเปรียบเทียบ" />}
          </div>
          
          <div className="p-4 h-28 flex justify-center flex-wrap gap-4 overflow-y-auto">
            {galleryImages.map(img => (
              <ThumbnailItem 
                key={img.id} 
                img={img} 
                isSelected={selectedImage?.id === img.id} 
                onClick={actions.selectById} 
                size={75} 
              />
            ))}
          </div>
        </div>
      </div>

      {modals.user.isOpen && (
        <FullscreenPortal src={userImage} onClose={() => modals.user.set(false)} />
      )}

      {modals.gallery.isOpen && selectedImage && (
        <>
          <FullscreenPortal 
            src={selectedImage.url} 
            caption={selectedImage.description} 
            onClose={() => modals.gallery.set(false)} 
          />
          <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 animate-slideUp">
            <div className="flex gap-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
              {galleryImages.map(img => (
                <div
                  key={img.id}
                  onClick={() => actions.setSelectedImage(img)}
                  className={`flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                    selectedImage.id === img.id ? 'border-[#990000] scale-110 shadow-xl' : 'border-white/20'
                  }`}
                  style={{ width: '80px', height: '80px' }}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-contain bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

Gallery.propTypes = {
  evidence: PropTypes.object,
  firearmInfo: PropTypes.object,
  userImage: PropTypes.string
};

export default React.memo(Gallery);