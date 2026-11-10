import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '../../context/SeasonContext';
import { F1Api } from '../../api/client';
import DriverFormChart from '../../components/charts/DriverFormChart';
import PointsProgressionChart from '../../components/charts/PointsProgressionChart';
import WikiLink from '../../components/common/WikiLink';
import { CountryFlag } from '../../utils/flags';
import DriverBadge from '../../components/common/DriverBadge';
import { useTableSort } from '../../utils/useTableSort';
import F1Select from '../../components/common/F1Select';

export default function AnalyticsPage() {
  const { season } = useSeason();
  const [category, setCategory] = useState('seasonal'); // 'seasonal' | 'historical'
  const [seasonalMetric, setSeasonalMetric] = useState('biggest-movers');
  const [historicalMetric, setHistoricalMetric] = useState('pole-to-win');

  // Query Seasonal Metrics
  const { data: seasonalData, isLoading: loadingSeasonal } = useQuery({
    queryKey: ['seasonalAnalytics', season, seasonalMetric],
    queryFn: async () => {
      let res;
      if (seasonalMetric === 'biggest-movers') res = await F1Api.getBiggestMovers(season);
      else if (seasonalMetric === 'pit-stops-eff') res = await F1Api.getPitStopEfficiency(season);
      else if (seasonalMetric === 'teammate-quali') res = await F1Api.getTeammateQualifying(season);
      else if (seasonalMetric === 'driver-form') res = await F1Api.getDriverForm(season);
      else if (seasonalMetric === 'points-progression') res = await F1Api.getPointsProgression(season);
      return res?.data || res || [];
    },
    enabled: category === 'seasonal',
  });

  // Query Historical Metrics
  const { data: historicalData, isLoading: loadingHistorical } = useQuery({
    queryKey: ['historicalAnalytics', historicalMetric],
    queryFn: async () => {
      let res;
      if (historicalMetric === 'pole-to-win') res = await F1Api.getPoleToWinRate();
      else if (historicalMetric === 'dnf-circuits') res = await F1Api.getHighDnfCircuits();
      else if (historicalMetric === 'deep-grid-wins') res = await F1Api.getDeepGridWins();
      else if (historicalMetric === 'most-laps-led') res = await F1Api.getMostLapsLed();
      else if (historicalMetric === 'fastest-speeds') res = await F1Api.getFastestSpeeds();
      else if (historicalMetric === 'constructor-one-twos') res = await F1Api.getConstructorOneTwos();
      else if (historicalMetric === 'youngest-winners') res = await F1Api.getYoungestWinners();
      else if (historicalMetric === 'circuit-masters') res = await F1Api.getCircuitMasters();
      else res = await F1Api.getAllTimeWinners();
      return res?.data || res || [];
    },
    enabled: category === 'historical',
  });

  const isLoading = category === 'seasonal' ? loadingSeasonal : loadingHistorical;
  const currentData = (category === 'seasonal' ? seasonalData : historicalData) || [];

  const initialKey = Array.isArray(currentData) && currentData.length > 0 ? Object.keys(currentData[0])[0] : null;
  const { sortedData, sortKey, sortDir, requestSort } = useTableSort(
    Array.isArray(currentData) ? currentData : [],
    initialKey
  );

  const renderTeammateBattles = () => {
    if (!seasonalData || seasonalData.length === 0) {
      return <div className="text-center py-5 text-muted">No teammate qualifying battle data.</div>;
    }
    return (
      <div className="table-responsive">
        <table className="f1-table">
          <thead>
            <tr>
              <th>Constructor Team</th>
              <th>Driver 1</th>
              <th>Driver 2</th>
              <th>Qualifying H2H Score</th>
              <th>Avg Gap (sec)</th>
            </tr>
          </thead>
          <tbody>
            {seasonalData.map((t, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{t.team_name}</strong>
                </td>
                <td>
                  <DriverBadge name={t.driver_1} team={t.team_name} season={season} />
                </td>
                <td>
                  <DriverBadge name={t.driver_2} team={t.team_name} season={season} />
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                  <span className="badge badge-f1">{t.h2h_score || `${t.driver_1_wins || 0} - ${t.driver_2_wins || 0}`}</span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{t.avg_gap ? `${t.avg_gap}s` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section id="view-analytics-master" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Advanced Intelligence & Telemetry Analytics</h2>
          <p className="text-muted">
            Deep motorsport analytics, historical records, strategic performance, and head-to-head metrics.
          </p>
        </div>
      </div>

      {/* Category Toggle Tabs */}
      <div className="analytics-category-tabs">
        <button
          id="btn-cat-seasonal"
          className={`analytics-cat-btn ${category === 'seasonal' ? 'active' : ''}`}
          onClick={() => setCategory('seasonal')}
        >
          <i className="fa-solid fa-gauge-high"></i> Current Season Telemetry ({season})
        </button>
        <button
          id="btn-cat-historical"
          className={`analytics-cat-btn ${category === 'historical' ? 'active' : ''}`}
          onClick={() => setCategory('historical')}
        >
          <i className="fa-solid fa-landmark"></i> All-Time & Historical Intelligence
        </button>
      </div>

      {/* Sub-dropdown for Metrics */}
      <div className="analytics-metric-bar">
        {category === 'seasonal' ? (
          <div id="seasonal-metrics-container" className="metrics-selector-box">
            <label htmlFor="seasonal-metric-select">
              <i className="fa-solid fa-chart-line"></i> Select Seasonal Metric:
            </label>
            <F1Select
              id="seasonal-metric-select"
              value={seasonalMetric}
              onChange={(val) => setSeasonalMetric(val)}
              options={[
                { value: 'biggest-movers',     label: 'Greatest Comebacks & Positions Gained' },
                { value: 'pit-stops-eff',      label: 'Pit Stop Efficiency & Duration by Team' },
                { value: 'teammate-quali',     label: 'Teammate Qualifying Battles (Head-to-Head)' },
                { value: 'driver-form',        label: 'Driver Rolling Form (Last 5 Races Moving Avg)' },
                { value: 'points-progression', label: 'Cumulative Season Points Trajectory' },
              ]}
            />
          </div>
        ) : (
          <div id="historical-metrics-container" className="metrics-selector-box">
            <label htmlFor="historical-metric-select">
              <i className="fa-solid fa-trophy"></i> Select Historical Metric:
            </label>
            <F1Select
              id="historical-metric-select"
              value={historicalMetric}
              onChange={(val) => setHistoricalMetric(val)}
              options={[
                { value: 'pole-to-win',          label: 'Pole-to-Win Conversion Rate (% of Pole Sitters Winning)' },
                { value: 'dnf-circuits',          label: 'High DNF & Incident-Prone Tracks' },
                { value: 'deep-grid-wins',        label: 'Miracle Wins from Deepest Grid (P10+)' },
                { value: 'most-laps-led',         label: 'All-Time Laps Led (P1 Race Leaders)' },
                { value: 'fastest-speeds',        label: 'Fastest Race Speed Traps Recorded in History' },
                { value: 'all-time-winners',      label: 'All-Time Grand Prix Winners (Hall of Fame)' },
                { value: 'constructor-one-twos',  label: 'Constructor 1-2 Finishes in History' },
                { value: 'youngest-winners',      label: 'Youngest Race Winners in F1 History' },
                { value: 'circuit-masters',       label: 'King of the Circuit (Mastery per Track)' },
              ]}
            />
          </div>
        )}
      </div>

      <div className="f1-card mt-3">
        <div className="card-header flex-between">
          <h3 id="analytics-card-title">
            <i className="fa-solid fa-chart-pie"></i>{' '}
            {category === 'seasonal'
              ? seasonalMetric.replace(/-/g, ' ').toUpperCase()
              : historicalMetric.replace(/-/g, ' ').toUpperCase()}
          </h3>
          <span id="analytics-card-badge" className="badge badge-f1">
            {category === 'seasonal' ? `${season} Season` : 'All-Time Record'}
          </span>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p className="mt-2">Calculating telemetry data...</p>
            </div>
          ) : category === 'seasonal' && seasonalMetric === 'driver-form' ? (
            <DriverFormChart rawData={currentData} />
          ) : category === 'seasonal' && seasonalMetric === 'points-progression' ? (
            <PointsProgressionChart rawData={currentData} />
          ) : category === 'seasonal' && seasonalMetric === 'teammate-quali' ? (
            renderTeammateBattles()
          ) : Array.isArray(sortedData) && sortedData.length > 0 ? (
            <div className="table-responsive">
              <table className="f1-table">
                <thead>
                  <tr>
                    {Object.keys(sortedData[0]).map((key) => (
                      <th
                        key={key}
                        className={sortKey === key ? `sort-${sortDir}` : 'sortable'}
                        onClick={() => requestSort(key)}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {key.replace(/_/g, ' ')} <span className="sort-icon"></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.slice(0, 50).map((row, idx) => (
                    <tr key={idx}>
                      {Object.entries(row).map(([k, val], colIdx) => {
                        const isYearOrSeason =
                          k.toLowerCase().includes('year') ||
                          k.toLowerCase().includes('season') ||
                          (typeof val === 'number' && Number.isInteger(val) && val >= 1900 && val <= 2100);

                        return (
                          <td key={colIdx}>
                            {k.includes('wiki_url') ? (
                              <WikiLink text="View Article" url={val} />
                            ) : k.toLowerCase().includes('nationality') || k.toLowerCase().includes('country') ? (
                              <span>
                                <CountryFlag name={val} />
                                {String(val ?? '-')}
                              </span>
                            ) : typeof val === 'number' ? (
                              isYearOrSeason ? (
                                <strong>{val}</strong>
                              ) : Number.isInteger(val) ? (
                                val.toLocaleString()
                              ) : (
                                val.toFixed(2)
                              )
                            ) : (
                              String(val ?? '-')
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
            <div className="text-center py-5 text-muted">
              No telemetry analytics recorded for this metric.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
