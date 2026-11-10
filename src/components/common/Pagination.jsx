import React from "react";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div
      className="card-footer pagination-footer"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
      }}
    >
      <span className="text-muted">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong> (
        {totalItems} records)
      </span>
      <div className="btn-group">
        <button
          className="btn btn-sm btn-outline"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <i className="fa-solid fa-chevron-left"></i> Prev
        </button>
        <button
          className="btn btn-sm btn-outline"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
