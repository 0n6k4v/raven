import React, { useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableImage from './SortableImage';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class ImageMetadataService {
  static createThumbnailList(images = []) {
    return images.map((src, index) => ({
      id: `${index}-${String(src)}`,
      src,
      index
    }));
  }

  static getSelectedImage(images, index) {
    if (!images || images.length === 0) return null;
    return images[index] ?? images[0];
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useImageActions = ({ setSelectedThumb, handleRemoveImage, handleImageUpload }) => {
  const onSelect = useCallback((index) => () => setSelectedThumb(index), [setSelectedThumb]);
  
  const onRemove = useCallback((index) => () => handleRemoveImage(index), [handleRemoveImage]);
  
  const onUpload = useCallback((e) => {
    if (!e?.target) return;
    handleImageUpload(e);

    try { e.target.value = ''; } catch (err) { /* ignore */ }
  }, [handleImageUpload]);

  return { onSelect, onRemove, onUpload };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const PlaceholderView = memo(() => (
  <div className="w-full h-56 bg-gray-100 rounded-md flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200" role="img" aria-label="ไม่มีรูปภาพ">
    <div className="mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
    <p>ยังไม่มีรูปภาพ</p>
    <p className="text-xs mt-1">อัพโหลดรูปภาพด้านล่าง</p>
  </div>
));

const MainPreview = memo(({ src, index }) => {
  if (!src) return <PlaceholderView />;

  return (
    <div className="relative w-full h-56">
      <img
        src={src}
        alt={`Preview image ${index + 1}`}
        className="w-full h-full object-contain rounded-md"
      />
    </div>
  );
});

const UploadTrigger = memo(({ onChange }) => (
  <label
    className="w-16 h-16 rounded border-2 border-dashed border-[#990000] flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 transition-colors duration-300"
    aria-label="เพิ่มรูปภาพ"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
  >
    <Plus className="h-5 w-5 text-[#990000]" aria-hidden />
    <span className="text-[10px] text-[#990000] mt-1">เพิ่มรูปภาพ</span>
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={onChange}
      className="hidden"
      aria-hidden="true"
    />
  </label>
));

const DraggableThumbnailGrid = memo(({ thumbnails, selectedIndex, onSelect, onRemove, onUpload }) => {
  const sortableIds = useMemo(() => thumbnails.map(t => t.id), [thumbnails]);

  return (
    <div className="flex items-center gap-3 mb-3 flex-wrap" role="list">
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {thumbnails.map((t) => (
          <div key={t.id} role="listitem">
            <SortableImage
              id={t.id}
              src={t.src}
              isSelected={selectedIndex === t.index}
              onSelect={onSelect(t.index)}
              onRemove={onRemove(t.index)}
            />
          </div>
        ))}
      </SortableContext>
      <UploadTrigger onChange={onUpload} />
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const ImageUploadSection = ({
  images = [],
  selectedThumb = 0,
  setSelectedThumb,
  handleImageUpload,
  handleRemoveImage,
  handleDragEnd,
  sensors,
}) => {
  const thumbnails = useMemo(() => ImageMetadataService.createThumbnailList(images), [images]);
  const activeImageSrc = useMemo(() => ImageMetadataService.getSelectedImage(images, selectedThumb), [images, selectedThumb]);
  const { onSelect, onRemove, onUpload } = useImageActions({ setSelectedThumb, handleRemoveImage, handleImageUpload });

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-4">อัพโหลดรูปภาพ</h2>

      <div className="bg-gray-50 rounded-md mb-5 shadow-inner overflow-hidden">
        <MainPreview src={activeImageSrc} index={selectedThumb} />
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-3">รูปภาพทั้งหมด ({images.length})</h3>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <DraggableThumbnailGrid 
          thumbnails={thumbnails}
          selectedIndex={selectedThumb}
          onSelect={onSelect}
          onRemove={onRemove}
          onUpload={onUpload}
        />
      </DndContext>

      {images.length > 0 && (
        <p className="text-xs text-gray-500 mt-2" aria-live="polite">*สามารถลากเพื่อจัดเรียงรูปภาพได้</p>
      )}
    </div>
  );
};

ImageUploadSection.propTypes = {
  images: PropTypes.array.isRequired,
  selectedThumb: PropTypes.number,
  setSelectedThumb: PropTypes.func.isRequired,
  handleImageUpload: PropTypes.func.isRequired,
  handleRemoveImage: PropTypes.func.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  sensors: PropTypes.array,
};

export default memo(ImageUploadSection);