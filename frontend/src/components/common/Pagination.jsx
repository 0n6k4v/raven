import React, { memo, useMemo, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/* ========================= CONSTANTS ========================= */
const ROWS_OPTIONS = [5, 10, 20];

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const PaginationButton = memo(function PaginationButton({
  onClick,
  disabled,
  children,
  title,
  ariaLabel,
  tabIndex,
  className = "",
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1 rounded ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"} ${className}`}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
});

const RowsPerPageSelect = memo(function RowsPerPageSelect({ value, onChange, options }) {
  return (
    <div className="flex items-center text-gray-600">
      <label htmlFor="rows-per-page" className="mr-2">
        แถว ต่อ หน้า:
      </label>
      <select
        id="rows-per-page"
        className="bg-transparent border-none text-gray-600 font-semibold focus:outline-none cursor-pointer"
        value={value}
        onChange={onChange}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  totalItems,
  indexOfFirstItem,
  indexOfLastItem,
}) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const rowsOptions = useMemo(() => ROWS_OPTIONS, []);

  const handleFirstPage = useCallback(() => onPageChange(1), [onPageChange]);
  const handlePrevPage = useCallback(() => onPageChange(currentPage - 1), [onPageChange, currentPage]);
  const handleNextPage = useCallback(() => onPageChange(currentPage + 1), [onPageChange, currentPage]);
  const handleLastPage = useCallback(() => onPageChange(totalPages), [onPageChange, totalPages]);
  const handleRowsPerPageChange = useCallback(
    (e) => onRowsPerPageChange(Number(e.target.value)),
    [onRowsPerPageChange]
  );

  return (
    <nav
      className="w-full bg-[#e6f0fa] py-2 px-4 flex justify-between items-center text-sm text-gray-700 font-medium rounded-b-lg border-t flex-shrink-0"
      aria-label="Pagination Navigation"
    >
      <span className="text-gray-600" aria-live="polite">
        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} จาก {totalItems}
      </span>
      <RowsPerPageSelect value={rowsPerPage} onChange={handleRowsPerPageChange} options={rowsOptions} />
      <div className="flex items-center gap-1">
        <PaginationButton
          onClick={handleFirstPage}
          disabled={isFirstPage}
          title="หน้าแรก"
          ariaLabel="Go to first page"
          tabIndex={isFirstPage ? -1 : 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8.354 1.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 0 .708l6 6a.5.5 0 0 0 .708-.708L2.707 8l5.647-5.646a.5.5 0 0 0 0-.708"/>
            <path d="M12.354 1.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 0 .708l-6 6a.5.5 0 0 0-.708-.708L6.707 8l5.647-5.646a.5.5 0 0 0 0-.708"/>
          </svg>
        </PaginationButton>
        <PaginationButton
          onClick={handlePrevPage}
          disabled={isFirstPage}
          title="หน้าก่อน"
          ariaLabel="Go to previous page"
          tabIndex={isFirstPage ? -1 : 0}
        >
          <FiChevronLeft size={16} aria-hidden="true" />
        </PaginationButton>
        <span className="font-semibold px-1" aria-live="polite">
          <span className="text-black">{currentPage}</span>
          <span className="px-1 text-gray-400">/</span>
          <span className="text-gray-500">{totalPages}</span>
        </span>
        <PaginationButton
          onClick={handleNextPage}
          disabled={isLastPage}
          title="หน้าถัดไป"
          ariaLabel="Go to next page"
          tabIndex={isLastPage ? -1 : 0}
        >
          <FiChevronRight size={16} aria-hidden="true" />
        </PaginationButton>
        <PaginationButton
          onClick={handleLastPage}
          disabled={isLastPage}
          title="หน้าสุดท้าย"
          ariaLabel="Go to last page"
          tabIndex={isLastPage ? -1 : 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8l-5.647-5.646a.5.5 0 0 1 0-.708"/>
            <path d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8l-5.647-5.646a.5.5 0 0 1 0-.708"/>
          </svg>
        </PaginationButton>
      </div>
    </nav>
  );
});

export default Pagination;