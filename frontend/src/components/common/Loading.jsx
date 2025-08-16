import React, { memo } from 'react';

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const Spinner = memo(function Spinner() {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center animate-spin border-4 border-t-transparent border-gray-400"
      aria-label="กำลังโหลด"
      role="status"
    />
  );
});

const RavenBrand = memo(function RavenBrand() {
  return (
    <div className="flex items-center space-x-2">
      <div className="leading-tight">
        <h1 className="text-3xl font-bold m-0 leading-none">RAVEN</h1>
        <p className="text-[4px] m-0 leading-none tracking-wide" aria-label="RAPID ANALYSIS FOR VIOLENT EVIDENCE & NARCOTICS">
          RAPID ANALYSIS FOR VIOLENT EVIDENCE &amp; NARCOTICS
        </p>
      </div>
    </div>
  );
});

const Loading = memo(function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-full" role="status" aria-live="polite">
      <div className="flex items-center justify-center mb-6">
        <Spinner />
        <RavenBrand />
      </div>
    </div>
  );
});

export default Loading;