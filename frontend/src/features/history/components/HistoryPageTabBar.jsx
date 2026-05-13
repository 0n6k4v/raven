import React, { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const TabService = {
  DEFAULT_CONFIG: [
    { id: 0, name: 'ข้อมูลเบื้องต้น', path: '/history/detail' },
  ],

  resolveActiveIndex: (tabs, pathname) => {
    const idx = tabs.findIndex((t) => pathname.startsWith(t.path));
    return idx >= 0 ? idx : 0;
  }
};

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useTabNavigation = (tabs) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = useMemo(
    () => TabService.resolveActiveIndex(tabs, location.pathname),
    [tabs, location.pathname]
  );

  const navigateToTab = useCallback((path) => {
    if (path && path !== location.pathname) {
      navigate(path);
    }
  }, [navigate, location.pathname]);

  return { activeIndex, navigateToTab };
};

const useTabIndicator = (tabRefs, activeIndex) => {
  const [style, setStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeIndex];
    
    if (activeTabElement && activeTabElement.parentElement) {
      const tabRect = activeTabElement.getBoundingClientRect();
      const parentRect = activeTabElement.parentElement.getBoundingClientRect();
      
      setStyle({
        left: tabRect.left - parentRect.left,
        width: tabRect.width
      });
    } else {
      setStyle({ left: 0, width: 0 });
    }
  }, [activeIndex, tabRefs.current]);

  return style;
};

const useKeyboardAccessibility = (tabRefs, tabs, activeIndex, navigateToTab) => {
  const handleKeyDown = useCallback((e) => {
    const maxIndex = tabs.length - 1;
    let nextIndex = null;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = Math.min(maxIndex, activeIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = Math.max(0, activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = maxIndex;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const targetIndex = Number(e.currentTarget.getAttribute('data-index'));
        if (!isNaN(targetIndex)) {
           navigateToTab(tabs[targetIndex].path);
        }
        return; 
      default:
        return;
    }

    if (nextIndex !== null) {
      const nextElement = tabRefs.current[nextIndex];
      nextElement?.focus();
    }
  }, [tabs, activeIndex, tabRefs, navigateToTab]);

  return { handleKeyDown };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const STYLES = {
  CONTAINER: "bg-white border-b border-gray-200",
  LIST_WRAPPER: "flex relative",
  BUTTON_BASE: "px-6 py-3 text-sm relative border-b-2 focus:outline-none transition-colors",
  BUTTON_ACTIVE: "text-black border-[#990000]",
  BUTTON_INACTIVE: "text-gray-500 border-transparent hover:text-gray-700",
  INDICATOR: "absolute bottom-0 bg-[#990000] h-0.5 transition-all duration-300 ease-out"
};

const TabButton = memo(({ 
  tab, 
  index, 
  isActive, 
  onClick, 
  onKeyDown,
  buttonRef 
}) => {
  return (
    <button
      ref={buttonRef}
      data-index={index}
      role="tab"
      type="button"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={`${STYLES.BUTTON_BASE} ${isActive ? STYLES.BUTTON_ACTIVE : STYLES.BUTTON_INACTIVE}`}
      onClick={() => onClick(tab.path)}
      onKeyDown={onKeyDown}
    >
      {tab.name}
    </button>
  );
});

TabButton.propTypes = {
  tab: PropTypes.shape({ 
    id: PropTypes.any.isRequired, 
    name: PropTypes.string.isRequired, 
    path: PropTypes.string 
  }).isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  buttonRef: PropTypes.oneOfType([
    PropTypes.func, 
    PropTypes.shape({ current: PropTypes.any })
  ])
};

const TabIndicator = memo(({ style }) => (
  <div
    className={STYLES.INDICATOR}
    style={{
      left: `${style.left}px`,
      width: `${style.width}px`,
    }}
    aria-hidden="true"
  />
));

TabIndicator.propTypes = {
  style: PropTypes.shape({
    left: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired
  }).isRequired
};

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const HistoryPageTabBar = ({ tabs = TabService.DEFAULT_CONFIG }) => {
  const { activeIndex, navigateToTab } = useTabNavigation(tabs);
  
  const tabRefs = useRef([]);

  if (tabRefs.current.length !== tabs.length) {
    tabRefs.current = Array(tabs.length).fill(null);
  }

  const indicatorStyle = useTabIndicator(tabRefs, activeIndex);
  const { handleKeyDown } = useKeyboardAccessibility(tabRefs, tabs, activeIndex, navigateToTab);

  return (
    <div className={STYLES.CONTAINER}>
      <div 
        className={STYLES.LIST_WRAPPER} 
        role="tablist" 
        aria-label="Navigation tabs"
      >
        {tabs.map((tab, idx) => (
          <TabButton
            key={tab.id}
            tab={tab}
            index={idx}
            isActive={idx === activeIndex}
            buttonRef={(el) => (tabRefs.current[idx] = el)}
            onClick={navigateToTab}
            onKeyDown={handleKeyDown}
          />
        ))}
        
        <TabIndicator style={indicatorStyle} />
      </div>
    </div>
  );
};

HistoryPageTabBar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any.isRequired,
      name: PropTypes.string.isRequired,
      path: PropTypes.string,
    })
  ),
};

export default memo(HistoryPageTabBar);