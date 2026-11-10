import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTimezone } from "../../context/TimezoneContext";
import { F1Api } from "../../api/client";
import { NAME } from "../../utils/helper";
import CustomSeasonDropdown from "./CustomSeasonDropdown";

export default function Header({ onToggleMobileSidebar }) {
  const { timezone, setTimezone } = useTimezone();
  const [showSyncPopover, setShowSyncPopover] = useState(false);

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
    <header className="f1-header">
      <div className="header-left">
        <button
          id="mobile-menu-btn"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
        <div className="header-brand">
          <img
            src="/assets/logo.png"
            alt="Tifosi Logo"
            className="brand-logo-img"
          />
          <div className="brand-title">
            <h1 className="brand-logo-text">{NAME.APP_NAME}</h1>
            <p className="brand-subtitle">{NAME.SUB_NAME}</p>
          </div>
        </div>
      </div>

      <div className="header-controls">
        {/* Global Last Update Indicator with Hover Details */}
        <div
          className={`last-update-container ${showSyncPopover ? "active" : ""}`}
          id="last-update-container"
          onClick={() => setShowSyncPopover((prev) => !prev)}
          onMouseEnter={() => setShowSyncPopover(true)}
          onMouseLeave={() => setShowSyncPopover(false)}
        >
          <span className="sync-status-indicator" id="sync-status-dot">
            <span className="sync-dot pulse-green"></span>
          </span>
          <span className="last-update-label">Last Updated:</span>
          <span className="last-update-value" id="last-update-display">
            {lastSyncStr}
          </span>

          {/* Hover Details Popover */}
          <div
            className="sync-details-popover"
            id="sync-details-popover"
            style={{ display: showSyncPopover ? "block" : "none" }}
          >
            <div className="popover-header">
              <i className="fa-solid fa-clock-rotate-left text-cyan"></i>
              <span>Database Sync Time</span>
            </div>
            <div className="popover-body">
              <div className="popover-row">
                <span className="popover-label">Status:</span>
                <span
                  className="popover-val status-badge"
                  id="popover-sync-status"
                >
                  {syncMeta?.status || "SUCCESS"}
                </span>
              </div>
              <div className="popover-row">
                <span className="popover-label">WIB (UTC+7):</span>
                <span className="popover-val font-mono" id="popover-sync-wib">
                  {syncMeta?.last_synced_at_wib || "-"}
                </span>
              </div>
              <div className="popover-row">
                <span className="popover-label">UTC:</span>
                <span className="popover-val font-mono" id="popover-sync-utc">
                  {syncMeta?.last_synced_at_utc || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Custom Season Dropdown */}
        <CustomSeasonDropdown />

        {/* Global Timezone Switcher */}
        <div className="tz-switch-container">
          <span className="tz-label">
            <i className="fa-regular fa-clock"></i> Time Zone:
          </span>
          <div className="tz-toggle-group">
            <button
              id="tz-btn-wib"
              className={`tz-btn ${timezone === "WIB" ? "active" : ""}`}
              onClick={() => setTimezone("WIB")}
            >
              <span className="tz-full">WIB (UTC+7)</span>
              <span className="tz-short">WIB</span>
            </button>
            <button
              id="tz-btn-utc"
              className={`tz-btn ${timezone === "UTC" ? "active" : ""}`}
              onClick={() => setTimezone("UTC")}
            >
              UTC
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
