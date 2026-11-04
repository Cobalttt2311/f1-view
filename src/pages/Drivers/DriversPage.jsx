import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { F1Api } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import DriverBadge from "../../components/common/DriverBadge";
import { CountryFlag } from "../../utils/flags";
import { useTableSort } from "../../utils/useTableSort";

export default function DriversPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Selected driver for career modal
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // Fetch Drivers
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await F1Api.getDrivers();
      return res?.data || res || [];
    },
  });

  // Fetch Driver Profile for Modal
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["driverProfile", selectedDriverId],
    queryFn: async () => {
      const res = await F1Api.getDriverProfile(selectedDriverId);
      return res?.data || res;
    },
    enabled: !!selectedDriverId,
  });

  // Filter query
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.nationality && d.nationality.toLowerCase().includes(q)) ||
        (d.driver_code && d.driver_code.toLowerCase().includes(q))
    );
  }, [drivers, search]);

  const { sortedData: sortedDrivers, sortKey, sortDir, requestSort } = useTableSort(filtered, 'full_name');

  const totalPages = Math.ceil(sortedDrivers.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedDrivers.slice(start, start + itemsPerPage);
  }, [sortedDrivers, page]);

  return (
    <section id="view-drivers-db" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Drivers Directory & Career Records</h2>
          <p className="text-muted">
            Complete historical driver archive, permanent numbers, career wins,
            podiums, and total career points.
          </p>
        </div>
        <div className="header-action-group">
          <input
            type="text"
            id="driver-search-input"
            className="f1-search"
            placeholder="Search driver by name or nationality..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="f1-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="f1-table" id="drivers-directory-table">
              <thead>
                <tr>
                  <th
                    className={sortKey === 'permanent_number' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('permanent_number')}
                  >
                    # <span className="sort-icon"></span>
                  </th>
                  <th>Code</th>
                  <th
                    className={sortKey === 'full_name' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('full_name')}
                  >
                    Driver Name <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'nationality' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('nationality')}
                  >
                    Nationality <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'date_of_birth' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('date_of_birth')}
                  >
                    Date of Birth <span className="sort-icon"></span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <i className="fa-solid fa-spinner fa-spin"></i> Loading drivers...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((d) => (
                    <tr key={d.driverId || d.id || d.full_name}>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        {d.permanent_number || "-"}
                      </td>
                      <td>
                        <DriverBadge
                          name=""
                          code={d.driver_code}
                          team={d.constructor_name || ""}
                          showFullName={false}
                        />
                      </td>
                      <td>
                        <WikiLink text={d.full_name} url={d.driver_wiki_url} />
                      </td>
                      <td>
                        <CountryFlag name={d.nationality} />
                        <span>{d.nationality || "-"}</span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                        {d.date_of_birth || "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setSelectedDriverId(d.driverId)}
                        >
                          <i className="fa-solid fa-id-card"></i> Career Stats
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Driver Profile Modal */}
      <Modal
        isOpen={!!selectedDriverId}
        onClose={() => setSelectedDriverId(null)}
        title="Driver Career Profile"
      >
        {loadingProfile ? (
          <div className="text-center py-4 text-muted">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-2">Loading career stats...</p>
          </div>
        ) : profile ? (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "24px",
                  margin: 0,
                }}
              >
                <WikiLink
                  text={profile.full_name}
                  url={profile.driver_wiki_url}
                />
              </h2>
              <p className="text-muted" style={{ margin: "6px 0 0" }}>
                <CountryFlag name={profile.nationality} />
                Nationality: <strong>{profile.nationality}</strong> • DOB:{" "}
                {profile.birth_date || profile.date_of_birth || "N/A"} • Car #
                {profile.permanent_number || "-"}
              </p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-trophy"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Career Wins</span>
                  <h3>{profile.total_career_wins ?? 0}</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-medal"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Career Podiums</span>
                  <h3>{profile.total_career_podiums ?? 0}</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-flag-checkered"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Races Entered</span>
                  <h3>{profile.total_races_entered ?? 0}</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-star"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Career Points</span>
                  <h3>{profile.total_career_points ?? 0}</h3>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted">
            No profile found for this driver.
          </div>
        )}
      </Modal>
    </section>
  );
}
