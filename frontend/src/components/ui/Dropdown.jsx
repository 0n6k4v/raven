import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic & Constants
// ============================================================================

const DROPDOWN_CONSTANTS = {
  TYPEAHEAD_TIMEOUT: 700,
  MAX_HEIGHT: 240,
  ITEM_HEIGHT: 48,
};

const defaultSizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-3 py-2 text-base",
  lg: "px-4 py-3 text-lg"
};

const makeListId = (id) => `dropdown-list-${id || Math.random().toString(36).slice(2, 9)}`;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const SelectionModel = {
  isSelected: (value, optionValue, multiple) => {
    if (multiple) return Array.isArray(value) ? value.includes(optionValue) : false;
    return value === optionValue;
  },
  
  getNewValues: (currentValue, selectedOptionValue, multiple) => {
    if (!multiple) return selectedOptionValue;
    const currentValues = Array.isArray(currentValue) ? currentValue : [];
    return currentValues.includes(selectedOptionValue)
      ? currentValues.filter(v => v !== selectedOptionValue)
      : [...currentValues, selectedOptionValue];
  }
};

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useDropdownLogic({ options, value, multiple, onChange, disabled, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const typeBufferRef = useRef('');
  const typeTimeoutRef = useRef(null);

  const listId = useMemo(() => makeListId(id), [id]);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current || !isOpen) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(options.length * DROPDOWN_CONSTANTS.ITEM_HEIGHT + 16, DROPDOWN_CONSTANTS.MAX_HEIGHT + 16);
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'top' : 'bottom');
  }, [options.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const idx = multiple ? 0 : options.findIndex(o => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : (options.length ? 0 : -1));
      calculatePosition();
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, options, value, multiple, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((option) => {
    const newValue = SelectionModel.getNewValues(value, option.value, multiple);
    const meta = multiple ? newValue.map(v => options.find(o => o.value === v)) : option;
    onChange(newValue, meta);
    if (!multiple) {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  }, [multiple, value, onChange, options]);

  const handleTypeahead = useCallback((char) => {
    if (!char) return;
    window.clearTimeout(typeTimeoutRef.current);
    typeBufferRef.current = (typeBufferRef.current + char).toLowerCase();
    const search = typeBufferRef.current;

    const startIndex = isOpen ? clamp(focusedIndex + 1, 0, options.length - 1) : 0;
    const combined = [...options.slice(startIndex), ...options.slice(0, startIndex)];
    const matchOffset = combined.findIndex(opt => opt.label.toLowerCase().startsWith(search));

    if (matchOffset >= 0) {
      const matchIndex = (startIndex + matchOffset) % options.length;
      if (!isOpen) setIsOpen(true);
      setFocusedIndex(matchIndex);
    }
    typeTimeoutRef.current = setTimeout(() => { typeBufferRef.current = ''; }, DROPDOWN_CONSTANTS.TYPEAHEAD_TIMEOUT);
  }, [isOpen, focusedIndex, options]);

  const onButtonKeyDown = useCallback((e) => {
    if (disabled) return;
    const actions = {
      ArrowDown: () => !isOpen ? setIsOpen(true) : setFocusedIndex(i => Math.min(i + 1, options.length - 1)),
      ArrowUp: () => !isOpen ? setIsOpen(true) : setFocusedIndex(i => Math.max(i - 1, 0)),
      Enter: () => isOpen && focusedIndex >= 0 ? handleSelect(options[focusedIndex]) : setIsOpen(s => !s),
      ' ': () => isOpen && focusedIndex >= 0 ? handleSelect(options[focusedIndex]) : setIsOpen(s => !s),
      Escape: () => setIsOpen(false),
      Home: () => isOpen && setFocusedIndex(0),
      End: () => isOpen && setFocusedIndex(options.length - 1),
    };
    if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) handleTypeahead(e.key);
  }, [disabled, isOpen, focusedIndex, options, handleSelect, handleTypeahead]);

  return {
    isOpen, focusedIndex, dropdownPosition, dropdownRef, buttonRef, listRef, listId,
    setIsOpen, setFocusedIndex, toggleDropdown: () => !disabled && setIsOpen(s => !s),
    handleSelect, onButtonKeyDown, isSelected: (opt) => SelectionModel.isSelected(value, opt.value, multiple)
  };
}

// ============================================================================
// PRESENTATION LAYER - UI Atoms & Composition Root
// ============================================================================

const OptionItem = memo(({ option, idx, selected, isFocused, onClick, onMouseEnter }) => (
  <button
    type="button" role="option" aria-selected={selected} data-index={idx}
    onClick={onClick} onMouseEnter={onMouseEnter}
    className={`
      w-full px-4 py-3 text-left transition-colors duration-150 flex items-center justify-between group font-normal
      ${selected ? 'bg-blue-50 text-blue-600' : isFocused ? 'bg-gray-50' : 'text-gray-900'}
      hover:bg-gray-50
    `}
  >
    <span className="font-normal truncate">{option.label}</span>
    {selected && <Check className="w-4 h-4 text-blue-600" aria-hidden="true" />}
  </button>
));

function Dropdown({
  options = [], placeholder = "เลือกตัวเลือก", value = "", onChange = () => {},
  className = "", disabled = false, error = false, size = "md",
  id, name, required = false, multiple = false
}) {
  const logic = useDropdownLogic({ options, value, multiple, onChange, disabled, id });

  const selectedOptions = useMemo(() => {
    if (multiple) return Array.isArray(value) ? options.filter(o => value.includes(o.value)) : [];
    return options.find(o => o.value === value) || null;
  }, [options, value, multiple]);

  const displayText = useMemo(() => {
    if (multiple) {
      if (selectedOptions.length === 0) return placeholder;
      return selectedOptions.length === 1 ? selectedOptions[0].label : `เลือกแล้ว ${selectedOptions.length} รายการ`;
    }
    return selectedOptions ? selectedOptions.label : placeholder;
  }, [selectedOptions, placeholder, multiple]);

  const buttonClasses = useMemo(() => {
    const base = `w-full text-left bg-white border border-gray-300 rounded transition-all duration-200 focus:outline-none flex items-center justify-between ${defaultSizeClasses[size]} font-normal`;
    if (disabled) return `${base} cursor-not-allowed bg-gray-50 text-gray-400 ${className}`;
    if (error) return `${base} border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${className}`;
    if (logic.isOpen) return `${base} ring-2 ring-blue-200 border-blue-500 shadow-md ${className}`;
    return `${base} hover:shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${className}`;
  }, [size, className, disabled, error, logic.isOpen]);

  return (
    <div className="relative" ref={logic.dropdownRef}>
      <button
        id={id} name={name} ref={logic.buttonRef} type="button"
        aria-haspopup="listbox" aria-expanded={logic.isOpen} aria-controls={logic.listId}
        onClick={logic.toggleDropdown} onKeyDown={logic.onButtonKeyDown} disabled={disabled}
        className={buttonClasses}
      >
        <span className={`${(multiple ? selectedOptions.length > 0 : selectedOptions) ? 'text-gray-700' : 'text-gray-400'} font-normal truncate`}>
          {displayText}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${logic.isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="mt-1 text-sm text-red-600" role="alert">{required ? 'กรุณาเลือกตัวเลือก' : 'ข้อมูลไม่ถูกต้อง'}</p>}

      {logic.isOpen && !disabled && (
        <div
          ref={logic.listRef} id={logic.listId} role="listbox" tabIndex={-1}
          className={`absolute z-50 w-full bg-white border border-gray-300 rounded shadow-xl overflow-hidden ${
            logic.dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } animate-in fade-in slide-in-from-top-1 duration-200`}
        >
          <div className="py-1 max-h-60 overflow-y-auto no-scrollbar">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center text-sm">ไม่มีตัวเลือก</div>
            ) : (
              options.map((option, idx) => (
                <OptionItem
                  key={option.value} option={option} idx={idx}
                  selected={logic.isSelected(option)}
                  isFocused={logic.focusedIndex === idx}
                  onClick={() => logic.handleSelect(option)}
                  onMouseEnter={() => logic.setFocusedIndex(idx)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(Dropdown);