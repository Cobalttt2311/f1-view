import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSeason } from '../../context/SeasonContext';
import { useTimezone } from '../../context/TimezoneContext';
import { F1Api } from '../../api/client';
import WikiLink from '../../components/common/WikiLink';

export default function SprintsPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const navigate = useNavigate();

  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ['sprintSchedule', season],
    queryFn: async () => {
      const res = await F1Api.getSprintSchedule(season);
      return res?.data || res || [];
    },
  });

  return (
    <section id="view-sprints" className="content-view active">
      <div className="view-header">
        <div>
          <h2>
            Dedicated Sprint Race Weekends (<span className="current-season-display">{season} Season</span>)
          </h2>
          <p className="text-muted">
            Schedule and session breakdown for all Sprint event weekends in the selected championship season.
          </p>
        </div>
      </div>

      <div className="f1-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="f1-table" id="sprint-schedule-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Grand Prix</th>
                  <th>Circuit</th>
                  <th>Sprint Date</th>
                  <th>Sprint Time ({timezone})</th>
                  <th>Main Race Date</th>
                  <th>Main Race Time ({timezone})</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      <i className="fa-solid fa-spinner fa-spin"></i> Loading sprint weekends for {season}...
                    </td>
                  </tr>
                ) : sprints.length > 0 ? (
                  sprints.map((s) => (
                    <tr key={s.round}>
                      <td>
                        <span className="badge badge-f1">R{s.round}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <WikiLink text={s.grand_prix_name} url={s.race_wiki_url} />
                      </td>
                      <td>
                        {s.circuit_name} <span className="text-muted">({s.country})</span>
                      </td>
                      <td>{s.sprint_date || '-'}</td>
                      <td>
                        <span className="session-time-val font-weight-bold" style={{ color: 'var(--f1-cyan)' }}>
                          {formatSessionTime(s.sprint_time_utc, s.sprint_time_wib)}
                        </span>
                      </td>
                      <td>{s.main_race_date || '-'}</td>
                      <td>
                        <span className="session-time-val font-weight-bold">
                          {formatSessionTime(s.main_race_time_utc, s.main_race_time_wib)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate('/weekend-hub')}
                        >
                          <i className="fa-solid fa-flag-checkered"></i> View Weekend
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      No sprint race weekends scheduled for {season}.
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
