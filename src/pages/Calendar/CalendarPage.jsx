import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSeason } from '../../context/SeasonContext';
import { useTimezone } from '../../context/TimezoneContext';
import { F1Api } from '../../api/client';
import WikiLink from '../../components/common/WikiLink';

export default function CalendarPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const limit = 6;

  const { data: races = [], isLoading } = useQuery({
    queryKey: ['raceCalendar', season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return res?.data || res || [];
    },
  });

  const total = races.length;
  const totalPages = Math.ceil(total / limit) || 1;

  const paginatedRaces = useMemo(() => {
    const start = (page - 1) * limit;
    return races.slice(start, start + limit);
  }, [races, page]);

  return (
    <section id="view-calendar" className="content-view active">
      <div className="view-header">
        <div>
          <h2>
            Complete Race Calendar (<span className="current-season-display">{season} Season</span>)
          </h2>
          <p className="text-muted">
            Full weekend timetable including Main Race, Qualifying, FP1, FP2, FP3, and Sprint Sessions in both WIB and UTC.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5 text-muted">
          <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
          <p className="mt-2">Loading {season} season calendar...</p>
        </div>
      ) : paginatedRaces.length > 0 ? (
        <>
          <div className="calendar-cards-scroll-container">
            <div id="calendar-container" className="calendar-cards-grid">
              {paginatedRaces.map((r) => (
                <div key={r.round} className="race-card">
                  <div className="race-card-header">
                    <div>
                      <span className="race-round-badge">ROUND {r.round}</span>
                      <h4 className="race-card-title">
                        <WikiLink text={r.grand_prix_name} url={r.race_wiki_url} />
                      </h4>
                      <p className="race-circuit-info">
                        <WikiLink text={r.circuit_name} url={r.circuit_wiki_url} /> • {r.location}, {r.country}
                      </p>
                    </div>
                    <div>
                      {r.has_sprint ? (
                        <span className="badge badge-sprint">
                          <i className="fa-solid fa-bolt"></i> Sprint Weekend
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Standard</span>
                      )}
                    </div>
                  </div>

                  {/* Full Session Timeline with WIB/UTC */}
                  <div className="session-schedule-matrix">
                    <div className="session-row">
                      <span className="session-name main-race">
                        <i className="fa-solid fa-flag-checkered text-danger"></i> Main Race
                      </span>
                      <span className="session-time-val">
                        {r.race_date || '-'} • {formatSessionTime(r.race_time_utc, r.race_time_wib)}
                      </span>
                    </div>

                    {(r.quali_date || r.quali_time_utc) && (
                      <div className="session-row">
                        <span className="session-name">
                          <i className="fa-solid fa-stopwatch text-warning"></i> Qualifying
                        </span>
                        <span className="session-time-val">
                          {r.quali_date || '-'} • {formatSessionTime(r.quali_time_utc, r.quali_time_wib)}
                        </span>
                      </div>
                    )}

                    {(r.has_sprint || r.sprint_date || r.sprint_time_utc) && (
                      <div className="session-row">
                        <span className="session-name" style={{ color: 'var(--f1-cyan)' }}>
                          <i className="fa-solid fa-bolt"></i> Sprint Race
                        </span>
                        <span className="session-time-val">
                          {r.sprint_date || '-'} • {formatSessionTime(r.sprint_time_utc, r.sprint_time_wib)}
                        </span>
                      </div>
                    )}

                    {!r.has_sprint && (r.fp3_date || r.fp3_time_utc) && (
                      <div className="session-row">
                        <span className="session-name">
                          <i className="fa-solid fa-gauge"></i> Practice 3 (FP3)
                        </span>
                        <span className="session-time-val">
                          {r.fp3_date || '-'} • {formatSessionTime(r.fp3_time_utc, r.fp3_time_wib)}
                        </span>
                      </div>
                    )}

                    {!r.has_sprint && (r.fp2_date || r.fp2_time_utc) && (
                      <div className="session-row">
                        <span className="session-name">
                          <i className="fa-solid fa-gauge"></i> Practice 2 (FP2)
                        </span>
                        <span className="session-time-val">
                          {r.fp2_date || '-'} • {formatSessionTime(r.fp2_time_utc, r.fp2_time_wib)}
                        </span>
                      </div>
                    )}

                    {(r.fp1_date || r.fp1_time_utc) && (
                      <div className="session-row">
                        <span className="session-name">
                          <i className="fa-solid fa-gauge"></i> Practice 1 (FP1)
                        </span>
                        <span className="session-time-val">
                          {r.fp1_date || '-'} • {formatSessionTime(r.fp1_time_utc, r.fp1_time_wib)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-between mt-3">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate('/lap-chart')}
                    >
                      <i className="fa-solid fa-chart-line"></i> Lap Chart
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate('/weekend-hub')}
                    >
                      Weekend Hub <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Card Pagination Footer */}
          <div className="card-footer pagination-footer mt-3" id="calendar-pagination">
            <span className="text-muted" style={{ fontSize: '11.5px' }}>
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} rounds
            </span>
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="fa-solid fa-chevron-left"></i> Prev
                </button>
                <span className="pagination-badge">
                  Page {page} / {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-5 text-muted">
          No races found for season {season}.
        </div>
      )}
    </section>
  );
}
