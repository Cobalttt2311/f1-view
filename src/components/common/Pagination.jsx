import React from "react";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="f1-pagination-bar">
      <span className="pagination-meta">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        {typeof totalItems === "number" && (
          <span className="pagination-total-dot"> • {totalItems} records</span>
        )}
      </span>
      <div className="pagination-actions">
        <button
          type="button"
          className="pagination-nav-btn"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <i className="fa-solid fa-chevron-left"></i> Prev
        </button>
        <button
          type="button"
          className="pagination-nav-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
