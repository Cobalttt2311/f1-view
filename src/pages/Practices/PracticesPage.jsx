import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '../../context/SeasonContext';
import { useTimezone } from '../../context/TimezoneContext';
import { F1Api } from '../../api/client';
import WikiLink from '../../components/common/WikiLink';
import F1Select from '../../components/common/F1Select';

export default function PracticesPage() {
  const { season } = useSeason();
  const { timezone, formatSessionTime } = useTimezone();
  const [selectedRound, setSelectedRound] = useState(1);

  const { data: races = [], isLoading: loadingRaces } = useQuery({
    queryKey: ['raceCalendar', season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return res?.data || res || [];
    },
  });

  const { data: practiceData, isLoading: loadingPractice } = useQuery({
    queryKey: ['practiceSchedule', season, selectedRound],
    queryFn: async () => {
      const res = await F1Api.getPracticeSchedule(season, selectedRound);
      return res?.data || res;
    },
    enabled: !!selectedRound,
  });

  return (
    <section id="view-practices" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Free Practice Schedule (FP1, FP2, FP3)</h2>
          <p className="text-muted">
            Dedicated session timetable for Free Practice rounds per Grand Prix weekend for {season} Season.
          </p>
        </div>
        <div className="header-action-group">
          <F1Select
            id="practice-round-select"
            value={selectedRound}
            onChange={(val) => setSelectedRound(Number(val))}
            options={races.map((r) => ({
              value: r.round,
              label: `Round ${r.round}: ${r.grand_prix_name}`,
            }))}
          />
        </div>
      </div>

      <div id="practice-content-card" className="f1-card">
        {loadingPractice || loadingRaces ? (
          <div className="text-center py-5 text-muted">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-2">Loading practice timetable...</p>
          </div>
        ) : practiceData ? (
          <>
            <div className="card-header flex-between">
              <div>
                <h3>
                  <i className="fa-solid fa-stopwatch"></i> Round {practiceData.round || selectedRound}:{' '}
                  <WikiLink text={practiceData.grand_prix_name} url={practiceData.race_wiki_url} />
                </h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>
                  {practiceData.circuit_name} ({practiceData.country})
                </p>
              </div>
              <span className="badge badge-f1">Season {season}</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="f1-table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Date</th>
                      <th>Session Time ({timezone})</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span className="badge badge-round">FP1</span> <strong>Free Practice 1</strong>
                      </td>
                      <td>{practiceData.fp1_date || '-'}</td>
                      <td>
                        <span className="session-time-val font-weight-bold">
                          {formatSessionTime(practiceData.fp1_time_utc, practiceData.fp1_time_wib)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="badge badge-round">FP2</span> <strong>Free Practice 2</strong>
                      </td>
                      <td>{practiceData.fp2_date || '-'}</td>
                      <td>
                        <span className="session-time-val font-weight-bold">
                          {formatSessionTime(practiceData.fp2_time_utc, practiceData.fp2_time_wib)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="badge badge-round">FP3</span> <strong>Free Practice 3</strong>
                      </td>
                      <td>{practiceData.fp3_date || '-'}</td>
                      <td>
                        <span className="session-time-val font-weight-bold">
                          {formatSessionTime(practiceData.fp3_time_utc, practiceData.fp3_time_wib)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-muted">
            No practice schedule found for Round {selectedRound}.
          </div>
        )}
      </div>
    </section>
  );
}
