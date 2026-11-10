import React, { useState, useEffect, useRef } from "react";

/**
 * F1Select — custom styled dropdown, replaces bare <select> elements.
 *
 * Props:
 *   value       — current value (matches an option's `value`)
 *   onChange    — callback(newValue) — note: value directly, not an event
 *   options     — array of { value, label } objects
 *   placeholder — text shown when no value selected (optional)
 *   id          — DOM id for the trigger button (optional)
 *   className   — extra class(es) for the wrapper div (optional)
 *   disabled    — boolean (optional)
 */
export default function F1Select({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  id,
  className = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected ? selected.label : placeholder;

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={ref}
      id={id}
      className={`f1-custom-select-wrapper ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""} ${className}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) setIsOpen((p) => !p);
        }
        if (e.key === "Escape") setIsOpen(false);
      }}
    >
      {/* Trigger */}
      <div
        className="f1-custom-select-trigger"
        onClick={() => !disabled && setIsOpen((p) => !p)}
      >
        <span className="f1-custom-select-label">{displayLabel}</span>
        <i className={`fa-solid fa-chevron-down f1-custom-select-chevron ${isOpen ? "rotated" : ""}`} />
      </div>

      {/* Options panel */}
      {isOpen && (
        <div className="f1-custom-select-menu">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                className={`f1-custom-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <i className="fa-solid fa-check" style={{ fontSize: "10px", color: "var(--f1-red)" }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

