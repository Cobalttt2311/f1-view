import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { F1Api } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import DriverBadge from "../../components/common/DriverBadge";
import { CountryFlag } from "../../utils/flags";
import { useTableSort } from "../../utils/useTableSort";

const CURRENT_REAL_YEAR = new Date().getFullYear();

export default function StandingsPage() {
  const { season } = useSeason();
  const [tab, setTab] = useState("drivers"); // 'drivers' | 'constructors'

  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ["driverStandings", season],
    queryFn: async () => {
      const res = await F1Api.getDriverStandingsByYear(season);
      return res?.data || res || [];
    },
    enabled: tab === "drivers",
  });

  const { data: constructors = [], isLoading: loadingConstructors } = useQuery({
    queryKey: ["constructorStandings", season],
    queryFn: async () => {
      const res = await F1Api.getConstructorStandingsByYear(season);
      return res?.data || res || [];
    },
    enabled: tab === "constructors",
  });

  // Fetch race calendar to calculate remaining races for the champion math
  const { data: calendar = [] } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return res?.data || res || [];
    },
  });

  const isLoading = tab === "drivers" ? loadingDrivers : loadingConstructors;

  // --- Champion clinch logic ---
  const isHistoricalSeason = Number(season) < CURRENT_REAL_YEAR;
  const MAX_PTS_PER_RACE = 26; // 25 (win) + 1 (fastest lap)

  const todayStr = new Date().toISOString().split("T")[0];
  const remainingRaces = calendar.filter(
    (r) => r.race_date && r.race_date > todayStr,
  ).length;

  // Driver champion: sort by points, check if P1 gap over P2 > remaining max
  const driversByPts = [...drivers].sort(
    (a, b) => (b.total_points ?? 0) - (a.total_points ?? 0),
  );
  const driverLeaderPts = driversByPts[0]?.total_points ?? 0;
  const driverSecondPts = driversByPts[1]?.total_points ?? 0;
  const driverGap = driverLeaderPts - driverSecondPts;
  const driverChampionClinched =
    isHistoricalSeason || driverGap > remainingRaces * MAX_PTS_PER_RACE;

  // Constructor champion: same logic
  const consByPts = [...constructors].sort(
    (a, b) => (b.total_points ?? 0) - (a.total_points ?? 0),
  );
  const consLeaderPts = consByPts[0]?.total_points ?? 0;
  const consSecondPts = consByPts[1]?.total_points ?? 0;
  const consGap = consLeaderPts - consSecondPts;
  const constructorChampionClinched =
    isHistoricalSeason || consGap > remainingRaces * MAX_PTS_PER_RACE;

  const {
    sortedData: sortedDrivers,
    sortKey: dSortKey,
    sortDir: dSortDir,
    requestSort: dRequestSort,
  } = useTableSort(drivers, "championship_rank");

  const {
    sortedData: sortedConstructors,
    sortKey: cSortKey,
    sortDir: cSortDir,
    requestSort: cRequestSort,
  } = useTableSort(constructors, "championship_rank");

  return (
    <section id="view-standings" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Championship Standings</h2>
          <p className="text-muted">
            Live and historical Driver & Constructor Championship standings with
            points, wins, and team affiliations for{" "}
            <span className="current-season-display">{season} Season</span>.
            {(isHistoricalSeason ||
              driverChampionClinched ||
              constructorChampionClinched) && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#ffb800",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <i className="fa-solid fa-crown"></i> Gold = Champion
              </span>
            )}
          </p>
        </div>
        <div className="header-action-group">
          <div className="btn-group">
            <button
              id="btn-standings-drivers"
              className={`btn btn-tab ${tab === "drivers" ? "active" : ""}`}
              onClick={() => setTab("drivers")}
            >
              Drivers Standings
            </button>
            <button
              id="btn-standings-constructors"
              className={`btn btn-tab ${tab === "constructors" ? "active" : ""}`}
              onClick={() => setTab("constructors")}
            >
              Constructors Standings
            </button>
          </div>
        </div>
      </div>

      <div className="f1-card">
        <div className="card-header flex-between">
          <h3 id="standings-table-title">
            <i
              className={`fa-solid ${tab === "drivers" ? "fa-trophy" : "fa-car"}`}
            ></i>{" "}
            {tab === "drivers"
              ? "World Drivers Championship (WDC)"
              : "World Constructors Championship (WCC)"}
          </h3>
          <span id="standings-season-badge" className="badge badge-f1">
            Season {season}
          </span>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div
              className="text-center py-5 text-muted"
              style={{
                padding: "2rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
              }}
            >
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p className="mt-2">Loading standings for {season}...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="f1-table" id="standings-main-table">
                {tab === "drivers" ? (
                  <>
                    <thead>
                      <tr>
                        <th
                          className={
                            dSortKey === "championship_rank"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("championship_rank")}
                        >
                          Pos <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "driver_name"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("driver_name")}
                        >
                          Driver <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "nationality"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("nationality")}
                        >
                          Nationality <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "team_name"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("team_name")}
                        >
                          Team / Constructor <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "total_wins"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("total_wins")}
                        >
                          Wins <span className="sort-icon"></span>
                        </th>
                        <th
                          className={`text-right ${dSortKey === "total_points" ? `sort-${dSortDir}` : "sortable"}`}
                          onClick={() => dRequestSort("total_points")}
                        >
                          Total Points <span className="sort-icon"></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDrivers.length > 0 ? (
                        sortedDrivers.map((d, i) => {
                          const rank = d.championship_rank ?? i + 1;
                          const isChampion =
                            rank === 1 && driverChampionClinched;

                          return (
                            <tr
                              key={d.driver_code || d.driver_name || i}
                              className={isChampion ? "row-champion-wdc" : ""}
                            >
                              <td className={`pos-${rank}`}>
                                <strong>P{rank}</strong>
                                {isChampion && (
                                  <span
                                    className="badge-champion"
                                    style={{ marginLeft: "6px" }}
                                    title="World Drivers Champion"
                                  >
                                    <i className="fa-solid fa-crown"></i> WDC
                                  </span>
                                )}
                              </td>
                              <td>
                                <DriverBadge
                                  name={d.driver_name}
                                  code={d.driver_code}
                                  team={d.team_name}
                                  season={season}
                                  wikiUrl={d.driver_wiki_url}
                                  // isHistorical={isHistoricalDriver}
                                />
                              </td>
                              <td>
                                <CountryFlag name={d.nationality} />
                                <span>{d.nationality || "-"}</span>
                              </td>
                              <td>
                                <WikiLink
                                  text={d.team_name}
                                  url={d.constructor_wiki_url}
                                />
                              </td>
                              <td>{d.total_wins ?? 0}</td>
                              <td
                                className="text-right font-weight-bold"
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "14px",
                                  color: isChampion ? "#ffb800" : undefined,
                                }}
                              >
                                {d.total_points ?? 0}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center py-4 text-muted"
                          >
                            No driver standings recorded for season {season}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th
                          className={
                            cSortKey === "championship_rank"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }
                          onClick={() => cRequestSort("championship_rank")}
                        >
                          Pos <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            cSortKey === "constructor_name"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }
                          onClick={() => cRequestSort("constructor_name")}
                        >
                          Constructor Team <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            cSortKey === "nationality"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }
                          onClick={() => cRequestSort("nationality")}
                        >
                          Nationality <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            cSortKey === "total_wins"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }
                          onClick={() => cRequestSort("total_wins")}
                        >
                          Wins <span className="sort-icon"></span>
                        </th>
                        <th
                          className={`text-right ${cSortKey === "total_points" ? `sort-${cSortDir}` : "sortable"}`}
                          onClick={() => cRequestSort("total_points")}
                        >
                          Total Points <span className="sort-icon"></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedConstructors.length > 0 ? (
                        sortedConstructors.map((c, i) => {
                          const rank = c.championship_rank ?? i + 1;
                          const isChampion =
                            rank === 1 && constructorChampionClinched;

                          return (
                            <tr
                              key={c.constructor_name || i}
                              className={isChampion ? "row-champion-wcc" : ""}
                            >
                              <td className={`pos-${rank}`}>
                                <strong>P{rank}</strong>
                                {isChampion && (
                                  <span
                                    className="badge-champion"
                                    style={{ marginLeft: "6px" }}
                                    title="World Constructors Champion"
                                  >
                                    <i className="fa-solid fa-crown"></i> WCC
                                  </span>
                                )}
                              </td>
                              <td>
                                <WikiLink
                                  text={c.constructor_name}
                                  url={c.constructor_wiki_url}
                                />
                              </td>
                              <td>
                                <CountryFlag name={c.nationality} />
                                <span>{c.nationality || "-"}</span>
                              </td>
                              <td>{c.total_wins ?? 0}</td>
                              <td
                                className="text-right font-weight-bold"
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "14px",
                                  color: isChampion ? "#ffb800" : undefined,
                                }}
                              >
                                {c.total_points ?? 0}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center py-4 text-muted"
                          >
                            No constructor standings recorded for season{" "}
                            {season}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
