import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import DownloadButton from '../common/DownloadButton';

/* ========================= CONSTANTS ========================= */
const BORDER_COLOR = "#e5e7eb";
const ACCENT_COLOR = "#b91c1c";
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* ========================= UTILS ========================= */
const formatPercent = (value) => `${Math.round(value)}%`;

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const DetailRow = React.memo(({ label, children }) => (
  <div className="flex">
    <span className="text-gray-600 w-40">{label}</span>
    <span className="font-medium">{children || ''}</span>
  </div>
));

DetailRow.propTypes = {
  label: PropTypes.node.isRequired,
  children: PropTypes.node,
};

const ConfidenceMeter = React.memo(({ confidencePercent, size = 24 }) => {
  const dashArray = useMemo(() => CIRCUMFERENCE, []);
  const dashOffset = useMemo(
    () => CIRCUMFERENCE - (CIRCUMFERENCE * (confidencePercent / 100)),
    [confidencePercent]
  );

  return (
    <div className={`w-${size} h-${size} relative`} aria-label="AI confidence meter" role="img">
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke={BORDER_COLOR} strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={ACCENT_COLOR}
          strokeWidth="8"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fontWeight="bold"
          fill={ACCENT_COLOR}
        >
          {formatPercent(confidencePercent)}
        </text>
      </svg>
      <p className="text-gray-600 text-sm text-center mt-1">ความมั่นใจ AI</p>
    </div>
  );
});

ConfidenceMeter.propTypes = {
  confidencePercent: PropTypes.number,
  size: PropTypes.number,
};

ConfidenceMeter.defaultProps = {
  confidencePercent: 0,
  size: 24,
};

/* ========================= MAIN COMPONENT ========================= */
const GunHistoryProfile = ({ item }) => {
  const detailedData = item ?? null;
  const loading = false;
  const error = null;

  console.log(detailedData);
  

  const confidencePercent = useMemo(
    () => (detailedData?.confidence ?? 0) * 100,
    [detailedData?.confidence]
  );

  const imageSrc = detailedData?.image || '';
  const title = detailedData?.name || 'ไม่มีข้อมูล';

  const DesktopView = React.memo(() => (
    <div className="hidden md:flex flex-row h-full w-full">
      <div className="w-1/2 p-6 flex justify-center items-center">
        <img
          src={imageSrc}
          alt={title}
          className="max-w-full h-auto object-contain max-h-96"
        />
      </div>

      <div className="w-1/2 p-6 flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-medium">{title}</h2>
            <DownloadButton aria-label="ดาวน์โหลดรายละเอียด" />
          </div>

          <div className="mb-8">
            <div className="flex flex-row">
              <div className="space-y-4 w-1/2">
                <h3 className="text-xl font-medium mb-4">รายละเอียด</h3>
                <DetailRow label="ประเภท:">{detailedData?.firearmSubCategory}</DetailRow>
                <DetailRow label="กลไก:">{detailedData?.firearmMechanism}</DetailRow>
                <DetailRow label="ยี่ห้อ:">{detailedData?.firearmBrand}</DetailRow>
                <DetailRow label="ซีรี่ส์:">{detailedData?.firearmSeries}</DetailRow>
                <DetailRow label="โมเดล:">{detailedData?.firearmModel}</DetailRow>
                <DetailRow label="จุดสังเกตเลขประจำปืน:">{detailedData?.exhibit?.firearms?.[0]?.serial_info}</DetailRow>

                <h3 className="text-xl font-medium mb-4">สถานที่พบ</h3>
                <DetailRow label="จังหวัด:">{detailedData?.province}</DetailRow>
                <DetailRow label="อำเภอ:">{detailedData?.district}</DetailRow>
                <DetailRow label="ตำบล:">{detailedData?.subdistrict}</DetailRow>

                <h3 className="text-xl font-medium mb-4">ข้อมูลการค้นพบ</h3>
                <DetailRow label="ผู้ค้นพบ:">{detailedData?.discovererName || 'ไม่ทราบข้อมูล'}</DetailRow>
                <DetailRow label="วันที่พบ:">{detailedData?.date}</DetailRow>
                <DetailRow label="เวลาที่พบ:">{detailedData?.time}</DetailRow>
              </div>

              <div className="flex flex-col items-center justify-top w-1/2">
                <div className="w-24 h-24 relative">
                  <ConfidenceMeter confidencePercent={confidencePercent} size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto" />
      </div>
    </div>
  ));

  const MobileView = React.memo(() => (
    <div className="flex md:hidden flex-col h-full w-full">
      <div className="p-4 flex justify-center items-center">
        <img src={imageSrc} alt={title} className="max-w-full h-auto object-contain max-h-60" />
      </div>

      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-medium">{title}</h2>
        <DownloadButton aria-label="ดาวน์โหลดรายละเอียด" />
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">รายละเอียด</h3>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ประเภท:</span>
              <span className="font-medium">{detailedData?.firearmSubCategory || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">กลไก:</span>
              <span className="font-medium">{detailedData?.firearmMechanism || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ยี่ห้อ:</span>
              <span className="font-medium">{detailedData?.firearmBrand || '-'}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ซีรี่ส์:</span>
              <span className="font-medium">{detailedData?.firearmSeries || '-'}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">โมเดล:</span>
              <span className="font-medium">{detailedData?.firearmModel || '-'}</span>
            </div>

            <h3 className="text-lg font-medium mb-2">สถานที่พบ</h3>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">จังหวัด:</span>
              <span className="font-medium">{detailedData?.province || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">อำเภอ:</span>
              <span className="font-medium">{detailedData?.district || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ตำบล:</span>
              <span className="font-medium">{detailedData?.subdistrict || ''}</span>
            </div>

            <h3 className="text-lg font-medium mb-2">ข้อมูลการค้นพบ</h3>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ผู้ค้นพบ:</span>
              <span className="font-medium">{detailedData?.discovererName || 'ไม่ระบุ'}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">วันที่พบ:</span>
              <span className="font-medium">{detailedData?.date || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">เวลาที่พบ:</span>
              <span className="font-medium">{detailedData?.time || ''}</span>
            </div>
          </div>

          <div className="ml-4 flex-shrink-0">
            <ConfidenceMeter confidencePercent={confidencePercent} size={20} />
          </div>
        </div>
      </div>
    </div>
  ));

  if (loading) {
    return (
      <div className="bg-white w-full h-full flex justify-center items-center" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-4" style={{ borderTopColor: ACCENT_COLOR }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white w-full h-full flex justify-center items-center text-red-600" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white w-full h-full flex flex-col relative" id="capture-area">
      <DesktopView />
      <MobileView />
    </div>
  );
};

GunHistoryProfile.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    image: PropTypes.string,
    subcategory: PropTypes.string,
  }),
};

GunHistoryProfile.defaultProps = {
  item: {},
};

export default React.memo(GunHistoryProfile);