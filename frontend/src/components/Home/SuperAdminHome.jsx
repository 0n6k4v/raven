import React, { memo, useCallback, useMemo, useState, useRef, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRoundCog } from 'lucide-react';

/* ========================= CONSTANTS ========================= */
const SERVICES = [
    {
        id: 'user-management',
        Icon: UserRoundCog,
        title: 'จัดการบัญชีผู้ใช้',
        to: '/userManagement',
    },
];

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const AzureServicesCard = memo(
    forwardRef(function AzureServicesCard(
        { id, Icon, title, subtitle, to, tabIndex = -1 },
        ref
    ) {
        const navigate = useNavigate();
        const handleClick = useCallback(() => {
            if (to) navigate(to);
        }, [navigate, to]);

        return (
            <button
                ref={ref}
                type="button"
                role="gridcell"
                aria-labelledby={`${id}-title`}
                aria-describedby={subtitle ? `${id}-subtitle` : undefined}
                aria-label={title}
                tabIndex={tabIndex}
                onClick={handleClick}
                className="flex flex-col items-center justify-center p-3 bg-white rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-w-[44px] min-h-[44px] touch-manipulation"
            >
                <div className="text-blue-600 mb-1" aria-hidden="true">
                    {Icon ? <Icon size={22} className="text-blue-600" /> : null}
                </div>
                <div id={`${id}-title`} className="text-xs font-medium text-gray-900">
                    {title}
                </div>
                {subtitle && (
                    <div id={`${id}-subtitle`} className="text-xs text-gray-600">
                        {subtitle}
                    </div>
                )}
            </button>
        );
    })
);

/* ========================= LAYOUTS ========================= */
const MobileLayout = memo(function MobileLayout() {
    const services = useMemo(() => SERVICES, []);
    const itemRefs = useRef([]);
    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, services.length);
    }, [services.length]);

    return (
        <div className="w-full h-full p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">บริการ</h2>
            <div
                role="grid"
                aria-label="Services"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden"
            >
                {services.map((service, idx) => (
                    <AzureServicesCard
                        key={service.id}
                        id={service.id}
                        Icon={service.Icon}
                        title={service.title}
                        subtitle={service.subtitle}
                        to={service.to}
                        ref={(el) => (itemRefs.current[idx] = el)}
                        tabIndex={0}
                    />
                ))}
            </div>
        </div>
    );
});

const DesktopLayout = memo(function DesktopLayout() {
    const services = useMemo(() => SERVICES, []);

    const [activeIndex, setActiveIndex] = useState(0);
    const itemRefs = useRef([]);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, services.length);
    }, [services.length]);

    const focusItem = useCallback(
        (idx) => {
            const el = itemRefs.current[idx];
            if (el && typeof el.focus === 'function') {
                el.focus();
                setActiveIndex(idx);
            }
        },
        [setActiveIndex]
    );

    const onKeyDown = useCallback(
        (e) => {
            const max = services.length - 1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = activeIndex >= max ? 0 : activeIndex + 1;
                focusItem(next);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = activeIndex <= 0 ? max : activeIndex - 1;
                focusItem(prev);
            } else if (e.key === 'Home') {
                e.preventDefault();
                focusItem(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                focusItem(max);
            }
        },
        [activeIndex, services.length, focusItem]
    );

    return (
        <div className="h-full w-full flex flex-col overflow-hidden p-6 hidden md:flex">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only p-2 bg-white text-sm text-blue-600"
            >
                ข้ามไปที่เนื้อหา
            </a>

            <div className="flex justify-between items-center flex-shrink-0 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">บริการ</h2>
            </div>

            <div
                id="main-content"
                role="grid"
                aria-label="Services"
                className="flex space-x-4 overflow-x-auto pb-4"
                onKeyDown={onKeyDown}
            >
                {services.map((service, idx) => (
                    <AzureServicesCard
                        key={service.id}
                        id={service.id}
                        Icon={service.Icon}
                        title={service.title}
                        subtitle={service.subtitle}
                        to={service.to}
                        ref={(el) => (itemRefs.current[idx] = el)}
                        tabIndex={idx === activeIndex ? 0 : -1}
                    />
                ))}
            </div>
        </div>
    );
});

/* ========================= MAIN COMPONENT ========================= */
const SuperAdminHome = memo(function SuperAdminHome() {
    return (
        <div className="w-full h-full">
            <div className="block md:hidden">
                <MobileLayout />
            </div>
            <div className="hidden md:block h-full">
                <DesktopLayout />
            </div>
        </div>
    );
});

export default SuperAdminHome;