import React, { memo, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FiEye, FiEdit, FiTrash } from 'react-icons/fi';
import { FaTags } from 'react-icons/fa6';
import { PiImageBroken } from "react-icons/pi";

/* ========================= CONSTANTS ========================= */
const IMAGE_SIZE_PX = 48;

/* ========================= PRESENTATIONAL SUB-COMPONENTS ========================= */
const DefaultNoImage = memo(({ small = true }) => (
  <div
    className={`flex flex-col items-center justify-center p-1 bg-gray-50 rounded-lg border border-slate-200 ${small ? 'h-12 w-12' : 'h-24 w-24'}`}
    role="img"
    aria-label="ไม่มีรูปภาพ"
  >
    <PiImageBroken className="text-gray-400 text-lg" aria-hidden />
  </div>
));
DefaultNoImage.displayName = 'DefaultNoImage';
DefaultNoImage.propTypes = { small: PropTypes.bool };

/* ========================= MAIN COMPONENT ========================= */
const HistoryTableRow = ({
  item,
  onViewDetail,
  onEditItem,
  onDeleteItem,
  onLabelItem,
  showActionColumn = true,
  showRecorderInfo = false,
  isAdmin = false,
  NoImageComponent = null
}) => {
  const [imageError, setImageError] = useState(false);

  // detect whether NoImageComponent is a React element instance or a component type
  const isElementInstance = React.isValidElement(NoImageComponent);
  const NoImage = (!NoImageComponent || isElementInstance) ? DefaultNoImage : NoImageComponent;

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleView = useCallback(() => {
    if (typeof onViewDetail === 'function') onViewDetail(item);
  }, [onViewDetail, item]);

  const handleEdit = useCallback(() => {
    if (typeof onEditItem === 'function') onEditItem(item);
  }, [onEditItem, item]);

  const handleDelete = useCallback(() => {
    if (typeof onDeleteItem === 'function') onDeleteItem(item);
  }, [onDeleteItem, item]);

  const handleLabel = useCallback(() => {
    if (typeof onLabelItem === 'function') onLabelItem(item);
  }, [onLabelItem, item]);

  const imageCell = useMemo(() => {
    if (item?.image && !imageError) {
      return (
        <div className="relative" style={{ width: IMAGE_SIZE_PX, height: IMAGE_SIZE_PX }}>
          <img
            src={item.image}
            alt={item?.name ?? 'รูปภาพวัตถุพยาน'}
            className="h-12 w-12 object-contain rounded-md"
            onError={handleImageError}
          />
        </div>
      );
    }

    // if a React element instance was provided, clone it and pass small prop
    if (isElementInstance) {
      return React.cloneElement(NoImageComponent, { small: true });
    }

    // otherwise render the component type (DefaultNoImage or provided component type)
    return <NoImage small />;
  }, [item?.image, item?.name, imageError, handleImageError, NoImageComponent, NoImage, isElementInstance]);

  return (
    <tr className="border-b border-slate-200 hover:bg-gray-50" role="row" aria-rowindex={item?.id ?? undefined}>
      {/* Date and Time */}
      <td className="p-3" role="cell">
        <div className="text-gray-900" aria-label="วันที่">{item?.date ?? ''}</div>
        {item?.time && <div className="text-gray-500 text-sm" aria-label="เวลา">{item.time}</div>}
      </td>

      {/* Category */}
      <td className="p-3" role="cell">
        <div aria-label="หมวดหมู่">{item?.category ?? ''}</div>
      </td>

      {/* Image */}
      <td className="p-3" role="cell">
        {imageCell}
      </td>

      {/* Name */}
      <td className="p-3" role="cell">
        <div className="line-clamp-2" aria-label="ชื่อ">{item?.name ?? ''}</div>
      </td>

      {/* Location */}
      <td className="p-3" role="cell">
        <div className="line-clamp-2" aria-label="สถานที่">{item?.location ?? ''}</div>
      </td>

      {/* Recorder/Modifier Info */}
      {showRecorderInfo && (
        <td className="p-3" role="cell">
          <div className="flex flex-col">
            <span className="text-gray-700" aria-label="ผู้บันทึก">{item?.discoverer_name ?? ''}</span>
            {item?.modifier_name && <div className="text-gray-500 text-sm mt-1" aria-label="ผู้แก้ไข">แก้ไขโดย: {item.modifier_name}</div>}
          </div>
        </td>
      )}

      {/* Actions */}
      {showActionColumn && (
        <td className="p-3 text-center" role="cell">
          <div className="flex items-center justify-center space-x-2" role="group" aria-label="การกระทำ">
            {typeof onLabelItem === 'function' ? (
              <button
                onClick={handleLabel}
                className="p-2 rounded-full text-blue-700 hover:bg-blue-100"
                title="ป้ายกำกับ"
                aria-label="ป้ายกำกับ"
                type="button"
              >
                <FaTags size={16} aria-hidden />
              </button>
            ) : (
              <>
                {typeof onViewDetail === 'function' && (
                  <button
                    onClick={handleView}
                    className="p-2 rounded-full text-blue-600 hover:bg-blue-50"
                    title="ดูรายละเอียด"
                    aria-label="ดูรายละเอียด"
                    type="button"
                  >
                    <FiEye size={16} aria-hidden />
                  </button>
                )}

                {isAdmin && typeof onEditItem === 'function' && (
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded-full text-amber-600 hover:bg-amber-50"
                    title="แก้ไข"
                    aria-label="แก้ไข"
                    type="button"
                  >
                    <FiEdit size={16} aria-hidden />
                  </button>
                )}

                {isAdmin && typeof onDeleteItem === 'function' && (
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-full text-red-600 hover:bg-red-50"
                    title="ลบ"
                    aria-label="ลบ"
                    type="button"
                  >
                    <FiTrash size={16} aria-hidden />
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

HistoryTableRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string,
    time: PropTypes.string,
    category: PropTypes.string,
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
  showActionColumn: PropTypes.bool,
  showRecorderInfo: PropTypes.bool,
  isAdmin: PropTypes.bool,
  NoImageComponent: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType]),
};

export default HistoryTableRow;