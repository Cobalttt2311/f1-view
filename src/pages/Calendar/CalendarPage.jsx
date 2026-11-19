import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSeason } from "../../context/SeasonContext";
import { useTimezone } from "../../context/TimezoneContext";
import { F1Api, toArray } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import { CountryFlag } from "../../utils/flags";
import { getCircuitTrackMap, getHeroImage } from "../../utils/f1Assets";

function cleanVal(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (!s || s === "-" || s.includes("\\N") || s.toLowerCase() === "null") {
    return null;
  }
  return s;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseShortDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().split("-");
  if (parts.length !== 3) return null;
  const mIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(mIdx) || isNaN(day) || mIdx < 0 || mIdx > 11) return null;
  return { day, month: SHORT_MONTHS[mIdx] };
}

function formatWeekendRange(race) {
  if (!race) return "-";
  const endStr = cleanVal(race.race_date);
  const startStr =
    cleanVal(race.fp1_date) ||
    cleanVal(race.fp2_date) ||
    cleanVal(race.fp3_date) ||
    cleanVal(race.sprint_date) ||
    cleanVal(race.quali_date);

  const s = parseShortDate(startStr);
  const e = parseShortDate(endStr);

  if (s && e) {
    if (s.month === e.month) {
      if (s.day === e.day) return `${e.day} ${e.month}`;
      return `${s.day} - ${e.day} ${e.month}`;
    }
    return `${s.day} ${s.month} - ${e.day} ${e.month}`;
  }
  if (e) return `${e.day} ${e.month}`;
  if (s) return `${s.day} ${s.month}`;
  return endStr || startStr || "-";
}

export default function CalendarPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const navigate = useNavigate();

  const [selectedRound, setSelectedRound] = useState(null);
  const [visualMode, setVisualMode] = useState("circuit"); // 'circuit' | 'photo'
  const [svgFailed, setSvgFailed] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  const { data: racesData = [], isLoading } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return toArray(res);
    },
  });
  const races = Array.isArray(racesData) ? racesData : [];

  const todayStr = new Date().toISOString().split("T")[0];

  // Determine next/target race and default selection
  const nextRace = useMemo(() => {
    if (!races || races.length === 0) return null;
    const upcoming = races.find((r) => r.race_date && r.race_date >= todayStr);
    return upcoming || races[races.length - 1];
  }, [races, todayStr]);

  useEffect(() => {
    if (races.length > 0) {
      const defaultRnd = nextRace ? nextRace.round : races[0].round;
      setSelectedRound(defaultRnd);
    }
  }, [season, races, nextRace]);

  const activeRace = useMemo(() => {
    if (!races || races.length === 0) return null;
    return (
      races.find((r) => Number(r.round) === Number(selectedRound)) ||
      nextRace ||
      races[0]
    );
  }, [races, selectedRound, nextRace]);

  useEffect(() => {
    setSvgFailed(false);
    setHeroFailed(false);
  }, [activeRace?.round, season]);

  // Live countdown to nextRace
  const [countdownStr, setCountdownStr] = useState("00:00:00");
  useEffect(() => {
    if (!nextRace || !nextRace.race_date) {
      setCountdownStr("--:--:--");
      return;
    }
    const targetTime = new Date(`${nextRace.race_date}T12:00:00Z`).getTime();
    const updateTimer = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setCountdownStr("COMPLETED");
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setCountdownStr(
        `${String(totalHours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [nextRace]);

  const activeSvgUrl = activeRace
    ? getCircuitTrackMap(
        activeRace.circuit_name,
        activeRace.grand_prix_name,
        activeRace.location,
        activeRace.country
      )
    : null;

  const activeHeroUrl = activeRace
    ? getHeroImage(
        activeRace.circuit_name,
        activeRace.grand_prix_name,
        activeRace.location,
        activeRace.country
      )
    : null;

  const nextRaceSvgUrl = nextRace
    ? getCircuitTrackMap(
        nextRace.circuit_name,
        nextRace.grand_prix_name,
        nextRace.location,
        nextRace.country
      )
    : null;

  // Build ordered session list for the right panel
  const sessionList = useMemo(() => {
    if (!activeRace) return [];
    const list = [];
    const fp1Date = cleanVal(activeRace.fp1_date);
    const fp1Time = cleanVal(activeRace.fp1_time_utc);
    if (fp1Date || fp1Time) {
      list.push({
        key: "fp1",
        label: "Practice 1",
        date: fp1Date,
        time: formatSessionTime(activeRace.fp1_time_utc, activeRace.fp1_time_wib),
        meta: "Free Practice Session 1 (60 Mins)",
      });
    }
    const fp2Date = cleanVal(activeRace.fp2_date);
    const fp2Time = cleanVal(activeRace.fp2_time_utc);
    if (!activeRace.has_sprint && (fp2Date || fp2Time)) {
      list.push({
        key: "fp2",
        label: "Practice 2",
        date: fp2Date,
        time: formatSessionTime(activeRace.fp2_time_utc, activeRace.fp2_time_wib),
        meta: "Free Practice Session 2 (60 Mins)",
      });
    }
    const fp3Date = cleanVal(activeRace.fp3_date);
    const fp3Time = cleanVal(activeRace.fp3_time_utc);
    if (!activeRace.has_sprint && (fp3Date || fp3Time)) {
      list.push({
        key: "fp3",
        label: "Practice 3",
        date: fp3Date,
        time: formatSessionTime(activeRace.fp3_time_utc, activeRace.fp3_time_wib),
        meta: "Free Practice Session 3 (60 Mins)",
      });
    }
    const sprintDate = cleanVal(activeRace.sprint_date);
    const sprintTime = cleanVal(activeRace.sprint_time_utc);
    if (activeRace.has_sprint || sprintDate || sprintTime) {
      list.push({
        key: "sprint",
        label: "Sprint",
        date: sprintDate || cleanVal(activeRace.quali_date),
        time: formatSessionTime(
          activeRace.sprint_time_utc,
          activeRace.sprint_time_wib
        ),
        meta: "100km Sprint Race Session",
        isSprint: true,
      });
    }
    const qualiDate = cleanVal(activeRace.quali_date);
    const qualiTime = cleanVal(activeRace.quali_time_utc);
    if (qualiDate || qualiTime) {
      list.push({
        key: "quali",
        label: "Qualifying",
        date: qualiDate,
        time: formatSessionTime(
          activeRace.quali_time_utc,
          activeRace.quali_time_wib
        ),
        meta: "Q1, Q2 & Q3 Knockout Grid Qualifying",
      });
    }
    list.push({
      key: "race",
      label: "Race",
      date: cleanVal(activeRace.race_date),
      time: formatSessionTime(activeRace.race_time_utc, activeRace.race_time_wib),
      meta: "Grand Prix Main Feature Race",
      isMain: true,
    });
    return list;
  }, [activeRace, formatSessionTime]);

  return (
    <section id="view-calendar" className="content-view active">
      {isLoading ? (
        <div className="f1-loading-state">
          <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
          <p>Loading {season} Grand Prix Calendar...</p>
        </div>
      ) : races.length > 0 ? (
        <div className="f1-calendar-split-layout" id="calendar-container">
          {/* LEFT PANEL: SCROLLABLE GP LIST (Reference 5 Left Rail) */}
          <div className="cal-split-left">
            <div className="cal-left-top-bar">
              <div className="cal-top-title-group">
                <h2 className="cal-panel-heading">GP Calendar</h2>
                <span className="cal-season-sub">{season} Season</span>
              </div>

              {nextRace && (
                <div className="cal-next-countdown-mini">
                  <div className="cal-next-meta">
                    <span className="cal-next-lbl">Next Session</span>
                    <strong className="cal-next-timer">{countdownStr}</strong>
                    <span className="cal-next-gp-sub">
                      {nextRace.grand_prix_name}
                    </span>
                  </div>
                  {nextRaceSvgUrl && (
                    <img
                      src={nextRaceSvgUrl}
                      alt=""
                      className="cal-mini-track-svg"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="cal-rounds-list">
              {races.map((r) => {
                const isSelected =
                  activeRace && Number(r.round) === Number(activeRace.round);
                const isCompleted = r.race_date && r.race_date < todayStr;
                const isNext =
                  nextRace &&
                  Number(r.round) === Number(nextRace.round) &&
                  !isCompleted;

                return (
                  <div
                    key={r.round}
                    className={`cal-round-item ${isSelected ? "selected" : ""} ${isCompleted ? "completed" : ""}`}
                    onClick={() => setSelectedRound(r.round)}
                  >
                    <div className="cal-round-num-col">
                      <span className="cal-round-number">{r.round}</span>
                      <span className="cal-round-word">Round</span>
                    </div>

                    <div className="cal-round-info-col">
                      <div className="cal-round-country-row">
                        <CountryFlag
                          name={r.country || r.location || r.grand_prix_name}
                          size={15}
                        />
                        <span>
                          {[r.country, r.location].filter(Boolean).join(" / ")}
                        </span>
                      </div>

                      <h4 className="cal-round-gp-title">
                        {season} {r.grand_prix_name}
                      </h4>

                      <span className="cal-round-circuit-sub">
                        {r.circuit_name}
                      </span>
                    </div>

                    <div className="cal-round-status-col">
                      <div className="cal-pill-stack">
                        <span
                          className={`f1-status-pill ${
                            isNext
                              ? "status-next"
                              : isCompleted
                                ? "status-completed"
                                : "status-upcoming"
                          }`}
                        >
                          {isNext
                            ? "Next"
                            : isCompleted
                              ? "Completed"
                              : "Scheduled"}
                        </span>
                      </div>
                      <span className="cal-round-date-str">
                        {formatWeekendRange(r)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: SELECTED GRAND PRIX DETAIL & TRACK INFO (Reference 5 Main Area) */}
          {activeRace && (
            <div className="cal-split-right">
              {/* Top GP Header */}
              <div className="cal-detail-header">
                <div className="cal-detail-title-row">
                  <h2 className="cal-detail-title">
                    FORMULA 1 {activeRace.grand_prix_name?.toUpperCase()} {season}
                  </h2>
                </div>
                <div className="cal-detail-sub-row">
                  <span className="cal-detail-dates">
                    {formatWeekendRange(activeRace)}
                  </span>
                  <span className="cal-detail-breadcrumb">
                    {[
                      activeRace.country,
                      activeRace.location,
                      activeRace.circuit_name,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </span>
                </div>
              </div>

              {/* Session Schedules List */}
              {/* Session Schedules (Minimalist Timetable) */}
              <div className="cal-detail-section">
                <h3 className="cal-section-heading">Session Schedules</h3>
                <div className="cal-sessions-table">
                  {sessionList.map((s) => {
                    const parsed = parseShortDate(s.date);
                    return (
                      <div
                        key={s.key}
                        className={`cal-session-line ${s.isMain ? "is-main" : ""} ${s.isSprint ? "is-sprint" : ""}`}
                      >
                        <div className="cal-session-left-group">
                          <div className="cal-session-date-col">
                            <span className="cal-session-day">
                              {parsed ? String(parsed.day).padStart(2, "0") : "--"}
                            </span>
                            <span className="cal-session-month">
                              {parsed ? parsed.month.toUpperCase() : "TBD"}
                            </span>
                          </div>

                          <div className="cal-session-divider" />

                          <span className="cal-session-name">
                            {s.label.toUpperCase()}
                          </span>
                        </div>

                        <div className="cal-session-time-col">
                          {s.time && s.time !== "-" ? s.time : "TBA"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Track Information & Circuit SVG / Hero Preview */}
              <div className="cal-detail-section">
                <h3 className="cal-section-heading">Track Information</h3>

                <div className="cal-track-info-grid">
                  {/* Left: Stacked Metrics */}
                  <div className="cal-track-metrics-col">
                    <div className="cal-metric-cell">
                      <span className="cal-metric-label">Grand Prix Round</span>
                      <strong className="cal-metric-value">
                        Round {String(activeRace.round).padStart(2, "0")} /{" "}
                        {races.length}
                      </strong>
                    </div>

                    <div className="cal-metric-cell">
                      <span className="cal-metric-label">Venue Circuit</span>
                      <strong className="cal-metric-value cal-metric-value-sm">
                        <WikiLink
                          text={activeRace.circuit_name}
                          url={activeRace.circuit_wiki_url}
                        />
                      </strong>
                    </div>

                    <div className="cal-metric-cell">
                      <span className="cal-metric-label">Host Location</span>
                      <strong className="cal-metric-value cal-metric-value-sm">
                        <CountryFlag
                          name={activeRace.country || activeRace.location}
                          size={18}
                        />
                        {[activeRace.location, activeRace.country]
                          .filter(Boolean)
                          .join(", ")}
                      </strong>
                    </div>

                    <div className="cal-metric-cell">
                      <span className="cal-metric-label">Weekend Format</span>
                      <strong className="cal-metric-value cal-metric-value-sm">
                        {activeRace.has_sprint
                          ? "Sprint Format"
                          : "Standard Grand Prix"}
                      </strong>
                    </div>

                    <div className="cal-quick-links">
                      <button
                        type="button"
                        className="f1-btn-primary w-100"
                        onClick={() => navigate("/weekend-hub")}
                      >
                        <span>Open Weekend Hub</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                      <button
                        type="button"
                        className="f1-btn-ghost w-100"
                        onClick={() => navigate("/lap-chart")}
                      >
                        <span>Lap Chart Progression</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Circuit SVG Map / Photo Switcher */}
                  <div className="cal-track-visual-col">
                    <div className="cal-visual-tabs">
                      <button
                        type="button"
                        className={`cal-vis-tab ${visualMode === "circuit" ? "active" : ""}`}
                        onClick={() => setVisualMode("circuit")}
                      >
                        Circuit Layout
                      </button>
                      <button
                        type="button"
                        className={`cal-vis-tab ${visualMode === "photo" ? "active" : ""}`}
                        onClick={() => setVisualMode("photo")}
                      >
                        Venue Backdrop
                      </button>
                    </div>

                    <div className="cal-visual-canvas">
                      {visualMode === "circuit" ? (
                        activeSvgUrl && !svgFailed ? (
                          <div className="cal-svg-display">
                            <img
                              src={activeSvgUrl}
                              alt={activeRace.circuit_name}
                              className="cal-circuit-svg-large"
                              onError={() => setSvgFailed(true)}
                            />
                            <div className="cal-svg-caption">
                              <span>{activeRace.circuit_name}</span>
                              <span>Official Track Layout</span>
                            </div>
                          </div>
                        ) : (
                          /* Fallback when circuit has no local SVG */
                          <div className="cal-svg-fallback">
                            <div className="fallback-telemetry-grid">
                              <span className="f1-minimal-pill">
                                TRACK TELEMETRY ARCHIVE
                              </span>
                              <h4>{activeRace.circuit_name}</h4>
                              <p>
                                {[activeRace.location, activeRace.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                              {activeRace.circuit_wiki_url && (
                                <WikiLink
                                  text="View Circuit Specifications on Wikipedia"
                                  url={activeRace.circuit_wiki_url}
                                />
                              )}
                            </div>
                          </div>
                        )
                      ) : activeHeroUrl && !heroFailed ? (
                        <div className="cal-photo-display">
                          <img
                            src={activeHeroUrl}
                            alt={activeRace.grand_prix_name}
                            className="cal-circuit-photo-large"
                            onError={() => setHeroFailed(true)}
                          />
                          <div className="cal-photo-overlay">
                            <h4>{activeRace.grand_prix_name}</h4>
                            <span>{activeRace.circuit_name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="cal-svg-fallback">
                          <h4>{activeRace.grand_prix_name}</h4>
                          <p>{activeRace.circuit_name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="f1-empty-state">
          No races found for season {season}.
        </div>
      )}
    </section>
  );
}
