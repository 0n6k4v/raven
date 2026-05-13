import React, { useState, useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import HistoryPageTabBar from '../../history/components/HistoryPageTabBar';
import HistoryPageBottomBar from '../../history/components/HistoryPageBottomBar';
import GunHistoryProfile from '../components/EvidenceHistoryProfile/GunHistoryProfile';
import DrugHistoryProfile from '../components/EvidenceHistoryProfile/DrugHistoryProfile';
import { HistoryItemEntity } from '../../history/entities';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

const CONSTANTS = {
  CATEGORY: {
    GUN: 'อาวุธปืน',
    DRUG: 'ยาเสพติด',
  },
};

class ContentRendererStrategy {
  static getComponent(category) {
    switch (category) {
      case CONSTANTS.CATEGORY.GUN:
        return GunHistoryProfile;
      case CONSTANTS.CATEGORY.DRUG:
        return DrugHistoryProfile;
      default:
        return null;
    }
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

function useEvidenceHistory() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  const historyItem = useMemo(() => {
    const data = location.state?.item;
    return data ? HistoryItemEntity.fromApi(data) : null;
  }, [location.state]);

  const isValid = useMemo(() => {
    return !!(historyItem && historyItem.id && historyItem.category);
  }, [historyItem]);

  return {
    historyItem,
    isValid,
    activeTab,
    setActiveTab,
  };
}

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const EmptyState = memo(({ message = 'ไม่พบข้อมูล' }) => (
  <div role="status" aria-live="polite" className="p-6 text-center text-gray-500">
    {message}
  </div>
));

const HistoryContent = memo(({ item, isValid, activeTab }) => {
  if (!isValid) return <EmptyState />;

  if (activeTab === 0) {
    const Component = ContentRendererStrategy.getComponent(item.category);
    return Component ? <Component item={item} /> : <EmptyState message="ไม่พบข้อมูลหมวดหมู่" />;
  }

  return null;
});

HistoryContent.propTypes = {
  item: PropTypes.instanceOf(HistoryItemEntity),
  isValid: PropTypes.bool.isRequired,
  activeTab: PropTypes.number.isRequired,
};

const PageLayout = memo(({ children, tabBarProps }) => (
  <div className="flex-1 flex flex-col overflow-hidden h-full bg-gray-50">
    <HistoryPageTabBar {...tabBarProps} />
    <div className="flex-1 overflow-auto">
      {children}
    </div>
    <HistoryPageBottomBar />
  </div>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const EvidenceHistoryPage = () => {
  const { historyItem, isValid, activeTab, setActiveTab } = useEvidenceHistory();
  return (
    <PageLayout 
      tabBarProps={{ 
        activeTab, 
        setActiveTab 
      }}
    >
      <HistoryContent 
        item={historyItem} 
        isValid={isValid} 
        activeTab={activeTab} 
      />
    </PageLayout>
  );
};

export default memo(EvidenceHistoryPage);