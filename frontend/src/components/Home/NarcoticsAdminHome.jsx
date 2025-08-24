import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ==================== ICONS ====================
const DrugIcon = React.memo(({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <path fill="currentColor" d="M28.987 7.898c-1.618-2.803-5.215-3.779-8.010-2.146-9.273 5.417-6.35 3.666-15.822 9.135v0c-2.803 1.618-3.764 5.207-2.146 8.010s5.214 3.777 8.010 2.146c9.447-5.512 6.518-3.772 15.822-9.135 2.804-1.616 3.765-5.207 2.146-8.010zM26.544 15.141l-7.751 4.475c0.424-0.245 0.679-0.623 0.796-1.089 1.068-0.623 2.463-1.428 5.298-3.054 0.834-0.478 1.459-1.163 1.851-1.969l-0-0c0.654-1.343 0.644-2.99-0.153-4.376-0.115-0.2-0.262-0.368-0.401-0.544 0.679 2.050-0.15 4.373-2.097 5.489-2.236 1.282-3.578 2.057-4.571 2.636-0.417-1.701-1.638-3.688-2.945-4.926-1.888 1.115-2.616 1.559-7.348 4.271-1.921 1.101-2.752 3.377-2.122 5.407-0.023-0.012-0.046-0.024-0.069-0.036-0.109-0.135-0.217-0.27-0.306-0.426-0.797-1.387-0.807-3.033-0.153-4.376l-0-0c0.392-0.806 1.017-1.49 1.851-1.969 4.175-2.393 5.228-3.010 6.71-3.88-0.534-0.23-1.037-0.262-1.455-0.017l7.751-4.475c5.215-3.011 10.413 5.8 5.115 8.859z"></path>
  </svg>
));

const UploadIcon = React.memo(({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <path fill="currentColor" d="M12 3v10" />
    <path fill="currentColor" d="M8 7l4-4 4 4" />
    <path fill="currentColor" d="M21 21H3v-2h18v2z" />
  </svg>
));

const CaseIcon = React.memo(({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
    <path fill="currentColor" d="M3 7h18v11H3z" />
    <path fill="currentColor" d="M8 7V5h8v2" />
    <path fill="currentColor" d="M9 11h6v4H9z" />
  </svg>
));

// ==================== PRESENTATIONAL COMPONENTS ====================
const AzureServicesCard = React.memo(function AzureServicesCard({ icon, title, subtitle, to, onNavigate, variant = 'mobile' }) {
  const handleClick = useCallback(() => {
    if (to && onNavigate) onNavigate(to);
  }, [to, onNavigate]);

  const baseClass = variant === 'mobile'
    ? 'flex flex-col items-center justify-center p-4 bg-white rounded-md hover:bg-gray-50 transition-colors w-24 h-24 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
    : 'flex flex-col items-center justify-center p-3 bg-white rounded-md hover:bg-gray-50 transition-colors text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={baseClass}
      aria-label={title}
    >
      <div className="text-blue-500 mb-2" aria-hidden>{icon}</div>
      <div className="text-xs font-medium">{title}</div>
      {subtitle && <div className="text-xs text-gray-600">{subtitle}</div>}
    </button>
  );
});

// ==================== LAYOUT ====================
const ServicesLayout = React.memo(function ServicesLayout({ onNavigate }) {
  const services = useMemo(() => ([
    {
      icon: <DrugIcon size={24} className="text-blue-500" />,
      title: "จัดการยาเสพติด",
      to: "/admin/narcotics/catalog-management"
    },
    {
      icon: <UploadIcon size={24} className="text-blue-500" />,
      title: "อัพโหลดคดียาเสพติด",
      to: "/admin/narcotics/upload-narcotic-case"
    },
    {
      icon: <CaseIcon size={24} className="text-blue-500" />,
      title: "คดียาเสพติด",
      to: "/admin/narcotics/case"
    }
  ]), []);

  return (
    <section className="w-full h-full flex flex-col overflow-hidden" aria-labelledby="services-heading">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 id="services-heading" className="text-lg sm:text-xl font-semibold text-gray-800">บริการ</h2>
      </div>
      <div
        className="px-4 pb-4 overflow-x-auto"
        role="list"
        aria-label="Azure services"
      >
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr"
          style={{ minWidth: 0 }}
        >
          {services.map((service, index) => (
            <div key={service.to ?? index} role="listitem" className="flex items-center justify-center">
              <AzureServicesCard
                icon={service.icon}
                title={service.title}
                subtitle={service.subtitle}
                to={service.to}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// ==================== MAIN COMPONENT ====================
const NarcoticsAdminHome = () => {
  const navigate = useNavigate();

  const handleNavigate = useCallback((to) => {
    if (to) navigate(to);
  }, [navigate]);

  return (
    <main className="w-full h-full">
      <div className="h-full">
        <ServicesLayout onNavigate={handleNavigate} />
      </div>
    </main>
  );
};

export default NarcoticsAdminHome;