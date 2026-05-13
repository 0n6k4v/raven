import React, { useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

class EvidenceViewEntity {
  constructor(data) {
    this.id = data?.id ?? null;
    this.name = data?.name || '';
    this.category = data?.category || '';
  }

  get displayLabel() {
    if (!this.name) return null;
    return `วัตถุพยาน: ${this.name}`;
  }

  static fromProps(props) {
    return new EvidenceViewEntity(props);
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useBottomBarViewModel = () => {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return {
    handlers: {
      goBack
    }
  };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const STYLES = {
  FOOTER: "w-full py-4 px-4 flex justify-between border-t border-gray-200 sm:justify-end sm:space-x-4 bg-white",
  INFO_CONTAINER: "hidden sm:flex items-center text-sm text-gray-600",
  BUTTON_CONTAINER: "flex items-center justify-end w-full sm:w-auto",
  BUTTON: "px-4 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 border border-[#6B0000] bg-white text-[#900B09] hover:bg-[#f8eaea] focus:ring-[#6B0000] cursor-pointer"
};

const EvidenceInfo = memo(({ entity }) => {
  const label = entity.displayLabel;

  return (
    <div className={STYLES.INFO_CONTAINER}>
      {label}
    </div>
  );
});

EvidenceInfo.propTypes = {
  entity: PropTypes.instanceOf(EvidenceViewEntity).isRequired
};

const BackButton = memo(({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={STYLES.BUTTON}
    aria-label="ย้อนกลับ"
    title="ย้อนกลับ"
  >
    ย้อนกลับ
  </button>
));

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

const BarContainer = memo(({ children }) => (
  <footer
    className={STYLES.FOOTER}
    role="contentinfo"
    aria-label="Bottom actions"
  >
    {children}
  </footer>
));

BarContainer.propTypes = {
  children: PropTypes.node.isRequired
};

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const EvidenceHistoryPageBottomBar = ({ evidenceData }) => {
  const evidenceEntity = useMemo(() => 
    EvidenceViewEntity.fromProps(evidenceData), 
  [evidenceData]);

  const { handlers } = useBottomBarViewModel();

  return (
    <BarContainer>
      <EvidenceInfo entity={evidenceEntity} />
      
      <div className={STYLES.BUTTON_CONTAINER}>
        <BackButton onClick={handlers.goBack} />
      </div>
    </BarContainer>
  );
};

EvidenceHistoryPageBottomBar.propTypes = {
  evidenceData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    category: PropTypes.string,
  }),
};

EvidenceHistoryPageBottomBar.defaultProps = {
  evidenceData: null,
};

export default memo(EvidenceHistoryPageBottomBar);