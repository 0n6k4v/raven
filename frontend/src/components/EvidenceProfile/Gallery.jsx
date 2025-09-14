import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IoClose } from 'react-icons/io5';
import { PiImageBroken } from 'react-icons/pi';

// ==================== CONSTANTS ====================
const DEFAULT_NO_IMAGE_MSG = {
  main: "การแสดงผลภาพถ่ายมีปัญหา",
  sub: "ไม่พบภาพที่บันทึกไว้"
};

// ==================== UTILS ====================
const normalizeImageEntry = (img, fallbackName = '') => {
  const url = img.image_url || img.url || '';
  return {
    // prefer stable id if provided, otherwise use url as id (stable across sources)
    id: img.id || url,
    url,
    name: img.description || fallbackName,
    description: img.description || '',
    priority: typeof img.priority === 'number' ? img.priority : undefined,
    raw: img
  };
};

const sortImagesByPriority = (a, b) => {
  const pa = a.priority;
  const pb = b.priority;
  if (pa !== undefined && pb !== undefined) return pa - pb;
  if (pa !== undefined) return -1;
  if (pb !== undefined) return 1;
  return (a.id || 0) - (b.id || 0);
};

const extractCandidateImages = (evidenceData, firearmInfo) => {
  const sources = [];
  if (evidenceData?.example_images?.length) sources.push(...evidenceData.example_images);
  if (firearmInfo?.images?.length) sources.push(...firearmInfo.images);
  if (firearmInfo?.exhibit?.images?.length) sources.push(...firearmInfo.exhibit.images);
  if (firearmInfo?.example_images?.length) sources.push(...firearmInfo.example_images);
  if (firearmInfo?.exhibit?.example_images?.length) sources.push(...firearmInfo.exhibit.example_images);
  return sources;
};

const buildGalleryList = (evidenceData, firearmInfo) => {
  const fallbackName = evidenceData?.drug_type || evidenceData?.characteristics ||
    (firearmInfo ? `${firearmInfo.brand || ''} ${firearmInfo.model || firearmInfo.series || ''}`.trim() : '');
  const imgs = extractCandidateImages(evidenceData, firearmInfo);
  if (!imgs || imgs.length === 0) return [];

  // Deduplicate by URL (prefer first occurrence or smaller priority)
  const map = new Map(); // key: url -> normalized entry
  for (const img of imgs) {
    const url = (img.image_url || img.url || '').trim();
    if (!url) continue;
    const entry = normalizeImageEntry(img, fallbackName);
    if (map.has(url)) {
      const existing = map.get(url);
      // prefer the one with defined lower priority (smaller number)
      if (typeof entry.priority === 'number' && (existing.priority === undefined || entry.priority < existing.priority)) {
        map.set(url, entry);
      }
    } else {
      map.set(url, entry);
    }
  }

  const normalized = Array.from(map.values());
  normalized.sort(sortImagesByPriority);
  return normalized;
};

// ==================== CUSTOM HOOKS ====================
function useGalleryImages(evidence, firearmInfo) {
  const evidenceData = evidence;
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  useEffect(() => {
    const list = buildGalleryList(evidenceData, firearmInfo);
    setGalleryImages(list);
    setSelectedGalleryImage(prev => (list.length && !prev ? list[0] : (prev && list.find(i => i.id === prev.id)) || list[0] || null));
  }, [evidenceData, firearmInfo]);

  const selectImageById = useCallback((id) => {
    setSelectedGalleryImage(galleryImages.find(i => i.id === id) || null);
  }, [galleryImages]);

  return {
    galleryImages,
    selectedGalleryImage,
    setSelectedGalleryImage,
    selectImageById
  };
}

// ==================== PRESENTATIONAL / SMALL COMPONENTS ====================
const NoImageDisplay = React.memo(({ message = DEFAULT_NO_IMAGE_MSG.main, subMessage = DEFAULT_NO_IMAGE_MSG.sub }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-b border-gray-300 h-64 w-full">
    <PiImageBroken className="text-gray-400 text-5xl mb-2" />
    <p className="text-gray-600 text-center">{message}</p>
    {subMessage && <p className="text-gray-400 text-sm text-center mt-1">{subMessage}</p>}
  </div>
));

const ImageView = React.memo(function ImageView({ src, alt, className = '', onClick, onError }) {
  if (!src) return <NoImageDisplay />;
  return (
    <img
      src={src}
      alt={alt || 'Image'}
      className={className}
      onClick={onClick}
      onError={onError}
    />
  );
});

const Thumbnail = React.memo(function Thumbnail({ img, isSelected, onClick, size = 70 }) {
  const containerStyle = { width: `${size}px`, height: `${size}px` };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onClick(img.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(img.id); } }}
      className={`flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-[#990000]/30 ${isSelected ? 'ring-2 ring-[#990000] border-transparent shadow-lg' : 'border border-gray-300 bg-white hover:shadow-sm'}`}
      style={containerStyle}
      aria-label={img.name || 'thumbnail'}
    >
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <img
          src={img.url}
          alt={img.name}
          className="max-w-full max-h-full object-contain p-1"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentNode;
            if (parent) parent.innerHTML = '<div class="text-xs text-center text-gray-400">ไม่สามารถโหลดรูปได้</div>';
          }}
        />
      </div>
    </div>
  );
});

const FullscreenModal = React.memo(function FullscreenModal({ src, onClose, caption }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
      <button
        className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
        onClick={onClose}
        aria-label="Close"
      >
        <IoClose />
      </button>
      <img src={src} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain mb-4 px-4" />
      {caption && <div className="text-white text-center">{caption}</div>}
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
const Gallery = ({ evidence, firearmInfo, userImage: userImageProp }) => {
  const evidenceData = evidence;
  // prefer prop from parent; fallback to localStorage for backward compatibility
  const userImageFromStorage = typeof window !== 'undefined' ? localStorage.getItem('analysisImage') : null;
  const userImage = userImageProp || userImageFromStorage || null;

  const { galleryImages, selectedGalleryImage, setSelectedGalleryImage, selectImageById } = useGalleryImages(evidenceData, firearmInfo);

  const [fullScreen, setFullScreen] = useState(false);
  const [galleryFullScreen, setGalleryFullScreen] = useState(false);

  const userImageSrc = useMemo(() => userImage, [userImage]);
  const galleryImageSrc = selectedGalleryImage?.url;

  const handleThumbnailClick = useCallback((id) => {
    selectImageById(id);
  }, [selectImageById]);

  const handleImageErrorHide = useCallback((e) => {
    e.target.style.display = 'none';
    const next = e.target.nextElementSibling;
    if (next) next.style.display = 'flex';
  }, []);

  return (
    /* reserve space at bottom so content is not covered by BottomBar */
    <div className="bg-white h-full w-full pb-24">
      {/* Mobile */}
      <div className="flex flex-col md:hidden">
        <div className="px-4">
          <div className="p-3">
            <h3 className="text-base font-medium block pb-2 border-b border-gray-300">ภาพถ่าย</h3>
          </div>
          <div className="flex justify-center items-center py-4">
            {userImageSrc ? (
              <ImageView
                src={userImageSrc}
                alt="ภาพวัตถุพยานที่ถ่าย"
                className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
                onClick={() => userImageSrc && setFullScreen(true)}
              />
            ) : <NoImageDisplay />}
          </div>
        </div>

        {fullScreen && userImageSrc && (
          <FullscreenModal src={userImageSrc} onClose={() => setFullScreen(false)} />
        )}

        <div className="px-4">
          <div className="p-3">
            <h3 className="text-base font-medium block pb-2 border-b border-gray-300">ภาพเปรียบเทียบจากคลัง</h3>
          </div>
          <div className="py-2">
            {galleryImages.length > 0 ? (
              selectedGalleryImage ? (
                <div className="flex justify-center items-center py-4">
                  <ImageView
                    src={galleryImageSrc}
                    alt="ภาพวัตถุพยานจากคลัง"
                    className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
                    onClick={() => setGalleryFullScreen(true)}
                    onError={handleImageErrorHide}
                  />
                </div>
              ) : <NoImageDisplay message="กำลังโหลดภาพ..." subMessage="โปรดรอสักครู่" />
            ) : <NoImageDisplay message="ไม่พบภาพเปรียบเทียบ" subMessage="ไม่มีภาพในฐานข้อมูล" />}

            <div className="mt-6">
              {galleryImages.length > 0 && (
                <div className="flex justify-center flex-wrap gap-4 pb-2">
                  {galleryImages.map((img) => (
                    <Thumbnail key={img.id} img={img} isSelected={selectedGalleryImage?.id === img.id} onClick={handleThumbnailClick} size={70} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: make columns full-height; reserve fixed thumbnail bar height so image areas match */}
      <div className="hidden md:flex flex-row pl-4 pr-4 relative h-full">
        {/* left column */}
        <div className="w-1/2 h-full flex flex-col">
          <div className="p-3">
            <h3 className="text-base font-medium inline-block pb-2 border-b border-gray-300 w-full">ภาพถ่ายหลักฐาน</h3>
          </div>
          {/* image area fills remaining vertical space and centers content */}
          <div className="flex-1 flex items-center justify-center p-4">
            {userImageSrc ? (
              <ImageView
                src={userImageSrc}
                alt="ภาพวัตถุพยานที่ถ่าย"
                className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
                onClick={() => userImageSrc && setFullScreen(true)}
              />
            ) : <NoImageDisplay />}
          </div>
          {/* spacer to match thumbnail bar height on right so image areas are equal height */}
          <div className="h-28" aria-hidden="true" />
        </div>

        {fullScreen && userImageSrc && (
          <FullscreenModal src={userImageSrc} onClose={() => setFullScreen(false)} />
        )}

        {/* centered vertical divider (height relative to container) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[80%] w-px bg-gray-300" aria-hidden="true" />

        {/* right column */}
        <div className="w-1/2 h-full flex flex-col">
          <div className="p-3">
            <h3 className="text-base font-medium inline-block pb-2 border-b border-gray-300 w-full">ภาพจากฐานข้อมูล</h3>
          </div>
          {/* main gallery image area fills remaining vertical space */}
          <div className="flex-1 flex items-center justify-center p-4">
            {/* center content horizontally so image is centered even if smaller than column */}
            <div className="w-full flex items-center justify-center">
              {galleryImages.length > 0 ? (
                selectedGalleryImage ? (
                  <ImageView
                    src={galleryImageSrc}
                    alt="ภาพวัตถุพยานจากคลัง"
                    className="max-w-full h-auto max-h-96 object-contain cursor-pointer"
                    onClick={() => setGalleryFullScreen(true)}
                    onError={handleImageErrorHide}
                  />
                ) : <NoImageDisplay message="กำลังโหลดภาพ..." subMessage="โปรดรอสักครู่" />
              ) : <NoImageDisplay message="ไม่พบภาพเปรียบเทียบ" subMessage="ไม่มีภาพในฐานข้อมูล" />}
            </div>
          </div>
          {/* thumbnails area sits at bottom with fixed height (does not shrink flex-1) */}
          <div className="p-4 h-28">
            <div className="mt-6">
              {galleryImages.length > 0 && (
                <div className="flex justify-center flex-wrap gap-4 pb-2">
                  {galleryImages.map((img) => (
                    <Thumbnail key={img.id} img={img} isSelected={selectedGalleryImage?.id === img.id} onClick={handleThumbnailClick} size={75} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {galleryFullScreen && selectedGalleryImage && (
        <div>
          <FullscreenModal
            src={selectedGalleryImage.url}
            caption={selectedGalleryImage.description}
            onClose={() => setGalleryFullScreen(false)}
          />
          {/* move overlay thumbnails above BottomBar (match pb-24) */}
          <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50">
            <div className="flex gap-4 px-4">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className={`flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-shadow ${selectedGalleryImage.id === img.id ? 'ring-2 ring-[#990000] border-transparent shadow-lg' : 'border border-gray-300 bg-white hover:shadow-sm'}`}
                  onClick={() => setSelectedGalleryImage(img)}
                  style={{ width: '80px', height: '80px' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={img.url} alt={img.name} className="max-w-full max-h-full object-contain p-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Gallery);