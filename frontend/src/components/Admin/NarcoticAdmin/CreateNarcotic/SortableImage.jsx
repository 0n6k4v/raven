import React, { useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';

// ==================== CONSTANTS ====================
const SIZE_PX = 64;
const BORDER_RADIUS = '0.375rem';
const SELECTED_BORDER = '2px solid #990000';
const DEFAULT_BORDER = '2px solid #E5E7EB';

// ==================== UTILS ====================
const buildStyle = (transform, transition, isSelected) => ({
  transform: CSS.Transform.toString(transform),
  transition,
  border: isSelected ? SELECTED_BORDER : DEFAULT_BORDER,
  borderRadius: BORDER_RADIUS,
  overflow: 'hidden',
  width: `${SIZE_PX}px`,
  height: `${SIZE_PX}px`,
  display: 'inline-block',
  backgroundColor: '#fff',
});

// ==================== CUSTOM HOOKS ====================
const useSortableImage = (id) => {
  const sortable = useSortable({ id });
  const style = buildStyle(sortable.transform, sortable.transition, false);
  return { ...sortable, style };
};

// ==================== PRESENTATIONAL SUBCOMPONENTS ====================
const RemoveButton = memo(function RemoveButton({ onClick }) {
  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    },
    [onClick]
  );

  return (
    <button
      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700 shadow-md"
      onClick={onClick}
      onKeyDown={handleKey}
      type="button"
      aria-label="ลบรูปภาพ"
    >
      <X size={12} />
    </button>
  );
});

RemoveButton.propTypes = { onClick: PropTypes.func.isRequired };

const ThumbnailImage = memo(function ThumbnailImage({ src, alt, onClick }) {
  return (
    <img
      src={src}
      alt={alt}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="w-full h-full object-contain bg-white"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
});

ThumbnailImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

// ==================== MAIN COMPONENT ====================
const SortableImage = ({ id, src, onSelect, onRemove, isSelected = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = buildStyle(transform, transition, isSelected);

  const handleSelect = useCallback(
    (e) => {
      e?.preventDefault?.();
      onSelect();
    },
    [onSelect]
  );

  const handleRemove = useCallback(
    (e) => {
      e?.stopPropagation?.();
      onRemove();
    },
    [onRemove]
  );

  return (
    <div className="relative group inline-block" ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="w-16 h-16">
        <ThumbnailImage src={src} alt={`thumb-${id}`} onClick={handleSelect} />
        <div
          className={
            isSelected
              ? 'absolute inset-0 bg-black/50 transition-all duration-300 pointer-events-none'
              : 'absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 pointer-events-none'
          }
          aria-hidden="true"
        />
      </div>

      <RemoveButton onClick={handleRemove} />
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