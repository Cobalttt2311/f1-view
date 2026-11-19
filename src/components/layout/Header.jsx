import React, { useState } from "react";
import { Link } from "react-router-dom";
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
        <Link to="/dashboard" className="header-brand" title="Go to Dashboard">
          <img
            src="/assets/common/logo.png"
            alt="Tifosi Logo"
            className="brand-logo-img"
          />
          <span className="brand-slash-divider" aria-hidden="true" />
          <div className="brand-title">
            <h1 className="brand-logo-text">{NAME.APP_NAME}</h1>
            <p className="brand-subtitle">{NAME.SUB_NAME}</p>
          </div>
        </Link>
      </div>

      {/* Unified Precision Header Control Cluster: [● Synced] [2024 ▾] [WIB | UTC] */}
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
              <span>Last Database Sync</span>
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

        {/* 2. Season Dropdown Pill [2024 ▾] */}
        <CustomSeasonDropdown />

        {/* 3. Segmented Timezone Switcher [WIB | UTC] */}
        <div className="header-ctrl-pill tz-segmented-pill" role="group" aria-label="Timezone Switcher">
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
      </div>
    </header>
  );
}
