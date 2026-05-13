import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiEye, FiEdit, FiTrash } from 'react-icons/fi';
import { FaTags } from 'react-icons/fa6';
import { PiImageBroken } from "react-icons/pi";
import { HistoryItemEntity } from '../entities';
import { HistoryAccessPolicy } from '../utils';

const useImageLoader = (src) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => setHasError(false), [src]);
  const handleError = useCallback(() => setHasError(true), []);
  return { hasError, handleError };
};

const useHistoryRowHandlers = (item, callbacks) => {
  const handleAction = useCallback((cb) => {
    if (typeof cb === 'function') cb(item);
  }, [item]);

  return {
    onView: () => handleAction(callbacks.onViewDetail),
    onEdit: () => handleAction(callbacks.onEditItem),
    onDelete: () => handleAction(callbacks.onDeleteItem),
    onLabel: () => handleAction(callbacks.onLabelItem),
  };
};

const NoImagePlaceholder = memo(({ small = true }) => (
  <div className={`flex flex-col items-center justify-center p-1 bg-gray-50 rounded-lg border border-slate-200 ${small ? 'h-12 w-12' : 'h-24 w-24'}`} role="img" aria-label="ไม่มีรูปภาพ">
    <PiImageBroken className="text-gray-400 text-lg" aria-hidden />
  </div>
));

const ActionButtonGroup = memo(({ isAdmin, handlers, callbacks }) => {
  const isLabelMode = HistoryAccessPolicy.hasLabelPermission(callbacks.onLabelItem);
  const canEdit = HistoryAccessPolicy.canPerformAction(isAdmin, callbacks.onEditItem);
  const canDelete = HistoryAccessPolicy.canPerformAction(isAdmin, callbacks.onDeleteItem);
  const hasView = typeof callbacks.onViewDetail === 'function';

  if (isLabelMode) {
    return (
      <button onClick={handlers.onLabel} className="p-2 rounded-full text-blue-700 hover:bg-blue-100 transition-colors" title="ป้ายกำกับ" aria-label="ป้ายกำกับ" type="button">
        <FaTags size={16} aria-hidden />
      </button>
    );
  }

  return (
    <>
      {hasView && (
        <button onClick={handlers.onView} className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors" title="ดูรายละเอียด" aria-label="ดูรายละเอียด" type="button">
          <FiEye size={16} aria-hidden />
        </button>
      )}
      {canEdit && (
        <button onClick={handlers.onEdit} className="p-2 rounded-full text-amber-600 hover:bg-amber-50 transition-colors" title="แก้ไข" aria-label="แก้ไข" type="button">
          <FiEdit size={16} aria-hidden />
        </button>
      )}
      {canDelete && (
        <button onClick={handlers.onDelete} className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors" title="ลบ" aria-label="ลบ" type="button">
          <FiTrash size={16} aria-hidden />
        </button>
      )}
    </>
  );
});

const HistoryTableRow = ({
  item: rawItem,
  onViewDetail,
  onEditItem,
  onDeleteItem,
  onLabelItem,
  showActionColumn = true,
  showRecorderInfo = false,
  isAdmin = false,
  NoImageComponent = null
}) => {
  const entity = useMemo(() => HistoryItemEntity.fromApi(rawItem), [rawItem]);

  const displayName = useMemo(() => entity._determineDisplayName(entity), [entity]);
  const displayLocation = useMemo(() => entity._buildFullLocationString(entity), [entity]);
  const displayTime = useMemo(() => entity._parseTime(entity), [entity]);
  const displayImage = entity.image; 
  
  const { hasError, handleError } = useImageLoader(displayImage);
  const actions = useHistoryRowHandlers(rawItem, { 
    onViewDetail, onEditItem, onDeleteItem, onLabelItem 
  });

  const FallbackUI = useMemo(() => {
    const isElementInstance = React.isValidElement(NoImageComponent);
    if (!NoImageComponent || isElementInstance) {
      return isElementInstance 
        ? React.cloneElement(NoImageComponent, { small: true }) 
        : <NoImagePlaceholder small />;
    }
    const CustomComp = NoImageComponent;
    return <CustomComp small />;
  }, [NoImageComponent]);

  return (
    <tr className="border-b border-slate-200 hover:bg-gray-50 transition-colors" role="row" aria-rowindex={entity.id}>
      <td className="p-3" role="cell">
        <div className="text-gray-900 font-medium">{entity.date}</div>
        {displayTime && <div className="text-gray-500 text-xs">{displayTime} น.</div>}
      </td>

      <td className="p-3" role="cell">
        <div className="text-sm text-gray-600">{entity.category}</div>
      </td>

      <td className="p-3" role="cell">
        {displayImage && !hasError ? (
          <div className="relative flex items-center justify-center bg-white border border-slate-100 rounded-md overflow-hidden" style={{ width: 48, height: 48 }}>
            <img src={displayImage} alt={entity.altText} className="h-full w-full object-contain" onError={handleError} />
          </div>
        ) : FallbackUI}
      </td>

      <td className="p-3" role="cell">
        <div className="line-clamp-2 text-sm text-gray-800 font-medium">{displayName}</div>
      </td>

      <td className="p-3" role="cell">
        <div className="line-clamp-2 text-sm text-gray-500">{displayLocation}</div>
      </td>

      {showRecorderInfo && (
        <td className="p-3" role="cell">
          <div className="flex flex-col text-xs">
            <span className="text-gray-700 font-medium">{entity.discoverer_name}</span>
            {entity.modifier_name && (
              <div className="text-gray-400 italic mt-0.5">
                แก้ไขโดย: {entity.modifier_name}
              </div>
            )}
          </div>
        </td>
      )}

      {showActionColumn && (
        <td className="p-3 text-center" role="cell">
          <div className="flex items-center justify-center space-x-2" role="group">
            <ActionButtonGroup isAdmin={isAdmin} handlers={actions} callbacks={{ onViewDetail, onEditItem, onDeleteItem, onLabelItem }} />
          </div>
        </td>
      )}
    </tr>
  );
};

HistoryTableRow.propTypes = {
  item: PropTypes.object.isRequired,
  onViewDetail: PropTypes.func,
  onEditItem: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onLabelItem: PropTypes.func,
  showActionColumn: PropTypes.bool,
  showRecorderInfo: PropTypes.bool,
  isAdmin: PropTypes.bool,
  NoImageComponent: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType]),
};

export default memo(HistoryTableRow);