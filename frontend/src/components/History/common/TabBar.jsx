import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useNavigate, useLocation } from 'react-router-dom'

/* ========================= CONSTANTS ========================= */
const DEFAULT_TABS = [
  { id: 0, name: 'ข้อมูลเบื้องต้น', path: '/history/detail' },
]

/* ========================= UTILS ========================= */
const getActiveTabIndexFromPath = (tabs, pathname) => {
  const idx = tabs.findIndex((t) => pathname.startsWith(t.path))
  return idx >= 0 ? idx : 0
}

/* ========================= CUSTOM HOOKS ========================= */
function useTabs(tabs = DEFAULT_TABS) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeIndex = useMemo(
    () => getActiveTabIndexFromPath(tabs, location.pathname),
    [tabs, location.pathname]
  )

  const goTo = useCallback(
    (path) => {
      if (path && path !== location.pathname) navigate(path)
    },
    [navigate, location.pathname]
  )

  return { tabs, activeIndex, goTo, location }
}

function useIndicator(tabRefs, activeIndex) {
  const [style, setStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const el = tabRefs.current?.[activeIndex]
    if (el && el.parentNode) {
      const tabRect = el.getBoundingClientRect()
      const parentRect = el.parentNode.getBoundingClientRect()
      setStyle({ left: tabRect.left - parentRect.left, width: tabRect.width })
    } else {
      setStyle({ left: 0, width: 0 })
    }
  }, [activeIndex, tabRefs])

  return style
}

function useKeyboardNavigation(tabRefs, tabs, activeIndex, goTo) {
  const onKeyDown = useCallback(
    (e) => {
      const max = tabs.length - 1
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        let next = activeIndex
        if (e.key === 'ArrowRight') next = Math.min(max, activeIndex + 1)
        if (e.key === 'ArrowLeft') next = Math.max(0, activeIndex - 1)
        if (e.key === 'Home') next = 0
        if (e.key === 'End') next = max
        const el = tabRefs.current?.[next]
        el?.focus()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const el = e.target
        const idx = Number(el?.dataset?.index ?? NaN)
        const tab = tabs[idx]
        if (tab) goTo(tab.path)
      }
    },
    [tabRefs, tabs, activeIndex, goTo]
  )

  return onKeyDown
}

/* ========================= PRESENTATIONAL SUB-COMPONENTS ========================= */
const TabButton = React.memo(function TabButton({ tab, index, isActive, refCallback, onClick, onKeyDown }) {
  return (
    <button
      ref={refCallback}
      data-index={index}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`tab-panel-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      className={`px-6 py-3 text-sm relative border-b-2 focus:outline-none ${
        isActive ? 'text-black border-[#990000]' : 'text-gray-500 border-transparent'
      }`}
      onClick={() => onClick(tab.path)}
      onKeyDown={onKeyDown}
    >
      {tab.name}
    </button>
  )
})

TabButton.propTypes = {
  tab: PropTypes.shape({ id: PropTypes.any, name: PropTypes.string.isRequired, path: PropTypes.string }),
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  refCallback: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
}

/* ========================= MAIN COMPONENT ========================= */
const TabBar = ({ tabs = DEFAULT_TABS }) => {
  const { tabs: resolvedTabs, activeIndex, goTo } = useTabs(tabs)
  const tabRefs = useRef([])

  tabRefs.current = resolvedTabs.map((_, i) => tabRefs.current[i] || null)

  const indicatorStyle = useIndicator(tabRefs, activeIndex)
  const handleKeyDown = useKeyboardNavigation(tabRefs, resolvedTabs, activeIndex, goTo)

  useEffect(() => {
    const el = tabRefs.current?.[activeIndex]
    if (el && document.activeElement !== el) {
      // do not forcibly steal focus unless needed; here we set aria-current via tabIndex
      // el.focus()
    }
  }, [activeIndex])

  const handleClick = useCallback((path) => goTo(path), [goTo])

  return (
    <div className="bg-white border-b border-gray-200" role="tablist" aria-label="History tabs">
      <div className="flex relative">
        {resolvedTabs.map((tab, idx) => (
          <TabButton
            key={tab.id}
            tab={tab}
            index={idx}
            isActive={idx === activeIndex}
            refCallback={(el) => (tabRefs.current[idx] = el)}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          />
        ))}

        <div
          className="absolute bottom-0 bg-[#990000] h-0.5 transition-all duration-300"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
          aria-hidden
        />
      </div>
    </div>
  )
}

TabBar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any.isRequired,
      name: PropTypes.string.isRequired,
      path: PropTypes.string,
    })
  ),
}

export default TabBar