import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSeason } from "../../context/SeasonContext";
import { useTimezone } from "../../context/TimezoneContext";
import { F1Api } from "../../api/client";
import DriverBadge from "../../components/common/DriverBadge";
import WikiLink from "../../components/common/WikiLink";

export default function DashboardPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const navigate = useNavigate();

  // Queries
  const { data: races = [], isLoading: loadingRaces } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return res?.data || res || [];
    },
  });

  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ["driverStandings", season],
    queryFn: async () => {
      const res = await F1Api.getDriverStandingsByYear(season);
      return res?.data || res || [];
    },
  });

  const { data: constructors = [] } = useQuery({
    queryKey: ["constructorStandings", season],
    queryFn: async () => {
      const res = await F1Api.getConstructorStandingsByYear(season);
      return res?.data || res || [];
    },
  });

  // Next Race Target & Countdown logic
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });
  const [targetRace, setTargetRace] = useState(null);
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [isPastSeason, setIsPastSeason] = useState(false);

  useEffect(() => {
    if (!races || races.length === 0) return;
    const todayStr = new Date().toISOString().split("T")[0];

    let found = null;
    let live = false;

    // Check if live now
    for (const r of races) {
      const start = r.fp1_date || r.race_date;
      const end = r.race_date;
      if (start && end && todayStr >= start && todayStr <= end) {
        found = r;
        live = true;
        break;
      }
    }

    if (!found) {
      found = races.find((r) => r.race_date && r.race_date >= todayStr);
    }

    const past = !found;
    if (past) {
      found = races[races.length - 1]; // Season Finale
    }

    setTargetRace(found);
    setIsLiveNow(live);
    setIsPastSeason(past);

    if (found && found.race_date) {
      const targetTime = new Date(`${found.race_date}T12:00:00Z`).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = targetTime - now;
        if (diff > 0) {
          setCountdown({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            mins: Math.floor((diff / 1000 / 60) % 60),
            secs: Math.floor((diff / 1000) % 60),
          });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [races]);

  const dLeader = drivers[0];
  const cLeader = constructors[0];
  const uniqueCircuits = new Set(races.map((r) => r.circuit_name));
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <section id="view-dashboard" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Season Overview & Telemetry Dashboard</h2>
          <p className="text-muted">
            High-level statistics, championship leaders, and quick access to all
            Grand Prix telemetry for{" "}
            <strong className="current-season-display">{season} Season</strong>.
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Drivers Leader</span>
            <h3 id="dash-driver-leader">
              {dLeader ? (
                <WikiLink
                  text={dLeader.driver_name}
                  url={dLeader.driver_wiki_url}
                />
              ) : (
                "-"
              )}
            </h3>
            <p id="dash-driver-leader-pts" className="stat-sub">
              {dLeader
                ? `${dLeader.total_points ?? 0} PTS (${dLeader.total_wins ?? 0} Wins) • ${dLeader.team_name || ""}`
                : "-"}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-car-tunnel"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Constructors Leader</span>
            <h3 id="dash-team-leader">
              {cLeader ? (
                <WikiLink
                  text={cLeader.constructor_name}
                  url={cLeader.constructor_wiki_url}
                />
              ) : (
                "-"
              )}
            </h3>
            <p id="dash-team-leader-pts" className="stat-sub">
              {cLeader
                ? `${cLeader.total_points ?? 0} PTS (${cLeader.total_wins ?? 0} Wins)`
                : "-"}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-flag-checkered"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Races</span>
            <h3 id="dash-total-races">{races.length}</h3>
            <p id="dash-races-sub" className="stat-sub">
              {season} Championship Season
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-road"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Venues Visited</span>
            <h3 id="dash-total-circuits">{uniqueCircuits.size}</h3>
            <p className="stat-sub">Worldwide Tracks</p>
          </div>
        </div>
      </div>

      <div className="dash-grid-two">
        {/* Left: Season Grand Prix Schedule */}
        <div className="f1-card" id="dash-schedule-card">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-calendar-check"></i> Season Grand Prix
              Schedule
            </h3>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => navigate("/calendar")}
            >
              Full Calendar <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive" style={{ maxHeight: "540px" }}>
              <table className="f1-table" id="dash-races-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Grand Prix</th>
                    <th>Circuit</th>
                    <th>Race Date</th>
                    <th>Race Time ({timezone})</th>
                    <th>Format</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRaces ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <i className="fa-solid fa-spinner fa-spin"></i> Loading
                        season races...
                      </td>
                    </tr>
                  ) : races.length > 0 ? (
                    races.map((r) => {
                      const isTarget =
                        targetRace && r.round === targetRace.round;
                      const isPast = r.race_date && r.race_date < todayStr;
                      const isLive = isLiveNow && isTarget;

                      let roundBadge = (
                        <span className="badge badge-f1">R{r.round}</span>
                      );
                      let rowClass = "clickable-row";

                      if (isLive) {
                        roundBadge = (
                          <span className="badge badge-live">
                            <i className="fa-solid fa-circle-dot fa-beat"></i> R
                            {r.round} LIVE
                          </span>
                        );
                        rowClass += " row-live";
                      } else if (isTarget) {
                        const labelText = isPastSeason ? "LATEST" : "UPCOMING";
                        roundBadge = (
                          <span className="badge badge-upcoming">
                            <i className="fa-solid fa-flag-checkered"></i> R
                            {r.round} {labelText}
                          </span>
                        );
                        rowClass += " row-upcoming";
                      } else if (isPast) {
                        roundBadge = (
                          <span
                            className="badge badge-neutral"
                            style={{ opacity: 0.65 }}
                          >
                            R{r.round}
                          </span>
                        );
                        rowClass += " row-past";
                      }

                      return (
                        <tr
                          key={r.round}
                          className={rowClass}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate("/weekend-hub")}
                        >
                          <td>{roundBadge}</td>
                          <td style={{ fontWeight: 600 }}>
                            <WikiLink
                              text={r.grand_prix_name}
                              url={r.race_wiki_url}
                            />
                          </td>
                          <td>
                            <WikiLink
                              text={r.circuit_name}
                              url={r.circuit_wiki_url}
                            />
                          </td>
                          <td>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "12px",
                              }}
                            >
                              {r.race_date || "-"}
                            </span>
                          </td>
                          <td>
                            <span
                              className="session-time-val"
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "12px",
                              }}
                            >
                              {formatSessionTime(
                                r.race_time_utc,
                                r.race_time_wib,
                              )}
                            </span>
                          </td>
                          <td>
                            {r.has_sprint ? (
                              <span className="badge badge-sprint">
                                <i className="fa-solid fa-bolt"></i> Sprint
                              </span>
                            ) : (
                              <span className="badge badge-neutral">
                                Standard
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No races found for season {season}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Top 5 Drivers Standings Preview & Next Race Card */}
        <div className="dash-right-col">
          {/* Top 5 Driver Championship */}
          <div className="f1-card">
            <div className="card-header flex-between">
              <h3>
                <i className="fa-solid fa-ranking-star"></i> Top 5 Driver
                Championship
              </h3>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => navigate("/standings")}
              >
                Full Standings <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="f1-table" id="dash-standings-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Driver</th>
                      <th>Constructor</th>
                      <th>Wins</th>
                      <th className="text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDrivers ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <i className="fa-solid fa-spinner fa-spin"></i>{" "}
                          Loading standings...
                        </td>
                      </tr>
                    ) : drivers.length > 0 ? (
                      drivers.slice(0, 5).map((d, i) => (
                        <tr key={d.driver_code || d.driver_name || i}>
                          <td className={`pos-${i + 1}`}>
                            P{d.championship_rank || i + 1}
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
                            <WikiLink
                              text={d.team_name}
                              url={d.constructor_wiki_url}
                            />
                          </td>
                          <td>{d.total_wins ?? 0}</td>
                          <td
                            className="text-right font-weight-bold"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {d.total_points ?? 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No standings available for {season}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Next / Current Grand Prix Widget */}
          {targetRace && (
            <div className="f1-card" id="dash-next-race-card">
              <div className="card-header flex-between">
                <h3 id="dash-next-status-title">
                  <i className="fa-solid fa-flag-checkered"></i>{" "}
                  <span id="dash-next-status-text">
                    {isLiveNow ? (
                      <span style={{ color: "var(--f1-red)" }}>
                        <i className="fa-solid fa-circle-dot text-danger fa-beat"></i>{" "}
                        LIVE RACE WEEKEND (NOW)
                      </span>
                    ) : isPastSeason ? (
                      "Season Finale (Completed)"
                    ) : (
                      "Upcoming Grand Prix"
                    )}
                  </span>
                </h3>
                <span
                  id="dash-next-live-badge"
                  className={`badge ${isLiveNow ? "badge-danger" : "badge-f1"}`}
                >
                  ROUND {targetRace.round}
                </span>
              </div>
              <div className="card-body">
                <div>
                  <h4
                    id="dash-next-gp-name"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "20px",
                      color: "#ffffff",
                      marginBottom: "2px",
                    }}
                  >
                    {targetRace.grand_prix_name}
                  </h4>
                  <p
                    id="dash-next-circuit"
                    className="text-muted"
                    style={{ marginBottom: "4px" }}
                  >
                    {targetRace.circuit_name}
                  </p>
                  <p
                    id="dash-next-location"
                    className="text-muted"
                    style={{ marginBottom: "16px", fontSize: "12px" }}
                  >
                    <i
                      className="fa-solid fa-location-dot"
                      style={{ color: "var(--f1-red)", marginRight: "5px" }}
                    ></i>
                    {[targetRace.location, targetRace.country]
                      .filter(Boolean)
                      .join(", ") ||
                      targetRace.country ||
                      ""}
                  </p>
                </div>

                {/* Countdown */}
                {!isLiveNow && !isPastSeason ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                      textAlign: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        background: "#15151e",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <h3 style={{ margin: 0, color: "var(--f1-cyan)" }}>
                        {countdown.days}
                      </h3>
                      <small className="text-muted">DAYS</small>
                    </div>
                    <div
                      style={{
                        background: "#15151e",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <h3 style={{ margin: 0, color: "var(--f1-cyan)" }}>
                        {countdown.hours}
                      </h3>
                      <small className="text-muted">HRS</small>
                    </div>
                    <div
                      style={{
                        background: "#15151e",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <h3 style={{ margin: 0, color: "var(--f1-cyan)" }}>
                        {countdown.mins}
                      </h3>
                      <small className="text-muted">MINS</small>
                    </div>
                    <div
                      style={{
                        background: "#15151e",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <h3 style={{ margin: 0, color: "var(--f1-cyan)" }}>
                        {countdown.secs}
                      </h3>
                      <small className="text-muted">SECS</small>
                    </div>
                  </div>
                ) : isLiveNow ? (
                  <div className="badge badge-danger p-2 mb-3 w-100 text-center">
                    <i className="fa-solid fa-bolt"></i> RACE WEEKEND IN
                    PROGRESS
                  </div>
                ) : (
                  <div className="badge badge-neutral p-2 mb-3 w-100 text-center">
                    SEASON COMPLETED
                  </div>
                )}

                <button
                  className="btn btn-sm btn-view-hub-red w-100"
                  style={{
                    background: "var(--f1-red)",
                    color: "#ffffff",
                    border: "1px solid var(--f1-red)",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ff1801";
                    e.currentTarget.style.borderColor = "#ff1801";
                    e.currentTarget.style.boxShadow =
                      "0 0 14px rgba(225,6,0,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--f1-red)";
                    e.currentTarget.style.borderColor = "var(--f1-red)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onClick={() => navigate("/weekend-hub")}
                >
                  <i className="fa-solid fa-flag-checkered"></i> View Grand Prix
                  Weekend Hub
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
