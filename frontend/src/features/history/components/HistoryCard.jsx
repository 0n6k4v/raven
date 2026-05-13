import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiEye, FiMapPin, FiCalendar, FiClock, FiUser, FiEdit, FiTrash, FiMoreVertical } from 'react-icons/fi';
import { FaTags } from 'react-icons/fa6';
import { PiImageBroken } from 'react-icons/pi';
import { HistoryAccessPolicy } from '../utils';
import { HistoryItemEntity } from '../entities';

const useDropdownMenu = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback((e) => { e?.stopPropagation?.(); setIsOpen(prev => !prev); }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          toggleRef.current && !toggleRef.current.contains(event.target)) { close(); }
    };
    const handleKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [close]);
  return { isOpen, toggle, close, menuRef, toggleRef };
};

const useImageLoader = (src) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => setHasError(false), [src]);
  const handleError = useCallback(() => setHasError(true), []);
  return { hasError, handleError };
};

const NoImageDisplay = React.memo(({ message = 'ไม่พบรูปภาพ', subMessage = '', small = false }) => (
  <div className={`flex flex-col items-center justify-center ${small ? 'p-1' : 'p-2'} bg-gray-50 rounded-lg border border-slate-200 ${small ? 'h-12 w-12' : 'h-24 w-full'}`} role="img" aria-label={message}>
    <PiImageBroken className={`text-gray-400 ${small ? 'text-lg mb-0' : 'text-2xl mb-1'}`} />
    {!small && (
      <>
        <p className="text-gray-500 text-xs text-center">{message}</p>
        {subMessage && <p className="text-gray-400 text-xs text-center mt-1">{subMessage}</p>}
      </>
    )}
  </div>
));

const AdminActionMenu = React.memo(({ isOpen, onEdit, onDelete }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute right-0 z-10 mt-1 bg-white rounded shadow-lg border border-slate-200 w-36" role="menu" aria-label="เมนูรายการ">
      {onEdit && (
        <button type="button" role="menuitem" className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" onClick={onEdit}>
          <FiEdit size={16} className="text-amber-600" aria-hidden /> <span>แก้ไข</span>
        </button>
      )}
      {onDelete && (
        <button type="button" role="menuitem" className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" onClick={onDelete}>
          <FiTrash size={16} className="text-red-600" aria-hidden /> <span>ลบ</span>
        </button>
      )}
    </div>
  );
});

const HistoryCard = ({ 
  item: rawItem, 
  onViewDetail, 
  onEditItem, 
  onDeleteItem,
  onLabelItem,
  showDiscoverer = false, 
  showModifier = false,
  isAdmin = false 
}) => {
  const entity = useMemo(() => HistoryItemEntity.fromApi(rawItem), [rawItem]);

  const displayName = useMemo(() => entity._determineDisplayName(entity), [entity]);
  const displayLocation = useMemo(() => entity._buildFullLocationString(entity), [entity]);
  const displayTime = useMemo(() => entity._parseTime(entity), [entity]);
  const displayImage = entity.image; 
  const displayDate = entity.date;   

  const { isOpen, toggle, menuRef, toggleRef } = useDropdownMenu();
  const { hasError, handleError } = useImageLoader(displayImage);

  const hasEditOrDelete = useMemo(() => !!(onEditItem || onDeleteItem), [onEditItem, onDeleteItem]);
  
  const shouldShowAdminMenu = HistoryAccessPolicy.canShowAdminMenu({ 
    isAdmin, hasActions: hasEditOrDelete, hasLabelAction: !!onLabelItem 
  });

  const handleAction = useCallback((callback) => (e) => {
    e?.stopPropagation?.();
    if (typeof callback === 'function') callback(rawItem);
  }, [rawItem]);

  const cardId = `card-${entity.key}`;

  return (
    <article className="bg-white rounded-lg shadow-xs overflow-hidden border border-slate-200" aria-labelledby={cardId}>
      <div className="p-4">
        <header className="flex justify-between items-start mb-3">
          <h3 id={cardId} className="text-md font-bold text-red-900">{entity.category}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-gray-600 gap-3">
              <div className="flex items-center"><FiCalendar className="mr-1" size={12} aria-hidden /> <span>{displayDate}</span></div>
              <div className="flex items-center"><FiClock className="mr-1" size={12} aria-hidden /> <span>{displayTime} น.</span></div>
            </div>
            {shouldShowAdminMenu && (
              <div className="relative" ref={menuRef}>
                <button ref={toggleRef} type="button" className="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" onClick={toggle} aria-haspopup="menu" aria-expanded={isOpen} aria-label="ตัวเลือกเพิ่มเติม">
                  <FiMoreVertical size={18} />
                </button>
                <AdminActionMenu isOpen={isOpen} onEdit={onEditItem ? handleAction(onEditItem) : null} onDelete={onDeleteItem ? handleAction(onDeleteItem) : null} />
              </div>
            )}
          </div>
        </header>

        <div className="flex">
          <div className="flex-shrink-0 mr-3 flex items-center justify-center bg-slate-50 rounded-md border border-slate-100 overflow-hidden" style={{ width: 96, height: 96 }}>
            {displayImage && !hasError ? (
              <div className="relative w-full h-full">
                <img src={displayImage} alt={entity.altText} className="w-full h-full object-contain" onError={handleError} />
              </div>
            ) : <NoImageDisplay small />}
          </div>

          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <h4 className="font-bold text-sm mb-1 line-clamp-2 text-slate-800">{displayName}</h4>
              <div className="flex items-start mb-1">
                <FiMapPin size={14} className="text-gray-500 mt-[2px] flex-shrink-0" aria-hidden />
                <p className="text-gray-600 text-xs ml-1 line-clamp-2">{displayLocation}</p>
              </div>
              {showDiscoverer && entity.discoverer_name && (
                <div className="flex items-center">
                  <FiUser size={12} className="text-gray-400 flex-shrink-0" aria-hidden />
                  <p className="text-gray-500 text-[11px] ml-1 truncate">โดย: {entity.discoverer_name}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-2">
              {onLabelItem ? (
                <button type="button" onClick={handleAction(onLabelItem)} className="px-3 py-1 text-xs flex items-center gap-1 text-blue-700 border border-blue-700 hover:bg-blue-50 rounded transition-colors" aria-label="ป้ายกำกับ">
                  <FaTags size={14} aria-hidden /> ป้ายกำกับ
                </button>
              ) : onViewDetail ? (
                <button type="button" onClick={handleAction(onViewDetail)} className="px-3 py-1 text-xs flex items-center gap-1 text-red-900 border border-red-900 hover:bg-red-50 rounded font-medium transition-colors" aria-label="ดูรายละเอียด">
                  <FiEye size={14} aria-hidden /> รายละเอียด
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {showModifier && entity.modifier_name && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-gray-400 text-[10px] italic">แก้ไขล่าสุดโดย: {entity.modifier_name}</p>
          </div>
        )}
      </div>
    </article>
  );
};

HistoryCard.propTypes = {
  item: PropTypes.object.isRequired,
  onViewDetail: PropTypes.func,
  onEditItem: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onLabelItem: PropTypes.func,
  showDiscoverer: PropTypes.bool,
  showModifier: PropTypes.bool,
  isAdmin: PropTypes.bool,
};

export default React.memo(HistoryCard);