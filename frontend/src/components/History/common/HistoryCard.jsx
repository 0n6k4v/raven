import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiEye, FiMapPin, FiCalendar, FiUser, FiEdit, FiTrash, FiMoreVertical } from 'react-icons/fi';
import { FaTags } from 'react-icons/fa6';
import { PiImageBroken } from 'react-icons/pi';

/* ========================= CONSTANTS / UTILS ========================= */
const IMAGE_SIZE = 96;

const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return '';
  return timeStr ? `${dateStr} ${timeStr}` : dateStr;
};

/* ========================= PRESENTATIONAL SUB-COMPONENTS ========================= */
const NoImageDisplay = React.memo(({ message = 'ไม่พบรูปภาพ', subMessage = '', small = false }) => (
  <div
    className={`flex flex-col items-center justify-center ${small ? 'p-1' : 'p-2'} bg-gray-50 rounded-lg border border-slate-200 ${small ? 'h-12 w-12' : 'h-24 w-full'}`}
    role="img"
    aria-label={message}
  >
    <PiImageBroken className={`text-gray-400 ${small ? 'text-lg mb-0' : 'text-2xl mb-1'}`} />
    {!small && (
      <>
        <p className="text-gray-500 text-xs text-center">{message}</p>
        {subMessage && <p className="text-gray-400 text-xs text-center mt-1">{subMessage}</p>}
      </>
    )}
  </div>
));
NoImageDisplay.displayName = 'NoImageDisplay';
NoImageDisplay.propTypes = {
  message: PropTypes.string,
  subMessage: PropTypes.string,
  small: PropTypes.bool,
};

/* ========================= MAIN COMPONENT ========================= */
const HistoryCard = ({ 
  item, 
  onViewDetail, 
  onEditItem, 
  onDeleteItem,
  onLabelItem,
  showDiscoverer = false, 
  showModifier = false,
  isAdmin = false 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && toggleRef.current && !toggleRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [item?.image]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleToggleMenu = useCallback((e) => {
    e?.stopPropagation?.();
    setShowMenu((s) => !s);
  }, []);

  const handleEdit = useCallback((e) => {
    e?.stopPropagation?.();
    if (typeof onEditItem === 'function') onEditItem(item);
    setShowMenu(false);
  }, [onEditItem, item]);

  const handleDelete = useCallback((e) => {
    e?.stopPropagation?.();
    if (typeof onDeleteItem === 'function') onDeleteItem(item);
    setShowMenu(false);
  }, [onDeleteItem, item]);

  const handleLabel = useCallback(() => {
    if (typeof onLabelItem === 'function') onLabelItem(item);
  }, [onLabelItem, item]);

  const handleView = useCallback(() => {
    if (typeof onViewDetail === 'function') onViewDetail(item);
  }, [onViewDetail, item]);

  const hasEditOrDeleteAction = useMemo(() => (typeof onEditItem === 'function' || typeof onDeleteItem === 'function'), [onEditItem, onDeleteItem]);

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden" aria-labelledby={`history-item-${item?.id ?? item?.name}`}>
      <div className="p-4">
        <header className="flex justify-between items-start mb-3">
          <h3 id={`history-item-${item?.id ?? item?.name}`} className="text-md font-medium">{item?.category}</h3>

          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-gray-600">
              <FiCalendar className="mr-1" size={12} aria-hidden />
              <span>{formatDateTime(item?.date, item?.time)}</span>
            </div>

            {isAdmin && !onLabelItem && hasEditOrDeleteAction && (
              <div className="relative" ref={menuRef}>
                <button
                  ref={toggleRef}
                  type="button"
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"
                  onClick={handleToggleMenu}
                  aria-haspopup="menu"
                  aria-expanded={showMenu}
                  aria-label="ตัวเลือกเพิ่มเติม"
                >
                  <FiMoreVertical size={18} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 z-10 mt-1 bg-white rounded shadow-lg border border-slate-200 w-36" role="menu" aria-label="เมนูรายการ">
                    {typeof onEditItem === 'function' && (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                        onClick={handleEdit}
                      >
                        <FiEdit size={16} className="text-amber-600" aria-hidden />
                        <span>แก้ไข</span>
                      </button>
                    )}

                    {typeof onDeleteItem === 'function' && (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                        onClick={handleDelete}
                      >
                        <FiTrash size={16} className="text-red-600" aria-hidden />
                        <span>ลบ</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="flex">
          <div className={`flex-shrink-0 w-24 h-24 mr-3 flex items-center justify-center`} style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}>
            {item?.image && !imageError ? (
              <div className="relative w-24 h-24">
                <img
                  src={item.image}
                  alt={item?.name ?? 'รูปภาพวัตถุพยาน'}
                  className="w-24 h-24 object-contain rounded-md"
                  onError={handleImageError}
                />
              </div>
            ) : (
              <NoImageDisplay />
            )}
          </div>

          <div className="flex flex-col justify-between flex-1">
            <div>
              <h4 className="font-medium text-sm mb-1 line-clamp-2">{item?.name}</h4>

              <div className="flex items-start mb-1">
                <FiMapPin size={14} className="text-gray-500 mt-[2px] flex-shrink-0" aria-hidden />
                <p className="text-gray-600 text-sm ml-1 line-clamp-2">{item?.location}</p>
              </div>

              {showDiscoverer && item?.discoverer_name && (
                <div className="flex items-center">
                  <FiUser size={14} className="text-gray-500 flex-shrink-0" aria-hidden />
                  <p className="text-gray-600 text-sm ml-1 truncate">
                    {item.discoverer_name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-2">
              {typeof onLabelItem === 'function' ? (
                <button
                  type="button"
                  onClick={handleLabel}
                  className="px-3 py-1 text-sm flex items-center gap-1 text-blue-700 border border-blue-700 hover:bg-blue-50 rounded"
                  aria-label="ป้ายกำกับ"
                >
                  <FaTags size={14} aria-hidden /> ป้ายกำกับ
                </button>
              ) : typeof onViewDetail === 'function' ? (
                <button
                  type="button"
                  onClick={handleView}
                  className="px-3 py-1 text-sm flex items-center gap-1 text-red-900 border border-red-900 hover:bg-red-50 rounded"
                  aria-label="ดูรายละเอียด"
                >
                  <FiEye size={14} aria-hidden /> ดูรายละเอียด
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {showModifier && item?.modifier_name && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-gray-500 text-xs">แก้ไขล่าสุดโดย: {item.modifier_name}</p>
          </div>
        )}
      </div>
    </article>
  );
};

HistoryCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    image: PropTypes.string,
    name: PropTypes.string,
    location: PropTypes.string,
    discoverer_name: PropTypes.string,
    modifier_name: PropTypes.string,
  }).isRequired,
  onViewDetail: PropTypes.func,
  onEditItem: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onLabelItem: PropTypes.func,
  showDiscoverer: PropTypes.bool,
  showModifier: PropTypes.bool,
  isAdmin: PropTypes.bool,
};

HistoryCard.defaultProps = {
  onViewDetail: undefined,
  onEditItem: undefined,
  onDeleteItem: undefined,
  onLabelItem: undefined,
  showDiscoverer: false,
  showModifier: false,
  isAdmin: false,
};

export default React.memo(HistoryCard);