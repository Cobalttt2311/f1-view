import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import Pagination from "../../components/common/Pagination";
import DriverBadge from "../../components/common/DriverBadge";
import TeamBadge from "../../components/common/TeamBadge";
import { CountryFlag } from "../../utils/flags";
import { useTableSort } from "../../utils/useTableSort";
import {
  DEFAULT_CAR_SILHOUETTE,
  getTeamLogo,
  getCarLivery,
  getTeamCardGradient,
} from "../../utils/f1Assets";

function ConstructorLiveryCard({ teamItem, teamDrivers = [], season }) {
  const [carFailed, setCarFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  if (!teamItem) return null;

  const teamName = teamItem.constructor_name || "";
  const theme = getTeamCardGradient(teamName);
  const logoUrl = getTeamLogo(teamName, season);
  const carUrl = getCarLivery(season, teamName);
  const resolvedCarUrl = carFailed ? DEFAULT_CAR_SILHOUETTE : carUrl;
  const safeTeamDrivers = Array.isArray(teamDrivers) ? teamDrivers : [];

  return (
    <div
      className="f1-constructor-livery-card f1-halftone-card"
      style={{
        background: theme.gradient,
        borderColor: `${theme.baseColor}55`,
      }}
    >
      <div className="constructor-card-header">
        <div className="constructor-card-title-col">
          <h3 className="constructor-card-name">
            <WikiLink text={teamName} url={teamItem.constructor_wiki_url} />
          </h3>

          {safeTeamDrivers.length > 0 && (
            <div className="constructor-drivers-inline">
              {safeTeamDrivers.map((d, idx) => (
                <DriverBadge
                  key={d.driver_code || d.driver_name || idx}
                  name={d.driver_name}
                  code={d.driver_code}
                  team={teamName}
                  season={season}
                  wikiUrl={d.driver_wiki_url}
                  size={22}
                />
              ))}
            </div>
          )}
        </div>

        <div className="constructor-card-badge-col">
          {logoUrl && !logoFailed ? (
            <span className="constructor-logo-disc-lg">
              <img
                src={logoUrl}
                alt={teamName}
                loading="lazy"
                onError={() => setLogoFailed(true)}
              />
            </span>
          ) : (
            <span className="f1-minimal-pill">
              {teamItem.total_points ?? 0} PTS
            </span>
          )}
        </div>
      </div>

      <div className="constructor-car-stage">
        <img
          src={resolvedCarUrl}
          alt={`${season} ${teamName} Car`}
          className="constructor-livery-img"
          loading="lazy"
          onError={() => {
            if (!carFailed) setCarFailed(true);
          }}
        />
      </div>
    </div>
  );
}

export default function ConstructorsPage() {
  const { season } = useSeason();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'archive'
  const itemsPerPage = 15;

  // All-Time Historical Constructors Archive
  const { data: constructors = [], isLoading } = useQuery({
    queryKey: ["constructors"],
    queryFn: async () => {
      const res = await F1Api.getConstructors();
      return toArray(res);
    },
  });

  // Current Season Constructors & Drivers for Reference 4 Showcase
  const { data: seasonTeams = [], isLoading: loadingSeasonTeams } = useQuery({
    queryKey: ["constructorStandings", season],
    queryFn: async () => {
      const res = await F1Api.getConstructorStandingsByYear(season);
      return toArray(res);
    },
  });

  const { data: seasonDrivers = [] } = useQuery({
    queryKey: ["driverStandings", season],
    queryFn: async () => {
      const res = await F1Api.getDriverStandingsByYear(season);
      return toArray(res);
    },
  });

  const safeConstructors = Array.isArray(constructors) ? constructors : [];
  const safeSeasonTeams = Array.isArray(seasonTeams) ? seasonTeams : [];
  const safeSeasonDrivers = Array.isArray(seasonDrivers) ? seasonDrivers : [];

  // Group drivers by team name using null-prototype map to prevent prototype collisions
  const driversByTeam = useMemo(() => {
    const map = Object.create(null);
    safeSeasonDrivers.forEach((d) => {
      if (!d) return;
      const tName = String(d.team_name || "").toLowerCase().trim();
      if (!tName) return;
      if (!map[tName]) map[tName] = [];
      map[tName].push(d);
    });
    return map;
  }, [safeSeasonDrivers]);

  const filteredSeasonTeams = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return safeSeasonTeams;
    return safeSeasonTeams.filter(
      (c) =>
        (c?.constructor_name &&
          c.constructor_name.toLowerCase().includes(q)) ||
        (c?.nationality && c.nationality.toLowerCase().includes(q))
    );
  }, [safeSeasonTeams, search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return safeConstructors;
    return safeConstructors.filter(
      (c) =>
        (c?.constructor_name &&
          c.constructor_name.toLowerCase().includes(q)) ||
        (c?.constructor_nationality &&
          c.constructor_nationality.toLowerCase().includes(q)) ||
        (c?.constructorRef && c.constructorRef.toLowerCase().includes(q))
    );
  }, [safeConstructors, search]);

  const { sortedData, sortKey, sortDir, requestSort } = useTableSort(
    filtered,
    "constructor_name"
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, safePage]);

  const showArchiveTable =
    viewMode === "archive" ||
    search.trim().length > 0 ||
    (!loadingSeasonTeams && safeSeasonTeams.length === 0);

  return (
    <section id="view-constructors-db" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">
            FORMULA 1 TEAMS & CHASSIS ARCHIVE
          </span>
          <h2 className="page-main-title">Constructors & Teams Directory</h2>
        </div>

        <div className="header-action-group">
          <input
            type="text"
            id="constructor-search-input"
            className="f1-minimal-search"
            placeholder="Search constructor team or nationality..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <div className="f1-segmented-tabs">
            <button
              type="button"
              className={`seg-tab-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              {season} Teams
            </button>
            <button
              type="button"
              className={`seg-tab-btn ${viewMode === "archive" ? "active" : ""}`}
              onClick={() => setViewMode("archive")}
            >
              All-Time Archive
            </button>
          </div>
        </div>
      </div>

      {/* 1. 2-COLUMN CONSTRUCTOR CAR LIVERY SHOWCASE (Reference 4 Aesthetic) */}
      {viewMode === "grid" && (
        <div className="mb-4">
          {loadingSeasonTeams ? (
            <div className="f1-loading-state">
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p>Loading {season} constructors...</p>
            </div>
          ) : filteredSeasonTeams.length > 0 ? (
            <div className="f1-constructors-editorial-grid">
              {filteredSeasonTeams.map((team, idx) => {
                const tKey = String(team?.constructor_name || "")
                  .toLowerCase()
                  .trim();
                const matchedDrivers = Array.isArray(driversByTeam[tKey])
                  ? driversByTeam[tKey]
                  : [];
                return (
                  <ConstructorLiveryCard
                    key={`${season}-${team?.constructor_name || idx}`}
                    teamItem={team}
                    teamDrivers={matchedDrivers.slice(0, 3)}
                    season={season}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {/* 2. ALL-TIME CONSTRUCTORS ARCHIVE TABLE */}
      {showArchiveTable && (
        <div className="f1-minimal-panel">
          <div className="panel-header-bar">
            <div>
              <h3 className="panel-title">All-Time Constructors Archive</h3>
              <p className="panel-subtitle">
                Complete historical constructor registry ({filtered.length}{" "}
                teams)
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table
              className="f1-minimal-table"
              id="constructors-directory-table"
            >
              <thead>
                <tr>
                  <th
                    className={
                      sortKey === "constructor_name"
                        ? `sort-${sortDir}`
                        : "sortable"
                    }
                    onClick={() => requestSort("constructor_name")}
                  >
                    CONSTRUCTOR TEAM <span className="sort-icon"></span>
                  </th>
                  <th
                    className={
                      sortKey === "constructor_nationality"
                        ? `sort-${sortDir}`
                        : "sortable"
                    }
                    onClick={() => requestSort("constructor_nationality")}
                  >
                    NATIONALITY <span className="sort-icon"></span>
                  </th>
                  <th
                    className={
                      sortKey === "constructorRef"
                        ? `sort-${sortDir}`
                        : "sortable"
                    }
                    onClick={() => requestSort("constructorRef")}
                  >
                    REFERENCE <span className="sort-icon"></span>
                  </th>
                  <th className="text-right">HISTORY</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="table-state-cell">
                      Loading constructors...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((c, idx) => (
                    <tr key={c.constructorId || c.constructor_name || idx}>
                      <td>
                        <TeamBadge
                          name={c.constructor_name}
                          wikiUrl={c.constructor_wiki_url}
                        />
                      </td>
                      <td>
                        <CountryFlag
                          name={c.constructor_nationality}
                          size={18}
                        />
                        <span>{c.constructor_nationality || "-"}</span>
                      </td>
                      <td className="cell-muted cell-tabular">
                        {c.constructorRef || "-"}
                      </td>
                      <td className="text-right">
                        {c.constructor_wiki_url ? (
                          <a
                            href={c.constructor_wiki_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="f1-row-action-btn"
                          >
                            <span>Wikipedia</span>
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="table-state-cell">
                      No constructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}
    </section>
  );
}
