/**
 * Formula 1 REST API Client
 * URL backend diambil langsung dari js/config.js
 */
const API_BASE = CONFIG.API_BASE;



const F1Api = {
    // Basic & Lookups
    async getSeasons() {
        const res = await fetch(`${API_BASE}/seasons`);
        return res.json();
    },

    async getCircuits() {
        const res = await fetch(`${API_BASE}/circuits`);
        return res.json();
    },

    async getCircuitHistory(circuitId) {
        const res = await fetch(`${API_BASE}/circuits/${circuitId}/history`);
        return res.json();
    },

    async getDrivers() {
        const res = await fetch(`${API_BASE}/drivers`);
        return res.json();
    },

    async getDriverProfile(driverId) {
        const res = await fetch(`${API_BASE}/drivers/${driverId}/profile`);
        return res.json();
    },

    async getConstructors() {
        const res = await fetch(`${API_BASE}/constructors`);
        return res.json();
    },

    // Calendars & Schedules
    async getRaceCalendar(year = 2023) {
        const res = await fetch(`${API_BASE}/races/calendar?year=${year}`);
        return res.json();
    },

    async getPracticeSchedule(year, roundNo) {
        const res = await fetch(`${API_BASE}/races/${year}/${roundNo}/practice-schedule`);
        return res.json();
    },

    async getSprintSchedule(year = 2023) {
        const res = await fetch(`${API_BASE}/races/${year}/sprint-schedule`);
        return res.json();
    },

    // Season Participation
    async getSeasonDrivers(year = 2023) {
        const res = await fetch(`${API_BASE}/seasons/${year}/drivers`);
        return res.json();
    },

    async getSeasonConstructors(year = 2023) {
        const res = await fetch(`${API_BASE}/seasons/${year}/constructors`);
        return res.json();
    },

    async getSeasonCircuits(year = 2023) {
        const res = await fetch(`${API_BASE}/seasons/${year}/circuits`);
        return res.json();
    },

    async getSeasonWinners(year = 2023) {
        const res = await fetch(`${API_BASE}/seasons/${year}/winners`);
        return res.json();
    },

    async getSeasonPoleSitters(year = 2023) {
        const res = await fetch(`${API_BASE}/seasons/${year}/pole-sitters`);
        return res.json();
    },

    // Standings
    async getLatestDriverStandings() {
        const res = await fetch(`${API_BASE}/standings/drivers/latest`);
        return res.json();
    },

    async getDriverStandingsByYear(year = 2023) {
        const res = await fetch(`${API_BASE}/standings/drivers?year=${year}`);
        return res.json();
    },

    async getLatestConstructorStandings() {
        const res = await fetch(`${API_BASE}/standings/constructors/latest`);
        return res.json();
    },

    async getConstructorStandingsByYear(year = 2023) {
        const res = await fetch(`${API_BASE}/standings/constructors?year=${year}`);
        return res.json();
    },

    // Weekend Hub
    async getRaceResults(year, roundNo) {
        const res = await fetch(`${API_BASE}/races/${year}/${roundNo}/results`);
        return res.json();
    },

    async getStartingGrid(year, raceId) {
        const res = await fetch(`${API_BASE}/races/${year}/${raceId}/starting-grid`);
        return res.json();
    },

    async getQualifying(year, roundNo) {
        const res = await fetch(`${API_BASE}/races/${year}/${roundNo}/qualifying`);
        return res.json();
    },

    async getSprintResults(year, roundNo) {
        const res = await fetch(`${API_BASE}/races/${year}/${roundNo}/sprint`);
        return res.json();
    },

    async getPitStops(year, roundNo) {
        const res = await fetch(`${API_BASE}/races/${year}/${roundNo}/pit-stops`);
        return res.json();
    },

    // 4.10 Lap-by-Lap Chart
    async getLapChart(year, roundNo) {
        const res = await fetch(`${API_BASE}/races/${year}/${roundNo}/lap-chart`);
        return res.json();
    },

    // Section 4: Advanced Strategy & Performance Analytics
    async getBiggestMovers(year = 2023) {
        const res = await fetch(`${API_BASE}/analytics/biggest-movers?year=${year}`);
        return res.json();
    },

    async getPitStopEfficiency(year = 2023) {
        const res = await fetch(`${API_BASE}/analytics/pit-stop-efficiency?year=${year}`);
        return res.json();
    },

    async getPoleToWinRate(startYear = 2015) {
        const res = await fetch(`${API_BASE}/analytics/pole-to-win-rate?start_year=${startYear}`);
        return res.json();
    },

    async getHighDnfCircuits() {
        const res = await fetch(`${API_BASE}/analytics/high-dnf-circuits`);
        return res.json();
    },

    async getDeepGridWins() {
        const res = await fetch(`${API_BASE}/analytics/deep-grid-wins`);
        return res.json();
    },

    async getMostLapsLed() {
        const res = await fetch(`${API_BASE}/analytics/most-laps-led`);
        return res.json();
    },

    async getFastestSpeeds() {
        const res = await fetch(`${API_BASE}/analytics/fastest-speeds`);
        return res.json();
    },

    async getAllTimeWinners() {
        const res = await fetch(`${API_BASE}/analytics/all-time-winners`);
        return res.json();
    },

    async getTeammateQualifying(year = 2023) {
        const res = await fetch(`${API_BASE}/analytics/teammate-qualifying?year=${year}`);
        return res.json();
    },

    async getDriverForm(year = 2023) {
        const res = await fetch(`${API_BASE}/analytics/driver-form?year=${year}`);
        return res.json();
    },

    async getPointsProgression(year = 2023) {
        const res = await fetch(`${API_BASE}/analytics/points-progression?year=${year}`);
        return res.json();
    },

    async getConstructorOneTwos() {
        const res = await fetch(`${API_BASE}/analytics/constructor-one-twos`);
        return res.json();
    },

    async getYoungestWinners() {
        const res = await fetch(`${API_BASE}/analytics/youngest-winners`);
        return res.json();
    },

    async getCircuitMasters() {
        const res = await fetch(`${API_BASE}/analytics/circuit-masters`);
        return res.json();
    }
};
