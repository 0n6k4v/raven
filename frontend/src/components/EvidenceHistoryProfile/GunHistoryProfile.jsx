import React from 'react'
import PropTypes from 'prop-types'

/* ========================= HELPERS ========================= */
const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr && !timeStr) return 'ไม่ระบุ'
  return `${dateStr ?? ''}${timeStr ? ' ' + timeStr : ''}`.trim()
}

/* ========================= PRESENTATIONAL COMPONENT ========================= */
const GunHistoryProfile = React.memo(function GunHistoryProfile({ item }) {
  const photo = item?.photo_url || item?.exhibit?.photo_url || ''
  const name =
    item?.exhibit?.name ||
    item?.exhibit?.subcategory ||
    item?.exhibit?.category ||
    item?.name ||
    'ไม่ระบุชื่อ'
  const category = item?.exhibit?.category || item?.category || 'ไม่ระบุหมวดหมู่'
  const quantity = item?.quantity ?? 'ไม่ระบุ'
  const discoveredBy = item?.discovered_by || item?.discoverer_name || 'ไม่ระบุ'
  const datetime = formatDateTime(item?.discovery_date, item?.discovery_time)
  const location =
    [item?.subdistrict_name, item?.district_name, item?.province_name].filter(Boolean).join(' / ') ||
    'ไม่ระบุตำแหน่ง'
  const coords = item?.latitude && item?.longitude ? `${item.latitude}, ${item.longitude}` : 'ไม่ระบุพิกัด'

  return (
    <section className="p-4 text-sm text-gray-800">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-50 border">
          {photo ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={photo} alt="รูปวัตถุพยาน" className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              ไม่มีรูปภาพ
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500 mt-1">{category}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500">จำนวน</div>
          <div className="font-medium">{quantity}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">ผู้พบ</div>
          <div className="font-medium">{discoveredBy}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">วัน-เวลา</div>
          <div className="font-medium">{datetime}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">พิกัด</div>
          <div className="font-medium">{coords}</div>
        </div>

        <div className="col-span-2">
          <div className="text-xs text-gray-500">ที่อยู่ (ตำบล / อำเภอ / จังหวัด)</div>
          <div className="font-medium">{location}</div>
        </div>
      </div>
    </section>
  )
})

GunHistoryProfile.propTypes = {
  item: PropTypes.object,
}

GunHistoryProfile.defaultProps = {
  item: null,
}

export default GunHistoryProfile