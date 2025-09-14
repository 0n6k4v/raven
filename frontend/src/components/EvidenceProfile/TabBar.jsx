import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ==================== CONSTANTS ====================
const TABS = [
  { id: 0, name: 'ข้อมูลเบื้องต้น', path: '/evidenceProfile' },
  { id: 1, name: 'คลังภาพ',     path: '/evidenceProfile/gallery' },
  { id: 2, name: 'ประวัติ',     path: '/evidenceProfile/history' },
  { id: 3, name: 'แผนที่',      path: '/evidenceProfile/map' },
];

// ==================== UTILS ====================
const findTabIndexByPath = (pathname) => {
  const found = TABS.findIndex(t => t.path === pathname);
  return found >= 0 ? found : 0;
};

// ==================== CUSTOM HOOKS ====================
function useTabIndicator(activeIndex) {
  const tabRefs = useRef([]);
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const update = useCallback(() => {
    const el = tabRefs.current[activeIndex];
    const parent = containerRef.current;
    if (el && parent) {
      const tabRect = el.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      setIndicator({
        left: Math.max(0, tabRect.left - parentRect.left),
        width: Math.max(0, tabRect.width)
      });
    } else {
      setIndicator({ left: 0, width: 0 });
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    update();
  }, [activeIndex, update]);

  useEffect(() => {
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  return { tabRefs, containerRef, indicator, setIndicator };
}

// ==================== PRESENTATIONAL COMPONENTS ====================
const TabButton = React.memo(function TabButton({ tab, index, isActive, refSetter, onClick }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(tab.path);
    }
  };

  return (
    <button
      ref={el => refSetter(index, el)}
      className={`px-6 py-3 text-sm relative border-b-2 focus:outline-none ${
        isActive ? 'text-black border-[#990000]' : 'text-gray-500 border-transparent'
      }`}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onClick(tab.path)}
      onKeyDown={handleKeyDown}
      type="button"
    >
      {tab.name}
    </button>
  );
});

// ==================== MAIN COMPONENT ====================
const TabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialIndex = findTabIndexByPath(location.pathname);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    const idx = findTabIndexByPath(location.pathname);
    setActiveIndex(idx);
  }, [location.pathname]);

  const { tabRefs, containerRef, indicator } = useTabIndicator(activeIndex);

  const setRef = useCallback((i, el) => {
    tabRefs.current[i] = el;
  }, []);

  const handleTabClick = useCallback((path) => {
    navigate(path);
    const idx = findTabIndexByPath(path);
    setActiveIndex(idx);
  }, [navigate]);

  return (
    <nav className="bg-white border-b border-gray-200 relative" role="navigation" aria-label="Evidence profile tabs">
      <div ref={containerRef} className="flex relative" role="tablist" aria-orientation="horizontal">
        {TABS.map((tab, index) => (
          <TabButton
            key={tab.id}
            tab={tab}
            index={index}
            isActive={activeIndex === index}
            refSetter={setRef}
            onClick={handleTabClick}
          />
        ))}

        <div
          className="absolute bottom-0 bg-[#990000] h-0.5 transition-all duration-300"
          style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
          aria-hidden="true"
        />
      </div>
    </nav>
  );
};

export default TabBar;