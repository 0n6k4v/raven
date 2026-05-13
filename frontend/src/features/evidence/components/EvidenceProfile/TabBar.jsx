import React, { memo, useMemo, useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class TabModel {
  constructor(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
  }
}

class EvidenceNavigationService {
  static TABS = [
    new TabModel(0, 'ข้อมูลเบื้องต้น', '/evidenceProfile'),
    new TabModel(1, 'คลังภาพ',     '/evidenceProfile/gallery'),
    new TabModel(2, 'ประวัติ',     '/evidenceProfile/history'),
    new TabModel(3, 'แผนที่',      '/evidenceProfile/map'),
  ];

  static findIndexByPath(pathname) {
    const found = this.TABS.findIndex(t => t.path === pathname);
    return found >= 0 ? found : 0;
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useTabIndicator(activeIndex) {
  const tabRefs = useRef([]);
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const updatePosition = useCallback(() => {
    const activeEl = tabRefs.current[activeIndex];
    const containerEl = containerRef.current;

    if (activeEl && containerEl) {
      const tabRect = activeEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      
      setIndicatorStyle({
        left: Math.max(0, tabRect.left - containerRect.left),
        width: Math.max(0, tabRect.width)
      });
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  const registerTabRef = useCallback((index, el) => {
    tabRefs.current[index] = el;
  }, []);

  return { containerRef, registerTabRef, indicatorStyle };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const TabButton = memo(({ tab, index, isActive, onRegisterRef, onClick }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(tab.path);
    }
  };

  return (
    <button
      ref={(el) => onRegisterRef(index, el)}
      className={`px-6 py-3 text-sm relative border-b-2 focus:outline-none transition-colors ${
        isActive ? 'text-black border-[#990000]' : 'text-gray-500 border-transparent hover:text-gray-700'
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

const ActiveIndicator = memo(({ left, width }) => (
  <div
    className="absolute bottom-0 bg-[#990000] h-0.5 transition-all duration-300 ease-in-out"
    style={{ left: `${left}px`, width: `${width}px` }}
    aria-hidden="true"
  />
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const TabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = useMemo(
    () => EvidenceNavigationService.findIndexByPath(location.pathname),
    [location.pathname]
  );

  const { containerRef, registerTabRef, indicatorStyle } = useTabIndicator(activeIndex);

  const handleTabClick = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <nav 
      className="bg-white border-b border-gray-200 relative" 
      role="navigation" 
      aria-label="Evidence profile tabs"
    >
      <div 
        ref={containerRef} 
        className="flex relative" 
        role="tablist" 
        aria-orientation="horizontal"
      >
        {EvidenceNavigationService.TABS.map((tab, index) => (
          <TabButton
            key={tab.id}
            tab={tab}
            index={index}
            isActive={activeIndex === index}
            onRegisterRef={registerTabRef}
            onClick={handleTabClick}
          />
        ))}

        <ActiveIndicator 
          left={indicatorStyle.left} 
          width={indicatorStyle.width} 
        />
      </div>
    </nav>
  );
};

export default TabBar;