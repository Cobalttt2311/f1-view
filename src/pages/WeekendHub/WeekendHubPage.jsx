import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { F1Api } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import DriverBadge from "../../components/common/DriverBadge";
import { useTableSort } from "../../utils/useTableSort";
import F1Select from "../../components/common/F1Select";

export default function WeekendHubPage() {
  const { season } = useSeason();
  const [selectedRound, setSelectedRound] = useState(1);
  const [activeTab, setActiveTab] = useState("race-results");
  // 'race-results' | 'official-grid' | 'qualifying' | 'sprint-results' | 'pit-stops'

  const { data: races = [] } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return res?.data || res || [];
    },
  });

  const selectedRace =
    races.find((r) => r.round === selectedRound) || races[0] || {};
  const currentRound = selectedRace.round || selectedRound;
  const currentRaceId =
    selectedRace.raceId || selectedRace.race_id || currentRound;

  // 1. Race Results
  const { data: raceResults = [], isLoading: loadingResults } = useQuery({
    queryKey: ["raceResults", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getRaceResults(season, currentRound);
      return res?.data || res || [];
    },
    enabled: activeTab === "race-results",
  });

  // 2. Starting Grid
  const { data: startingGrid = [], isLoading: loadingGrid } = useQuery({
    queryKey: ["startingGrid", season, currentRaceId],
    queryFn: async () => {
      const res = await F1Api.getStartingGrid(season, currentRaceId);
      return res?.data || res || [];
    },
    enabled: activeTab === "official-grid",
  });

  // 3. Qualifying
  const { data: qualifying = [], isLoading: loadingQuali } = useQuery({
    queryKey: ["qualifying", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getQualifying(season, currentRound);
      return res?.data || res || [];
    },
    enabled: activeTab === "qualifying",
  });

  // 4. Sprint Results
  const { data: sprintResults = [], isLoading: loadingSprint } = useQuery({
    queryKey: ["sprintResults", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getSprintResults(season, currentRound);
      return res?.data || res || [];
    },
    enabled: activeTab === "sprint-results",
  });

  // 5. Pit Stops
  const { data: pitStops = [], isLoading: loadingPit } = useQuery({
    queryKey: ["pitStops", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getPitStops(season, currentRound);
      return res?.data || res || [];
    },
    enabled: activeTab === "pit-stops",
  });

  // Table Sorters for each tab
  const {
    sortedData: sortedRaceResults,
    sortKey: rrSortKey,
    sortDir: rrSortDir,
    requestSort: rrRequestSort,
  } = useTableSort(raceResults, "finish_position");

  const {
    sortedData: sortedGrid,
    sortKey: sgSortKey,
    sortDir: sgSortDir,
    requestSort: sgRequestSort,
  } = useTableSort(startingGrid, "starting_grid_position");

  const {
    sortedData: sortedQuali,
    sortKey: qSortKey,
    sortDir: qSortDir,
    requestSort: qRequestSort,
  } = useTableSort(qualifying, "quali_rank");

  const {
    sortedData: sortedSprint,
    sortKey: spSortKey,
    sortDir: spSortDir,
    requestSort: spRequestSort,
  } = useTableSort(sprintResults, "finish_position");

  const {
    sortedData: sortedPit,
    sortKey: pSortKey,
    sortDir: pSortDir,
    requestSort: pRequestSort,
  } = useTableSort(pitStops, "stop_number");

  const isLoading =
    (activeTab === "race-results" && loadingResults) ||
    (activeTab === "official-grid" && loadingGrid) ||
    (activeTab === "qualifying" && loadingQuali) ||
    (activeTab === "sprint-results" && loadingSprint) ||
    (activeTab === "pit-stops" && loadingPit);

  return (
    <section id="view-weekend-hub" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Grand Prix Weekend Hub</h2>
          <p className="text-muted">
            Race Results, Official Starting Grid with penalties & pit-lane
            starts, Qualifying Q1-Q3 breakdown, and Pit Stop telemetry.
          </p>
        </div>
        <div className="header-action-group">
          <F1Select
            id="weekend-race-select"
            value={currentRound}
            onChange={(val) => setSelectedRound(Number(val))}
            options={races.map((r) => ({
              value: r.round,
              label: `Round ${r.round}: ${r.grand_prix_name}`,
            }))}
          />
        </div>
      </div>

      {/* Weekend Sub-tabs */}
      <div className="weekend-nav-tabs">
        <button
          className={`weekend-tab ${activeTab === "race-results" ? "active" : ""}`}
          onClick={() => setActiveTab("race-results")}
        >
          <i className="fa-solid fa-flag-checkered"></i> Race Results
        </button>
        <button
          className={`weekend-tab ${activeTab === "official-grid" ? "active" : ""}`}
          onClick={() => setActiveTab("official-grid")}
        >
          <i className="fa-solid fa-bars-staggered"></i> Official Starting Grid
        </button>
        <button
          className={`weekend-tab ${activeTab === "qualifying" ? "active" : ""}`}
          onClick={() => setActiveTab("qualifying")}
        >
          <i className="fa-solid fa-stopwatch-20"></i> Qualifying (Q1-Q3)
        </button>
        <button
          className={`weekend-tab ${activeTab === "sprint-results" ? "active" : ""}`}
          onClick={() => setActiveTab("sprint-results")}
        >
          <i className="fa-solid fa-bolt"></i> Sprint Results
        </button>
        <button
          className={`weekend-tab ${activeTab === "pit-stops" ? "active" : ""}`}
          onClick={() => setActiveTab("pit-stops")}
        >
          <i className="fa-solid fa-wrench"></i> Pit Stops Telemetry
        </button>
      </div>

      <div className="f1-card">
        <div className="card-header flex-between">
          <h3 id="weekend-round-title">
            Round {currentRound} —{" "}
            <WikiLink
              text={selectedRace.grand_prix_name}
              url={selectedRace.race_wiki_url}
            />
          </h3>
          <span id="weekend-format-badge" className="badge badge-f1">
            {selectedRace.has_sprint ? "Sprint Weekend" : "Standard Format"}
          </span>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div
              style={{
                padding: "2rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
              }}
              className="text-muted"
            >
              <i
                className="fa-solid fa-spinner fa-spin fa-2x"
                style={{ color: "var(--f1-red)" }}
              ></i>
              <p
                style={{ margin: 0, fontSize: "14px", letterSpacing: "0.5px" }}
              >
                Loading session telemetry...
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              {/* 1. RACE RESULTS */}
              {activeTab === "race-results" && (
                <table className="f1-table" id="race-results-table">
                  <thead>
                    <tr>
                      <th
                        className={
                          rrSortKey === "finish_position"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("finish_position")}
                      >
                        Pos <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          rrSortKey === "car_number"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("car_number")}
                      >
                        # <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          rrSortKey === "starting_grid"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("starting_grid")}
                      >
                        Grid <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          rrSortKey === "driver_name"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("driver_name")}
                      >
                        Driver <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          rrSortKey === "team_name"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("team_name")}
                      >
                        Constructor <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          rrSortKey === "laps_completed"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("laps_completed")}
                      >
                        Laps <span className="sort-icon"></span>
                      </th>
                      <th>Time / Gap</th>
                      <th
                        className={
                          rrSortKey === "points_awarded"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("points_awarded")}
                      >
                        Points <span className="sort-icon"></span>
                      </th>
                      <th>Fastest Lap</th>
                      <th
                        className={
                          rrSortKey === "status"
                            ? `sort-${rrSortDir}`
                            : "sortable"
                        }
                        onClick={() => rrRequestSort("status")}
                      >
                        Status <span className="sort-icon"></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRaceResults.length > 0 ? (
                      sortedRaceResults.map((r, i) => {
                        const pos = r.finish_position ?? i + 1;
                        const isFL =
                          r.fastest_lap_rank === 1 ||
                          r.fastest_lap_rank === "1";
                        const pts =
                          r.points_awarded ?? r.points_earned ?? r.points ?? 0;
                        const status = r.status || r.race_status || "Finished";

                        return (
                          <tr
                            key={r.driver_code || r.driver_name || i}
                            className={isFL ? "row-fastest-lap" : ""}
                          >
                            <td className={`pos-${pos}`}>
                              <strong>P{pos}</strong>
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 600,
                              }}
                            >
                              {r.car_number || "-"}
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {r.starting_grid !== undefined &&
                              r.starting_grid !== null
                                ? `P${r.starting_grid}`
                                : "-"}
                            </td>
                            <td>
                              <DriverBadge
                                name={r.driver_name}
                                code={r.driver_code}
                                team={r.team_name}
                                season={season}
                                wikiUrl={r.driver_wiki_url}
                              />
                            </td>
                            <td>
                              <WikiLink
                                text={r.team_name || r.constructor_name}
                                url={r.constructor_wiki_url}
                              />
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {r.laps_completed ?? "-"}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: "bold",
                                color: "#ffffff",
                              }}
                            >
                              {r.race_time_or_gap ||
                                r.time_or_gap ||
                                r.finish_time ||
                                status ||
                                "-"}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 800,
                                color: "var(--f1-cyan)",
                                fontSize: "13px",
                              }}
                            >
                              +{pts}
                            </td>
                            <td>
                              <span
                                style={{
                                  color: isFL ? "#b15bfa" : "#ffffff",
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {isFL && (
                                  <i
                                    className="fa-solid fa-stopwatch"
                                    style={{
                                      fontSize: "11px",
                                      color: "#b15bfa",
                                    }}
                                  ></i>
                                )}
                                <span>{r.fastest_lap_time || "-"}</span>
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${status === "Finished" ? "badge-success" : "badge-neutral"}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="10"
                          className="text-center py-5 text-muted"
                        >
                          No race results recorded for this event.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* 2. OFFICIAL STARTING GRID */}
              {activeTab === "official-grid" && (
                <table className="f1-table" id="official-grid-table">
                  <thead>
                    <tr>
                      <th
                        className={
                          sgSortKey === "starting_grid_position"
                            ? `sort-${sgSortDir}`
                            : "sortable"
                        }
                        onClick={() => sgRequestSort("starting_grid_position")}
                      >
                        Grid Pos <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          sgSortKey === "car_number"
                            ? `sort-${sgSortDir}`
                            : "sortable"
                        }
                        onClick={() => sgRequestSort("car_number")}
                      >
                        # <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          sgSortKey === "driver_name"
                            ? `sort-${sgSortDir}`
                            : "sortable"
                        }
                        onClick={() => sgRequestSort("driver_name")}
                      >
                        Driver <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          sgSortKey === "team_name"
                            ? `sort-${sgSortDir}`
                            : "sortable"
                        }
                        onClick={() => sgRequestSort("team_name")}
                      >
                        Constructor Team <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          sgSortKey === "qualifying_position"
                            ? `sort-${sgSortDir}`
                            : "sortable"
                        }
                        onClick={() => sgRequestSort("qualifying_position")}
                      >
                        Qualifying Pos <span className="sort-icon"></span>
                      </th>
                      <th>Best Quali Lap</th>
                      <th
                        className={
                          sgSortKey === "grid_status"
                            ? `sort-${sgSortDir}`
                            : "sortable"
                        }
                        onClick={() => sgRequestSort("grid_status")}
                      >
                        Starting Grid Status <span className="sort-icon"></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGrid.length > 0 ? (
                      sortedGrid.map((g, i) => {
                        const gridPos =
                          g.starting_grid_position ?? g.grid_position ?? i + 1;
                        let statusBadge = (
                          <span className="badge badge-neutral">
                            {g.grid_status || "As Qualified"}
                          </span>
                        );
                        if (
                          String(gridPos) === "PL" ||
                          g.grid_status === "Pit Lane Start"
                        ) {
                          statusBadge = (
                            <span className="badge badge-danger">
                              <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                              Pit Lane Start
                            </span>
                          );
                        } else if (
                          g.grid_status &&
                          g.grid_status.includes("Penalty")
                        ) {
                          statusBadge = (
                            <span className="badge badge-danger">
                              {g.grid_status}
                            </span>
                          );
                        } else if (
                          g.grid_status &&
                          g.grid_status.includes("Promotion")
                        ) {
                          statusBadge = (
                            <span className="badge badge-success">
                              {g.grid_status}
                            </span>
                          );
                        }

                        return (
                          <tr key={g.driver_name || i}>
                            <td
                              className={`pos-${gridPos} font-weight-bold`}
                              style={{ fontSize: "14px" }}
                            >
                              {String(gridPos) === "PL" ? "PL" : `P${gridPos}`}
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {g.car_number || "-"}
                            </td>
                            <td>
                              <DriverBadge
                                name={g.driver_name}
                                code={g.driver_code}
                                team={g.team_name}
                                season={season}
                                wikiUrl={g.driver_wiki_url}
                              />
                            </td>
                            <td>
                              <WikiLink
                                text={g.team_name}
                                url={g.constructor_wiki_url}
                              />
                            </td>
                            <td>
                              {g.qualifying_position
                                ? `P${g.qualifying_position}`
                                : "N/A"}
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {g.qualifying_best_lap || g.best_lap || "-"}
                            </td>
                            <td>{statusBadge}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          Official starting grid not yet published or
                          unavailable for this event.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* 3. QUALIFYING */}
              {activeTab === "qualifying" && (
                <table className="f1-table" id="qualifying-table">
                  <thead>
                    <tr>
                      <th
                        className={
                          qSortKey === "quali_rank"
                            ? `sort-${qSortDir}`
                            : "sortable"
                        }
                        onClick={() => qRequestSort("quali_rank")}
                      >
                        Pos <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          qSortKey === "driver_name"
                            ? `sort-${qSortDir}`
                            : "sortable"
                        }
                        onClick={() => qRequestSort("driver_name")}
                      >
                        Driver <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          qSortKey === "team_name"
                            ? `sort-${qSortDir}`
                            : "sortable"
                        }
                        onClick={() => qRequestSort("team_name")}
                      >
                        Constructor Team <span className="sort-icon"></span>
                      </th>
                      <th>Q1 Lap</th>
                      <th>Q2 Lap</th>
                      <th>Q3 Lap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedQuali.length > 0 ? (
                      sortedQuali.map((q, i) => {
                        const pos =
                          q.quali_rank ??
                          q.qualifying_position ??
                          q.position ??
                          i + 1;
                        return (
                          <tr key={q.driver_name || i}>
                            <td className={`pos-${pos}`}>
                              <strong>P{pos}</strong>
                            </td>
                            <td>
                              <DriverBadge
                                name={q.driver_name}
                                code={q.driver_code}
                                team={q.team_name}
                                season={season}
                                wikiUrl={q.driver_wiki_url}
                              />
                            </td>
                            <td>
                              <WikiLink
                                text={q.team_name}
                                url={q.constructor_wiki_url}
                              />
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {q.q1_time || q.q1 || "-"}
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {q.q2_time || q.q2 || "-"}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                color: "var(--f1-cyan)",
                              }}
                            >
                              {q.q3_time || q.q3 || "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          No qualifying results recorded for this round.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* 4. SPRINT RESULTS */}
              {activeTab === "sprint-results" && (
                <table className="f1-table" id="sprint-results-table">
                  <thead>
                    <tr>
                      <th
                        className={
                          spSortKey === "finish_position"
                            ? `sort-${spSortDir}`
                            : "sortable"
                        }
                        onClick={() => spRequestSort("finish_position")}
                      >
                        Pos <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          spSortKey === "car_number"
                            ? `sort-${spSortDir}`
                            : "sortable"
                        }
                        onClick={() => spRequestSort("car_number")}
                      >
                        # <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          spSortKey === "starting_grid"
                            ? `sort-${spSortDir}`
                            : "sortable"
                        }
                        onClick={() => spRequestSort("starting_grid")}
                      >
                        Grid <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          spSortKey === "driver_name"
                            ? `sort-${spSortDir}`
                            : "sortable"
                        }
                        onClick={() => spRequestSort("driver_name")}
                      >
                        Driver <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          spSortKey === "team_name"
                            ? `sort-${spSortDir}`
                            : "sortable"
                        }
                        onClick={() => spRequestSort("team_name")}
                      >
                        Constructor Team <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          spSortKey === "laps_completed"
                            ? `sort-${spSortDir}`
                            : "sortable"
                        }
                        onClick={() => spRequestSort("laps_completed")}
                      >
                        Laps <span className="sort-icon"></span>
                      </th>
                      <th>Sprint Time / Gap</th>
                      <th
                        className={
                          spSortKey === "points_awarded"
                            ? `sort-${spSortDir}`
                            : "sortable"
                        }
                        onClick={() => spRequestSort("points_awarded")}
                      >
                        Sprint Points <span className="sort-icon"></span>
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSprint.length > 0 ? (
                      sortedSprint.map((s, i) => {
                        const pos = s.finish_position ?? i + 1;
                        const pts =
                          s.points_awarded ??
                          s.sprint_points_earned ??
                          s.points ??
                          0;
                        const status =
                          s.status || s.sprint_status || "Finished";

                        return (
                          <tr key={s.driver_name || i}>
                            <td className={`pos-${pos}`}>
                              <strong>P{pos}</strong>
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 600,
                              }}
                            >
                              {s.car_number || "-"}
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {s.starting_grid ? `P${s.starting_grid}` : "-"}
                            </td>
                            <td>
                              <DriverBadge
                                name={s.driver_name}
                                code={s.driver_code}
                                team={s.team_name}
                                season={season}
                                wikiUrl={s.driver_wiki_url}
                              />
                            </td>
                            <td>
                              <WikiLink
                                text={s.team_name || s.constructor_name}
                                url={s.constructor_wiki_url}
                              />
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {s.laps_completed || "-"}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: "bold",
                                color: "#ffffff",
                              }}
                            >
                              {s.race_time_or_gap ||
                                s.time_or_gap ||
                                s.time ||
                                status ||
                                "-"}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 800,
                                color: "var(--f1-cyan)",
                                fontSize: "13px",
                              }}
                            >
                              +{pts}
                            </td>
                            <td>
                              <span
                                className={`badge ${status === "Finished" ? "badge-success" : "badge-neutral"}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-5 text-muted">
                          No sprint race results found (Standard race weekend
                          format).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* 5. PIT STOPS */}
              {activeTab === "pit-stops" && (
                <table className="f1-table" id="pit-stops-table">
                  <thead>
                    <tr>
                      <th
                        className={
                          pSortKey === "stop_number"
                            ? `sort-${pSortDir}`
                            : "sortable"
                        }
                        onClick={() => pRequestSort("stop_number")}
                      >
                        Stop # <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          pSortKey === "driver_name"
                            ? `sort-${pSortDir}`
                            : "sortable"
                        }
                        onClick={() => pRequestSort("driver_name")}
                      >
                        Driver <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          pSortKey === "team_name"
                            ? `sort-${pSortDir}`
                            : "sortable"
                        }
                        onClick={() => pRequestSort("team_name")}
                      >
                        Constructor <span className="sort-icon"></span>
                      </th>
                      <th
                        className={
                          pSortKey === "lap" ? `sort-${pSortDir}` : "sortable"
                        }
                        onClick={() => pRequestSort("lap")}
                      >
                        Lap <span className="sort-icon"></span>
                      </th>
                      <th>Time of Day (UTC)</th>
                      <th
                        className={
                          pSortKey === "stop_duration_seconds"
                            ? `sort-${pSortDir}`
                            : "sortable"
                        }
                        onClick={() => pRequestSort("stop_duration_seconds")}
                      >
                        Pit Duration <span className="sort-icon"></span>
                      </th>
                      <th>Milliseconds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPit.length > 0 ? (
                      sortedPit.map((p, i) => {
                        const stop = p.stop_number ?? i + 1;
                        const durationSec =
                          p.stop_duration_seconds !== undefined &&
                          p.stop_duration_seconds !== null
                            ? `${p.stop_duration_seconds}s`
                            : p.duration_seconds
                              ? `${p.duration_seconds}s`
                              : "-";
                        const ms =
                          p.total_stop_milliseconds !== undefined &&
                          p.total_stop_milliseconds !== null
                            ? `${p.total_stop_milliseconds} ms`
                            : p.duration_millis !== undefined &&
                                p.duration_millis !== null
                              ? `${p.duration_millis} ms`
                              : p.milliseconds
                                ? `${p.milliseconds} ms`
                                : "-";

                        return (
                          <tr key={i}>
                            <td>
                              <span className="badge badge-f1">
                                Stop {stop}
                              </span>
                            </td>
                            <td>
                              <DriverBadge
                                name={p.driver_name}
                                code={p.driver_code}
                                team={p.team_name}
                                season={season}
                                wikiUrl={p.driver_wiki_url}
                              />
                            </td>
                            <td>
                              <WikiLink
                                text={p.team_name}
                                url={p.constructor_wiki_url}
                              />
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              Lap {p.lap}
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>
                              {p.time_of_day_utc ||
                                p.time_of_day ||
                                p.time ||
                                "-"}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                color: "var(--f1-cyan)",
                              }}
                            >
                              {durationSec}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--f1-text-dim)",
                              }}
                            >
                              {ms}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          No pit stop telemetry recorded for this round.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
