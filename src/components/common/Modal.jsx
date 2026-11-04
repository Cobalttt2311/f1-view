import React, { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      onClick={onClose}
      style={{ display: "flex" }}
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
