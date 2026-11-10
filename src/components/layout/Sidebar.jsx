import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      <div
        id="mobile-backdrop"
        className={`mobile-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        style={{ display: isMobileOpen ? 'block' : 'none' }}
      ></div>

      {/* Sidebar Navigation */}
      <aside
        className={`f1-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        id="f1-sidebar"
      >
        <div className="sidebar-top-header">
          <span className="sidebar-top-label">MENU</span>
          <div className="sidebar-ctrl-group">
            <button
              id="sidebar-close-btn"
              className="sidebar-close-mobile-btn"
              onClick={onCloseMobile}
              title="Close Menu"
              aria-label="Close Menu"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <button
              id="sidebar-toggle-btn"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              <i className="fa-solid fa-chevron-left icon-collapse"></i>
              <i className="fa-solid fa-chevron-right icon-expand"></i>
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Section 1: CORE RACING */}
          <div className="nav-section-title">CORE RACING</div>
          <NavLink
            to="/dashboard"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-gauge-high"></i> <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/calendar"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-regular fa-calendar-days"></i> <span>Race Calendar</span>
          </NavLink>
          <NavLink
            to="/practices"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-stopwatch"></i> <span>Free Practice (FP1-3)</span>
          </NavLink>
          <NavLink
            to="/sprints"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-bolt"></i> <span>Sprint Weekends</span>
          </NavLink>
          <NavLink
            to="/standings"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-trophy"></i> <span>Championship Standings</span>
          </NavLink>

          {/* Section 2: GRAND PRIX WEEKEND */}
          <div className="nav-section-title">GRAND PRIX WEEKEND</div>
          <NavLink
            to="/weekend-hub"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-flag-checkered"></i> <span>Race Weekend Hub</span>
          </NavLink>
          <NavLink
            to="/lap-chart"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-chart-line"></i> <span>Lap Chart Progression</span>
          </NavLink>

          {/* Section 3: DATABASE & STATS */}
          <div className="nav-section-title">DATABASE & STATS</div>
          <NavLink
            to="/drivers"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-user-astronaut"></i> <span>Drivers Directory</span>
          </NavLink>
          <NavLink
            to="/constructors"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-car"></i> <span>Constructors Directory</span>
          </NavLink>
          <NavLink
            to="/circuits"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-road"></i> <span>Circuits & Winners</span>
          </NavLink>
          <NavLink
            to="/analytics"
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-chart-column"></i> <span>Advanced Analytics</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
