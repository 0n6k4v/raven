import React from 'react';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class RavenBranding {
  static TITLE = "RAVEN";
  static FULL_ACRONYM = "RAPID ANALYSIS FOR VIOLENT EVIDENCE & NARCOTICS";

  static getBrandInfo() {
    return {
      title: this.TITLE,
      subtitle: this.FULL_ACRONYM,
    };
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useLoadingViewModel = () => {
  const brand = RavenBranding.getBrandInfo();
  
  return {
    brand,
    ariaStatus: "กำลังโหลดข้อมูล...",
  };
};

// ============================================================================
// PRESENTATION LAYER - UI Components (Atomic Design)
// ============================================================================

const Spinner = React.memo(() => (
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center animate-spin border-4 border-t-transparent border-gray-400"
    role="presentation"
  />
));

const RavenBrand = React.memo(({ title, subtitle }) => (
  <div className="flex items-center space-x-2">
    <div className="leading-tight">
      <h1 className="text-3xl font-bold m-0 leading-none">{title}</h1>
      <p 
        className="text-[4px] m-0 leading-none tracking-wide" 
        aria-label={subtitle}
      >
        {subtitle}
      </p>
    </div>
  </div>
));

const LoadingLayout = React.memo(({ children }) => (
  <div 
    className="flex flex-col items-center justify-center h-full" 
    role="status" 
    aria-live="polite"
  >
    <div className="flex items-center justify-center mb-6">
      {children}
    </div>
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const Loading = React.memo(function Loading() {
  const { brand } = useLoadingViewModel();

  return (
    <LoadingLayout>
      <Spinner />
      {/* <RavenBrand 
        title={brand.title} 
        subtitle={brand.subtitle} 
      /> */}
    </LoadingLayout>
  );
});

export default Loading;