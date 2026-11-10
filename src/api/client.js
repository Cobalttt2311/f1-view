const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://f1-api-neon.vercel.app/api/v1";

async function fetchJson(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const F1Api = {
  // Seasons & Lookups
  getSeasons: () => fetchJson("/seasons"),
  getCircuits: () => fetchJson("/circuits"),
  getCircuitHistory: (circuitId) => fetchJson(`/circuits/${circuitId}/history`),
  getDrivers: () => fetchJson("/drivers"),
  getDriverProfile: (driverId) => fetchJson(`/drivers/${driverId}/profile`),
  getConstructors: () => fetchJson("/constructors"),

  // Calendars & Schedules
  getRaceCalendar: (year = 2026) => fetchJson(`/races/calendar?year=${year}`),
  getCalendar: (year = 2026) => fetchJson(`/races/calendar?year=${year}`),
  getPracticeSchedule: (year, roundNo) => fetchJson(`/races/${year}/${roundNo}/practice-schedule`),
  getSprintSchedule: (year = 2026) => fetchJson(`/races/${year}/sprint-schedule`),

  // Standings
  getLatestDriverStandings: () => fetchJson("/standings/drivers/latest"),
  getDriverStandings: (year = 2026) => fetchJson(`/standings/drivers?year=${year}`),
  getDriverStandingsByYear: (year = 2026) => fetchJson(`/standings/drivers?year=${year}`),
  getLatestConstructorStandings: () => fetchJson("/standings/constructors/latest"),
  getConstructorStandings: (year = 2026) => fetchJson(`/standings/constructors?year=${year}`),
  getConstructorStandingsByYear: (year = 2026) => fetchJson(`/standings/constructors?year=${year}`),

  // Weekend Hub Telemetry
  getRaceResults: (year, roundNo) => fetchJson(`/races/${year}/${roundNo}/results`),
  getStartingGrid: (year, raceId) => fetchJson(`/races/${year}/${raceId}/starting-grid`),
  getQualifying: (year, roundNo) => fetchJson(`/races/${year}/${roundNo}/qualifying`),
  getSprintResults: (year, roundNo) => fetchJson(`/races/${year}/${roundNo}/sprint`),
  getPitStops: (year, roundNo) => fetchJson(`/races/${year}/${roundNo}/pit-stops`),

  // Lap-by-Lap Progression
  getLapChart: (year, roundNo) => fetchJson(`/races/${year}/${roundNo}/lap-chart`),

  // Advanced Strategy & Performance Analytics
  getBiggestMovers: (year = 2026) => fetchJson(`/analytics/biggest-movers?year=${year}`),
  getPitStopEfficiency: (year = 2026) => fetchJson(`/analytics/pit-stop-efficiency?year=${year}`),
  getTeammateQualifying: (year = 2026) => fetchJson(`/analytics/teammate-qualifying?year=${year}`),
  getDriverForm: (year = 2026) => fetchJson(`/analytics/driver-form?year=${year}`),
  getPointsProgression: (year = 2026) => fetchJson(`/analytics/points-progression?year=${year}`),

  // All-Time Historical Intelligence
  getPoleToWinRate: (startYear = 2015) => fetchJson(`/analytics/pole-to-win-rate?start_year=${startYear}`),
  getHighDnfCircuits: () => fetchJson("/analytics/high-dnf-circuits"),
  getDeepGridWins: () => fetchJson("/analytics/deep-grid-wins"),
  getMostLapsLed: () => fetchJson("/analytics/most-laps-led"),
  getFastestSpeeds: () => fetchJson("/analytics/fastest-speeds"),
  getAllTimeWinners: () => fetchJson("/analytics/all-time-winners"),
  getConstructorOneTwos: () => fetchJson("/analytics/constructor-one-twos"),
  getYoungestWinners: () => fetchJson("/analytics/youngest-winners"),
  getCircuitMasters: () => fetchJson("/analytics/circuit-masters"),

  // System Sync Metadata
  getLastSync: () => fetchJson("/analytics/last-sync"),
};
