import React, { useState, useMemo, useRef, useEffect } from 'react';
import F1Select from '../../components/common/F1Select';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSeason } from '../../context/SeasonContext';
import { F1Api } from '../../api/client';
import { getDriverColor } from '../../utils/teamColors';
import DriverBadge from '../../components/common/DriverBadge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LapChart() {
  const { season } = useSeason();
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch season calendar for round dropdown
  const { data: races = [] } = useQuery({
    queryKey: ['raceCalendar', season],
    queryFn: async () => {
      const res = await F1Api.getRaceCalendar(season);
      return res?.data || res || [];
    },
  });

  // Fetch lap progression telemetry
  const { data: rawLaps = [], isLoading } = useQuery({
    queryKey: ['lapChart', season, selectedRound],
    queryFn: async () => {
      const res = await F1Api.getLapChart(season, selectedRound);
      return res?.data || res || [];
    },
    enabled: !!selectedRound,
  });

  // Transform data for Chart.js
  const chartData = useMemo(() => {
    if (!rawLaps || !Array.isArray(rawLaps) || rawLaps.length === 0) return null;

    const driverMap = {};
    let maxLap = 0;
    let maxPosition = 20;

    rawLaps.forEach((row) => {
      const driver = row.driver_name || row.driver || 'Unknown';
      if (!driverMap[driver]) {
        driverMap[driver] = {
          code: row.driver_code || driver.substring(0, 3).toUpperCase(),
          fullName: driver,
          team: row.team_name || row.constructor_name || '',
          positions: {},
        };
      }
      const lap = Number(row.lap);
      const pos = Number(row.track_position ?? row.position);
      if (!isNaN(lap) && !isNaN(pos) && pos > 0) {
        driverMap[driver].positions[lap] = pos;
        if (lap > maxLap) maxLap = lap;
        if (pos > maxPosition) maxPosition = pos;
      }
    });

    const labels = Array.from({ length: maxLap }, (_, i) => `L${i + 1}`);
    const drivers = Object.keys(driverMap);

    const usedColors = {};
    const datasets = drivers.map((driverName) => {
      const d = driverMap[driverName];
      const dataPoints = labels.map((_, i) => d.positions[i + 1] ?? null);
      const isVisible = selectedDrivers[driverName] !== false;

      const baseColor = getDriverColor(d.code, d.team, season);
      let borderDash = [];
      if (usedColors[baseColor]) {
        borderDash = [5, 4];
      } else {
        usedColors[baseColor] = true;
      }

      return {
        label: d.code,
        data: dataPoints,
        borderColor: baseColor,
        backgroundColor: baseColor,
        borderWidth: 2.2,
        borderDash: borderDash,
        pointRadius: 2,
        pointHoverRadius: 6,
        tension: 0.15,
        spanGaps: true,
        hidden: !isVisible,
      };
    });

    return { labels, datasets, driverNames: drivers, driverMap, maxLap, maxPosition };
  }, [rawLaps, selectedDrivers, season]);

  const toggleDriver = (name) => {
    setSelectedDrivers((prev) => ({
      ...prev,
      [name]: prev[name] === false ? true : false,
    }));
  };

  const setAllDrivers = (status) => {
    if (!chartData) return;
    const next = {};
    chartData.driverNames.forEach((d) => {
      next[d] = status;
    });
    setSelectedDrivers(next);
  };

  const selectedCount = chartData
    ? chartData.driverNames.filter((d) => selectedDrivers[d] !== false).length
    : 0;
  const totalDrivers = chartData ? chartData.driverNames.length : 0;
  const filterLabel =
    totalDrivers > 0 && selectedCount === totalDrivers
      ? 'All'
      : `${selectedCount}/${totalDrivers}`;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8b93a7', font: { family: 'Inter', size: 11 } },
      },
      y: {
        reverse: true, // P1 on top
        min: 1,
        max: chartData ? chartData.maxPosition + 1 : 22,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#8b93a7',
          stepSize: 1,
          callback: (val) => `P${val}`,
        },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#e0e0ea', font: { family: 'Barlow Condensed', size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: P${context.parsed.y}`,
        },
      },
    },
  };

  return (
    <section id="view-lap-chart-view" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Lap-by-Lap Race Progression Chart</h2>
          <p className="text-muted">
            Interactive track position graph visualizing overtakes, pit stops, and race leader changes across all laps.
          </p>
        </div>
        <div className="header-action-group">
          {/* Round Selector */}
          <F1Select
            id="lapchart-race-select"
            value={selectedRound}
            onChange={(val) => setSelectedRound(Number(val))}
            options={races.map((r) => ({
              value: r.round,
              label: `Round ${r.round}: ${r.grand_prix_name}`,
            }))}
          />

          {/* Driver Checkbox Filter Dropdown */}
          <div
            ref={filterRef}
            className={`driver-filter-dropdown-container ${isFilterOpen ? 'active' : ''}`}
          >
            <button
              id="driver-filter-toggle-btn"
              className="f1-select driver-filter-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen((prev) => !prev);
              }}
            >
              <span className="driver-filter-btn-left">
                <i className="fa-solid fa-users"></i>
                <span>Drivers ({filterLabel})</span>
              </span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
            </button>
            <div
              className={`driver-filter-menu ${isFilterOpen ? 'active' : ''}`}
              id="driver-filter-menu"
              style={{ display: isFilterOpen ? 'block' : 'none' }}
            >
              <div className="filter-menu-header">
                <span>Filter Drivers</span>
                <div className="filter-actions">
                  <button type="button" className="btn-text-action" onClick={() => setAllDrivers(true)}>
                    All
                  </button>
                  <button type="button" className="btn-text-action" onClick={() => setAllDrivers(false)}>
                    Clear
                  </button>
                </div>
              </div>
              <div className="filter-checkbox-list" id="driver-checkbox-list">
                {chartData &&
                  chartData.driverNames.map((name) => (
                    <label key={name} className="filter-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedDrivers[name] !== false}
                        onChange={() => toggleDriver(name)}
                      />
                      <DriverBadge
                        name={name}
                        code={chartData.driverMap[name]?.code}
                        team={chartData.driverMap[name]?.team}
                        season={season}
                      />
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="f1-card">
        <div className="card-header flex-between">
          <h3 id="lapchart-title">
            <i className="fa-solid fa-chart-line"></i> Lap-by-Lap Progression (
            {chartData ? `${season} Round ${selectedRound} • ${chartData.maxLap} Laps • ${chartData.driverNames.length} Drivers` : `P1 - P20`}
            )
          </h3>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p className="mt-2">Loading Lap Chart...</p>
            </div>
          ) : chartData && chartData.datasets.length > 0 ? (
            <div className="chart-wrapper">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="p-5 text-center text-muted">
              No lap progression data available for this round.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
