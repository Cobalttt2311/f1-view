import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSeason } from "../../context/SeasonContext";
import { useTimezone } from "../../context/TimezoneContext";
import { F1Api, toArray, toObject } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import F1Select from "../../components/common/F1Select";
import { CardGridSkeleton } from "../../components/common/Skeleton";
import { CountryFlag } from "../../utils/flags";
import { getCircuitTrackMap, getHeroImage } from "../../utils/f1Assets";

export default function PracticesPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const navigate = useNavigate();
  const [selectedRound, setSelectedRound] = useState(1);
  const [svgFailed, setSvgFailed] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  const { data: racesData = [], isLoading: loadingRaces } = useQuery({
    queryKey: ["raceCalendar", season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return toArray(res);
    },
  });
  const races = Array.isArray(racesData) ? racesData : [];

  const { data: practiceData, isLoading: loadingPractice } = useQuery({
    queryKey: ["practiceSchedule", season, selectedRound],
    queryFn: async () => {
      const res = await F1Api.getPracticeSchedule(season, selectedRound);
      return toObject(res);
    },
    enabled: !!selectedRound,
  });

  useEffect(() => {
    setSvgFailed(false);
    setHeroFailed(false);
  }, [selectedRound, season]);

  const trackSvgUrl = practiceData
    ? getCircuitTrackMap(
        practiceData.circuit_name,
        practiceData.grand_prix_name,
        practiceData.country
      )
    : null;

  const heroBgUrl = practiceData
    ? getHeroImage(
        practiceData.circuit_name,
        practiceData.grand_prix_name,
        practiceData.country
      )
    : null;

  return (
    <section id="view-practices" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">{season} SESSION TIMETABLE</span>
          <h2 className="page-main-title">
            Free Practice Schedule (FP1, FP2, FP3)
          </h2>
        </div>

        <div className="header-action-group">
          <F1Select
            id="practice-round-select"
            value={selectedRound}
            onChange={(val) => setSelectedRound(Number(val))}
            options={races.map((r) => ({
              value: r.round,
              label: r.grand_prix_name,
            }))}
          />
        </div>
      </div>

      {loadingPractice || loadingRaces ? (
        <CardGridSkeleton
          count={2}
          gridClass="f1-practice-split-grid"
          cardHeight={280}
        />
      ) : practiceData ? (
        <div className="f1-practice-split-grid" id="practice-content-card">
          {/* Left: Venue & Track Outline Card */}
          <div
            className="practice-venue-card"
            style={{
              backgroundImage:
                heroBgUrl && !heroFailed
                  ? `linear-gradient(180deg, rgba(10,11,16,0.78) 0%, rgba(10,11,16,0.96) 100%), url("${heroBgUrl}")`
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

            <div className="practice-venue-top">
              <span className="f1-minimal-pill pill-accent">
                ROUND {String(practiceData.round || selectedRound).padStart(2, "0")}
              </span>
              <span className="f1-minimal-pill">SEASON {season}</span>
            </div>

            <div className="practice-venue-title-block">
              <h3>
                <WikiLink
                  text={practiceData.grand_prix_name}
                  url={practiceData.race_wiki_url}
                />
              </h3>
              <p className="practice-venue-sub">
                <CountryFlag name={practiceData.country} size={18} />
                <span>
                  {practiceData.circuit_name} ({practiceData.country})
                </span>
              </p>
            </div>

            {trackSvgUrl && !svgFailed ? (
              <div className="practice-svg-stage">
                <img
                  src={trackSvgUrl}
                  alt={practiceData.circuit_name}
                  className="practice-track-svg"
                  onError={() => setSvgFailed(true)}
                />
              </div>
            ) : (
              <div className="practice-svg-fallback">
                <span>{practiceData.circuit_name}</span>
              </div>
            )}

            <button
              type="button"
              className="f1-btn-ghost w-100 mt-3"
              onClick={() => navigate("/weekend-hub")}
            >
              <span>Inspect Full Weekend Telemetry</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          {/* Right: Session Schedules Panel (Reference 5 Right Style) */}
          <div className="f1-minimal-panel">
            <div className="panel-header-bar">
              <div>
                <h3 className="panel-title">Practice Sessions Timetable</h3>
                <p className="panel-subtitle">
                  Displayed in {timezone} timezone
                </p>
              </div>
            </div>

            <div className="cal-sessions-table p-3">
              {[
                {
                  code: "Practice 1",
                  title: "Free Practice 1 (FP1)",
                  date: practiceData.fp1_date,
                  time: formatSessionTime(
                    practiceData.fp1_time_utc,
                    practiceData.fp1_time_wib
                  ),
                  desc: "Opening 60-minute baseline setup & aero correlation session",
                },
                {
                  code: "Practice 2",
                  title: "Free Practice 2 (FP2)",
                  date: practiceData.fp2_date,
                  time: formatSessionTime(
                    practiceData.fp2_time_utc,
                    practiceData.fp2_time_wib
                  ),
                  desc: "Qualifying low-fuel simulation & long-run race pace program",
                },
                {
                  code: "Practice 3",
                  title: "Free Practice 3 (FP3)",
                  date: practiceData.fp3_date,
                  time: formatSessionTime(
                    practiceData.fp3_time_utc,
                    practiceData.fp3_time_wib
                  ),
                  desc: "Final 60-minute fine-tuning prior to Parc Fermé & Qualifying",
                },
              ].map((s) => (
                <div key={s.code} className="cal-session-line">
                  <div className="cal-session-left">
                    <span className="cal-session-badge">{s.code}</span>
                    <div className="mt-1">
                      <strong className="cell-strong">{s.title}</strong>
                      <div className="cal-session-meta">{s.desc}</div>
                    </div>
                  </div>
                  <div className="cal-session-right">
                    <div className="cal-session-datetime">
                      {s.date || "TBA"} • <strong>{s.time}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="f1-empty-state">
          No practice schedule found for Round {selectedRound}.
        </div>
      )}
    </section>
  );
}
