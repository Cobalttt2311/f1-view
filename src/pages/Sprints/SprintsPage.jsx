import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSeason } from "../../context/SeasonContext";
import { useTimezone } from "../../context/TimezoneContext";
import { F1Api, toArray } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import { CardGridSkeleton } from "../../components/common/Skeleton";
import { CountryFlag } from "../../utils/flags";
import { getCircuitTrackMap } from "../../utils/f1Assets";

export default function SprintsPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const navigate = useNavigate();

  const { data: sprintsData = [], isLoading } = useQuery({
    queryKey: ["sprintSchedule", season],
    queryFn: async () => {
      const res = await F1Api.getSprintSchedule(season);
      return toArray(res);
    },
  });
  const sprints = Array.isArray(sprintsData) ? sprintsData : [];

  return (
    <section id="view-sprints" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">{season} FIA FORMULA 1 SPRINT CALENDAR</span>
          <h2 className="page-main-title">Dedicated Sprint Race Weekends</h2>
        </div>
        <div>
          <span className="f1-minimal-pill">
            {sprints.length} SPRINT EVENTS
          </span>
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton
          count={4}
          gridClass="f1-sprints-cards-grid mb-4"
          cardHeight={190}
        />
      ) : sprints.length > 0 ? (
        <>
          {/* SPRINT WEEKEND FEATURE CARDS */}
          <div className="f1-sprints-cards-grid mb-4">
            {sprints.map((s) => {
              const svgUrl = getCircuitTrackMap(
                s.circuit_name,
                s.grand_prix_name,
                s.country
              );
              return (
                <div
                  key={s.round}
                  className="f1-sprint-feature-card"
                  onClick={() =>
                    navigate(`/weekend-hub?round=${s.round}&tab=sprint-results`)
                  }
                >
                  <div className="sprint-card-top">
                    <div className="hero-meta-tags">
                      <span className="f1-minimal-pill pill-accent">
                        ROUND {String(s.round).padStart(2, "0")}
                      </span>
                      <span className="f1-minimal-pill">SPRINT</span>
                    </div>
                    {svgUrl && (
                      <img
                        src={svgUrl}
                        alt=""
                        className="sprint-card-mini-svg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  <div className="sprint-card-title-block">
                    <h4>
                      <WikiLink
                        text={s.grand_prix_name}
                        url={s.race_wiki_url}
                      />
                    </h4>
                    <p className="sprint-card-circuit">
                      <CountryFlag name={s.country} size={16} />
                      <span>
                        {s.circuit_name} ({s.country})
                      </span>
                    </p>
                  </div>

                  <div className="sprint-card-timings">
                    <div className="sprint-timing-row">
                      <span className="timing-lbl">Sprint Race</span>
                      <span className="timing-val">
                        {s.sprint_date || "-"} •{" "}
                        {formatSessionTime(s.sprint_time_utc, s.sprint_time_wib)}
                      </span>
                    </div>
                    <div className="sprint-timing-row">
                      <span className="timing-lbl">Main Grand Prix</span>
                      <span className="timing-val">
                        {s.main_race_date || "-"} •{" "}
                        {formatSessionTime(
                          s.main_race_time_utc,
                          s.main_race_time_wib
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MINIMALIST SPRINT SCHEDULE TABLE */}
          <div className="f1-minimal-panel">
            <div className="panel-header-bar">
              <div>
                <h3 className="panel-title">Sprint Events Timetable</h3>
                <p className="panel-subtitle">
                  Session start times in {timezone}
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="f1-minimal-table" id="sprint-schedule-table">
                <thead>
                  <tr>
                    <th>RND</th>
                    <th>GRAND PRIX</th>
                    <th>CIRCUIT</th>
                    <th>SPRINT DATE</th>
                    <th>SPRINT TIME</th>
                    <th>RACE DATE</th>
                    <th>RACE TIME</th>
                    <th className="text-right">TELEMETRY</th>
                  </tr>
                </thead>
                <tbody>
                  {sprints.map((s) => (
                    <tr
                      key={s.round}
                      className="clickable-row"
                      onClick={() =>
                        navigate(
                          `/weekend-hub?round=${s.round}&tab=sprint-results`
                        )
                      }
                    >
                      <td className="cell-round">
                        {String(s.round).padStart(2, "0")}
                      </td>
                      <td className="cell-strong">
                        <CountryFlag
                          name={s.country || s.grand_prix_name}
                          size={18}
                        />
                        <WikiLink
                          text={s.grand_prix_name}
                          url={s.race_wiki_url}
                        />
                      </td>
                      <td className="cell-muted">{s.circuit_name}</td>
                      <td className="cell-tabular">{s.sprint_date || "-"}</td>
                      <td className="cell-tabular cell-strong">
                        {formatSessionTime(s.sprint_time_utc, s.sprint_time_wib)}
                      </td>
                      <td className="cell-tabular">
                        {s.main_race_date || "-"}
                      </td>
                      <td className="cell-tabular">
                        {formatSessionTime(
                          s.main_race_time_utc,
                          s.main_race_time_wib
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="f1-row-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/weekend-hub?round=${s.round}&tab=sprint-results`
                            );
                          }}
                        >
                          <span>Weekend Hub</span>
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="f1-empty-state">
          No sprint race weekends scheduled for {season}.
        </div>
      )}
    </section>
  );
}
