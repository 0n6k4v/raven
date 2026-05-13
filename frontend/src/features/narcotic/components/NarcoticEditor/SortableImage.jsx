import React, { useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';

// ============================================================================
// DOMAIN LAYER - Style Logic & Constants
// ============================================================================

const STYLE_CONFIG = {
  SIZE: '64px',
  BORDER_RADIUS: '0.375rem',
  BORDERS: {
    SELECTED: '2px solid #990000',
    DEFAULT: '2px solid #E5E7EB',
  }
};

class DragStyleService {
  static compute(transform, transition, isSelected) {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      border: isSelected ? STYLE_CONFIG.BORDERS.SELECTED : STYLE_CONFIG.BORDERS.DEFAULT,
      borderRadius: STYLE_CONFIG.BORDER_RADIUS,
      overflow: 'hidden',
      width: STYLE_CONFIG.SIZE,
      height: STYLE_CONFIG.SIZE,
      display: 'inline-block',
      backgroundColor: '#fff',
      position: 'relative',
      touchAction: 'none'
    };
  }
}

// ============================================================================
// PRESENTATION LAYER - Atomic Components
// ============================================================================

const DeleteBadge = memo(({ onClick }) => {
  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  }, [onClick]);

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKey}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700 shadow-md z-10 focus:opacity-100"
      aria-label="ลบรูปภาพ"
    >
      <X size={12} />
    </button>
  );
});

const SelectionOverlay = memo(({ isSelected }) => (
  <div
    className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
      isSelected 
        ? 'bg-black/50' 
        : 'bg-black/0 group-hover:bg-black/20'
    }`}
    aria-hidden="true"
  />
));

const ImageContent = memo(({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    className="w-full h-full object-contain bg-white select-none pointer-events-none" // Prevent native drag
    onError={(e) => { e.currentTarget.style.display = 'none'; }}
  />
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const SortableImage = ({ id, src, onSelect, onRemove, isSelected = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = useMemo(
    () => ({
      ...DragStyleService.compute(transform, transition, isSelected),
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 999 : 'auto'
    }),
    [transform, transition, isSelected, isDragging]
  );

  const handleSelect = useCallback((e) => {
    if (!isDragging) onSelect();
  }, [isDragging, onSelect]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove();
  }, [onRemove]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group cursor-grab active:cursor-grabbing"
      onClick={handleSelect}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(); }}
    >
      <div className="relative w-full h-full">
        <ImageContent src={src} alt={`thumb-${id}`} />
        <SelectionOverlay isSelected={isSelected} />
      </div>

      <DeleteBadge onClick={handleRemove} />
    </div>
  );
};

SortableImage.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  src: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
};

export default memo(SortableImage);