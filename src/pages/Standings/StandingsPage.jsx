import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import DriverBadge from "../../components/common/DriverBadge";
import TeamBadge from "../../components/common/TeamBadge";
import {
  CardGridSkeleton,
  TablePanelSkeleton,
} from "../../components/common/Skeleton";
import { CountryFlag, getCountryThreeLetterCode } from "../../utils/flags";
import { useTableSort } from "../../utils/useTableSort";
import {
  DEFAULT_CAR_SILHOUETTE,
  DEFAULT_DRIVER_SILHOUETTE,
  getDriverHeadshot,
  getTeamLogo,
  getCarLivery,
  getTeamCardGradient,
  resolveDriverCode,
} from "../../utils/f1Assets";

function DriverPodiumCard({ driver, rank, season }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!driver) return null;

  const headshot = getDriverHeadshot(driver.driver_name, driver.driver_code, season);
  const resolvedHeadshot = imgFailed ? DEFAULT_DRIVER_SILHOUETTE : headshot;
  const code = resolveDriverCode(driver.driver_name, driver.driver_code);
  const theme = getTeamCardGradient(driver.team_name);

  const parts = String(driver.driver_name || "").trim().split(/\s+/);
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const lastName =
    parts.length > 1 ? parts[parts.length - 1] : driver.driver_name;

  return (
    <div
      className="podium-feature-card f1-halftone-card"
      style={{
        background: theme.gradient,
        borderColor: `${theme.baseColor}55`,
      }}
    >
      <div className="podium-card-left">
        <div className="podium-top-meta">
          <span className="podium-pos-label">P{rank}</span>
          <span className="podium-pts-pill">
            {driver.total_points ?? 0} <small>PTS</small>
          </span>
        </div>

        <div className="podium-driver-names">
          {firstName && <span className="podium-first-name">{firstName}</span>}
          <h3 className="podium-last-name">
            <WikiLink text={lastName} url={driver.driver_wiki_url} />
          </h3>
        </div>

        <span className="podium-team-name">{driver.team_name || "-"}</span>

        <div className="podium-bottom-meta">
          <CountryFlag name={driver.nationality} size={22} />
          <span className="podium-wins-tag">
            {driver.total_wins ?? 0} Wins
          </span>
        </div>
      </div>

      <div className="podium-card-right">
        <img
          src={resolvedHeadshot}
          alt={driver.driver_name}
          className="podium-driver-cutout"
          onError={() => {
            if (!imgFailed) setImgFailed(true);
          }}
        />
      </div>
    </div>
  );
}

function ConstructorPodiumCard({ constructorItem, rank, season }) {
  const [carFailed, setCarFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  if (!constructorItem) return null;

  const carUrl = getCarLivery(season, constructorItem.constructor_name);
  const resolvedCarUrl = carFailed ? DEFAULT_CAR_SILHOUETTE : carUrl;
  const logoUrl = getTeamLogo(constructorItem.constructor_name, season);
  const theme = getTeamCardGradient(constructorItem.constructor_name);

  return (
    <div
      className="podium-feature-card constructor-podium-card f1-halftone-card"
      style={{
        background: theme.gradient,
        borderColor: `${theme.baseColor}55`,
      }}
    >
      <div className="podium-constructor-header">
        <div>
          <div className="podium-top-meta">
            <span className="podium-pos-label">P{rank}</span>
            <span className="podium-pts-pill">
              {constructorItem.total_points ?? 0} <small>PTS</small>
            </span>
            <span className="podium-wins-tag">
              {constructorItem.total_wins ?? 0} Wins
            </span>
          </div>
          <h3 className="podium-last-name mt-1">
            <WikiLink
              text={constructorItem.constructor_name}
              url={constructorItem.constructor_wiki_url}
            />
          </h3>
        </div>

        {logoUrl && !logoFailed && (
          <span className="constructor-logo-disc">
            <img
              src={logoUrl}
              alt={constructorItem.constructor_name}
              onError={() => setLogoFailed(true)}
            />
          </span>
        )}
      </div>

      <div className="podium-car-wrap">
        <img
          src={resolvedCarUrl}
          alt={constructorItem.constructor_name}
          className="podium-car-img"
          onError={() => {
            if (!carFailed) setCarFailed(true);
          }}
        />
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const { season } = useSeason();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState(
    tabParam === "constructors" ? "constructors" : "drivers"
  );

  useEffect(() => {
    if (tabParam === "constructors" || tabParam === "drivers") {
      setTab(tabParam);
    }
  }, [tabParam]);

  const { data: driversData = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ["driverStandings", season],
    queryFn: async () => {
      const res = await F1Api.getDriverStandingsByYear(season);
      return toArray(res);
    },
    enabled: tab === "drivers",
  });

  const { data: constructorsData = [], isLoading: loadingConstructors } = useQuery({
    queryKey: ["constructorStandings", season],
    queryFn: async () => {
      const res = await F1Api.getConstructorStandingsByYear(season);
      return toArray(res);
    },
    enabled: tab === "constructors",
  });

  const drivers = Array.isArray(driversData) ? driversData : [];
  const constructors = Array.isArray(constructorsData) ? constructorsData : [];

  const isLoading = tab === "drivers" ? loadingDrivers : loadingConstructors;

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

  const top3Drivers = [...drivers]
    .sort((a, b) => (a.championship_rank ?? 99) - (b.championship_rank ?? 99))
    .slice(0, 3);

  const top3Constructors = [...constructors]
    .sort((a, b) => (a.championship_rank ?? 99) - (b.championship_rank ?? 99))
    .slice(0, 3);

  return (
    <section id="view-standings" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">{season} FIA FORMULA ONE WORLD CHAMPIONSHIP</span>
          <h2 className="page-main-title">Championship Standings</h2>
        </div>
      </div>

      <div className="f1-segmented-tabs f1-tabs-5050">
        <button
          id="btn-standings-drivers"
          type="button"
          className={`seg-tab-btn ${tab === "drivers" ? "active" : ""}`}
          onClick={() => setTab("drivers")}
        >
          Drivers
        </button>
        <button
          id="btn-standings-constructors"
          type="button"
          className={`seg-tab-btn ${tab === "constructors" ? "active" : ""}`}
          onClick={() => setTab("constructors")}
        >
          Constructors
        </button>
      </div>

      {isLoading ? (
        <>
          <CardGridSkeleton
            count={3}
            gridClass="standings-podium-grid"
            cardHeight={164}
          />
          <div className="f1-minimal-panel">
            <TablePanelSkeleton rows={8} cols={5} />
          </div>
        </>
      ) : (
        <>
          {/* TOP 3 PODIUM FEATURE CARDS */}
          {tab === "drivers" && top3Drivers.length > 0 && (
            <div className="standings-podium-grid">
              {top3Drivers.map((d, idx) => (
                <DriverPodiumCard
                  key={`${season}-${d.driver_code || d.driver_name}`}
                  driver={d}
                  rank={d.championship_rank ?? idx + 1}
                  season={season}
                />
              ))}
            </div>
          )}

          {tab === "constructors" && top3Constructors.length > 0 && (
            <div className="standings-podium-grid">
              {top3Constructors.map((c, idx) => (
                <ConstructorPodiumCard
                  key={`${season}-${c.constructor_name}`}
                  constructorItem={c}
                  rank={c.championship_rank ?? idx + 1}
                  season={season}
                />
              ))}
            </div>
          )}

          {/* MINIMALIST STANDINGS TABLE (Reference 2 Aesthetic) */}
          <div className="f1-minimal-panel">
            <div className="table-responsive">
              <table className="f1-minimal-table" id="standings-main-table">
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
                          POS. <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "driver_name"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("driver_name")}
                        >
                          DRIVER <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "nationality"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("nationality")}
                        >
                          NATIONALITY <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "team_name"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("team_name")}
                        >
                          TEAM <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            dSortKey === "total_wins"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }
                          onClick={() => dRequestSort("total_wins")}
                        >
                          WINS <span className="sort-icon"></span>
                        </th>
                        <th
                          className={`text-right ${
                            dSortKey === "total_points"
                              ? `sort-${dSortDir}`
                              : "sortable"
                          }`}
                          onClick={() => dRequestSort("total_points")}
                        >
                          PTS. <span className="sort-icon"></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDrivers.length > 0 ? (
                        sortedDrivers.map((d, i) => {
                          const rank = d.championship_rank ?? i + 1;
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
                              <td className="cell-nation">
                                <span
                                  className="nation-code-text"
                                  title={d.nationality}
                                >
                                  {getCountryThreeLetterCode(d.nationality)}
                                </span>
                              </td>
                              <td>
                                <TeamBadge
                                  name={d.team_name}
                                  season={season}
                                  wikiUrl={d.constructor_wiki_url}
                                />
                              </td>
                              <td className="cell-tabular">
                                {d.total_wins ?? 0}
                              </td>
                              <td className="cell-points text-right">
                                {d.total_points ?? 0}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="table-state-cell">
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
                          POS. <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            cSortKey === "constructor_name"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }
                          onClick={() => cRequestSort("constructor_name")}
                        >
                          TEAM <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            cSortKey === "nationality"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }
                          onClick={() => cRequestSort("nationality")}
                        >
                          NATIONALITY <span className="sort-icon"></span>
                        </th>
                        <th
                          className={
                            cSortKey === "total_wins"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }
                          onClick={() => cRequestSort("total_wins")}
                        >
                          WINS <span className="sort-icon"></span>
                        </th>
                        <th
                          className={`text-right ${
                            cSortKey === "total_points"
                              ? `sort-${cSortDir}`
                              : "sortable"
                          }`}
                          onClick={() => cRequestSort("total_points")}
                        >
                          PTS. <span className="sort-icon"></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedConstructors.length > 0 ? (
                        sortedConstructors.map((c, i) => {
                          const rank = c.championship_rank ?? i + 1;
                          return (
                            <tr key={c.constructor_name || i}>
                              <td className="cell-pos">{rank}</td>
                              <td>
                                <TeamBadge
                                  name={c.constructor_name}
                                  season={season}
                                  wikiUrl={c.constructor_wiki_url}
                                />
                              </td>
                              <td className="cell-nation">
                                <span
                                  className="nation-code-text"
                                  title={c.nationality}
                                >
                                  {getCountryThreeLetterCode(c.nationality)}
                                </span>
                              </td>
                              <td className="cell-tabular">
                                {c.total_wins ?? 0}
                              </td>
                              <td className="cell-points text-right">
                                {c.total_points ?? 0}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="table-state-cell">
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
          </div>
        </>
      )}
    </section>
  );
}
