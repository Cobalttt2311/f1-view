import React, { useState, useMemo, useRef, useEffect } from "react";
import F1Select from "../../components/common/F1Select";
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
import {
  getDriverCode,
  getDriverColor,
  getTeamShortCode,
} from "../../utils/teamColors";
import DriverBadge from "../../components/common/DriverBadge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LapChart() {
  const { season } = useSeason();
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedDrivers, setSelectedDrivers] = useState({});
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

  const { data: racesData = [] } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return toArray(res);
    },
  });
  const races = Array.isArray(racesData) ? racesData : [];

  const { data: rawLaps = [], isLoading } = useQuery({
    queryKey: ["lapChart", season, selectedRound],
    queryFn: async () => {
      const res = await F1Api.getLapChart(season, selectedRound);
      return toArray(res);
    },
    enabled: !!selectedRound,
  });

  const { data: raceResultsData = [] } = useQuery({
    queryKey: ["raceResultforLapChart", season, selectedRound],
    queryFn: async () => {
      const res = await F1Api.getRaceResults(season, selectedRound);
      return toArray(res);
    },
    enabled: !!selectedRound,
  });
  const raceResults = Array.isArray(raceResultsData) ? raceResultsData : [];

  const chartData = useMemo(() => {
    if (!rawLaps || !Array.isArray(rawLaps) || rawLaps.length === 0)
      return null;

    const teamLookup = {};
    raceResults.forEach((r) => {
      if (r.driver_code) teamLookup[r.driver_code] = r.team_name;
      if (r.driver_name) teamLookup[r.driver_name] = r.team_name;
    });

    const driverMap = {};
    let maxLap = 0;
    let maxPosition = 20;

    rawLaps.forEach((row) => {
      const driver = row.driver_name || row.driver || "Unknown";
      if (!driverMap[driver]) {
        const code = getDriverCode(driver, row.driver_code);
        const team =
          row.team_name ||
          row.constructor_name ||
          teamLookup[row.driver_code] ||
          teamLookup[row.driver_name] ||
          "";
        const color = getDriverColor(code, team, season);
        const teamShort = getTeamShortCode(team, code);
        const parts = String(driver).trim().split(/\s+/);
        const lastName = parts[parts.length - 1] || driver;

        driverMap[driver] = {
          code,
          fullName: driver,
          lastName,
          team,
          teamShort,
          color,
          positions: {},
        };
      }
      const lap = Number(row.lap);
      const pos = Number(row.track_position ?? row.position);
      if (!isNaN(lap) && !isNaN(pos) && pos > 0) {
        driverMap[driver].positions[lap] = pos;
        if (lap > maxLap) maxLap = lap;
        if (pos > maxPosition) maxPosition = pos;
      }
    });

    const labels = Array.from({ length: maxLap }, (_, i) => `L${i + 1}`);
    const drivers = Object.keys(driverMap);

    const datasets = drivers.map((driverName) => {
      const d = driverMap[driverName];
      const dataPoints = labels.map((_, i) => d.positions[i + 1] ?? null);
      const isVisible = selectedDrivers[driverName] !== false;

      return {
        label: d.team ? `${d.fullName} (${d.team})` : d.fullName,
        data: dataPoints,
        borderColor: d.color,
        backgroundColor: d.color,
        borderWidth: 2.2,
        pointRadius: 2.5,
        pointHoverRadius: 5.5,
        tension: 0.15,
        spanGaps: true,
        clip: false,
        hidden: !isVisible,
      };
    });

    return {
      labels,
      datasets,
      driverNames: drivers,
      driverMap,
      maxLap,
      maxPosition,
    };
  }, [rawLaps, selectedDrivers, season, raceResults]);

  const toggleDriver = (name) => {
    setSelectedDrivers((prev) => ({
      ...prev,
      [name]: prev[name] === false ? true : false,
    }));
  };

  const setAllDrivers = (status) => {
    if (!chartData) return;
    const next = {};
    chartData.driverNames.forEach((d) => {
      next[d] = status;
    });
    setSelectedDrivers(next);
  };

  const selectedCount = chartData
    ? chartData.driverNames.filter((d) => selectedDrivers[d] !== false).length
    : 0;
  const totalDrivers = chartData ? chartData.driverNames.length : 0;
  const filterLabel =
    totalDrivers > 0 && selectedCount === totalDrivers
      ? "All"
      : `${selectedCount}/${totalDrivers}`;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 12,
        right: 12,
        bottom: 8,
        left: 4,
      },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.04)" },
        ticks: {
          color: "#7a7f94",
          font: { family: "'Titillium Web', sans-serif", size: 11, weight: "600" },
        },
      },
      y: {
        reverse: true,
        min: 0.5,
        max: chartData ? chartData.maxPosition + 0.5 : 20.5,
        afterBuildTicks: (axis) => {
          const maxPos = chartData ? chartData.maxPosition : 20;
          axis.ticks = Array.from({ length: maxPos }, (_, i) => ({
            value: i + 1,
          }));
        },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
        ticks: {
          color: "#7a7f94",
          font: { family: "'Titillium Web', sans-serif", size: 11, weight: "700" },
          stepSize: 1,
          callback: (val) => (Number.isInteger(val) && val >= 1 ? `P${val}` : ""),
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
        titleFont: { family: "'Titillium Web', sans-serif", size: 13, weight: "700" },
        bodyFont: { family: "'Titillium Web', sans-serif", size: 12, weight: "600" },
        callbacks: {
          label: (context) => `${context.dataset.label}: P${context.parsed.y}`,
        },
      },
    },
  };

  const applyTopPreset = (count) => {
    if (!chartData) return;
    const next = {};
    chartData.driverNames.forEach((d, idx) => {
      next[d] = idx < count;
    });
    setSelectedDrivers(next);
  };

  const activeRaceObj =
    races.find((r) => Number(r.round) === Number(selectedRound)) || {};

  return (
    <section id="view-lap-chart-view" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">{season} RACE POSITION TELEMETRY</span>
          <h2 className="page-main-title">
            Lap-by-Lap Race Progression Chart
          </h2>
        </div>

        <div className="header-action-group">
          <F1Select
            id="lapchart-race-select"
            value={selectedRound}
            onChange={(val) => setSelectedRound(Number(val))}
            options={races.map((r) => ({
              value: r.round,
              label: r.grand_prix_name,
            }))}
          />

          {/* Driver Checkbox Filter Dropdown */}
          <div
            ref={filterRef}
            className={`driver-filter-dropdown-container ${isFilterOpen ? "active" : ""}`}
          >
            <button
              id="driver-filter-toggle-btn"
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
              id="driver-filter-menu"
              style={{ display: isFilterOpen ? "block" : "none" }}
            >
              <div className="filter-menu-header">
                <span>FILTER DRIVERS</span>
                <div className="filter-actions">
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={() => setAllDrivers(true)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={() => setAllDrivers(false)}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="filter-checkbox-list" id="driver-checkbox-list">
                {chartData &&
                  chartData.driverNames.map((name) => (
                    <label key={name} className="filter-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedDrivers[name] !== false}
                        onChange={() => toggleDriver(name)}
                      />
                      <DriverBadge
                        name={name}
                        code={chartData.driverMap[name]?.code}
                        team={chartData.driverMap[name]?.team}
                        season={season}
                        size={22}
                      />
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="f1-minimal-panel">
        <div className="panel-header-bar">
          <div>
            <h3 className="panel-title" id="lapchart-title">
              {activeRaceObj.grand_prix_name || `Round ${selectedRound}`} —
              Position Trace
            </h3>
            <p className="panel-subtitle">
              {chartData
                ? `${season} Round ${selectedRound} • ${chartData.maxLap} Laps • ${chartData.driverNames.length} Classified Drivers`
                : "P1 to P20 Track Position History"}
            </p>
          </div>
          {chartData && (
            <div className="filter-actions">
              <button
                type="button"
                className="f1-row-action-btn"
                onClick={() => applyTopPreset(5)}
              >
                Top 5
              </button>
              <button
                type="button"
                className="f1-row-action-btn"
                onClick={() => applyTopPreset(10)}
              >
                Top 10
              </button>
              <button
                type="button"
                className="f1-row-action-btn"
                onClick={() => setAllDrivers(true)}
              >
                Show All
              </button>
              <button
                type="button"
                className="f1-row-action-btn"
                onClick={() => setAllDrivers(false)}
              >
                Hide All
              </button>
            </div>
          )}
        </div>

        <div className="p-3">
          {isLoading ? (
            <div className="f1-loading-state">
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p>Loading lap-by-lap telemetry...</p>
            </div>
          ) : chartData && chartData.datasets.length > 0 ? (
            <div className="f1-telemetry-chart-block">
              <div className="f1-chart-legend-grid">
                {chartData.driverNames.map((name) => {
                  const d = chartData.driverMap[name];
                  const active = selectedDrivers[name] !== false;
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`f1-chart-legend-chip ${active ? "active" : "muted"}`}
                      onClick={() => toggleDriver(name)}
                      title={`${d.fullName}${d.team ? ` — ${d.team}` : ""}`}
                    >
                      <span
                        className="legend-chip-color-bar"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="legend-chip-code">{d.code}</span>
                      <span className="legend-chip-name">{d.lastName}</span>
                      {d.teamShort && (
                        <span
                          className="legend-chip-team"
                          style={{ color: d.color }}
                        >
                          {d.teamShort}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="chart-wrapper" style={{ height: "540px" }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          ) : (
            <div className="f1-empty-state">
              No lap progression data available for this round.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
