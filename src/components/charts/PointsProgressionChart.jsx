import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray } from "../../api/client";
import { getTeamLogo } from "../../utils/f1Assets";
import {
  getDriverCode,
  getDriverColor,
  getTeamShortCode,
} from "../../utils/teamColors";
import DriverBadge from "../common/DriverBadge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PointsProgressionChart({ rawData }) {
  const { season } = useSeason();
  const [selectedDrivers, setSelectedDrivers] = useState(null); // null = initial top 8 default
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Reset driver selection when season changes
  useEffect(() => {
    setSelectedDrivers(null);
  }, [season]);

  // Fetch season driver standings to guarantee exact team_name & driver_code for every driver
  const { data: standingsData = [] } = useQuery({
    queryKey: ["driverStandings", season],
    queryFn: async () => {
      const res = await F1Api.getDriverStandingsByYear(season);
      return toArray(res);
    },
  });

  const chartData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0)
      return null;

    // Build team & code lookup from season standings
    const standingsLookup = Object.create(null);
    (Array.isArray(standingsData) ? standingsData : []).forEach((s) => {
      if (!s) return;
      const dName = String(s.driver_name || "").toLowerCase().trim();
      if (dName) {
        standingsLookup[dName] = {
          team: s.team_name || "",
          code: s.driver_code || "",
        };
      }
    });

    // 1. Extract sorted unique rounds
    const roundMap = {};
    rawData.forEach((r) => {
      if (!roundMap[r.round]) {
        const shortGp = (r.grand_prix || "")
          .replace(/ Grand Prix$/, "")
          .replace(/ GP$/, "");
        roundMap[r.round] = `R${r.round} ${shortGp}`.trim();
      }
    });

    const sortedRounds = Object.keys(roundMap)
      .map(Number)
      .sort((a, b) => a - b);
    const roundLabels = sortedRounds.map((rnd) => roundMap[rnd]);

    // 2. Group cumulative points by driver
    const driversMap = {};
    rawData.forEach((row) => {
      const dName = row.driver_name || row.driver;
      if (!dName) return;
      if (!driversMap[dName]) {
        const st = standingsLookup[String(dName).toLowerCase().trim()] || {};
        const team = row.team_name || row.constructor_name || st.team || "";
        const code = getDriverCode(dName, row.driver_code || st.code);
        const color = getDriverColor(code, team, season);
        const teamShort = getTeamShortCode(team, code);
        const parts = String(dName).trim().split(/\s+/);
        const lastName = parts[parts.length - 1] || dName;

        driversMap[dName] = {
          fullName: dName,
          lastName,
          code,
          team,
          teamShort,
          color,
          pointsPerRound: {},
          maxPoints: 0,
        };
      }
      const rawVal = row.cumulative_season_points ?? row.cumulative_points;
      const val =
        rawVal !== null && rawVal !== undefined ? Number(rawVal) : null;
      driversMap[dName].pointsPerRound[row.round] = val;
      if (val !== null && val > driversMap[dName].maxPoints) {
        driversMap[dName].maxPoints = val;
      }
    });

    const driverNames = Object.keys(driversMap).sort(
      (a, b) => driversMap[b].maxPoints - driversMap[a].maxPoints
    );

    const isDriverActive = (name, idx) => {
      if (selectedDrivers === null) return idx < 8; // Top 8 active by default
      return Boolean(selectedDrivers[name]);
    };

    const datasets = driverNames.map((name, idx) => {
      const d = driversMap[name];
      const active = isDriverActive(name, idx);
      return {
        label: d.team ? `${d.fullName} (${d.team})` : d.fullName,
        driverName: name,
        data: sortedRounds.map((rnd) => d.pointsPerRound[rnd] ?? null),
        borderColor: d.color,
        backgroundColor: d.color,
        tension: 0.2,
        borderWidth: 2.3,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        spanGaps: true,
        hidden: !active,
      };
    });

    return {
      labels: roundLabels,
      datasets,
      driverNames,
      driversMap,
      isDriverActive,
    };
  }, [rawData, standingsData, selectedDrivers, season]);

  if (!chartData) {
    return (
      <div className="f1-empty-state">
        No cumulative points progression available.
      </div>
    );
  }

  const toggleDriver = (name, idx) => {
    setSelectedDrivers((prev) => {
      const base = {};
      chartData.driverNames.forEach((d, i) => {
        base[d] = prev === null ? i < 8 : Boolean(prev[d]);
      });
      base[name] = !base[name];
      return base;
    });
  };

  const applyPreset = (mode) => {
    const next = {};
    chartData.driverNames.forEach((d, idx) => {
      if (mode === "all") next[d] = true;
      else if (mode === "none") next[d] = false;
      else if (mode === "top5") next[d] = idx < 5;
      else if (mode === "top10") next[d] = idx < 10;
    });
    setSelectedDrivers(next);
  };

  const activeCount = chartData.driverNames.filter((d, i) =>
    chartData.isDriverActive(d, i)
  ).length;
  const totalDrivers = chartData.driverNames.length;
  const filterLabel =
    activeCount === totalDrivers ? "All" : `${activeCount}/${totalDrivers}`;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.04)" },
        ticks: {
          color: "#7a7f94",
          font: {
            family: "'Titillium Web', sans-serif",
            size: 11,
            weight: "600",
          },
        },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.04)" },
        ticks: {
          color: "#7a7f94",
          font: {
            family: "'Titillium Web', sans-serif",
            size: 11,
            weight: "600",
          },
          callback: (v) => `${v} pts`,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Using aligned custom HTML telemetry legend grid
      },
      tooltip: {
        backgroundColor: "#0e0f15",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        titleFont: {
          family: "'Titillium Web', sans-serif",
          size: 13,
          weight: "700",
        },
        bodyFont: {
          family: "'Titillium Web', sans-serif",
          size: 12,
          weight: "600",
        },
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} pts`,
        },
      },
    },
  };

  return (
    <div className="f1-telemetry-chart-block">
      {/* 1. FILTER & PRESET CONTROL BAR */}
      <div className="f1-chart-controls-bar">
        <div className="f1-chart-controls-left">
          <div
            ref={filterRef}
            className={`driver-filter-dropdown-container ${isFilterOpen ? "active" : ""}`}
          >
            <button
              type="button"
              className="f1-select driver-filter-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen((prev) => !prev);
              }}
            >
              <span className="driver-filter-btn-left">
                <span>Drivers ({filterLabel})</span>
              </span>
              <i
                className="fa-solid fa-chevron-down"
                style={{ fontSize: "10px", marginLeft: "6px" }}
              ></i>
            </button>

            <div
              className={`driver-filter-menu ${isFilterOpen ? "active" : ""}`}
              style={{ display: isFilterOpen ? "block" : "none" }}
            >
              <div className="filter-menu-header">
                <span>FILTER DRIVERS</span>
                <div className="filter-actions">
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={() => applyPreset("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={() => applyPreset("none")}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="filter-checkbox-list">
                {chartData.driverNames.map((name, idx) => {
                  const info = chartData.driversMap[name];
                  return (
                    <label key={name} className="filter-checkbox-item">
                      <input
                        type="checkbox"
                        checked={chartData.isDriverActive(name, idx)}
                        onChange={() => toggleDriver(name, idx)}
                      />
                      <DriverBadge
                        name={name}
                        code={info?.code}
                        team={info?.team}
                        season={season}
                        size={22}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="f1-chart-quick-presets">
            <button
              type="button"
              className="f1-row-action-btn"
              onClick={() => applyPreset("top5")}
            >
              Top 5
            </button>
            <button
              type="button"
              className="f1-row-action-btn"
              onClick={() => applyPreset("top10")}
            >
              Top 10
            </button>
            <button
              type="button"
              className="f1-row-action-btn"
              onClick={() => applyPreset("all")}
            >
              Show All
            </button>
            <button
              type="button"
              className="f1-row-action-btn"
              onClick={() => applyPreset("none")}
            >
              Hide All
            </button>
          </div>
        </div>

        <span className="f1-chart-legend-hint">
          Click any driver chip below to toggle line
        </span>
      </div>

      {/* 2. ALIGNED UNIFORM TELEMETRY LEGEND GRID */}
      <div className="f1-chart-legend-grid">
        {chartData.driverNames.map((name, idx) => {
          const d = chartData.driversMap[name];
          const active = chartData.isDriverActive(name, idx);
          return (
            <button
              key={name}
              type="button"
              className={`f1-chart-legend-chip ${active ? "active" : "muted"}`}
              onClick={() => toggleDriver(name, idx)}
              title={`${d.fullName}${d.team ? ` — ${d.team}` : ""} (${d.maxPoints} pts)`}
            >
              <span
                className="legend-chip-color-bar"
                style={{ backgroundColor: d.color }}
              />
              <span className="legend-chip-code">{d.code}</span>
              <span className="legend-chip-name">{d.lastName}</span>
              {d.team && getTeamLogo(d.team) && (
                <img
                  src={getTeamLogo(d.team)}
                  alt={d.team}
                  className="legend-chip-team-logo"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. CHART CANVAS */}
      <div style={{ height: "430px", width: "100%", paddingTop: "8px" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
