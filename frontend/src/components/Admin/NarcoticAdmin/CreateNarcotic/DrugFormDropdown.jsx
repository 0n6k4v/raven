import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

// ==================== CONSTANTS ====================
const DEFAULT_PLACEHOLDER = "เลือกรูปแบบยาเสพติด";

// ==================== UTILS ====================
const findById = (options = [], id) => options.find(o => String(o.id) === String(id)) || null;

// ==================== COMPONENT ====================
function DrugFormDropdown({
  value,
  options = [],
  isLoading = false,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(() => findById(options, value));
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    setSelectedForm(findById(options, value));
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const idx = selectedForm ? options.findIndex(o => o.id === selectedForm.id) : -1;
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, options, selectedForm]);

  useEffect(() => {
    const el = itemsRef.current[highlightedIndex];
    if (el && isOpen) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const listboxId = useMemo(() => `drugform-listbox-${Math.random().toString(36).slice(2, 9)}`, []);

  const toggleOpen = useCallback(() => {
    if (!isLoading) setIsOpen(v => !v);
  }, [isLoading]);

  const handleSelect = useCallback((form) => {
    setSelectedForm(form);
    onChange && onChange(String(form.id));
    setIsOpen(false);
  }, [onChange]);

  const handleKeyDownButton = useCallback((e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex(prev => {
        const max = Math.max(0, options.length - 1);
        if (e.key === 'ArrowDown') return prev < 0 ? 0 : Math.min(prev + 1, max);
        return prev <= 0 ? max : prev - 1;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  }, [isOpen, options.length, toggleOpen]);

  const handleKeyDownList = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const form = options[highlightedIndex];
      if (form) handleSelect(form);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  }, [highlightedIndex, options, handleSelect]);

  const onMouseEnterItem = useCallback((index) => setHighlightedIndex(index), []);
  const onItemRef = useCallback((el, idx) => { itemsRef.current[idx] = el; }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={style}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`relative w-full px-4 py-3 text-left bg-white border ${isOpen ? 'border-[#990000] ring-2 ring-red-100' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none transition-all duration-200`}
        onClick={toggleOpen}
        onKeyDown={handleKeyDownButton}
        disabled={isLoading}
      >
        <span className={selectedForm ? 'text-gray-900' : 'text-gray-400'}>
          {selectedForm ? selectedForm.name : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isLoading && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2" aria-hidden="true">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-900"></div>
        </div>
      )}

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto ring-1 ring-black ring-opacity-5 focus:outline-none"
          onKeyDown={handleKeyDownList}
        >
          {options && options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">ไม่พบข้อมูลรูปแบบยาเสพติด</div>
          ) : (
            options.map((form, idx) => {
              const isSelected = selectedForm && selectedForm.id === form.id;
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={form.id}
                  ref={el => onItemRef(el, idx)}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${isHighlighted ? 'bg-red-50 text-[#990000]' : 'text-gray-900'} ${isSelected ? 'bg-red-100' : ''}`}
                  onClick={() => handleSelect(form)}
                  onMouseEnter={() => onMouseEnterItem(idx)}
                >
                  <span className="block truncate">{form.name}</span>
                  {isSelected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#990000]">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

DrugFormDropdown.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  options: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired
  })),
  isLoading: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  style: PropTypes.object
};

export default DrugFormDropdown;