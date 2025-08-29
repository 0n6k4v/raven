import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiX } from "react-icons/fi";

const FilterTags = ({ labels = [], onRemove = () => {} }) => {
  if (!Array.isArray(labels) || labels.length === 0) return null;

  const tagNodes = useMemo(() => labels.map((item, index) => {
    const key = `${item.type ?? 'unknown'}-${String(item.value ?? '')}-${index}`;
    return (
      <div
        key={key}
        className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
      >
        <span>{item.label}</span>
        <button
          type="button"
          aria-label={`ลบตัวกรอง ${item.label}`}
          className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
          onClick={() => onRemove(item)}
        >
          <FiX size={16} />
        </button>
      </div>
    );
  }), [labels, onRemove]);

  return (
    <div className="flex flex-wrap gap-2 mb-4 px-4 md:px-6" role="list" aria-label="Active filters">
      {tagNodes}
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

export default memo(FilterTags);