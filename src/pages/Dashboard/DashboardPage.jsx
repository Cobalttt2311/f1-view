import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSeason } from "../../context/SeasonContext";
import { useTimezone } from "../../context/TimezoneContext";
import { F1Api, toArray } from "../../api/client";
import DriverBadge from "../../components/common/DriverBadge";
import TeamBadge from "../../components/common/TeamBadge";
import WikiLink from "../../components/common/WikiLink";
import AnimatedNumber from "../../components/common/AnimatedNumber";
import FlipCountdown from "../../components/common/FlipCountdown";
import { TableRowsSkeleton } from "../../components/common/Skeleton";
import { CountryFlag } from "../../utils/flags";
import {
  DEFAULT_CAR_SILHOUETTE,
  DEFAULT_DRIVER_SILHOUETTE,
  getDriverHeadshot,
  getTeamLogo,
  getCarLivery,
  getCircuitTrackMap,
  getHeroImage,
  getTeamCardGradient,
  resolveDriverCode,
} from "../../utils/f1Assets";

function DashboardDriverCard({ driver, rank, season, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const theme = getTeamCardGradient(driver?.team_name);
  const headshot = driver
    ? getDriverHeadshot(driver.driver_name, driver.driver_code, season)
    : null;
  const parts = String(driver?.driver_name || "").trim().split(/\s+/);
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : driver?.driver_name || "-";

  return (
    <div
      className="leader-spotlight-card f1-halftone-card"
      style={{
        background: theme.gradient,
        borderColor: `${theme.baseColor}55`,
      }}
      onClick={onClick}
    >
      <div className="leader-card-content">
        <div className="leader-card-top">
          <span className="leader-overline">Drivers Standings</span>
          <span className="leader-pos-tag">P{rank}</span>
        </div>

        <div className="leader-name-block" id={rank === 1 ? "dash-driver-leader" : undefined}>
          {driver ? (
            <>
              <span className="leader-first-name">{firstName}</span>
              <span className="leader-last-name">
                <WikiLink text={lastName} url={driver.driver_wiki_url} />
              </span>
            </>
          ) : (
            <span className="leader-last-name">-</span>
          )}
        </div>

        <p className="leader-team-sub">{driver?.team_name || "-"}</p>

        <div className="leader-metrics-row" id={rank === 1 ? "dash-driver-leader-pts" : undefined}>
          <div className="leader-metric">
            <span className="metric-val">
              <AnimatedNumber value={driver?.total_points ?? 0} />
            </span>
            <span className="metric-unit">PTS</span>
          </div>
          <div className="leader-metric-divider" />
          <div className="leader-metric">
            <span className="metric-val">
              <AnimatedNumber value={driver?.total_wins ?? 0} />
            </span>
            <span className="metric-unit">WINS</span>
          </div>
        </div>
      </div>

      {driver && (
        <div className="leader-card-visual">
          <img
            src={imgFailed ? DEFAULT_DRIVER_SILHOUETTE : headshot}
            alt={driver.driver_name}
            className="leader-cutout-img"
            onError={() => {
              if (!imgFailed) setImgFailed(true);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const navigate = useNavigate();

  // Queries
  const { data: racesData = [], isLoading: loadingRaces } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return toArray(res);
    },
  });

  const { data: driversData = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ["driverStandings", season],
    queryFn: async () => {
      const res = await F1Api.getDriverStandingsByYear(season);
      return toArray(res);
    },
  });

  const { data: constructorsData = [] } = useQuery({
    queryKey: ["constructorStandings", season],
    queryFn: async () => {
      const res = await F1Api.getConstructorStandingsByYear(season);
      return toArray(res);
    },
  });

  const races = Array.isArray(racesData) ? racesData : [];
  const drivers = Array.isArray(driversData) ? driversData : [];
  const constructors = Array.isArray(constructorsData) ? constructorsData : [];

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

  // Asset fallback states
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [trackSvgFailed, setTrackSvgFailed] = useState(false);
  const [leaderImgFailed, setLeaderImgFailed] = useState(false);
  const [carImgFailed, setCarImgFailed] = useState(false);
  const [teamLogoFailed, setTeamLogoFailed] = useState(false);

  useEffect(() => {
    setHeroImgFailed(false);
    setTrackSvgFailed(false);
    setLeaderImgFailed(false);
    setCarImgFailed(false);
    setTeamLogoFailed(false);
  }, [season, targetRace?.round]);

  useEffect(() => {
    if (!races || races.length === 0) return;
    const todayStr = new Date().toISOString().split("T")[0];

    let found = null;
    let live = false;

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
      found = races[races.length - 1];
    }

    setTargetRace(found);
    setIsLiveNow(live);
    setIsPastSeason(past);

    if (found && found.race_date) {
      const targetTime = new Date(`${found.race_date}T12:00:00Z`).getTime();
      const getParts = () => {
        const diff = targetTime - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
        return {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60),
        };
      };

      let rafId = null;
      let startTime = null;
      const duration = 550;
      const initialTarget = getParts();

      const animateIntro = (ts) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (progress >= 1) {
          setCountdown(getParts());
          return;
        }
        setCountdown({
          days: Math.round(initialTarget.days * eased),
          hours: Math.round(initialTarget.hours * eased),
          mins: Math.round(initialTarget.mins * eased),
          secs: Math.round(initialTarget.secs * eased),
        });
        rafId = requestAnimationFrame(animateIntro);
      };

      rafId = requestAnimationFrame(animateIntro);

      const interval = setInterval(() => {
        const diff = targetTime - Date.now();
        if (diff > 0) {
          setCountdown(getParts());
        }
      }, 1000);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        clearInterval(interval);
      };
    }
  }, [races]);

  const dLeader = drivers[0];
  const cLeader = constructors[0];
  const todayStr = new Date().toISOString().split("T")[0];
  const completedRaces = races.filter(
    (r) => r.race_date && r.race_date < todayStr
  ).length;
  const remainingRaces = Math.max(0, races.length - completedRaces);
  const p1LeadRaw =
    drivers.length >= 2
      ? Number(drivers[0]?.total_points ?? 0) -
        Number(drivers[1]?.total_points ?? 0)
      : 0;
  const p1Lead = Number.isInteger(p1LeadRaw)
    ? p1LeadRaw
    : Number(p1LeadRaw.toFixed(1));

  // Resolve spotlight assets
  const heroBgUrl = targetRace
    ? getHeroImage(
      targetRace.circuit_name,
      targetRace.grand_prix_name,
      targetRace.location,
      targetRace.country
    )
    : "/assets/hero/dashboard_hero.jpg";

  const trackSvgUrl = targetRace
    ? getCircuitTrackMap(
      targetRace.circuit_name,
      targetRace.grand_prix_name,
      targetRace.location,
      targetRace.country
    )
    : null;

  const dLeaderHeadshot = dLeader
    ? getDriverHeadshot(dLeader.driver_name, dLeader.driver_code, season)
    : null;
  const dLeaderCode = dLeader
    ? resolveDriverCode(dLeader.driver_name, dLeader.driver_code)
    : "";
  const dLeaderTheme = getTeamCardGradient(dLeader?.team_name);

  const cLeaderCar = cLeader
    ? getCarLivery(season, cLeader.constructor_name)
    : null;
  const cLeaderLogo = cLeader ? getTeamLogo(cLeader.constructor_name, season) : null;
  const cLeaderTheme = getTeamCardGradient(cLeader?.constructor_name);

  const splitDriverName = (fullName = "") => {
    const parts = String(fullName).trim().split(/\s+/);
    if (parts.length <= 1) return { first: "", last: fullName };
    return {
      first: parts.slice(0, -1).join(" "),
      last: parts[parts.length - 1],
    };
  };

  const leaderNames = splitDriverName(dLeader?.driver_name);

  return (
    <section id="view-dashboard" className="content-view active">
      {/* 1. HERO GRAND PRIX SPOTLIGHT BANNER */}
      {targetRace && (
        <div
          className="f1-hero-spotlight"
          id="dash-next-race-card"
          style={{
            backgroundImage: !heroImgFailed
              ? `linear-gradient(90deg, rgba(7,7,10,0.95) 0%, rgba(7,7,10,0.78) 52%, rgba(7,7,10,0.88) 100%), url("${heroBgUrl}")`
              : "linear-gradient(135deg, #13151f 0%, #090a0f 100%)",
          }}
        >
          {/* Hidden preloader to detect hero image failure */}
          <img
            src={heroBgUrl}
            alt=""
            style={{ display: "none" }}
            onError={() => setHeroImgFailed(true)}
          />

          <div className="hero-spotlight-left">
            <div className="hero-meta-editorial">
              <span className="hero-meta-round" id="dash-next-live-badge">
                ROUND {targetRace.round}
              </span>
              <span className="hero-meta-slash" aria-hidden="true">/</span>
              <span className="hero-meta-format" id="dash-next-status-text">
                {isLiveNow
                  ? "LIVE RACE WEEKEND"
                  : isPastSeason
                    ? "SEASON FINISHED"
                    : "UPCOMING GRAND PRIX"}
              </span>
              {targetRace.has_sprint && (
                <>
                  <span className="hero-meta-slash" aria-hidden="true">/</span>
                  <span className="hero-meta-format is-sprint">SPRINT</span>
                </>
              )}
            </div>

            <h2 className="hero-gp-title" id="dash-next-gp-name">
              {targetRace.grand_prix_name}
            </h2>

            <div className="hero-circuit-meta">
              <span className="hero-meta-pair">
                <CountryFlag
                  name={targetRace.country || targetRace.location}
                  size={20}
                />
                <span id="dash-next-circuit" className="hero-circuit-name">
                  {targetRace.circuit_name}
                </span>
              </span>
              <span className="hero-meta-pair">
                <span className="hero-meta-sep hero-location-icon">
                  <i className="fa-solid fa-location-dot"></i>
                </span>
                <span id="dash-next-location" className="hero-location-text">
                  {[targetRace.location, targetRace.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
            </div>

            <div className="hero-actions-row">
              <button
                type="button"
                className="f1-btn-primary"
                onClick={() =>
                  navigate(`/weekend-hub?round=${targetRace.round}`)
                }
              >
                <span>Open Race Weekend Hub</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
              <button
                type="button"
                className="f1-btn-ghost"
                onClick={() => navigate("/calendar")}
              >
                <span>Full Season Calendar</span>
              </button>
            </div>
          </div>

          <div className="hero-spotlight-right">
            {!isLiveNow && !isPastSeason && (
              <div className="hero-countdown-box">
                <span className="countdown-overline">
                  <span className="countdown-live-dot" />
                  Next Session Countdown
                </span>
                <FlipCountdown
                  days={countdown.days}
                  hours={countdown.hours}
                  mins={countdown.mins}
                  secs={countdown.secs}
                />
              </div>
            )}

            {trackSvgUrl && !trackSvgFailed && (
              <div className="hero-track-vector-wrap">
                <img
                  src={trackSvgUrl}
                  alt={targetRace.circuit_name}
                  className="hero-track-svg"
                  onError={() => setTrackSvgFailed(true)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TOP 3 DRIVERS & CONSTRUCTOR LEADER */}
      <div className="dash-leaders-strip">
        {[0, 1, 2].map((idx) => (
          <DashboardDriverCard
            key={drivers[idx]?.driver_name || `top-driver-${idx}`}
            driver={drivers[idx]}
            rank={idx + 1}
            season={season}
            onClick={() => navigate("/standings")}
          />
        ))}

        {/* WCC P1 Constructor Card */}
        <div
          className="leader-spotlight-card constructor-leader-card f1-halftone-card"
          style={{
            background: cLeaderTheme.gradient,
            borderColor: `${cLeaderTheme.baseColor}55`,
          }}
          onClick={() => navigate("/standings?tab=constructors")}
        >
          <div className="leader-card-content w-100">
            <div className="leader-card-top flex-between">
              <div>
                <span className="leader-overline">Constructors Standings</span>
                <div className="leader-name-block" id="dash-team-leader">
                  <span className="leader-last-name">
                    {cLeader ? (
                      <WikiLink
                        text={cLeader.constructor_name}
                        url={cLeader.constructor_wiki_url}
                      />
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>

              <div className="constructor-top-right">
                <span className="leader-pos-tag">P1</span>
                {cLeaderLogo && !teamLogoFailed && (
                  <span className="constructor-logo-disc">
                    <img
                      src={cLeaderLogo}
                      alt={cLeader?.constructor_name}
                      onError={() => setTeamLogoFailed(true)}
                    />
                  </span>
                )}
              </div>
            </div>

            <div className="leader-metrics-row" id="dash-team-leader-pts">
              <div className="leader-metric">
                <span className="metric-val">
                  <AnimatedNumber value={cLeader?.total_points ?? 0} />
                </span>
                <span className="metric-unit">PTS</span>
              </div>
              <div className="leader-metric-divider" />
              <div className="leader-metric">
                <span className="metric-val">
                  <AnimatedNumber value={cLeader?.total_wins ?? 0} />
                </span>
                <span className="metric-unit">WINS</span>
              </div>
            </div>

            {cLeader && (
              <div className="constructor-car-showcase">
                <img
                  src={carImgFailed ? DEFAULT_CAR_SILHOUETTE : cLeaderCar}
                  alt={cLeader?.constructor_name}
                  className="constructor-car-img"
                  onError={() => {
                    if (!carImgFailed) setCarImgFailed(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN MINIMALIST TABLES (SCHEDULE & TOP 5 STANDINGS) */}
      <div className="dash-tables-grid">
        {/* Left: Season Grand Prix Schedule (Clean without Format column) */}
        <div className="f1-minimal-panel" id="dash-schedule-card">
          <div className="panel-header-bar">
            <h3 className="panel-title">Season Grand Prix Schedule</h3>
            <button
              type="button"
              className="f1-link-btn"
              onClick={() => navigate("/calendar")}
            >
              <span>Full Calendar</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="table-responsive dash-table-scroll">
            <table className="f1-minimal-table" id="dash-races-table">
              <thead>
                <tr>
                  <th>RND</th>
                  <th>GRAND PRIX</th>
                  <th>CIRCUIT</th>
                  <th className="text-right">DATE</th>
                </tr>
              </thead>
              <tbody>
                {loadingRaces ? (
                  <TableRowsSkeleton rows={7} cols={4} />
                ) : races.length > 0 ? (
                  races.map((r) => {
                    const isTarget =
                      targetRace && r.round === targetRace.round;
                    const isPast = r.race_date && r.race_date < todayStr;
                    const isLive = isLiveNow && isTarget;

                    let rowClass = "clickable-row";
                    if (isLive) rowClass += " row-highlight-live";
                    else if (isTarget) rowClass += " row-highlight-next";
                    else if (isPast) rowClass += " row-dimmed";

                    return (
                      <tr
                        key={r.round}
                        className={rowClass}
                        onClick={() => navigate(`/weekend-hub?round=${r.round}`)}
                      >
                        <td className="cell-round">
                          {String(r.round).padStart(2, "0")}
                        </td>
                        <td className="cell-gp">
                          <div className="gp-cell-inner">
                            <CountryFlag
                              name={r.country || r.location || r.grand_prix_name}
                              size={18}
                            />
                            <WikiLink
                              text={String(r.grand_prix_name || "").replace(/Grand Prix/i, "GP")}
                              url={r.race_wiki_url}
                            />
                            {isLive && (
                              <span
                                className="f1-live-flag-icon"
                                title="Race Week"
                                aria-label="Race Week"
                              >
                                <i className="fa-solid fa-flag-checkered"></i>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="cell-muted">
                          <WikiLink
                            text={r.circuit_name}
                            url={r.circuit_wiki_url}
                          />
                        </td>
                        <td className="cell-tabular text-right">
                          {r.race_date || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="table-state-cell">
                      No races found for season {season}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top 5 Driver Championship (Reference 2 Minimalist Style) */}
        <div className="f1-minimal-panel">
          <div className="panel-header-bar">
            <h3 className="panel-title">Top 5 Driver Standings</h3>
            <button
              type="button"
              className="f1-link-btn"
              onClick={() => navigate("/standings")}
            >
              <span>Full Standings</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="table-responsive">
            <table className="f1-minimal-table" id="dash-standings-table">
              <thead>
                <tr>
                  <th>POS.</th>
                  <th>DRIVER</th>
                  <th>TEAM</th>
                  <th>WINS</th>
                  <th className="text-right">PTS.</th>
                </tr>
              </thead>
              <tbody>
                {loadingDrivers ? (
                  <TableRowsSkeleton rows={5} cols={5} />
                ) : drivers.length > 0 ? (
                  drivers.slice(0, 5).map((d, i) => {
                    const rank = d.championship_rank || i + 1;
                    return (
                      <tr key={d.driver_code || d.driver_name || i}>
                        <td className="cell-pos">{rank}</td>
                        <td>
                          <DriverBadge
                            name={d.driver_name}
                            code={d.driver_code}
                            team={d.team_name}
                            season={season}
                            wikiUrl={d.driver_wiki_url}
                          />
                        </td>
                        <td>
                          <TeamBadge
                            name={d.team_name}
                            season={season}
                            wikiUrl={d.constructor_wiki_url}
                          />
                        </td>
                        <td className="cell-tabular">{d.total_wins ?? 0}</td>
                        <td className="cell-points text-right">
                          {d.total_points ?? 0}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="table-state-cell">
                      No standings available for {season}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
