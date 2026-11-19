import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

const SIDEBAR_MENU = [
  {
    type: "link",
    id: "dashboard",
    to: "/dashboard",
    icon: "fa-solid fa-table-cells-large",
    label: "Dashboard",
  },
  {
    type: "accordion",
    id: "championship",
    icon: "fa-solid fa-trophy",
    label: "Championship",
    children: [
      { to: "/calendar", icon: "fa-regular fa-calendar", label: "Race Calendar" },
      { to: "/standings", icon: "fa-solid fa-ranking-star", label: "Standings" },
    ],
  },
  {
    type: "accordion",
    id: "telemetry",
    icon: "fa-solid fa-flag-checkered",
    label: "Race Telemetry",
    children: [
      { to: "/weekend-hub", icon: "fa-solid fa-gauge-high", label: "Weekend Hub" },
      { to: "/lap-chart", icon: "fa-solid fa-chart-line", label: "Lap Chart" },
    ],
  },
  {
    type: "accordion",
    id: "archive",
    icon: "fa-solid fa-layer-group",
    label: "Archive & Data",
    children: [
      { to: "/drivers", icon: "fa-solid fa-id-badge", label: "Drivers" },
      { to: "/constructors", icon: "fa-solid fa-shield-halved", label: "Constructors" },
      { to: "/circuits", icon: "fa-solid fa-route", label: "Circuits" },
    ],
  },
  {
    type: "link",
    id: "analytics",
    to: "/analytics",
    icon: "fa-solid fa-sliders",
    label: "Analytics",
  },
];

export default function Sidebar({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) {
  const location = useLocation();
  const [openGroupId, setOpenGroupId] = useState("championship");

  // Automatically open the accordion group that contains the active route
  useEffect(() => {
    const matchedGroup = SIDEBAR_MENU.find(
      (item) =>
        item.type === "accordion" &&
        item.children.some((child) => location.pathname.startsWith(child.to))
    );
    if (matchedGroup) {
      setOpenGroupId(matchedGroup.id);
    }
  }, [location.pathname]);

  const handleToggleGroup = (groupId) => {
    if (isCollapsed) {
      onToggleCollapse();
      setOpenGroupId(groupId);
      return;
    }
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        id="mobile-backdrop"
        className={`mobile-backdrop ${isMobileOpen ? "active" : ""}`}
        onClick={onCloseMobile}
        style={{ display: isMobileOpen ? "block" : "none" }}
      ></div>

      {/* Flow-UI Inspired Interactive Accordion Sidebar */}
      <aside
        className={`f1-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
        id="f1-sidebar"
      >
        <nav className="sidebar-nav flow-sidebar-nav">
          {/* Top MENU label + Collapse / Mobile Close Controls */}
          <div className="flow-sidebar-top-actions">
            <span className="flow-sidebar-menu-label">MENU</span>
            <div className="sidebar-inline-actions">
              <button
                id="sidebar-toggle-btn"
                type="button"
                className="sidebar-top-icon-btn"
                onClick={onToggleCollapse}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label="Toggle Sidebar"
              >
                <i
                  className={`fa-solid ${isCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`}
                ></i>
              </button>

              <button
                id="sidebar-close-btn"
                type="button"
                className="sidebar-close-mobile-btn"
                onClick={onCloseMobile}
                title="Close Menu"
                aria-label="Close Menu"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div className="flow-nav-list">
            {SIDEBAR_MENU.map((item) => {
              if (item.type === "link") {
                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flow-nav-row ${isActive ? "active" : ""}`
                    }
                  >
                    <span className="flow-nav-left">
                      <span className="flow-nav-icon">
                        <i className={item.icon}></i>
                      </span>
                      <span className="flow-nav-label">{item.label}</span>
                    </span>
                  </NavLink>
                );
              }

              const isGroupOpen = !isCollapsed && openGroupId === item.id;
              const hasActiveChild = item.children.some((c) =>
                location.pathname.startsWith(c.to)
              );

              return (
                <div
                  key={item.id}
                  className={`flow-accordion-group ${isGroupOpen ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className={`flow-nav-row flow-accordion-trigger ${isGroupOpen ? "open" : ""} ${hasActiveChild ? "child-active" : ""}`}
                    onClick={() => handleToggleGroup(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="flow-nav-left">
                      <span className="flow-nav-icon">
                        <i className={item.icon}></i>
                      </span>
                      <span className="flow-nav-label">{item.label}</span>
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down flow-accordion-chevron ${isGroupOpen ? "rotated" : ""}`}
                    ></i>
                  </button>

                  <div
                    className={`flow-submenu-wrapper ${isGroupOpen ? "open" : ""}`}
                  >
                    <div className="flow-submenu-inner">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flow-sub-item ${isActive ? "active" : ""}`
                          }
                        >
                          <span className="flow-sub-icon">
                            <i className={child.icon}></i>
                          </span>
                          <span className="flow-sub-label">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
