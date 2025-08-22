import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// ==================== CONSTANTS ====================
const TYPEAHEAD_TIMEOUT = 700;

// ==================== UTILS ====================
const makeListId = (id) => `dropdown-list-${id || Math.random().toString(36).slice(2, 9)}`;

const defaultSizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-3 py-2 text-base",
  lg: "px-4 py-3 text-lg"
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ==================== CUSTOM HOOKS ====================
function useDropdownLogic({
  options,
  value,
  multiple,
  onChange,
  disabled,
  id
}) {
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
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(options.length * 48 + 16, 240 + 16);

    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  }, [options.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (multiple) {
        setFocusedIndex(options.length ? 0 : -1);
      } else {
        const idx = options.findIndex(o => o.value === value);
        setFocusedIndex(idx >= 0 ? idx : (options.length ? 0 : -1));
      }
      calculatePosition();
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, options, value, multiple, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    buttonRef.current?.focus();
  }, []);

  const handleSelect = useCallback((option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onChange(newValues, newValues.map(v => options.find(opt => opt.value === v)));
    } else {
      onChange(option.value, option);
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  }, [multiple, value, onChange, options]);

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(s => !s);
  }, [disabled]);

  const handleTypeahead = useCallback((char) => {
    if (!char) return;
    window.clearTimeout(typeTimeoutRef.current);
    typeBufferRef.current = (typeBufferRef.current + char).toLowerCase();

    const startIndex = isOpen ? clamp(focusedIndex + 1, 0, options.length - 1) : 0;
    const search = typeBufferRef.current;
    const combined = [...options.slice(startIndex), ...options.slice(0, startIndex)];
    const matchOffset = combined.findIndex(opt => opt.label.toLowerCase().startsWith(search));
    if (matchOffset >= 0) {
      const matchIndex = (startIndex + matchOffset) % options.length;
      if (!isOpen) setIsOpen(true);
      setFocusedIndex(matchIndex);
    }

    typeTimeoutRef.current = window.setTimeout(() => {
      typeBufferRef.current = '';
      typeTimeoutRef.current = null;
    }, TYPEAHEAD_TIMEOUT);
  }, [isOpen, focusedIndex, options]);

  const onButtonKeyDown = useCallback((e) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setFocusedIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex]);
        } else {
          setIsOpen(s => !s);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(options.length - 1);
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          handleTypeahead(e.key);
        }
        break;
    }
  }, [disabled, isOpen, focusedIndex, options, handleSelect, close, handleTypeahead]);

  const onListKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0) {
          e.preventDefault();
          handleSelect(options[focusedIndex]);
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          handleTypeahead(e.key);
        }
        break;
    }
  }, [close, options, focusedIndex, handleSelect, handleTypeahead]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${focusedIndex}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex, isOpen]);

  const isSelected = useCallback((option) => {
    if (multiple) {
      return Array.isArray(value) ? value.includes(option.value) : false;
    } else {
      return value === option.value;
    }
  }, [value, multiple]);

  return {
    isOpen,
    focusedIndex,
    dropdownPosition,
    dropdownRef,
    buttonRef,
    listRef,
    listId,
    setIsOpen,
    setFocusedIndex,
    close,
    toggleDropdown,
    handleSelect,
    onButtonKeyDown,
    onListKeyDown,
    isSelected
  };
}

// ==================== PRESENTATIONAL / PERFORMANCE ====================
const OptionItem = React.memo(function OptionItem({ option, idx, selected, isFocused, onClick, onMouseEnter }) {
  return (
    <button
      key={option.value}
      type="button"
      role="option"
      aria-selected={selected}
      data-index={idx}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        w-full px-4 py-3 text-left transition-colors duration-150 flex items-center justify-between group font-normal
        ${selected ? 'bg-blue-50 text-blue-600' : isFocused ? 'bg-gray-50' : 'text-gray-900'}
        hover:bg-gray-50
      `}
    >
      <span className="font-normal">{option.label}</span>
      {selected && (
        <Check className="w-4 h-4 text-blue-600" aria-hidden="true" />
      )}
    </button>
  );
});

// ==================== MAIN COMPONENT ====================
function Dropdown({
  options = [],
  placeholder = "เลือกตัวเลือก",
  value = "",
  onChange = () => {},
  className = "",
  disabled = false,
  error = false,
  size = "md",
  id,
  name,
  required = false,
  multiple = false
}) {
  const {
    isOpen,
    focusedIndex,
    dropdownPosition,
    dropdownRef,
    buttonRef,
    listRef,
    listId,
    toggleDropdown,
    onButtonKeyDown,
    onListKeyDown,
    handleSelect,
    isSelected,
    close
  } = useDropdownLogic({
    options,
    value,
    multiple,
    onChange,
    disabled,
    id
  });

  const selectedOptions = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? options.filter(option => value.includes(option.value)) : [];
    } else {
      return options.find(option => option.value === value) || null;
    }
  }, [options, value, multiple]);

  const displayText = useMemo(() => {
    if (multiple) {
      if (selectedOptions.length === 0) return placeholder;
      if (selectedOptions.length === 1) return selectedOptions[0].label;
      return `เลือกแล้ว ${selectedOptions.length} รายการ`;
    } else {
      return selectedOptions ? selectedOptions.label : placeholder;
    }
  }, [selectedOptions, placeholder, multiple]);

  const sizeClasses = defaultSizeClasses;
  const baseClasses = `
    w-full text-left bg-white border border-gray-300 rounded
    transition-colors duration-200 ease-in-out focus:outline-none
    flex items-center justify-between ${sizeClasses[size]} font-normal
  `;

  const getButtonClasses = useCallback(() => {
    if (disabled) {
      return `${baseClasses} cursor-not-allowed bg-gray-50 text-gray-400 ${className}`;
    }
    if (error) {
      return `${baseClasses} border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${className}`;
    }
    if (isOpen) {
      return `${baseClasses} ring-2 ring-blue-200 border-blue-500 shadow-md ${className}`;
    }
    return `${baseClasses} hover:shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${className}`;
  }, [baseClasses, className, disabled, error, isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id={id}
        name={name}
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-required={required}
        onClick={toggleDropdown}
        onKeyDown={onButtonKeyDown}
        disabled={disabled}
        className={getButtonClasses()}
      >
        <span className={`${(multiple ? selectedOptions.length > 0 : selectedOptions) ? 'text-gray-700' : 'text-gray-400'} font-normal`}>
          {displayText}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${disabled ? 'opacity-50' : ''}`}
          aria-hidden="true"
        />
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {required ? 'กรุณาเลือกตัวเลือก' : 'ข้อมูลไม่ถูกต้อง'}
        </p>
      )}

      {isOpen && !disabled && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={id}
          aria-multiselectable={multiple}
          onKeyDown={onListKeyDown}
          className={`absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg overflow-hidden ${
            dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="py-2 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                ไม่มีตัวเลือก
              </div>
            ) : (
              options.map((option, idx) => {
                const selected = isSelected(option);
                const isFocused = focusedIndex === idx;
                return (
                  <OptionItem
                    key={option.value}
                    option={option}
                    idx={idx}
                    selected={selected}
                    isFocused={isFocused}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => {
                      const el = idx;
                      const elNode = listRef.current?.querySelector(`[data-index="${el}"]`);
                      elNode?.focus?.();
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(Dropdown);