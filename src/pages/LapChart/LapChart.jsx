import React, { useState, useMemo, useRef, useEffect } from "react";
import F1Select from "../../components/common/F1Select";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray } from "../../api/client";
import { ChartSkeleton } from "../../components/common/Skeleton";
import { CountryFlag } from "../../utils/flags";
import { getTeamLogo } from "../../utils/f1Assets";
import {
  getDriverCode,
  getDriverColor,
  getTeamShortCode,
} from "../../utils/teamColors";
import DriverBadge from "../../components/common/DriverBadge";

function formatOrdinalShort(n) {
  const num = Number(n);
  if (!num || Number.isNaN(num)) return "";
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  switch (num % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}

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

  const [hoveredDriver, setHoveredDriver] = useState(null);

  const broadcastLayout = useMemo(() => {
    if (!chartData || chartData.driverNames.length === 0) return null;
    const { driverNames, driverMap, maxLap } = chartData;

    const resultRankMap = {};
    raceResults.forEach((r, idx) => {
      const rank = Number(r.finish_position ?? r.position ?? idx + 1);
      if (r.driver_name) resultRankMap[r.driver_name] = rank;
      if (r.driver_code) resultRankMap[r.driver_code] = rank;
    });

    const enriched = driverNames.map((name) => {
      const d = driverMap[name];
      const lapNums = Object.keys(d.positions)
        .map(Number)
        .sort((a, b) => a - b);
      const firstLap = lapNums[0] ?? 1;
      const lastLap = lapNums[lapNums.length - 1] ?? 1;
      const startPos = d.positions[firstLap] ?? 99;
      const endPos = d.positions[lastLap] ?? 99;
      const finalRank =
        resultRankMap[name] ?? resultRankMap[d.code] ?? endPos;
      const isDnf = lastLap < maxLap;

      return {
        name,
        ...d,
        lapNums,
        firstLap,
        lastLap,
        startPos,
        endPos,
        finalRank,
        isDnf,
      };
    });

    const leftOrdered = [...enriched].sort(
      (a, b) => a.startPos - b.startPos || a.finalRank - b.finalRank
    );
    const rightOrdered = [...enriched].sort(
      (a, b) =>
        Number(a.isDnf) - Number(b.isDnf) ||
        b.lastLap - a.lastLap ||
        a.endPos - b.endPos ||
        a.finalRank - b.finalRank
    );

    const rowCount = Math.max(enriched.length, chartData.maxPosition || 20);
    return {
      enriched,
      leftOrdered,
      rightOrdered,
      maxLap,
      rowCount,
    };
  }, [chartData, raceResults]);

  const applyTopPreset = (count) => {
    if (!chartData) return;
    const ordered =
      broadcastLayout?.rightOrdered?.map((d) => d.name) ||
      chartData.driverNames;
    const next = {};
    ordered.forEach((d, idx) => {
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
        </div>

        <div className="p-3">
          {isLoading ? (
            <ChartSkeleton />
          ) : broadcastLayout ? (
            <div className="f1-telemetry-chart-block">
              <div className="f1-chart-controls-bar">
                <div className="f1-chart-controls-left">
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
                                label={(chartData.driverMap[name]?.lastName || name).toUpperCase()}
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
              </div>

              <div className="lap-broadcast-card">
              {/* F1 Broadcast SVG Bump Chart */}
              <div className="lap-broadcast-scroll">
                {(() => {
                  const rowH = 24;
                  const topPad = 36;
                  const bottomPad = 18;
                  const svgH =
                    topPad + broadcastLayout.rowCount * rowH + bottomPad;
                  const svgW = 1140;
                  const plotLeft = 86;
                  const plotRight = 936;
                  const plotW = plotRight - plotLeft;
                  const maxLap = Math.max(1, broadcastLayout.maxLap);

                  const xForLap = (lap) =>
                    maxLap === 1
                      ? plotLeft
                      : plotLeft + ((lap - 1) / (maxLap - 1)) * plotW;
                  const yForPos = (pos) => topPad + (pos - 0.5) * rowH;

                  // Build lap ticks: 1, 5, 10, ..., maxLap
                  const lapTicks = [1];
                  for (let l = 5; l < maxLap; l += 5) lapTicks.push(l);
                  if (maxLap > 1 && lapTicks[lapTicks.length - 1] !== maxLap) {
                    lapTicks.push(maxLap);
                  }

                  return (
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      className="lap-broadcast-svg"
                      role="img"
                      aria-label="Formula 1 Race Classification Lap Chart"
                    >
                      {/* Top Column Labels */}
                      <text
                        x={8}
                        y={20}
                        className="lap-svg-axis-hdr"
                        textAnchor="start"
                      >
                        LAP
                      </text>
                      {lapTicks.map((l) => (
                        <text
                          key={l}
                          x={xForLap(l)}
                          y={20}
                          className="lap-svg-axis-hdr"
                          textAnchor="middle"
                        >
                          {l}
                        </text>
                      ))}
                      <text
                        x={960}
                        y={20}
                        className="lap-svg-axis-hdr"
                        textAnchor="start"
                      >
                        FINISH
                      </text>

                      {/* Horizontal Guide Lines */}
                      {Array.from({ length: broadcastLayout.rowCount }).map(
                        (_, idx) => {
                          const y = yForPos(idx + 1);
                          return (
                            <line
                              key={idx}
                              x1={plotLeft}
                              y1={y}
                              x2={plotRight}
                              y2={y}
                              stroke="rgba(255,255,255,0.06)"
                              strokeWidth="1"
                            />
                          );
                        }
                      )}

                      {/* Left Start Driver Legend (Color Bar + Team Logo + Code) */}
                      {broadcastLayout.leftOrdered.map((d, idx) => {
                        const visible = selectedDrivers[d.name] !== false;
                        const isDimmed =
                          !visible ||
                          (hoveredDriver && hoveredDriver !== d.name);
                        const y = yForPos(
                          d.startPos <= broadcastLayout.rowCount
                            ? d.startPos
                            : idx + 1
                        );
                        const logoUrl = d.team ? getTeamLogo(d.team) : null;
                        return (
                          <g
                            key={`left-${d.name}`}
                            style={{ cursor: "pointer" }}
                            opacity={isDimmed ? 0.25 : 1}
                            onMouseEnter={() => setHoveredDriver(d.name)}
                            onMouseLeave={() => setHoveredDriver(null)}
                            onClick={() => toggleDriver(d.name)}
                          >
                            <rect
                              x={8}
                              y={y - 7}
                              width={3.5}
                              height={14}
                              rx={1.5}
                              fill={d.color}
                            />
                            {logoUrl && (
                              <image
                                href={logoUrl}
                                x={16}
                                y={y - 7}
                                width={14}
                                height={14}
                                preserveAspectRatio="xMidYMid meet"
                              />
                            )}
                            <text
                              x={logoUrl ? 35 : 17}
                              y={y + 4}
                              className="lap-svg-left-code"
                            >
                              {d.code}
                            </text>
                          </g>
                        );
                      })}

                      {/* Driver Position Lines */}
                      {broadcastLayout.enriched.map((d) => {
                        if (selectedDrivers[d.name] === false) return null;
                        if (d.lapNums.length === 0) return null;

                        const isHighlighted = hoveredDriver === d.name;
                        const isDimmed =
                          hoveredDriver && hoveredDriver !== d.name;

                        const points = d.lapNums
                          .map((l) => `${xForLap(l)},${yForPos(d.positions[l])}`)
                          .join(" ");

                        const lastX = xForLap(d.lastLap);
                        const lastY = yForPos(d.endPos);

                        return (
                          <g
                            key={`line-${d.name}`}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredDriver(d.name)}
                            onMouseLeave={() => setHoveredDriver(null)}
                            onClick={() => toggleDriver(d.name)}
                          >
                            <polyline
                              fill="none"
                              stroke={d.color}
                              strokeWidth={isHighlighted ? 3.8 : 2.3}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              opacity={isDimmed ? 0.14 : 0.95}
                              points={points}
                            />
                            <circle
                              cx={lastX}
                              cy={lastY}
                              r={isHighlighted ? 4.5 : 3.2}
                              fill={d.color}
                              opacity={isDimmed ? 0.2 : 1}
                            />
                          </g>
                        );
                      })}

                      {/* Right Finish Classification */}
                      {broadcastLayout.rightOrdered.map((d, idx) => {
                        const visible = selectedDrivers[d.name] !== false;
                        const isDimmed =
                          !visible ||
                          (hoveredDriver && hoveredDriver !== d.name);
                        const y = yForPos(idx + 1);
                        return (
                          <g
                            key={`right-${d.name}`}
                            style={{ cursor: "pointer" }}
                            opacity={isDimmed ? 0.25 : 1}
                            onMouseEnter={() => setHoveredDriver(d.name)}
                            onMouseLeave={() => setHoveredDriver(null)}
                            onClick={() => toggleDriver(d.name)}
                          >
                            {!d.isDnf && (
                              <text
                                x={960}
                                y={y + 4}
                                className="lap-svg-rank"
                                textAnchor="start"
                              >
                                {formatOrdinalShort(idx + 1)}
                              </text>
                            )}
                            <text
                              x={1004}
                              y={y + 4}
                              className="lap-svg-right-name"
                              textAnchor="start"
                            >
                              {d.lastName.toUpperCase()}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
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
