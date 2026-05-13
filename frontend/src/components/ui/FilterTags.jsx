import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiX } from "react-icons/fi";

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class FilterTagEntity {
  constructor(item, index) {
    this.type = item?.type ?? 'unknown';
    this.value = String(item?.value ?? '');
    this.label = item?.label || '';
    this.index = index;
    this.originalItem = item;
  }

  get uniqueKey() {
    return `${this.type}-${this.value}-${this.index}`;
  }

  get ariaLabel() {
    return `ลบตัวกรอง ${this.label}`;
  }

  static fromList(labels) {
    if (!Array.isArray(labels)) return [];
    return labels.map((item, index) => new FilterTagEntity(item, index));
  }
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const TagItem = React.memo(({ label, ariaLabel, onRemove }) => (
  <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
    <span>{label}</span>
    <button
      type="button"
      aria-label={ariaLabel}
      className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
      onClick={onRemove}
    >
      <FiX size={16} />
    </button>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const FilterTags = ({ labels = [], onRemove = () => {} }) => {
  const entities = useMemo(() => FilterTagEntity.fromList(labels), [labels]);

  if (entities.length === 0) return null;

  return (
    <div 
      className="flex flex-wrap gap-2 py-2" 
      role="list" 
      aria-label="Active filters"
    >
      {entities.map((tag) => (
        <TagItem
          key={tag.uniqueKey}
          label={tag.label}
          ariaLabel={tag.ariaLabel}
          onRemove={() => onRemove(tag.originalItem)}
        />
      ))}
    </div>
  );
};

FilterTags.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    value: PropTypes.any,
    label: PropTypes.string.isRequired,
  })),
  onRemove: PropTypes.func,
};

export default React.memo(FilterTags);