import React, { useMemo } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PALETTE = [
  '#e10600', '#00d2be', '#ffb800', '#ff8000', '#00d66c',
  '#0090ff', '#ffffff', '#e000ff', '#33b3a6', '#c0c0c0',
  '#e54d42', '#39b54a', '#a5673f', '#6739b6', '#f37b1d',
];

export default function PointsProgressionChart({ rawData }) {
  const chartData = useMemo(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return null;

    // 1. Extract sorted unique rounds
    const roundMap = {};
    rawData.forEach((r) => {
      if (!roundMap[r.round]) {
        const shortGp = (r.grand_prix || '').replace(/ Grand Prix$/, '').replace(/ GP$/, '');
        roundMap[r.round] = `R${r.round} ${shortGp}`.trim();
      }
    });

    const sortedRounds = Object.keys(roundMap).map(Number).sort((a, b) => a - b);
    const roundLabels = sortedRounds.map((rnd) => roundMap[rnd]);

    // 2. Group cumulative points by driver
    const driversMap = {};
    rawData.forEach((row) => {
      const dName = row.driver_name || row.driver;
      if (!driversMap[dName]) {
        driversMap[dName] = { pointsPerRound: {}, maxPoints: 0 };
      }
      const val = row.cumulative_points !== null && row.cumulative_points !== undefined
        ? Number(row.cumulative_points)
        : null;
      driversMap[dName].pointsPerRound[row.round] = val;
      if (val !== null && val > driversMap[dName].maxPoints) {
        driversMap[dName].maxPoints = val;
      }
    });

    const driverNames = Object.keys(driversMap).sort((a, b) => driversMap[b].maxPoints - driversMap[a].maxPoints);

    const datasets = driverNames.map((name, idx) => ({
      label: name,
      data: sortedRounds.map((rnd) => driversMap[name].pointsPerRound[rnd] ?? null),
      borderColor: PALETTE[idx % PALETTE.length],
      backgroundColor: PALETTE[idx % PALETTE.length],
      tension: 0.2,
      borderWidth: 2,
      pointRadius: 2,
      spanGaps: true,
      hidden: idx >= 8, // Top 8 active by default
    }));

    return { labels: roundLabels, datasets };
  }, [rawData]);

  if (!chartData) {
    return <div className="text-center py-5 text-muted">No cumulative points progression available.</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8b93a7', font: { family: 'Inter', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8b93a7', callback: (v) => `${v} pts` },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e0e0ea', font: { family: 'Barlow Condensed', size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} pts`,
        },
      },
    },
  };

  return (
    <div style={{ height: '420px', width: '100%', padding: '10px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
