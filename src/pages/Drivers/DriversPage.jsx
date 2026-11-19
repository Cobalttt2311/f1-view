import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "../../context/SeasonContext";
import { F1Api, toArray, toObject } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import DriverBadge from "../../components/common/DriverBadge";
import { CountryFlag } from "../../utils/flags";
import { useTableSort } from "../../utils/useTableSort";
import {
  DEFAULT_DRIVER_SILHOUETTE,
  getDriverHeadshot,
  getTeamCardGradient,
  getVerifiedDriverNumber,
  resolveDriverCode,
} from "../../utils/f1Assets";

function formatDriverNumber(val) {
  if (val === undefined || val === null || val === "" || val === "\\N")
    return null;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return Math.trunc(num);
  return String(val);
}

function EditorialDriverCard({ driver, season, numberLookup, onSelect }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!driver) return null;

  const fullName = driver.driver_name || driver.full_name || "";
  const code = resolveDriverCode(fullName, driver.driver_code);
  const headshot = getDriverHeadshot(fullName, code, season);
  const resolvedHeadshot = imgFailed ? DEFAULT_DRIVER_SILHOUETTE : headshot;
  const team = driver.team_name || driver.constructor_name || "";
  const theme = getTeamCardGradient(team);

  const parts = String(fullName).trim().split(/\s+/);
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : fullName;

  const rawNumber =
    formatDriverNumber(driver.permanent_number) ||
    formatDriverNumber(driver.car_number) ||
    (Object.hasOwn(numberLookup, fullName.toLowerCase())
      ? numberLookup[fullName.toLowerCase()]
      : null) ||
    getVerifiedDriverNumber(fullName) ||
    "";
  const racingNumber = formatDriverNumber(rawNumber);

  return (
    <div
      className="f1-driver-editorial-card f1-halftone-card"
      style={{
        background: theme.gradient,
        borderColor: `${theme.baseColor}55`,
      }}
      onClick={onSelect}
    >
      <div className="driver-card-info">
        <div className="driver-card-name-group">
          {firstName && (
            <span className="driver-card-first-name">{firstName}</span>
          )}
          <h3 className="driver-card-last-name">{lastName}</h3>
          <span className="driver-card-team">{team || "Formula 1"}</span>
        </div>

        {racingNumber && (
          <div className="driver-card-number-outlined">{racingNumber}</div>
        )}

        <div className="driver-card-footer">
          <CountryFlag name={driver.nationality} size={24} />
          {driver.total_points !== undefined && (
            <span className="driver-card-pts-tag">
              {driver.total_points} PTS
            </span>
          )}
        </div>
      </div>

      <div className="driver-card-portrait">
        <img
          src={resolvedHeadshot}
          alt={fullName}
          className="driver-card-cutout-img"
          loading="lazy"
          onError={() => {
            if (!imgFailed) setImgFailed(true);
          }}
        />
      </div>
    </div>
  );
}

function formatOrdinal(n) {
  const num = Number(n);
  if (!num || isNaN(num)) return "-";
  const v = num % 100;
  const suffix =
    v >= 11 && v <= 13
      ? "th"
      : num % 10 === 1
        ? "st"
        : num % 10 === 2
          ? "nd"
          : num % 10 === 3
            ? "rd"
            : "th";
  return `${num}${suffix}`;
}

export default function DriversPage({ mode = "grid" }) {
  const { season } = useSeason();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedDriverFallback, setSelectedDriverFallback] = useState(null);
  const [isSeasonContext, setIsSeasonContext] = useState(false);

  // Fetch Complete Historical Drivers Archive
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await F1Api.getDrivers();
      return toArray(res);
    },
  });

  // Fetch Current Season Drivers for the 2-Column Editorial Grid (Reference 3)
  const { data: seasonDrivers = [], isLoading: loadingSeasonDrivers } =
    useQuery({
      queryKey: ["driverStandings", season],
      queryFn: async () => {
        const res = await F1Api.getDriverStandingsByYear(season);
        return toArray(res);
      },
    });

  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeSeasonDrivers = Array.isArray(seasonDrivers) ? seasonDrivers : [];

  // Build quick lookup for permanent racing numbers & driverId from the historical archive
  const archiveLookup = useMemo(() => {
    const numbers = Object.create(null);
    const ids = Object.create(null);
    safeDrivers.forEach((d) => {
      if (!d) return;
      const nameKey = String(d.full_name || "").toLowerCase().trim();
      const rawCode = String(d.driver_code || "").toUpperCase().trim();
      const codeKey = rawCode && rawCode !== "\\N" ? rawCode : "";
      const cleanNum = formatDriverNumber(d.permanent_number);
      if (cleanNum) {
        if (nameKey) numbers[nameKey] = cleanNum;
        if (codeKey) numbers[codeKey] = cleanNum;
      }
      if (d.driverId) {
        if (nameKey) ids[nameKey] = d.driverId;
        if (codeKey && !ids[codeKey]) ids[codeKey] = d.driverId;
      }
    });
    return { numbers, ids };
  }, [safeDrivers]);

  // Fetch Driver Profile for Modal
  const { data: fetchedProfile, isLoading: loadingProfile } = useQuery({
    queryKey: [
      "driverProfile",
      selectedDriverId,
      isSeasonContext ? season : "all-time",
    ],
    queryFn: async () => {
      if (!selectedDriverId || String(selectedDriverId).startsWith("fallback:"))
        return null;
      const res = await F1Api.getDriverProfile(
        selectedDriverId,
        isSeasonContext ? season : null
      );
      return toObject(res);
    },
    enabled:
      !!selectedDriverId && !String(selectedDriverId).startsWith("fallback:"),
  });

  const activeProfile = useMemo(() => {
    if (fetchedProfile && fetchedProfile.full_name) return fetchedProfile;
    if (selectedDriverFallback) {
      const d = selectedDriverFallback;
      const fName = d.full_name || d.driver_name || "Driver";
      const code = resolveDriverCode(fName, d.driver_code);
      return {
        full_name: fName,
        driver_code: code,
        permanent_number:
          d.permanent_number ||
          archiveLookup.numbers[fName.toLowerCase()] ||
          archiveLookup.numbers[code] ||
          null,
        birth_date: d.date_of_birth || d.birth_date || null,
        nationality: d.nationality || "-",
        driver_wiki_url: d.driver_wiki_url || null,
        total_career_wins: d.total_wins ?? 0,
        total_career_podiums: d.total_podiums ?? d.total_wins ?? 0,
        total_races_entered: d.total_races_entered ?? "-",
        total_career_points: d.total_points ?? 0,
      };
    }
    return null;
  }, [fetchedProfile, selectedDriverFallback, archiveLookup.numbers]);

  // Filter season grid
  const filteredSeasonGrid = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return safeSeasonDrivers;
    return safeSeasonDrivers.filter(
      (d) =>
        (d?.driver_name && d.driver_name.toLowerCase().includes(q)) ||
        (d?.team_name && d.team_name.toLowerCase().includes(q)) ||
        (d?.nationality && d.nationality.toLowerCase().includes(q)) ||
        (d?.driver_code && d.driver_code.toLowerCase().includes(q))
    );
  }, [safeSeasonDrivers, search]);

  // Filter historical archive
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return safeDrivers;
    return safeDrivers.filter(
      (d) =>
        (d?.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d?.nationality && d.nationality.toLowerCase().includes(q)) ||
        (d?.driver_code && d.driver_code.toLowerCase().includes(q))
    );
  }, [safeDrivers, search]);

  const {
    sortedData: sortedDrivers,
    sortKey,
    sortDir,
    requestSort,
  } = useTableSort(filtered, "full_name");

  const totalPages = Math.ceil(sortedDrivers.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedDrivers.slice(start, start + itemsPerPage);
  }, [sortedDrivers, safePage]);

  const handleOpenDriverProfile = (d, fromSeasonGrid = false) => {
    if (!d) return;
    setIsSeasonContext(Boolean(fromSeasonGrid));
    setSelectedDriverFallback(d);
    const directId = d.driverId || d.driver_id || d.id;
    if (directId) {
      setSelectedDriverId(directId);
      return;
    }
    const nameKey = String(d.driver_name || d.full_name || "")
      .toLowerCase()
      .trim();
    const codeKey = resolveDriverCode(
      d.driver_name || d.full_name,
      d.driver_code
    );
    const matchedId = archiveLookup.ids[nameKey] || archiveLookup.ids[codeKey];
    if (matchedId) {
      setSelectedDriverId(matchedId);
    } else {
      setSelectedDriverId(`fallback:${nameKey || codeKey}`);
    }
  };

  const handleCloseModal = () => {
    setSelectedDriverId(null);
    setSelectedDriverFallback(null);
    setIsSeasonContext(false);
  };

  const profileHeadshot = activeProfile
    ? getDriverHeadshot(
      activeProfile.full_name,
      activeProfile.driver_code,
      isSeasonContext ? season : null
    )
    : null;
  const profileNumber =
    formatDriverNumber(activeProfile?.permanent_number) ||
    getVerifiedDriverNumber(activeProfile?.full_name);

  const isArchiveMode = mode === "archive";

  return (
    <section id="view-drivers-db" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">
            {isArchiveMode
              ? "ALL-TIME FORMULA 1 DRIVER ARCHIVE"
              : `${season} OFFICIAL F1 DRIVER LINEUP`}
          </span>
          <h2 className="page-main-title">
            {isArchiveMode ? "Drivers Directory" : `${season} Drivers`}
          </h2>
        </div>

        <div className="header-action-group">
          <input
            type="text"
            id="driver-search-input"
            className="f1-minimal-search"
            placeholder="Search driver, team, or nationality..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* 1. 2-COLUMN EDITORIAL DRIVER CARDS (Season Grid) */}
      {!isArchiveMode && (
        <div className="mb-4">
          {loadingSeasonDrivers ? (
            <div className="f1-loading-state">
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p>Loading {season} driver lineup...</p>
            </div>
          ) : filteredSeasonGrid.length > 0 ? (
            <div className="f1-drivers-editorial-grid">
              {filteredSeasonGrid.map((d, i) => (
                <EditorialDriverCard
                  key={d.driver_code || d.driver_name || i}
                  driver={d}
                  season={season}
                  numberLookup={archiveLookup.numbers}
                  onSelect={() => handleOpenDriverProfile(d, true)}
                />
              ))}
            </div>
          ) : (
            <div className="f1-empty-state">
              No drivers found for {season}.
            </div>
          )}
        </div>
      )}

      {/* 2. ALL-TIME HISTORICAL DRIVERS ARCHIVE TABLE */}
      {isArchiveMode && (
        <div className="f1-minimal-panel">
          <div className="panel-header-bar">
            <div>
              <h3 className="panel-title">All-Time Drivers Archive</h3>
              <p className="panel-subtitle">
                Complete historical database ({filtered.length} drivers)
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="f1-minimal-table" id="drivers-directory-table">
              <thead>
                <tr>
                  <th
                    className={
                      sortKey === "permanent_number"
                        ? `sort-${sortDir}`
                        : "sortable"
                    }
                    onClick={() => requestSort("permanent_number")}
                  >
                    DRIVER NUMBER <span className="sort-icon"></span>
                  </th>
                  <th
                    className={
                      sortKey === "full_name" ? `sort-${sortDir}` : "sortable"
                    }
                    onClick={() => requestSort("full_name")}
                  >
                    DRIVER <span className="sort-icon"></span>
                  </th>
                  <th
                    className={
                      sortKey === "nationality" ? `sort-${sortDir}` : "sortable"
                    }
                    onClick={() => requestSort("nationality")}
                  >
                    NATIONALITY <span className="sort-icon"></span>
                  </th>
                  <th className="text-right">CAREER PROFILE</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="table-state-cell">
                      Loading drivers archive...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((d, idx) => (
                    <tr
                      key={d.driverId || d.id || d.full_name || idx}
                      className="clickable-row"
                      onClick={() => handleOpenDriverProfile(d)}
                    >
                      <td className="cell-tabular">
                        {formatDriverNumber(d.permanent_number) || "-"}
                      </td>
                      <td>
                        <DriverBadge
                          name={d.full_name}
                          code={d.driver_code}
                          team={d.constructor_name || ""}
                          wikiUrl={d.driver_wiki_url}
                        />
                      </td>
                      <td>
                        <CountryFlag name={d.nationality} size={18} />
                        <span>{d.nationality || "-"}</span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="f1-row-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDriverProfile(d);
                          }}
                        >
                          <span>Career Stats</span>
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="table-state-cell">
                      No drivers found.
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

      {/* Driver Career Profile Modal */}
      <Modal
        isOpen={!!selectedDriverId}
        onClose={handleCloseModal}
        title="Driver Career Profile"
      >
        {loadingProfile ? (
          <div className="f1-loading-state">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p>Loading career statistics...</p>
          </div>
        ) : activeProfile ? (
          <div className="driver-profile-modal-content">
            <div className="profile-modal-hero">
              <div className="profile-modal-info">
                <h2 className="profile-modal-name">
                  <WikiLink
                    text={activeProfile.full_name}
                    url={activeProfile.driver_wiki_url}
                  />
                </h2>
                <div className="profile-modal-nation">
                  <CountryFlag name={activeProfile.nationality} size={20} />
                  <span>{activeProfile.nationality}</span>
                </div>
                <div className="profile-modal-plain-meta">
                  <span>
                    Latest Number Driver : {profileNumber || "-"}
                  </span>
                  <span>
                    Date of Birth :{" "}
                    {activeProfile.birth_date ||
                      activeProfile.date_of_birth ||
                      "-"}
                  </span>
                </div>
              </div>

              {profileHeadshot && (
                <div className="profile-modal-avatar">
                  <img
                    src={profileHeadshot}
                    alt={activeProfile.full_name}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_DRIVER_SILHOUETTE;
                    }}
                  />
                </div>
              )}
            </div>

            {/* 1. SEASON SUMMARY (Only shown when opened for a driver in the active season) */}
            {isSeasonContext && activeProfile.season_year && (
              <div className="driver-stat-section">
                <div className="driver-stat-pair-grid">
                  <div className="driver-stat-cell">
                    <span className="driver-stat-label">
                      {activeProfile.season_year} Season Position
                    </span>
                    <strong className="driver-stat-val">
                      {formatOrdinal(activeProfile.season_position)}
                    </strong>
                  </div>
                  <div className="driver-stat-cell">
                    <span className="driver-stat-label">
                      {activeProfile.season_year} Season Points
                    </span>
                    <strong className="driver-stat-val">
                      {activeProfile.season_points ?? 0}
                    </strong>
                  </div>
                  {activeProfile.season_team && (
                    <div className="driver-stat-cell driver-stat-span2">
                      <span className="driver-stat-label">
                        {activeProfile.season_year} Team
                      </span>
                      <strong className="driver-stat-val-sm">
                        {activeProfile.season_team}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. FOCUSED CAREER STATISTICS (2-Column Editorial Hairline Grid) */}
            <div className="driver-stat-section">
              <div className="driver-stat-pair-grid">
                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Grand Prix Races</span>
                  <strong className="driver-stat-val">
                    {activeProfile.total_races_entered ?? 0}
                  </strong>
                </div>
                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Grand Prix Points</span>
                  <strong className="driver-stat-val">
                    {activeProfile.total_career_points ?? 0}
                  </strong>
                </div>

                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Grand Prix Wins</span>
                  <strong className="driver-stat-val">
                    {activeProfile.total_career_wins ?? 0}
                  </strong>
                </div>
                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Podiums</span>
                  <strong className="driver-stat-val">
                    {activeProfile.total_career_podiums ?? 0}
                  </strong>
                </div>

                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Poles</span>
                  <strong className="driver-stat-val">
                    {activeProfile.total_career_poles ?? 0}
                  </strong>
                </div>
                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Fastest Laps</span>
                  <strong className="driver-stat-val">
                    {activeProfile.total_fastest_laps ?? 0}
                  </strong>
                </div>

                <div className="driver-stat-cell">
                  <span className="driver-stat-label">DNFs</span>
                  <strong className="driver-stat-val">
                    {activeProfile.total_dnfs ?? 0}
                  </strong>
                </div>
                <div className="driver-stat-cell">
                  <span className="driver-stat-label">World Champions</span>
                  <strong className="driver-stat-val">
                    {activeProfile.world_championships ?? 0}
                  </strong>
                </div>

                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Highest Grid</span>
                  <strong className="driver-stat-val">
                    {activeProfile.highest_grid
                      ? `P${activeProfile.highest_grid}`
                      : "-"}
                  </strong>
                </div>
                <div className="driver-stat-cell">
                  <span className="driver-stat-label">Seasons Active</span>
                  <strong className="driver-stat-val-sm">
                    {activeProfile.seasons_active || "-"}
                  </strong>
                </div>

                {activeProfile.teams_driven_for && (
                  <div className="driver-stat-cell driver-stat-span2">
                    <span className="driver-stat-label">Teams Driven For</span>
                    <strong className="driver-stat-val-sm">
                      {activeProfile.teams_driven_for}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="f1-empty-state">
            No career profile found for this driver.
          </div>
        )}
      </Modal>
    </section>
  );
}
