import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTimezone } from "../../context/TimezoneContext";
import { F1Api } from "../../api/client";
import { NAME } from "../../utils/helper";
import CustomSeasonDropdown from "./CustomSeasonDropdown";

const PRIMARY_TOP_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/calendar", label: "Calendar" },
  { to: "/weekend-hub", label: "Weekend Hub" },
  { to: "/standings", label: "Standings" },
  { to: "/drivers", label: "Drivers" },
  { to: "/constructors", label: "Constructors" },
];

const DRAWER_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/calendar", label: "Race Calendar" },
  { to: "/standings", label: "Standings" },
  { to: "/weekend-hub", label: "Weekend Hub" },
  { to: "/lap-chart", label: "Lap Chart" },
  { to: "/drivers", label: "Drivers" },
  { to: "/drivers-directory", label: "Drivers Directory" },
  { to: "/constructors", label: "Constructors" },
  { to: "/constructors-directory", label: "Constructors Directory" },
  { to: "/circuits", label: "Circuits Directory" },
  { to: "/analytics", label: "Analytics" },
];

export default function Header() {
  const { timezone, setTimezone } = useTimezone();
  const [showSyncPopover, setShowSyncPopover] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer automatically on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fetch Last Database Sync Metadata
  const { data: syncMeta } = useQuery({
    queryKey: ["lastSync"],
    queryFn: async () => {
      const res = await F1Api.getLastSync();
      return res?.data || res;
    },
  });

  const lastSyncStr =
    timezone === "WIB"
      ? syncMeta?.last_synced_at_wib ||
      syncMeta?.last_synced_at_utc ||
      "Up to date"
      : syncMeta?.last_synced_at_utc ||
      syncMeta?.last_synced_at_wib ||
      "Up to date";

  return (
    <>
      <header className="f1-header">
        <div className="header-left">
          <Link to="/dashboard" className="header-brand" title="Go to Dashboard">
            <img
              src="/assets/common/logo.png"
              alt="Tifosi Logo"
              className="brand-logo-img"
            />
            <span className="brand-slash-divider" aria-hidden="true" />
            <div className="brand-title">
              <h1 className="brand-logo-text">{NAME.APP_NAME}</h1>
            </div>
          </Link>

          {/* Minimalist Horizontal Top Navigation Bar */}
          <nav className="f1-top-nav" aria-label="Primary Navigation">
            {PRIMARY_TOP_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `f1-top-nav-link ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Precision Control Cluster + Slide-Over Drawer Toggle */}
        <div className="header-controls">
          {/* 1. Sync Status Pill */}
          <div
            className={`header-ctrl-pill sync-pill ${showSyncPopover ? "active" : ""}`}
            id="last-update-container"
            onClick={() => setShowSyncPopover((prev) => !prev)}
            onMouseEnter={() => setShowSyncPopover(true)}
            onMouseLeave={() => setShowSyncPopover(false)}
          >
            <span className="sync-dot-wrapper" id="sync-status-dot">
              <span className="sync-dot-core"></span>
              <span className="sync-dot-ring"></span>
            </span>
            <span className="sync-pill-prefix">Synced:</span>
            <span className="sync-pill-time" id="last-update-display">
              {lastSyncStr}
            </span>

            {/* Hover Details Popover */}
            <div
              className="sync-details-popover"
              id="sync-details-popover"
              style={{ display: showSyncPopover ? "block" : "none" }}
            >
              <div className="popover-header">
                <span className="popover-title-dot"></span>
                <span>Database Sync</span>
                <span className="popover-status-tag" id="popover-sync-status">
                  {syncMeta?.status || "ONLINE"}
                </span>
              </div>
              <div className="popover-body">
                <div className="popover-row">
                  <span className="popover-label">WIB (UTC+7)</span>
                  <span className="popover-val" id="popover-sync-wib">
                    {syncMeta?.last_synced_at_wib || "Up to date"}
                  </span>
                </div>
                <div className="popover-row">
                  <span className="popover-label">UTC</span>
                  <span className="popover-val" id="popover-sync-utc">
                    {syncMeta?.last_synced_at_utc || "Up to date"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Season Dropdown Pill */}
          <CustomSeasonDropdown />

          {/* 3. Segmented Timezone Switcher [WIB | UTC] */}
          <div
            className="header-ctrl-pill tz-segmented-pill"
            role="group"
            aria-label="Timezone Switcher"
          >
            <button
              id="tz-btn-wib"
              type="button"
              className={`tz-seg-btn ${timezone === "WIB" ? "active" : ""}`}
              onClick={() => setTimezone("WIB")}
              title="Western Indonesian Time (UTC+7)"
            >
              WIB
            </button>
            <span className="tz-seg-divider" aria-hidden="true"></span>
            <button
              id="tz-btn-utc"
              type="button"
              className={`tz-seg-btn ${timezone === "UTC" ? "active" : ""}`}
              onClick={() => setTimezone("UTC")}
              title="Coordinated Universal Time"
            >
              UTC
            </button>
          </div>

          {/* 4. Right Drawer Toggle Button (≡) */}
          <button
            id="nav-drawer-toggle-btn"
            type="button"
            className="f1-drawer-toggle-btn"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-label="Open Navigation Menu"
            title="Menu"
          >
            <i className={`fa-solid ${isDrawerOpen ? "fa-xmark" : "fa-bars"}`}></i>
          </button>
        </div>
      </header>

      {/* Right Slide-Over Navigation Drawer */}
      {isDrawerOpen && (
        <div
          className="f1-drawer-backdrop"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      <aside
        className={`f1-right-drawer ${isDrawerOpen ? "open" : ""}`}
        aria-label="Full Navigation Menu"
      >
        <div className="f1-drawer-header">
          <button
            type="button"
            className="f1-drawer-close-btn"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close Menu"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav className="f1-drawer-links">
          {DRAWER_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `f1-drawer-link-item ${isActive ? "active" : ""}`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
