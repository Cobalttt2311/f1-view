import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import DriverBadge from "../../components/common/DriverBadge";
import TeamBadge from "../../components/common/TeamBadge";
import { CountryFlag } from "../../utils/flags";
import { useTableSort } from "../../utils/useTableSort";
import F1Select from "../../components/common/F1Select";
import { getCircuitTrackMap, getHeroImage } from "../../utils/f1Assets";
import { formatWeekendRange } from "../../utils/helper";

export default function WeekendHubPage() {
  const { season } = useSeason();
  const [searchParams] = useSearchParams();
  const roundParam = Number(searchParams.get("round"));
  const [selectedRound, setSelectedRound] = useState(
    roundParam > 0 ? roundParam : 1
  );

  useEffect(() => {
    if (roundParam > 0) {
      setSelectedRound(roundParam);
    }
  }, [roundParam]);
  const [activeTab, setActiveTab] = useState("race-results");
  const [svgFailed, setSvgFailed] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  const { data: racesData = [] } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return toArray(res);
    },
  });
  const races = Array.isArray(racesData) ? racesData : [];

  const selectedRace =
    races.find((r) => Number(r.round) === Number(selectedRound)) ||
    races[0] ||
    {};
  const currentRound = selectedRace.round || selectedRound;
  const currentRaceId =
    selectedRace.raceId || selectedRace.race_id || currentRound;

  useEffect(() => {
    setSvgFailed(false);
    setHeroFailed(false);
    if (!selectedRace.has_sprint && activeTab === "sprint-results") {
      setActiveTab("race-results");
    }
  }, [currentRound, season, selectedRace.has_sprint, activeTab]);

  // 1. Race Results
  const { data: raceResults = [], isLoading: loadingResults } = useQuery({
    queryKey: ["raceResults", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getRaceResults(season, currentRound);
      return toArray(res);
    },
    enabled: activeTab === "race-results",
  });

  // 2. Starting Grid
  const { data: startingGrid = [], isLoading: loadingGrid } = useQuery({
    queryKey: ["startingGrid", season, currentRaceId],
    queryFn: async () => {
      const res = await F1Api.getStartingGrid(season, currentRaceId);
      return toArray(res);
    },
    enabled: activeTab === "official-grid",
  });

  // 3. Qualifying
  const { data: qualifying = [], isLoading: loadingQuali } = useQuery({
    queryKey: ["qualifying", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getQualifying(season, currentRound);
      return toArray(res);
    },
    enabled: activeTab === "qualifying",
  });

  // 4. Sprint Results
  const { data: sprintResults = [], isLoading: loadingSprint } = useQuery({
    queryKey: ["sprintResults", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getSprintResults(season, currentRound);
      return toArray(res);
    },
    enabled: activeTab === "sprint-results",
  });

  // 5. Pit Stops
  const { data: pitStops = [], isLoading: loadingPit } = useQuery({
    queryKey: ["pitStops", season, currentRound],
    queryFn: async () => {
      const res = await F1Api.getPitStops(season, currentRound);
      return toArray(res);
    },
    enabled: activeTab === "pit-stops",
  });

  // Table Sorters
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

  const trackSvgUrl = getCircuitTrackMap(
    selectedRace.circuit_name,
    selectedRace.grand_prix_name,
    selectedRace.location,
    selectedRace.country
  );
  const heroBgUrl = getHeroImage(
    selectedRace.circuit_name,
    selectedRace.grand_prix_name,
    selectedRace.location,
    selectedRace.country
  );

  return (
    <section id="view-weekend-hub" className="content-view active">
      {/* GRAND PRIX WEEKEND BANNER */}
      <div
        className="f1-weekend-hero-banner"
        style={{
          backgroundImage:
            heroBgUrl && !heroFailed
              ? `linear-gradient(90deg, rgba(7,7,10,0.96) 0%, rgba(7,7,10,0.82) 55%, rgba(7,7,10,0.92) 100%), url("${heroBgUrl}")`
              : "linear-gradient(135deg, #13151f 0%, #090a0f 100%)",
        }}
      >
        {heroBgUrl && (
          <img
            src={heroBgUrl}
            alt=""
            style={{ display: "none" }}
            onError={() => setHeroFailed(true)}
          />
        )}

        <div className="weekend-banner-left">
          <div className="hero-meta-editorial">
            <span className="hero-meta-round">
              ROUND {String(currentRound).padStart(2, "0")}
            </span>
          </div>

          <h2 className="weekend-banner-title" id="weekend-round-title">
            <WikiLink
              text={selectedRace.grand_prix_name || `Round ${currentRound}`}
              url={selectedRace.race_wiki_url}
            />
          </h2>

          {(selectedRace.race_date || selectedRace.fp1_date) && (
            <div className="hero-meta-date-row">
              {formatWeekendRange(selectedRace).toUpperCase()}
            </div>
          )}

          <div className="hero-circuit-meta">
            <span className="hero-meta-pair">
              <CountryFlag
                name={selectedRace.country || selectedRace.location}
                size={18}
              />
              <span className="hero-circuit-name">
                <WikiLink
                  text={selectedRace.circuit_name}
                  url={selectedRace.circuit_wiki_url}
                />
              </span>
            </span>
            {selectedRace.location && (
              <span className="hero-meta-pair">
                <span className="hero-meta-sep hero-location-icon">
                  <i className="fa-solid fa-location-dot"></i>
                </span>
                <span className="hero-location-text">
                  {[selectedRace.location, selectedRace.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="weekend-banner-right">
          {trackSvgUrl && !svgFailed && (
            <img
              src={trackSvgUrl}
              alt={selectedRace.circuit_name}
              className="weekend-banner-track-svg"
              onError={() => setSvgFailed(true)}
            />
          )}

          <div className="weekend-round-picker">
            <span className="picker-overline">SELECT GRAND PRIX</span>
            <F1Select
              id="weekend-race-select"
              value={currentRound}
              onChange={(val) => setSelectedRound(Number(val))}
              options={races.map((r) => ({
                value: r.round,
                label: r.grand_prix_name,
              }))}
            />
          </div>
        </div>
      </div>

      {/* TELEMETRY SUB-TABS */}
      <div className="f1-minimal-tabs-bar">
        <button
          type="button"
          className={`f1-minimal-tab ${activeTab === "race-results" ? "active" : ""}`}
          onClick={() => setActiveTab("race-results")}
        >
          Race Results
        </button>
        <button
          type="button"
          className={`f1-minimal-tab ${activeTab === "official-grid" ? "active" : ""}`}
          onClick={() => setActiveTab("official-grid")}
        >
          Official Starting Grid
        </button>
        <button
          type="button"
          className={`f1-minimal-tab ${activeTab === "qualifying" ? "active" : ""}`}
          onClick={() => setActiveTab("qualifying")}
        >
          Qualifying
        </button>
        {Boolean(selectedRace.has_sprint) && (
          <button
            type="button"
            className={`f1-minimal-tab ${activeTab === "sprint-results" ? "active" : ""}`}
            onClick={() => setActiveTab("sprint-results")}
          >
            Sprint Results
          </button>
        )}
        <button
          type="button"
          className={`f1-minimal-tab ${activeTab === "pit-stops" ? "active" : ""}`}
          onClick={() => setActiveTab("pit-stops")}
        >
          Pit Stop Summary
        </button>
      </div>

      {/* TELEMETRY DATA TABLE (Reference 1 Minimalist Aesthetic) */}
      <div className="f1-minimal-panel">
        {isLoading ? (
          <div className="f1-loading-state">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p>Loading session classification...</p>
          </div>
        ) : (
          <div className="table-responsive">
            {/* 1. RACE RESULTS */}
            {activeTab === "race-results" && (
              <table className="f1-minimal-table" id="race-results-table">
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
                      POS. <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        rrSortKey === "car_number"
                          ? `sort-${rrSortDir}`
                          : "sortable"
                      }
                      onClick={() => rrRequestSort("car_number")}
                    >
                      NO. <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        rrSortKey === "starting_grid"
                          ? `sort-${rrSortDir}`
                          : "sortable"
                      }
                      onClick={() => rrRequestSort("starting_grid")}
                    >
                      GRID <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        rrSortKey === "driver_name"
                          ? `sort-${rrSortDir}`
                          : "sortable"
                      }
                      onClick={() => rrRequestSort("driver_name")}
                    >
                      DRIVER <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        rrSortKey === "team_name"
                          ? `sort-${rrSortDir}`
                          : "sortable"
                      }
                      onClick={() => rrRequestSort("team_name")}
                    >
                      TEAM <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        rrSortKey === "laps_completed"
                          ? `sort-${rrSortDir}`
                          : "sortable"
                      }
                      onClick={() => rrRequestSort("laps_completed")}
                    >
                      LAPS <span className="sort-icon"></span>
                    </th>
                    <th>TIME / RETIRED</th>
                    <th>FASTEST LAP</th>
                    <th
                      className={`text-right ${
                        rrSortKey === "points_awarded"
                          ? `sort-${rrSortDir}`
                          : "sortable"
                      }`}
                      onClick={() => rrRequestSort("points_awarded")}
                    >
                      PTS. <span className="sort-icon"></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRaceResults.length > 0 ? (
                    sortedRaceResults.map((r, i) => {
                      const pos = r.finish_position ?? i + 1;
                      const isFL =
                        r.fastest_lap_rank === 1 || r.fastest_lap_rank === "1";
                      const pts =
                        r.points_awarded ?? r.points_earned ?? r.points ?? 0;
                      const status = r.status || r.race_status || "Finished";

                      return (
                        <tr
                          key={r.driver_code || r.driver_name || i}
                          className={isFL ? "row-fastest-lap" : ""}
                        >
                          <td className="cell-pos">{pos}</td>
                          <td className="cell-muted cell-tabular">
                            {r.car_number || "-"}
                          </td>
                          <td className="cell-muted cell-tabular">
                            {r.starting_grid !== undefined &&
                            r.starting_grid !== null
                              ? r.starting_grid
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
                            <TeamBadge
                              name={r.team_name || r.constructor_name}
                              wikiUrl={r.constructor_wiki_url}
                            />
                          </td>
                          <td className="cell-tabular">
                            {r.laps_completed ?? "-"}
                          </td>
                          <td className="cell-tabular cell-strong">
                            {r.race_time_or_gap ||
                              r.time_or_gap ||
                              r.finish_time ||
                              status ||
                              "-"}
                          </td>
                          <td className="cell-tabular">
                            <span
                              className={isFL ? "fastest-lap-text" : "cell-muted"}
                            >
                              {r.fastest_lap_time || "-"}
                            </span>
                          </td>
                          <td className="cell-points text-right">{pts}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="table-state-cell">
                        No race results recorded for this event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 2. OFFICIAL STARTING GRID */}
            {activeTab === "official-grid" && (
              <table className="f1-minimal-table" id="official-grid-table">
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
                      POS. <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        sgSortKey === "car_number"
                          ? `sort-${sgSortDir}`
                          : "sortable"
                      }
                      onClick={() => sgRequestSort("car_number")}
                    >
                      NO. <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        sgSortKey === "driver_name"
                          ? `sort-${sgSortDir}`
                          : "sortable"
                      }
                      onClick={() => sgRequestSort("driver_name")}
                    >
                      DRIVER <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        sgSortKey === "team_name"
                          ? `sort-${sgSortDir}`
                          : "sortable"
                      }
                      onClick={() => sgRequestSort("team_name")}
                    >
                      TEAM <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        sgSortKey === "qualifying_position"
                          ? `sort-${sgSortDir}`
                          : "sortable"
                      }
                      onClick={() => sgRequestSort("qualifying_position")}
                    >
                      QUALI POS. <span className="sort-icon"></span>
                    </th>
                    <th>BEST QUALI LAP</th>
                    <th
                      className={`text-right ${
                        sgSortKey === "grid_status"
                          ? `sort-${sgSortDir}`
                          : "sortable"
                      }`}
                      onClick={() => sgRequestSort("grid_status")}
                    >
                      GRID NOTE <span className="sort-icon"></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGrid.length > 0 ? (
                    sortedGrid.map((g, i) => {
                      const gridPos =
                        g.starting_grid_position ?? g.grid_position ?? i + 1;
                      const note = g.grid_status || "As Qualified";
                      const isPenalty =
                        String(gridPos) === "PL" ||
                        note.includes("Pit Lane") ||
                        note.includes("Penalty");

                      return (
                        <tr key={g.driver_name || i}>
                          <td className="cell-pos">{gridPos}</td>
                          <td className="cell-muted cell-tabular">
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
                            <TeamBadge
                              name={g.team_name}
                              wikiUrl={g.constructor_wiki_url}
                            />
                          </td>
                          <td className="cell-tabular">
                            {g.qualifying_position || "-"}
                          </td>
                          <td className="cell-tabular cell-strong">
                            {g.qualifying_best_lap || g.best_lap || "-"}
                          </td>
                          <td className="text-right">
                            <span
                              className={`f1-minimal-pill ${
                                isPenalty ? "pill-accent" : ""
                              }`}
                            >
                              {note}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="table-state-cell">
                        Official starting grid not yet published for this event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 3. QUALIFYING */}
            {activeTab === "qualifying" && (
              <table className="f1-minimal-table" id="qualifying-table">
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
                      POS. <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        qSortKey === "driver_name"
                          ? `sort-${qSortDir}`
                          : "sortable"
                      }
                      onClick={() => qRequestSort("driver_name")}
                    >
                      DRIVER <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        qSortKey === "team_name"
                          ? `sort-${qSortDir}`
                          : "sortable"
                      }
                      onClick={() => qRequestSort("team_name")}
                    >
                      TEAM <span className="sort-icon"></span>
                    </th>
                    <th>Q1</th>
                    <th>Q2</th>
                    <th className="text-right">Q3</th>
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
                          <td className="cell-pos">{pos}</td>
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
                            <TeamBadge
                              name={q.team_name}
                              wikiUrl={q.constructor_wiki_url}
                            />
                          </td>
                          <td className="cell-tabular">
                            {q.q1_time || q.q1 || "-"}
                          </td>
                          <td className="cell-tabular">
                            {q.q2_time || q.q2 || "-"}
                          </td>
                          <td className="cell-tabular cell-points text-right">
                            {q.q3_time || q.q3 || "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="table-state-cell">
                        No qualifying results recorded for this round.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 4. SPRINT RESULTS */}
            {activeTab === "sprint-results" && (
              <table className="f1-minimal-table" id="sprint-results-table">
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
                      POS. <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        spSortKey === "car_number"
                          ? `sort-${spSortDir}`
                          : "sortable"
                      }
                      onClick={() => spRequestSort("car_number")}
                    >
                      NO. <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        spSortKey === "starting_grid"
                          ? `sort-${spSortDir}`
                          : "sortable"
                      }
                      onClick={() => spRequestSort("starting_grid")}
                    >
                      GRID <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        spSortKey === "driver_name"
                          ? `sort-${spSortDir}`
                          : "sortable"
                      }
                      onClick={() => spRequestSort("driver_name")}
                    >
                      DRIVER <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        spSortKey === "team_name"
                          ? `sort-${spSortDir}`
                          : "sortable"
                      }
                      onClick={() => spRequestSort("team_name")}
                    >
                      TEAM <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        spSortKey === "laps_completed"
                          ? `sort-${spSortDir}`
                          : "sortable"
                      }
                      onClick={() => spRequestSort("laps_completed")}
                    >
                      LAPS <span className="sort-icon"></span>
                    </th>
                    <th>TIME / RETIRED</th>
                    <th
                      className={`text-right ${
                        spSortKey === "points_awarded"
                          ? `sort-${spSortDir}`
                          : "sortable"
                      }`}
                      onClick={() => spRequestSort("points_awarded")}
                    >
                      PTS. <span className="sort-icon"></span>
                    </th>
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
                          <td className="cell-pos">{pos}</td>
                          <td className="cell-muted cell-tabular">
                            {s.car_number || "-"}
                          </td>
                          <td className="cell-muted cell-tabular">
                            {s.starting_grid || "-"}
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
                            <TeamBadge
                              name={s.team_name || s.constructor_name}
                              wikiUrl={s.constructor_wiki_url}
                            />
                          </td>
                          <td className="cell-tabular">
                            {s.laps_completed || "-"}
                          </td>
                          <td className="cell-tabular cell-strong">
                            {s.race_time_or_gap ||
                              s.time_or_gap ||
                              s.time ||
                              status ||
                              "-"}
                          </td>
                          <td className="cell-points text-right">{pts}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="table-state-cell">
                        No sprint results recorded for this round (Standard
                        format weekend).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 5. PIT STOPS */}
            {activeTab === "pit-stops" && (
              <table className="f1-minimal-table" id="pit-stops-table">
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
                      STOP <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        pSortKey === "driver_name"
                          ? `sort-${pSortDir}`
                          : "sortable"
                      }
                      onClick={() => pRequestSort("driver_name")}
                    >
                      DRIVER <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        pSortKey === "team_name"
                          ? `sort-${pSortDir}`
                          : "sortable"
                      }
                      onClick={() => pRequestSort("team_name")}
                    >
                      TEAM <span className="sort-icon"></span>
                    </th>
                    <th
                      className={
                        pSortKey === "lap" ? `sort-${pSortDir}` : "sortable"
                      }
                      onClick={() => pRequestSort("lap")}
                    >
                      LAP <span className="sort-icon"></span>
                    </th>
                    <th>TIME OF DAY</th>
                    <th
                      className={`text-right ${
                        pSortKey === "stop_duration_seconds"
                          ? `sort-${pSortDir}`
                          : "sortable"
                      }`}
                      onClick={() => pRequestSort("stop_duration_seconds")}
                    >
                      DURATION <span className="sort-icon"></span>
                    </th>
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

                      return (
                        <tr key={i}>
                          <td className="cell-pos">{stop}</td>
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
                            <TeamBadge
                              name={p.team_name}
                              wikiUrl={p.constructor_wiki_url}
                            />
                          </td>
                          <td className="cell-tabular">Lap {p.lap}</td>
                          <td className="cell-muted cell-tabular">
                            {p.time_of_day_utc ||
                              p.time_of_day ||
                              p.time ||
                              "-"}
                          </td>
                          <td className="cell-points text-right">
                            {durationSec}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="table-state-cell">
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
    </section>
  );
}
