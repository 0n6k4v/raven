import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

/* ========================= CONSTANTS ========================= */
const BUTTON_BASE = 'px-4 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1'
const BACK_BUTTON_CLASS = `${BUTTON_BASE} border border-[#6B0000] bg-white text-[#900B09] hover:bg-[#f8eaea] focus:ring-[#6B0000] cursor-pointer`

/* ========================= CUSTOM HOOKS ========================= */
function useBackNavigation() {
  const navigate = useNavigate()
  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return { handleBack }
}

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const BackButton = React.memo(function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={BACK_BUTTON_CLASS}
      aria-label="ย้อนกลับ"
      title="ย้อนกลับ"
    >
      ย้อนกลับ
    </button>
  )
})

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
}

/* ========================= MAIN COMPONENT ========================= */
const BottomBar = ({ evidenceData }) => {
  const { handleBack } = useBackNavigation()

  return (
    <footer
      className="w-full py-4 px-4 flex justify-between border-t border-gray-200 sm:justify-end sm:space-x-4 bg-white"
      role="contentinfo"
      aria-label="Bottom actions"
    >
      <div className="hidden sm:flex items-center text-sm text-gray-600">
        {evidenceData?.name ? `วัตถุพยาน: ${evidenceData.name}` : null}
      </div>

      <div className="flex items-center justify-end w-full sm:w-auto">
        <BackButton onClick={handleBack} />
      </div>
    </footer>
  )
}

BottomBar.propTypes = {
  evidenceData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    category: PropTypes.string,
  }),
}

BottomBar.defaultProps = {
  evidenceData: null,
}

export default BottomBar