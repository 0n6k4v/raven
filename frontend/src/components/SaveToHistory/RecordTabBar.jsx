import React from 'react';

const RecordTabBar = () => {
  return (
    <header
      className="flex items-center justify-between flex-shrink-0 px-6 h-14 bg-white ring-1 ring-gray-100 shadow-sm"
      role="banner"
      aria-label="Record header"
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">บันทึกประวัติ</h1>
        <p className="mt-0.5 text-sm text-gray-500">กรอกข้อมูลตำแหน่งและรายละเอียดหลักฐาน</p>
      </div>
    </header>
  );
};

export default React.memo(RecordTabBar);