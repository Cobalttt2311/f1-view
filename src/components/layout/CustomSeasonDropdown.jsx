import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '../../context/SeasonContext';
import { F1Api } from '../../api/client';

export default function CustomSeasonDropdown() {
  const { season, setSeason } = useSeason();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const res = await F1Api.getSeasons();
      const list = res.data || res || [];
      return list.length > 0
        ? list
        : Array.from({ length: 77 }, (_, i) => ({ year: 2026 - i }));
    },
  });

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSelect = (yr) => {
    setSeason(yr);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`global-season-container custom-season-dropdown-wrapper ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }}
    >
      <span className="global-control-label">
        <i className="fa-solid fa-flag-checkered"></i> Season:
      </span>
      <div className="custom-season-select-box">
        <span id="selected-season-display">
          <span className="season-full">{season} Season</span>
          <span className="season-short">{season}</span>
        </span>
        <i className="fa-solid fa-chevron-down season-chevron"></i>
      </div>

      {/* Custom Scrollable Dropdown Menu */}
      <div className="custom-season-menu" id="custom-season-menu">
        <div className="season-options-list" id="season-options-list">
          {seasons.map((s) => {
            const yr = typeof s === 'object' ? s.year : s;
            const isSelected = yr === season;
            return (
              <div
                key={yr}
                className={`season-option-item ${isSelected ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(yr);
                }}
              >
                <span>{yr} Season</span>
                {isSelected && (
                  <i className="fa-solid fa-check" style={{ fontSize: '10px' }}></i>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

