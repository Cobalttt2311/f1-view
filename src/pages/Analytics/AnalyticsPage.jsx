import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray } from "../../api/client";
import DriverFormChart from "../../components/charts/DriverFormChart";
import PointsProgressionChart from "../../components/charts/PointsProgressionChart";
import WikiLink from "../../components/common/WikiLink";
import { CountryFlag } from "../../utils/flags";
import DriverBadge from "../../components/common/DriverBadge";
import TeamBadge from "../../components/common/TeamBadge";
import { useTableSort } from "../../utils/useTableSort";
import F1Select from "../../components/common/F1Select";
import {
  CardGridSkeleton,
  ChartSkeleton,
  TablePanelSkeleton,
} from "../../components/common/Skeleton";
import { getTeamColor } from "../../utils/teamColors";

const METRIC_DESCRIPTIONS = {
  "biggest-movers":
    "Drivers who gained the most positions from their starting grid slot to the checkered flag.",
  "pit-stops-eff":
    "Average pit stop duration and efficiency per constructor across the selected season.",
  "teammate-quali":
    "Head-to-head qualifying battle comparing teammates driving the same car.",
  "driver-form":
    "Rolling form tracking points scored across each driver's recent Grands Prix.",
  "points-progression":
    "Cumulative championship points trajectory round-by-round throughout the season.",
  "pole-to-win":
    "Percentage of pole-position qualifiers who converted P1 on the grid into a Grand Prix victory.",
  "dnf-circuits":
    "Circuits with the highest historical retirement (Did Not Finish) rates.",
  "deep-grid-wins":
    "Rare Grand Prix victories achieved after starting from P10 or further back on the grid.",
  "most-laps-led":
    "All-time drivers who have led the most race laps in P1 across Formula 1 history.",
  "fastest-speeds":
    "Highest recorded race speed-trap velocities in Formula 1 history.",
  "all-time-winners":
    "Drivers with the most Grand Prix victories in Formula 1 history.",
  "constructor-one-twos":
    "Constructors that achieved the most 1st and 2nd place finishes in the same race.",
  "youngest-winners":
    "The youngest drivers ever to win a Formula 1 World Championship Grand Prix.",
  "circuit-masters":
    "Drivers with the most victories at a single specific circuit.",
};

export default function AnalyticsPage() {
  const { season } = useSeason();
  const [category, setCategory] = useState("seasonal");
  const [seasonalMetric, setSeasonalMetric] = useState("biggest-movers");
  const [historicalMetric, setHistoricalMetric] = useState("pole-to-win");

  const { data: seasonalData = [], isLoading: loadingSeasonal } = useQuery({
    queryKey: ["seasonalAnalytics", season, seasonalMetric],
    queryFn: async () => {
      let res;
      if (seasonalMetric === "biggest-movers")
        res = await F1Api.getBiggestMovers(season);
      else if (seasonalMetric === "pit-stops-eff")
        res = await F1Api.getPitStopEfficiency(season);
      else if (seasonalMetric === "teammate-quali")
        res = await F1Api.getTeammateQualifying(season);
      else if (seasonalMetric === "driver-form")
        res = await F1Api.getDriverForm(season);
      else if (seasonalMetric === "points-progression")
        res = await F1Api.getPointsProgression(season);
      return toArray(res);
    },
    enabled: category === "seasonal",
  });

  const { data: historicalData = [], isLoading: loadingHistorical } = useQuery({
    queryKey: ["historicalAnalytics", historicalMetric],
    queryFn: async () => {
      let res;
      if (historicalMetric === "pole-to-win")
        res = await F1Api.getPoleToWinRate();
      else if (historicalMetric === "dnf-circuits")
        res = await F1Api.getHighDnfCircuits();
      else if (historicalMetric === "deep-grid-wins")
        res = await F1Api.getDeepGridWins();
      else if (historicalMetric === "most-laps-led")
        res = await F1Api.getMostLapsLed();
      else if (historicalMetric === "fastest-speeds")
        res = await F1Api.getFastestSpeeds();
      else if (historicalMetric === "constructor-one-twos")
        res = await F1Api.getConstructorOneTwos();
      else if (historicalMetric === "youngest-winners")
        res = await F1Api.getYoungestWinners();
      else if (historicalMetric === "circuit-masters")
        res = await F1Api.getCircuitMasters();
      else res = await F1Api.getAllTimeWinners();
      return toArray(res);
    },
    enabled: category === "historical",
  });

  const isLoading =
    category === "seasonal" ? loadingSeasonal : loadingHistorical;
  const rawCurrent = category === "seasonal" ? seasonalData : historicalData;
  const currentData = Array.isArray(rawCurrent) ? rawCurrent : [];

  const visibleColumns = useMemo(() => {
    if (!currentData.length || !currentData[0]) return [];
    return Object.keys(currentData[0]).filter(
      (k) => !k.toLowerCase().includes("wiki_url")
    );
  }, [currentData]);

  const initialKey = visibleColumns.length > 0 ? visibleColumns[0] : null;

  const { sortedData, sortKey, sortDir, requestSort } = useTableSort(
    currentData,
    initialKey
  );

  // Normalize teammate battles whether backend returns per-driver rows or paired rows
  const teammatePairs = useMemo(() => {
    const list = Array.isArray(seasonalData) ? seasonalData : [];
    if (list.length === 0) return [];

    // Check if already paired (driver_1 / driver_2)
    if (list[0] && (list[0].driver_1 || list[0].driver_2)) {
      return list.map((t) => {
        let d1Wins = Number(t.driver_1_wins ?? 0);
        let d2Wins = Number(t.driver_2_wins ?? 0);
        if (!d1Wins && !d2Wins && t.h2h_score) {
          const parts = String(t.h2h_score).split("-");
          if (parts.length === 2) {
            d1Wins = parseInt(parts[0].trim(), 10) || 0;
            d2Wins = parseInt(parts[1].trim(), 10) || 0;
          }
        }
        return {
          team_name: t.team_name,
          driver_1: t.driver_1,
          driver_2: t.driver_2,
          d1Wins,
          d2Wins,
          meta: t.avg_gap ? `AVG GAP: ${t.avg_gap}s` : null,
        };
      });
    }

    // Group per-driver rows ({ team_name, driver_name, outqualified_teammate_count, total_sessions_entered })
    const byTeam = Object.create(null);
    list.forEach((row) => {
      if (!row || !row.team_name) return;
      if (!byTeam[row.team_name]) byTeam[row.team_name] = [];
      byTeam[row.team_name].push(row);
    });

    return Object.entries(byTeam).map(([teamName, drivers]) => {
      const d1 = drivers[0] || {};
      const d2 = drivers[1] || {};
      return {
        team_name: teamName,
        driver_1: d1.driver_name || "-",
        driver_2: d2.driver_name || "Teammate",
        d1Wins: Number(d1.outqualified_teammate_count ?? 0),
        d2Wins: Number(d2.outqualified_teammate_count ?? 0),
        meta: d1.total_sessions_entered
          ? `${d1.total_sessions_entered} QUALI SESSIONS`
          : null,
      };
    });
  }, [seasonalData]);

  const renderTeammateBattles = () => {
    if (teammatePairs.length === 0) {
      return (
        <div className="f1-empty-state">
          No teammate qualifying battle data for {season}.
        </div>
      );
    }

    return (
      <div className="p-3">
        <div className="h2h-battles-grid">
          {teammatePairs.map((t, idx) => {
            const teamColor = getTeamColor(t.team_name);
            const total = t.d1Wins + t.d2Wins || 1;
            const d1Pct = Math.round((t.d1Wins / total) * 100);

            return (
              <div
                key={idx}
                className="h2h-battle-card"
                style={{ borderColor: `${teamColor}44` }}
              >
                <div className="h2h-card-top">
                  <TeamBadge name={t.team_name} season={season} size={22} />
                  {t.meta && (
                    <span className="f1-minimal-pill">{t.meta}</span>
                  )}
                </div>

                <div className="h2h-drivers-row">
                  <div className="h2h-side h2h-left">
                    <DriverBadge
                      name={t.driver_1}
                      team={t.team_name}
                      season={season}
                      size={32}
                    />
                    <strong className="h2h-score-num">{t.d1Wins}</strong>
                  </div>

                  <div className="h2h-vs-divider">VS</div>

                  <div className="h2h-side h2h-right">
                    <strong className="h2h-score-num">{t.d2Wins}</strong>
                    <DriverBadge
                      name={t.driver_2}
                      team={t.team_name}
                      season={season}
                      size={32}
                    />
                  </div>
                </div>

                <div className="h2h-bar-track">
                  <div
                    className="h2h-bar-fill"
                    style={{
                      width: `${d1Pct}%`,
                      backgroundColor: teamColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section id="view-analytics-master" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">
            TELEMETRY INTELLIGENCE & HISTORICAL RECORDS
          </span>
          <h2 className="page-main-title">
            Advanced Intelligence & Telemetry Analytics
          </h2>
        </div>

        <div className="f1-segmented-tabs">
          <button
            id="btn-cat-seasonal"
            type="button"
            className={`seg-tab-btn ${category === "seasonal" ? "active" : ""}`}
            onClick={() => setCategory("seasonal")}
          >
            {season} Season Telemetry
          </button>
          <button
            id="btn-cat-historical"
            type="button"
            className={`seg-tab-btn ${category === "historical" ? "active" : ""}`}
            onClick={() => setCategory("historical")}
          >
            All-Time Historical Records
          </button>
        </div>
      </div>

      {/* METRIC SELECTOR BAR */}
      <div className="f1-analytics-toolbar">
        {category === "seasonal" ? (
          <div
            id="seasonal-metrics-container"
            className="analytics-picker-row"
          >
            <span className="picker-overline">SEASONAL METRIC</span>
            <F1Select
              id="seasonal-metric-select"
              value={seasonalMetric}
              onChange={(val) => setSeasonalMetric(val)}
              options={[
                {
                  value: "biggest-movers",
                  label: "Greatest Comebacks & Positions Gained",
                },
                {
                  value: "pit-stops-eff",
                  label: "Pit Stop Efficiency & Duration by Team",
                },
                {
                  value: "teammate-quali",
                  label: "Teammate Qualifying Battles",
                },
                {
                  value: "driver-form",
                  label: "Driver Rolling Form",
                },
                {
                  value: "points-progression",
                  label: "Cumulative Season Points Trajectory",
                },
              ]}
            />
          </div>
        ) : (
          <div
            id="historical-metrics-container"
            className="analytics-picker-row"
          >
            <span className="picker-overline">HISTORICAL METRIC</span>
            <F1Select
              id="historical-metric-select"
              value={historicalMetric}
              onChange={(val) => setHistoricalMetric(val)}
              options={[
                {
                  value: "pole-to-win",
                  label: "Pole-to-Win Conversion Rate",
                },
                {
                  value: "dnf-circuits",
                  label: "High DNF & Incident-Prone Tracks",
                },
                {
                  value: "deep-grid-wins",
                  label: "Miracle Wins from Deepest Grid",
                },
                {
                  value: "most-laps-led",
                  label: "All-Time Laps Led",
                },
                {
                  value: "fastest-speeds",
                  label: "Fastest Race Speed Traps Recorded in History",
                },
                {
                  value: "all-time-winners",
                  label: "All-Time Grand Prix Winners",
                },
                {
                  value: "constructor-one-twos",
                  label: "Constructor 1-2 Finishes in History",
                },
                {
                  value: "youngest-winners",
                  label: "Youngest Race Winners in F1 History",
                },
                {
                  value: "circuit-masters",
                  label: "King of the Circuit",
                },
              ]}
            />
          </div>
        )}

        <span id="analytics-card-badge" className="f1-minimal-pill">
          {category === "seasonal" ? `${season} SEASON` : "ALL-TIME RECORD"}
        </span>
      </div>

      {/* ANALYTICS CONTENT PANEL */}
      <div className="f1-minimal-panel">
        <div className="panel-header-bar">
          <div className="panel-title-group">
            <h3 className="panel-title" id="analytics-card-title">
              {category === "seasonal"
                ? seasonalMetric.replace(/-/g, " ").toUpperCase()
                : historicalMetric.replace(/-/g, " ").toUpperCase()}
            </h3>
            <p className="panel-subtitle-desc" id="analytics-card-desc">
              {
                METRIC_DESCRIPTIONS[
                  category === "seasonal" ? seasonalMetric : historicalMetric
                ]
              }
            </p>
          </div>
        </div>

        <div>
          {isLoading ? (
            category === "seasonal" &&
            (seasonalMetric === "driver-form" ||
              seasonalMetric === "points-progression") ? (
              <ChartSkeleton />
            ) : category === "seasonal" &&
              seasonalMetric === "teammate-quali" ? (
              <div className="p-3">
                <CardGridSkeleton
                  count={6}
                  gridClass="h2h-battles-grid"
                  cardHeight={120}
                />
              </div>
            ) : (
              <TablePanelSkeleton rows={8} cols={5} />
            )
          ) : category === "seasonal" && seasonalMetric === "driver-form" ? (
            <div className="p-3">
              <DriverFormChart rawData={currentData} />
            </div>
          ) : category === "seasonal" &&
            seasonalMetric === "points-progression" ? (
            <div className="p-3">
              <PointsProgressionChart rawData={currentData} />
            </div>
          ) : category === "seasonal" && seasonalMetric === "teammate-quali" ? (
            renderTeammateBattles()
          ) : Array.isArray(sortedData) &&
            sortedData.length > 0 &&
            visibleColumns.length > 0 ? (
            <div className="table-responsive">
              <table className="f1-minimal-table">
                <thead>
                  <tr>
                    {visibleColumns.map((key) => (
                      <th
                        key={key}
                        className={
                          sortKey === key ? `sort-${sortDir}` : "sortable"
                        }
                        onClick={() => requestSort(key)}
                      >
                        {key.replace(/_/g, " ").toUpperCase()}{" "}
                        <span className="sort-icon"></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.slice(0, 50).map((row, idx) => (
                    <tr key={idx}>
                      {visibleColumns.map((k, colIdx) => {
                        const val = row[k];
                        const keyLower = k.toLowerCase();
                        const isYearOrSeason =
                          keyLower.includes("year") ||
                          keyLower.includes("season") ||
                          (typeof val === "number" &&
                            Number.isInteger(val) &&
                            val >= 1900 &&
                            val <= 2100);

                        const isDriverCol =
                          (keyLower === "driver" ||
                            keyLower === "driver_name" ||
                            keyLower === "winner" ||
                            keyLower === "winner_name") &&
                          typeof val === "string";

                        const isTeamCol =
                          (keyLower === "team" ||
                            keyLower === "team_name" ||
                            keyLower === "constructor" ||
                            keyLower === "constructor_name") &&
                          typeof val === "string";

                        const isRaceCol =
                          (keyLower === "grand_prix" ||
                            keyLower === "grand_prix_name" ||
                            keyLower === "race_name") &&
                          typeof val === "string";

                        const isCircuitCol =
                          (keyLower === "circuit" ||
                            keyLower === "circuit_name") &&
                          typeof val === "string";

                        return (
                          <td
                            key={colIdx}
                            className={
                              typeof val === "number" ? "cell-tabular" : ""
                            }
                          >
                            {isDriverCol ? (
                              <DriverBadge
                                name={val}
                                team={
                                  row.team_name ||
                                  row.constructor_name ||
                                  row.team ||
                                  ""
                                }
                                season={row.year || row.season || season}
                                wikiUrl={row.driver_wiki_url}
                              />
                            ) : isTeamCol ? (
                              <TeamBadge
                                name={val}
                                season={row.year || row.season || (category === "seasonal" ? season : null)}
                                wikiUrl={row.constructor_wiki_url}
                              />
                            ) : isRaceCol ? (
                              <WikiLink text={val} url={row.race_wiki_url} />
                            ) : isCircuitCol ? (
                              <WikiLink text={val} url={row.circuit_wiki_url} />
                            ) : keyLower.includes("nationality") ||
                              keyLower.includes("country") ? (
                              <span>
                                <CountryFlag name={val} size={18} />
                                {String(val ?? "-")}
                              </span>
                            ) : typeof val === "number" ? (
                              isYearOrSeason ? (
                                <strong>{val}</strong>
                              ) : Number.isInteger(val) ? (
                                val.toLocaleString()
                              ) : (
                                val.toFixed(2)
                              )
                            ) : (
                              String(val ?? "-")
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="f1-empty-state">
              No telemetry analytics recorded for this metric.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
