import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import DownloadButton from '../common/DownloadButton'

/* ========================= CONSTANTS ========================= */
const CIRCLE_R = 45
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R
const PLACEHOLDER_IMG = '/placeholder-drug.png'

/* ========================= UTILS ========================= */
const calculateOffset = (percent) => CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * percent) / 100

const parseLocationParts = (locationStr) => {
  if (!locationStr) return { subdistrict: 'ไม่ระบุ', district: 'ไม่ระบุ', province: 'ไม่ระบุ' }
  const parts = locationStr.split(' ').filter(Boolean)
  return {
    subdistrict: parts[0] ?? 'ไม่ระบุ',
    district: parts[1] ?? 'ไม่ระบุ',
    province: parts[2] ?? 'ไม่ระบุ',
  }
}

const clampPercent = (v) => {
  const n = Number.isFinite(v) ? v : 0
  return Math.max(0, Math.min(100, Math.round(n * 100)))
}

/* ========================= PRESENTATIONAL SUB-COMPONENTS ========================= */
const ConfidenceMeter = React.memo(function ConfidenceMeter({ confidence }) {
  const pct = clampPercent(confidence)
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r={CIRCLE_R} fill="none" stroke="#E5E7EB" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={CIRCLE_R}
            fill="none"
            stroke="#8B0000"
            strokeWidth="8"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={calculateOffset(pct)}
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#8B0000">
            {pct}%
          </text>
        </svg>
      </div>
      <div className="mt-2 text-center text-xs text-gray-600">ความมั่นใจ AI</div>
    </div>
  )
})

ConfidenceMeter.propTypes = { confidence: PropTypes.number }
ConfidenceMeter.defaultProps = { confidence: 0 }

/* ========================= MAIN COMPONENT ========================= */
const DrugHistoryProfile = React.memo(function DrugHistoryProfile({ item }) {
  const locationParts = useMemo(() => parseLocationParts(item?.location || ''), [item?.location])
  const confidencePct = useMemo(() => clampPercent(item?.ai_confidence ?? 0), [item?.ai_confidence])

  const imageSrc = item?.image || item?.photo || ''
  const onImgError = (e) => {
    // avoid throwing if element already uses placeholder
    if (e?.target?.src !== PLACEHOLDER_IMG) e.target.src = PLACEHOLDER_IMG
  }

  return (
    <div className="bg-white w-full h-full flex flex-col md:flex-row" id="capture-area">
      {/* Left / Image */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <img
          src={imageSrc || PLACEHOLDER_IMG}
          alt={item?.name || 'ภาพวัตถุพยาน'}
          className="max-w-full h-auto object-contain max-h-96 rounded-md border border-gray-300"
          onError={onImgError}
        />
      </div>

      {/* Right / Details */}
      <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-6">
            <div>
              <div className="text-sm text-gray-500">{item?.category || 'ไม่ระบุหมวดหมู่'}</div>
              <h1 className="text-2xl font-bold mt-1">{item?.name || 'ไม่ระบุชื่อ'}</h1>
            </div>
            <DownloadButton />
          </div>

          <div className="mb-6 md:mb-8 flex gap-4">
            <div className="flex-1">
              <section className="mb-4">
                <h3 className="text-lg font-medium mb-3">ข้อมูลยาเสพติด</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex">
                    <span className="text-gray-600 w-32">ประเภท:</span>
                    <span className="font-medium">{item?.drug_type || item?.subcategory || 'ไม่ระบุ'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">หมวดหมู่:</span>
                    <span className="font-medium">{item?.drug_category || 'ไม่ระบุ'}</span>
                  </div>
                  {item?.weight_grams != null && (
                    <div className="flex">
                      <span className="text-gray-600 w-32">น้ำหนัก:</span>
                      <span className="font-medium">{item.weight_grams} กรัม</span>
                    </div>
                  )}
                  {item?.consumption_method && (
                    <div className="flex">
                      <span className="text-gray-600 w-32">วิธีการใช้:</span>
                      <span className="font-medium">{item.consumption_method}</span>
                    </div>
                  )}
                  {item?.description && (
                    <div className="flex">
                      <span className="text-gray-600 w-32">ลักษณะ:</span>
                      <span className="font-medium">{item.description}</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="mb-4">
                <h3 className="text-lg font-medium mb-3">สถานที่พบ</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex">
                    <span className="text-gray-600 w-32">ตำบล:</span>
                    <span className="font-medium">{locationParts.subdistrict}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">อำเภอ:</span>
                    <span className="font-medium">{locationParts.district}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">จังหวัด:</span>
                    <span className="font-medium">{locationParts.province}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-3">ข้อมูลการค้นพบ</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex">
                    <span className="text-gray-600 w-32">วันที่พบ:</span>
                    <span className="font-medium">{item?.date || 'ไม่ระบุ'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">เวลาที่พบ:</span>
                    <span className="font-medium">{item?.time || 'ไม่ระบุ'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-600 w-32">ผู้พบ:</span>
                    <span className="font-medium">{item?.discoverer || item?.discovered_by || 'ไม่ระบุ'}</span>
                  </div>
                  {item?.quantity != null && (
                    <div className="flex">
                      <span className="text-gray-600 w-32">จำนวน:</span>
                      <span className="font-medium">{item.quantity}</span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="hidden md:flex md:flex-col md:items-center md:justify-start w-40">
              <ConfidenceMeter confidence={confidencePct / 100} />
            </div>
          </div>
        </div>

        {/* Mobile confidence meter at bottom */}
        <div className="md:hidden mt-4 flex items-center justify-center">
          <ConfidenceMeter confidence={confidencePct / 100} />
        </div>
      </div>
    </div>
  )
})

DrugHistoryProfile.propTypes = {
  item: PropTypes.shape({
    image: PropTypes.string,
    photo: PropTypes.string,
    name: PropTypes.string,
    category: PropTypes.string,
    drug_type: PropTypes.string,
    drug_category: PropTypes.string,
    weight_grams: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    consumption_method: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    discoverer: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ai_confidence: PropTypes.number,
  }),
}

DrugHistoryProfile.defaultProps = {
  item: {},
}

export default DrugHistoryProfile