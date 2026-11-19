import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray } from "../../api/client";

export default function CustomSeasonDropdown() {
  const { season, setSeason } = useSeason();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const res = await F1Api.getSeasons();
      const list = toArray(res);
      return list.length > 0
        ? list
        : Array.from({ length: 77 }, (_, i) => ({ year: 2026 - i }));
    },
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelect = (yr) => {
    setSeason(yr);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`header-ctrl-pill season-dropdown-pill custom-season-dropdown-wrapper ${isOpen ? "active" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }}
    >
      <span className="season-pill-label">Season</span>
      <span className="season-pill-year" id="selected-season-display">
        {season}
      </span>
      <i
        className={`fa-solid fa-chevron-down season-chevron ${isOpen ? "open" : ""}`}
      ></i>

      {/* Scrollable Season Dropdown Menu (Clean numbers without F1 tags or checkmarks) */}
      <div className="custom-season-menu" id="custom-season-menu">
        <div className="season-options-list" id="season-options-list">
          {seasons.map((s) => {
            const yr = typeof s === "object" ? s.year : s;
            const isSelected = Number(yr) === Number(season);
            return (
              <div
                key={yr}
                className={`season-option-item ${isSelected ? "selected" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(yr);
                }}
              >
                <span className="season-opt-year">{yr}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
