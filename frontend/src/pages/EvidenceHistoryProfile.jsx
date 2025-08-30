import React, { useState, useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import TabBar from '../components/History/common/TabBar'
import BottomBar from '../components/History/common/BottomBar'
import GunHistoryProfile from '../components/EvidenceHistoryProfile/GunHistoryProfile'
import DrugHistoryProfile from '../components/EvidenceHistoryProfile/DrugHistoryProfile'

/* ========================= CONSTANTS ========================= */
const CATEGORY_GUN = 'อาวุธปืน'
const CATEGORY_DRUG = 'ยาเสพติด'

/* ========================= UTILS ========================= */
const getCategoryComponent = (category) => {
  switch (category) {
    case CATEGORY_GUN:
      return GunHistoryProfile
    case CATEGORY_DRUG:
      return DrugHistoryProfile
    default:
      return null
  }
}

/* ========================= CUSTOM HOOKS ========================= */
function useLocationItem() {
  const location = useLocation()
  const { item } = location.state || {}
  useEffect(() => {
    console.debug('EvidenceHistoryProfile: item', item)
  }, [item])
  return item ?? null
}

function useActiveTab(initial = 0) {
  const [activeTab, setActiveTab] = useState(() => initial)
  const setTab = useCallback((i) => setActiveTab(i), [])
  return [activeTab, setTab]
}

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const BasicInfoRenderer = React.memo(function BasicInfoRenderer({ item }) {
  if (!item || !item.category) {
    return <div className="p-4 text-center">ไม่พบหมวดหมู่</div>
  }

  const CategoryComponent = getCategoryComponent(item.category)
  if (!CategoryComponent) {
    return <div className="p-4 text-center">ไม่พบหมวดหมู่</div>
  }

  return <CategoryComponent item={item} />
})

BasicInfoRenderer.propTypes = {
  item: PropTypes.object,
}

/* ========================= MAIN COMPONENT ========================= */
const EvidenceHistoryProfile = () => {
  const item = useLocationItem()
  const [activeTab, setActiveTab] = useActiveTab(0)

  const contentNode = useMemo(() => {
    if (!item) {
      return <div role="status" aria-live="polite" className="p-6 text-center">ไม่พบข้อมูล</div>
    }

    switch (activeTab) {
      case 0:
        return <BasicInfoRenderer item={item} />
      default:
        return null
    }
  }, [item, activeTab])

  if (!item) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 overflow-auto">{contentNode}</div>
        <BottomBar />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">{contentNode}</div>
      <BottomBar />
    </div>
  )
}

export default React.memo(EvidenceHistoryProfile)