
// Custom Season Dropdown Controller
function toggleSeasonDropdown(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const wrapper = document.querySelector('.custom-season-dropdown-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('active');
    }
}

// Sync Details Popover Controller
function toggleSyncTooltip(event) {
    if (event) {
        event.stopPropagation();
    }
    const container = document.getElementById('last-update-container');
    if (container) {
        container.classList.toggle('active');
    }
}


function toggleSidebar() {
    const sidebar = document.querySelector('.f1-sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('f1-sidebar');
    const backdrop = document.getElementById('mobile-backdrop');
    if (sidebar) sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
    document.body.classList.toggle('mobile-nav-open');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('f1-sidebar');
    const backdrop = document.getElementById('mobile-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('mobile-nav-open');
}



const COUNTRY_CODES = {
    "Australia": "AUS", "China": "CHN", "Japan": "JPN", "Bahrain": "BHR", "Saudi Arabia": "KSA",
    "USA": "USA", "United States": "USA", "Miami": "USA", "Las Vegas": "USA", "Austin": "USA",
    "Italy": "ITA", "Monaco": "MCO", "Spain": "ESP", "Canada": "CAN", "Austria": "AUT",
    "UK": "GBR", "Great Britain": "GBR", "Hungary": "HUN", "Belgium": "BEL", "Netherlands": "NLD",
    "Azerbaijan": "AZE", "Singapore": "SGP", "Mexico": "MEX", "Brazil": "BRA", "Qatar": "QAT",
    "UAE": "UAE", "United Arab Emirates": "UAE", "Abu Dhabi": "UAE", "France": "FRA", "Germany": "GER",
    "Portugal": "PRT", "Russia": "RUS", "Turkey": "TUR", "Malaysia": "MYS"
};

function getCountryBadge(country, isTarget = false) {
    const code = COUNTRY_CODES[country] || (country ? country.substring(0, 3).toUpperCase() : 'F1');
    return `<span class="country-pill ${isTarget ? 'active' : ''}">${code}</span>`;
}


let nextRaceTarget = { year: 2026, round: 1, raceId: null };

function goToNextRaceHub() {
    if (nextRaceTarget.round) {
        openRaceInWeekendHub(nextRaceTarget.year, nextRaceTarget.round, nextRaceTarget.raceId);
    }
}

function updateNextRaceWidget(races) {
    if (!races || races.length === 0) {
        document.getElementById('dash-next-gp-name').textContent = 'No races scheduled';
        document.getElementById('dash-next-circuit').textContent = '-';
        document.getElementById('dash-next-sessions').innerHTML = '<div class="text-muted text-center py-2">No race schedule found for this season.</div>';
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    let targetRace = null;
    let isLiveNow = false;

    // 1. Check if today is active race weekend
    for (const r of races) {
        const startDay = r.fp1_date || r.race_date;
        const endDay = r.race_date;
        if (startDay && endDay && todayStr >= startDay && todayStr <= endDay) {
            targetRace = r;
            isLiveNow = true;
            break;
        }
    }

    // 2. If not live, find next upcoming race in season
    if (!targetRace) {
        for (const r of races) {
            if (r.race_date && r.race_date >= todayStr) {
                targetRace = r;
                break;
            }
        }
    }

    // 3. Fallback to latest race (Season Finale) if past completed season
    let isPastSeason = false;
    if (!targetRace) {
        // If all races are in the past, choose the last race (Season Finale)
        targetRace = races[races.length - 1];
        isPastSeason = true;
    }

    nextRaceTarget = {
        year: targetRace.year || currentSeason,
        round: targetRace.round,
        raceId: targetRace.raceId
    };

    const statusTitle = document.getElementById('dash-next-status-title');
    const statusText = document.getElementById('dash-next-status-text');
    const liveBadge = document.getElementById('dash-next-live-badge');
    const countdown = document.getElementById('dash-next-countdown');

    if (isLiveNow) {
        statusTitle.innerHTML = `<i class="fa-solid fa-circle-dot text-danger fa-beat"></i> <span style="color: var(--f1-red);">LIVE RACE WEEKEND (NOW)</span>`;
        liveBadge.className = 'badge badge-danger';
        liveBadge.textContent = `ROUND ${targetRace.round}`;
        countdown.className = 'badge badge-danger';
        countdown.innerHTML = `<i class="fa-solid fa-bolt"></i> RACE WEEKEND IN PROGRESS`;
    } else {
        if (isPastSeason) {
            statusTitle.innerHTML = `<i class="fa-solid fa-flag-checkered text-warning"></i> <span>Season Finale / Latest Grand Prix</span>`;
        } else {
            statusTitle.innerHTML = `<i class="fa-solid fa-flag-checkered text-warning"></i> <span>Upcoming Grand Prix</span>`;
        }
        liveBadge.className = 'badge badge-f1';
        liveBadge.textContent = `ROUND ${targetRace.round}`;

        // Calculate days difference
        if (targetRace.race_date) {
            const diffTime = new Date(targetRace.race_date) - new Date(todayStr);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                countdown.innerHTML = `<i class="fa-regular fa-clock"></i> In ${diffDays} Days (${targetRace.race_date})`;
            } else if (diffDays === 0) {
                countdown.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> RACE DAY TODAY!`;
            } else {
                countdown.innerHTML = `<i class="fa-solid fa-check"></i> Round Completed (${targetRace.race_date})`;
            }
        }
    }

    document.getElementById('dash-next-gp-name').innerHTML = renderWikiLink(targetRace.grand_prix_name, targetRace.race_wiki_url);
    document.getElementById('dash-next-circuit').innerHTML = `${renderWikiLink(targetRace.circuit_name, targetRace.circuit_wiki_url)} · ${targetRace.location}, ${targetRace.country}`;

    // Render session matrix for target race
    const sessionsContainer = document.getElementById('dash-next-sessions');
    sessionsContainer.innerHTML = `
        <div class="session-row">
            <span class="session-name main-race"><i class="fa-solid fa-flag-checkered text-danger"></i> Main Race</span>
            <span class="session-time-val">${targetRace.race_date || '-'} • ${formatSessionTime(targetRace.race_time_utc, targetRace.race_time_wib)}</span>
        </div>
        ${(targetRace.quali_date || targetRace.quali_time_utc) ? `
        <div class="session-row">
            <span class="session-name"><i class="fa-solid fa-stopwatch text-warning"></i> Qualifying</span>
            <span class="session-time-val">${targetRace.quali_date || '-'} • ${formatSessionTime(targetRace.quali_time_utc, targetRace.quali_time_wib)}</span>
        </div>
        ` : ''}
        ${(targetRace.has_sprint || targetRace.sprint_date || targetRace.sprint_time_utc) ? `
        <div class="session-row">
            <span class="session-name" style="color: var(--f1-cyan);"><i class="fa-solid fa-bolt"></i> Sprint Race</span>
            <span class="session-time-val">${targetRace.sprint_date || '-'} • ${formatSessionTime(targetRace.sprint_time_utc, targetRace.sprint_time_wib)}</span>
        </div>
        ` : ''}
        ${(!targetRace.has_sprint && (targetRace.fp3_date || targetRace.fp3_time_utc)) ? `
        <div class="session-row">
            <span class="session-name"><i class="fa-solid fa-gauge"></i> Practice 3 (FP3)</span>
            <span class="session-time-val">${targetRace.fp3_date || '-'} • ${formatSessionTime(targetRace.fp3_time_utc, targetRace.fp3_time_wib)}</span>
        </div>
        ` : ''}
        ${(!targetRace.has_sprint && (targetRace.fp2_date || targetRace.fp2_time_utc)) ? `
        <div class="session-row">
            <span class="session-name"><i class="fa-solid fa-gauge"></i> Practice 2 (FP2)</span>
            <span class="session-time-val">${targetRace.fp2_date || '-'} • ${formatSessionTime(targetRace.fp2_time_utc, targetRace.fp2_time_wib)}</span>
        </div>
        ` : ''}
        ${(targetRace.fp1_date || targetRace.fp1_time_utc) ? `
        <div class="session-row">
            <span class="session-name"><i class="fa-solid fa-gauge"></i> Practice 1 (FP1)</span>
            <span class="session-time-val">${targetRace.fp1_date || '-'} • ${formatSessionTime(targetRace.fp1_time_utc, targetRace.fp1_time_wib)}</span>
        </div>
        ` : ''}
    `;
}

/**
 * Tifosi - Formula 1 Live Hub & Analytics
 * Complete Client Application Logic
 */

// Global State
let currentSeason = 2023;
let currentTz = 'WIB'; // 'WIB' or 'UTC'
let currentStandingsTab = 'drivers'; // 'drivers' or 'constructors'
let currentWeekendTab = 'race-results'; // 'race-results', 'official-grid', 'qualifying', 'sprint-results', 'pit-stops'
let currentAnalyticsCategory = 'seasonal'; // 'seasonal' or 'historical'

// Data Caches & Pagination States
let allSeasonsCache = [];
let allDriversCache = [];
let allConstructorsCache = [];
let allCircuitsCache = [];
let currentCalendarRaces = [];
let lapChartInstance = null;

// Pagination state objects
const paginationState = {
    drivers: { page: 1, limit: 15, total: 0, sortCol: 'full_name', sortDir: 'asc', data: [] },
    constructors: { page: 1, limit: 15, total: 0, sortCol: 'constructor_name', sortDir: 'asc', data: [] },
    circuits: { page: 1, limit: 15, total: 0, sortCol: 'circuit_name', sortDir: 'asc', data: [] },
    analytics: { page: 1, limit: 20, total: 0, sortCol: null, sortDir: 'asc', data: [] }
};

// Table sorting state for any table
const tableSortState = {};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initGlobalTableSorting();
    await loadSeasonsList();
    initApiCheck();
    loadLastSyncStatus();
    loadActiveView();
});

// View and URL Route Mappings
const VIEW_ROUTES = {
    'dashboard': 'dashboard',
    'calendar': 'calendar',
    'practices': 'practices',
    'sprints': 'sprints',
    'standings': 'standings',
    'weekend-hub': 'weekend-hub',
    'lap-chart-view': 'lap-chart',
    'drivers-db': 'drivers',
    'constructors-db': 'constructors',
    'circuits-db': 'circuits',
    'analytics-master': 'analytics'
};

const ROUTE_TO_VIEW = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'calendar': 'calendar',
    'practices': 'practices',
    'sprints': 'sprints',
    'standings': 'standings',
    'weekend-hub': 'weekend-hub',
    'lap-chart': 'lap-chart-view',
    'lap-chart-view': 'lap-chart-view',
    'drivers': 'drivers-db',
    'drivers-db': 'drivers-db',
    'constructors': 'constructors-db',
    'constructors-db': 'constructors-db',
    'circuits': 'circuits-db',
    'circuits-db': 'circuits-db',
    'analytics': 'analytics-master',
    'analytics-master': 'analytics-master'
};

// Navigation Controller with URL Hash Routing
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            switchView(targetView, true);
        });
    });

    window.addEventListener('hashchange', handleHashRouting);
    window.addEventListener('popstate', handleHashRouting);

    if (window.location.hash) {
        handleHashRouting();
    }
}

function handleHashRouting() {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim().split('?')[0].split('/')[0];
    const targetView = ROUTE_TO_VIEW[rawHash] || 'dashboard';
    switchView(targetView, false);
}

function switchView(viewName, updateUrl = true) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) targetSection.classList.add('active');

    closeMobileSidebar();

    if (updateUrl) {
        const route = VIEW_ROUTES[viewName] || viewName;
        if (window.location.hash !== `#/${route}`) {
            history.pushState(null, '', `#/${route}`);
        }
    }

    loadActiveView();
}

function getActiveViewName() {
    const activeSection = document.querySelector('.content-view.active');
    if (!activeSection) return 'dashboard';
    return activeSection.id.replace('view-', '');
}

function loadActiveView() {
    const viewName = getActiveViewName();
    updateSeasonDisplayLabels();

    switch (viewName) {
        case 'dashboard':
            loadDashboardData(currentSeason);
            break;
        case 'calendar':
            loadCalendarData(currentSeason);
            break;
        case 'practices':
            loadPracticeGrandPrixList(currentSeason);
            break;
        case 'sprints':
            loadSprintSchedule(currentSeason);
            break;
        case 'standings':
            loadStandingsData();
            break;
        case 'weekend-hub':
            loadWeekendRacesDropdown(currentSeason);
            break;
        case 'lap-chart-view':
            loadLapChartRacesDropdown(currentSeason);
            break;
        case 'drivers-db':
            loadDriversDirectory();
            break;
        case 'constructors-db':
            loadConstructorsDirectory();
            break;
        case 'circuits-db':
            loadCircuitsDirectory();
            break;
        case 'analytics-master':
            const metric = currentAnalyticsCategory === 'seasonal'
                ? document.getElementById('seasonal-metric-select').value
                : document.getElementById('historical-metric-select').value;
            loadAnalyticsFeature(metric);
            break;
    }
}

function updateSeasonDisplayLabels() {
    const display = document.getElementById('selected-season-display');
    if (display) display.textContent = `${currentSeason} Season`;

    const hiddenSelect = document.getElementById('global-season-select');
    if (hiddenSelect) hiddenSelect.value = currentSeason;

    document.querySelectorAll('.season-option-item').forEach(el => {
        el.classList.toggle('selected', parseInt(el.getAttribute('data-year')) === currentSeason);
    });

    document.querySelectorAll('.current-season-display').forEach(el => {
        el.textContent = `${currentSeason}`;
    });
}

function selectSeasonOption(year) {
    currentSeason = parseInt(year);
    const display = document.getElementById('selected-season-display');
    if (display) display.textContent = `${year} Season`;
    
    const hiddenSelect = document.getElementById('global-season-select');
    if (hiddenSelect) hiddenSelect.value = year;

    // Update selected class
    document.querySelectorAll('.season-option-item').forEach(el => {
        el.classList.toggle('selected', parseInt(el.getAttribute('data-year')) === currentSeason);
    });

    const wrapper = document.querySelector('.custom-season-dropdown-wrapper');
    if (wrapper) wrapper.classList.remove('active');

    loadActiveView();
}

// Global Seasons Loader
async function loadSeasonsList() {
    try {
        const res = await F1Api.getSeasons();
        allSeasonsCache = res.data || [];
        const optionsList = document.getElementById('season-options-list');
        const hiddenSelect = document.getElementById('global-season-select');

        if (allSeasonsCache.length > 0) {
            currentSeason = allSeasonsCache[0].year;
            const display = document.getElementById('selected-season-display');
            if (display) display.textContent = `${currentSeason} Season`;

            if (optionsList) {
                optionsList.innerHTML = allSeasonsCache.map((s, idx) => `
                    <div class="season-option-item ${idx === 0 ? 'selected' : ''}" data-year="${s.year}" onclick="selectSeasonOption(${s.year})">
                        <span>${s.year} Season</span>
                        ${idx === 0 ? '<i class="fa-solid fa-check" style="font-size: 10px;"></i>' : ''}
                    </div>
                `).join('');
            }

            if (hiddenSelect) {
                hiddenSelect.innerHTML = allSeasonsCache.map(s => `<option value="${s.year}">${s.year} Season</option>`).join('');
                hiddenSelect.value = currentSeason;
            }

            updateSeasonDisplayLabels();
        }
    } catch (e) {
        console.error("Error loading seasons:", e);
    }
}

function onGlobalSeasonChange(newSeason) {
    currentSeason = parseInt(newSeason);
    loadActiveView();
}

// Timezone Controller
function setTimezone(tz) {
    currentTz = tz;
    const wibBtn = document.getElementById('tz-btn-wib');
    const utcBtn = document.getElementById('tz-btn-utc');
    if (wibBtn) wibBtn.classList.toggle('active', tz === 'WIB');
    if (utcBtn) utcBtn.classList.toggle('active', tz === 'UTC');
    document.querySelectorAll('.tz-display').forEach(el => el.textContent = tz);
    
    renderLastSyncDisplay();

    const activeView = getActiveViewName();
    if (activeView === 'dashboard') {
        loadDashboardData(currentSeason);
    } else if (activeView === 'calendar') {
        renderCalendarCards(currentCalendarRaces);
    } else if (activeView === 'practices') {
        loadPracticeSessionData();
    } else if (activeView === 'sprints') {
        loadSprintSchedule(currentSeason);
    } else if (activeView === 'weekend-hub') {
        loadWeekendData(currentSeason, currentHubRound);
    }
}


function formatSessionTime(utcTime, wibTime) {
    if (currentTz === 'WIB') {
        return wibTime ? `${wibTime} WIB` : (utcTime ? `${utcTime} (UTC)` : 'TBA');
    }
    return utcTime ? `${utcTime} UTC` : 'TBA';
}

function renderWikiLink(text, url, extraClass = '') {
    if (!url) return escapeHtml(text || '-');
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="wiki-link ${extraClass}" title="View Wikipedia for ${escapeHtml(text)}">${escapeHtml(text)} <i class="fa-solid fa-arrow-up-right-from-square wiki-icon"></i></a>`;
}

function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// API Health Check
async function initApiCheck() {
    try {
        const res = await F1Api.getSeasons();
        if (res && res.data) {
            const statusEl = document.getElementById('api-status');
            const statusTextEl = document.getElementById('api-status-text');
            if (statusEl) statusEl.className = 'api-status-badge online';
            if (statusTextEl) statusTextEl.textContent = 'API Online';
        }
    } catch (e) {
        const statusEl = document.getElementById('api-status');
        const statusTextEl = document.getElementById('api-status-text');
        if (statusEl) statusEl.className = 'api-status-badge offline';
        if (statusTextEl) statusTextEl.textContent = 'API Offline';
    }
}

// =========================================================================
// TABLE COLUMN SORTING SYSTEM (Applies to all tables with data-sort)
// =========================================================================
function initGlobalTableSorting() {
    document.addEventListener('click', (e) => {
        const th = e.target.closest('th[data-sort]');
        if (!th) return;

        const table = th.closest('table');
        if (!table) return;

        const sortKey = th.getAttribute('data-sort');
        const tableId = table.id;

        if (!tableSortState[tableId]) {
            tableSortState[tableId] = { sortKey: null, sortDir: 'asc' };
        }

        const state = tableSortState[tableId];
        if (state.sortKey === sortKey) {
            state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortKey = sortKey;
            state.sortDir = 'asc';
        }

        // Update header classes
        table.querySelectorAll('th[data-sort]').forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
        });
        th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');

        // Handle sort per table
        handleTableSort(tableId, sortKey, state.sortDir);
    });
}

function handleTableSort(tableId, sortKey, sortDir) {
    if (tableId === 'drivers-directory-table') {
        paginationState.drivers.sortCol = sortKey;
        paginationState.drivers.sortDir = sortDir;
        renderPaginatedDrivers();
    } else if (tableId === 'constructors-directory-table') {
        paginationState.constructors.sortCol = sortKey;
        paginationState.constructors.sortDir = sortDir;
        renderPaginatedConstructors();
    } else if (tableId === 'circuits-directory-table') {
        paginationState.circuits.sortCol = sortKey;
        paginationState.circuits.sortDir = sortDir;
        renderPaginatedCircuits();
    } else {
        // Generic in-place sort for DOM table rows
        const table = document.getElementById(tableId);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const thIndex = Array.from(table.querySelectorAll('th')).findIndex(th => th.getAttribute('data-sort') === sortKey);
        if (thIndex === -1) return;

        rows.sort((a, b) => {
            const cellA = a.children[thIndex]?.textContent.trim() || '';
            const cellB = b.children[thIndex]?.textContent.trim() || '';

            const numA = parseFloat(cellA.replace(/[^0-9.-]+/g, ""));
            const numB = parseFloat(cellB.replace(/[^0-9.-]+/g, ""));

            let res = 0;
            if (!isNaN(numA) && !isNaN(numB)) {
                res = numA - numB;
            } else {
                res = cellA.localeCompare(cellB);
            }
            return sortDir === 'asc' ? res : -res;
        });

        rows.forEach(r => tbody.appendChild(r));
    }
}

// Generic comparator for JavaScript arrays
function sortArrayBy(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        let res = 0;
        if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'string') {
            res = numA - numB;
        } else {
            res = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        }
        return dir === 'asc' ? res : -res;
    });
}

// =========================================================================
// 1. DASHBOARD CONTROLLER
// =========================================================================
async function loadDashboardData(year) {
    try {
        const [calRes, driverStandingsRes, constStandingsRes] = await Promise.all([
            F1Api.getRaceCalendar(year),
            F1Api.getDriverStandingsByYear(year).catch(() => F1Api.getLatestDriverStandings()),
            F1Api.getConstructorStandingsByYear(year).catch(() => F1Api.getLatestConstructorStandings())
        ]);

        const races = calRes.data || [];
        const drivers = driverStandingsRes.data || [];
        const constructors = constStandingsRes.data || [];

        // Leaders
        if (drivers.length > 0) {
            const dLeader = drivers[0];
            document.getElementById('dash-driver-leader').innerHTML = renderWikiLink(dLeader.driver_name, dLeader.driver_wiki_url);
            document.getElementById('dash-driver-leader-pts').textContent = `${dLeader.total_points} PTS (${dLeader.total_wins} Wins) · ${dLeader.team_name}`;
        } else {
            document.getElementById('dash-driver-leader').textContent = 'N/A';
            document.getElementById('dash-driver-leader-pts').textContent = '-';
        }

        if (constructors.length > 0) {
            const cLeader = constructors[0];
            document.getElementById('dash-team-leader').innerHTML = renderWikiLink(cLeader.constructor_name, cLeader.constructor_wiki_url);
            document.getElementById('dash-team-leader-pts').textContent = `${cLeader.total_points} PTS (${cLeader.total_wins} Wins)`;
        } else {
            document.getElementById('dash-team-leader').textContent = 'N/A';
            document.getElementById('dash-team-leader-pts').textContent = '-';
        }

        document.getElementById('dash-total-races').textContent = races.length;
        document.getElementById('dash-races-sub').textContent = `${year} Championship Season`;

        const uniqueCircuits = new Set(races.map(r => r.circuit_name));
        document.getElementById('dash-total-circuits').textContent = uniqueCircuits.size;

        // Render Dashboard Races Table (Full Season Schedule with Vivid Green Next/Latest Highlighting)
        const racesTbody = document.querySelector('#dash-races-table tbody');
        if (!races || races.length === 0) {
            racesTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No races found for season ${year}.</td></tr>`;
        } else {
            const todayStr = new Date().toISOString().split('T')[0];
            let currentIdx = races.findIndex(r => r.race_date && r.race_date >= todayStr);
            const isPastSeason = (currentIdx === -1);
            if (isPastSeason) {
                currentIdx = Math.max(0, races.length - 1);
            }
            const targetRound = races[currentIdx]?.round;

            racesTbody.innerHTML = races.map(r => {
                const isTarget = (r.round === targetRound);
                const isPast = r.race_date && r.race_date < todayStr;
                const isLive = (r.fp1_date && r.race_date && todayStr >= r.fp1_date && todayStr <= r.race_date);

                let roundBadge = `<span class="badge badge-f1">R${r.round}</span>`;
                let rowClass = "clickable-row";
                let rowId = isTarget ? 'id="dash-active-round-row"' : '';

                if (isLive) {
                    roundBadge = `<span class="badge badge-live"><i class="fa-solid fa-circle-dot fa-beat"></i> R${r.round} LIVE</span>`;
                    rowClass += " row-live";
                } else if (isTarget) {
                    const labelText = isPastSeason ? 'LATEST' : 'UPCOMING';
                    roundBadge = `<span class="badge badge-upcoming"><i class="fa-solid fa-flag-checkered"></i> R${r.round} ${labelText}</span>`;
                    rowClass += " row-upcoming";
                } else if (isPast) {
                    roundBadge = `<span class="badge badge-neutral" style="opacity: 0.65;">R${r.round}</span>`;
                    rowClass += " row-past";
                }

                return `
                    <tr ${rowId} class="${rowClass}" onclick="openRaceInWeekendHub(${r.year || currentSeason}, ${r.round}, ${r.raceId || 'null'})">
                        <td>${roundBadge}</td>
                        <td style="font-weight: 600;">${renderWikiLink(r.grand_prix_name, r.race_wiki_url)}</td>
                        <td>${renderWikiLink(r.circuit_name, r.circuit_wiki_url)}</td>
                        <td><span style="font-family: var(--font-mono); font-size: 12px;">${r.race_date || '-'}</span></td>
                        <td><span class="session-time-val" style="font-family: var(--font-mono); font-size: 12px;">${formatSessionTime(r.race_time_utc, r.race_time_wib)}</span></td>
                        <td>${r.has_sprint ? '<span class="badge badge-sprint"><i class="fa-solid fa-bolt"></i> Sprint</span>' : '<span class="badge badge-neutral">Standard</span>'}</td>
                    </tr>
                `;
            }).join('');

            // Smooth scroll to active round row inside the scrollable container
            setTimeout(() => {
                const activeRow = document.getElementById('dash-active-round-row');
                const tableContainer = document.querySelector('#dash-schedule-card .table-responsive');
                if (activeRow && tableContainer) {
                    const rowTop = activeRow.offsetTop;
                    tableContainer.scrollTop = Math.max(0, rowTop - 120);
                }
            }, 100);
        }

        // Render Dashboard Standings Table
        const standingsTbody = document.querySelector('#dash-standings-table tbody');
        if (drivers.length === 0) {
            standingsTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No standings available for ${year}.</td></tr>`;
        } else {
            updateNextRaceWidget(races);
            standingsTbody.innerHTML = drivers.slice(0, 5).map((d, i) => `
                <tr>
                    <td class="pos-${i + 1}">P${d.championship_rank || i + 1}</td>
                    <td>
                        <span class="driver-tag">
                            <span class="driver-code-pill">${d.driver_code || 'F1'}</span>
                            ${renderWikiLink(d.driver_name, d.driver_wiki_url)}
                        </span>
                    </td>
                    <td>${renderWikiLink(d.team_name, d.constructor_wiki_url)}</td>
                    <td>${d.total_wins}</td>
                    <td class="text-right font-weight-bold" style="font-family: var(--font-mono);">${d.total_points}</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error("Dashboard error:", e);
    }
}

// =========================================================================
// 2. RACE CALENDAR (Full session schedule: Race, Quali, FP1-3, Sprint)
// =========================================================================
async function loadCalendarData(year) {
    const container = document.getElementById('calendar-container');
    container.innerHTML = `<div class="text-center py-5 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading ${year} season calendar...</div>`;

    try {
        const res = await F1Api.getRaceCalendar(year);
        currentCalendarRaces = res.data || [];
        renderCalendarCards(currentCalendarRaces);
    } catch (e) {
        container.innerHTML = `<div class="text-center py-5 text-muted">Failed to load calendar: ${e.message}</div>`;
    }
}

function renderCalendarCards(races) {
    if (!paginationState.calendar) {
        paginationState.calendar = { page: 1, limit: 6, total: 0, data: [] };
    }
    paginationState.calendar.data = races || [];
    paginationState.calendar.total = (races || []).length;
    renderPaginatedCalendarCards();
}

function renderPaginatedCalendarCards() {
    const p = paginationState.calendar;
    const container = document.getElementById('calendar-container');
    const footer = document.getElementById('calendar-pagination');

    if (!p.data || p.data.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">No races found for season ${currentSeason}.</div>`;
        if (footer) footer.innerHTML = '';
        return;
    }

    const start = (p.page - 1) * p.limit;
    const end = start + p.limit;
    const pageRaces = p.data.slice(start, end);

    container.innerHTML = pageRaces.map(r => `
        <div class="race-card">
            <div class="race-card-header">
                <div>
                    <span class="race-round-badge">ROUND ${r.round}</span>
                    <h4 class="race-card-title">${renderWikiLink(r.grand_prix_name, r.race_wiki_url)}</h4>
                    <p class="race-circuit-info">${renderWikiLink(r.circuit_name, r.circuit_wiki_url)} • ${r.location}, ${r.country}</p>
                </div>
                <div>
                    ${r.has_sprint ? '<span class="badge badge-sprint"><i class="fa-solid fa-bolt"></i> Sprint Weekend</span>' : '<span class="badge badge-neutral">Standard</span>'}
                </div>
            </div>

            <!-- Full Session Timeline with WIB/UTC -->
            <div class="session-schedule-matrix">
                <div class="session-row">
                    <span class="session-name main-race"><i class="fa-solid fa-flag-checkered text-danger"></i> Main Race</span>
                    <span class="session-time-val">${r.race_date || '-'} • ${formatSessionTime(r.race_time_utc, r.race_time_wib)}</span>
                </div>
                ${(r.quali_date || r.quali_time_utc) ? `
                <div class="session-row">
                    <span class="session-name"><i class="fa-solid fa-stopwatch text-warning"></i> Qualifying</span>
                    <span class="session-time-val">${r.quali_date || '-'} • ${formatSessionTime(r.quali_time_utc, r.quali_time_wib)}</span>
                </div>
                ` : ''}
                ${(r.has_sprint || r.sprint_date || r.sprint_time_utc) ? `
                <div class="session-row">
                    <span class="session-name" style="color: var(--f1-cyan);"><i class="fa-solid fa-bolt"></i> Sprint Race</span>
                    <span class="session-time-val">${r.sprint_date || '-'} • ${formatSessionTime(r.sprint_time_utc, r.sprint_time_wib)}</span>
                </div>
                ` : ''}
                ${(!r.has_sprint && (r.fp3_date || r.fp3_time_utc)) ? `
                <div class="session-row">
                    <span class="session-name"><i class="fa-solid fa-gauge"></i> Practice 3 (FP3)</span>
                    <span class="session-time-val">${r.fp3_date || '-'} • ${formatSessionTime(r.fp3_time_utc, r.fp3_time_wib)}</span>
                </div>
                ` : ''}
                ${(!r.has_sprint && (r.fp2_date || r.fp2_time_utc)) ? `
                <div class="session-row">
                    <span class="session-name"><i class="fa-solid fa-gauge"></i> Practice 2 (FP2)</span>
                    <span class="session-time-val">${r.fp2_date || '-'} • ${formatSessionTime(r.fp2_time_utc, r.fp2_time_wib)}</span>
                </div>
                ` : ''}
                ${(r.fp1_date || r.fp1_time_utc) ? `
                <div class="session-row">
                    <span class="session-name"><i class="fa-solid fa-gauge"></i> Practice 1 (FP1)</span>
                    <span class="session-time-val">${r.fp1_date || '-'} • ${formatSessionTime(r.fp1_time_utc, r.fp1_time_wib)}</span>
                </div>
                ` : ''}
            </div>

            <div class="flex-between mt-3">
                <button class="btn btn-sm btn-outline" onclick="openLapChartForRace(${r.year || currentSeason}, ${r.round})">
                    <i class="fa-solid fa-chart-line"></i> Lap Chart
                </button>
                <button class="btn btn-sm btn-primary" onclick="openRaceInWeekendHub(${r.year || currentSeason}, ${r.round}, ${r.raceId || 'null'})">
                    Weekend Hub <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Render Calendar Pagination Controls
    if (footer) {
        const totalPages = Math.ceil(p.total / p.limit);
        if (totalPages <= 1) {
            footer.innerHTML = `<span class="text-muted" style="font-size: 11.5px;">Showing all ${p.total} rounds</span><span></span>`;
        } else {
            footer.innerHTML = `
                <span class="text-muted" style="font-size: 11.5px;">Showing ${start + 1} - ${Math.min(end, p.total)} of ${p.total} rounds</span>
                <div class="pagination-controls">
                    <button class="pagination-btn" ${p.page === 1 ? 'disabled' : ''} onclick="changeCalendarCardPage(${p.page - 1})">
                        <i class="fa-solid fa-chevron-left"></i> Prev
                    </button>
                    <span class="pagination-badge">Page ${p.page} / ${totalPages}</span>
                    <button class="pagination-btn" ${p.page === totalPages ? 'disabled' : ''} onclick="changeCalendarCardPage(${p.page + 1})">
                        Next <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            `;
        }
    }
}

function changeCalendarCardPage(newPage) {
    const p = paginationState.calendar;
    const totalPages = Math.ceil(p.total / p.limit);
    if (newPage < 1 || newPage > totalPages) return;
    p.page = newPage;
    renderPaginatedCalendarCards();
}

function openRaceInWeekendHub(year, roundNo, raceId) {
    currentSeason = year;
    document.getElementById('global-season-select').value = year;
    switchView('weekend-hub');
    loadWeekendRacesDropdown(year, roundNo, raceId);
}

function openLapChartForRace(year, roundNo) {
    currentSeason = year;
    document.getElementById('global-season-select').value = year;
    switchView('lap-chart-view');
    loadLapChartRacesDropdown(year, roundNo);
}

// =========================================================================
// 3. FREE PRACTICE SESSIONS (FP1, FP2, FP3)
// =========================================================================
async function loadPracticeGrandPrixList(year) {
    try {
        const res = await F1Api.getRaceCalendar(year);
        const races = res.data || [];
        const roundSelect = document.getElementById('practice-round-select');
        roundSelect.innerHTML = races.map(r => `<option value="${r.round}">Round ${r.round}: ${r.grand_prix_name}</option>`).join('');
        loadPracticeSessionData();
    } catch (e) {
        console.error("Practice error:", e);
    }
}

async function loadPracticeSessionData() {
    const roundNo = document.getElementById('practice-round-select').value;
    const card = document.getElementById('practice-content-card');

    if (!roundNo) {
        card.innerHTML = `<div class="p-4 text-center text-muted">No rounds available for season ${currentSeason}.</div>`;
        return;
    }

    card.innerHTML = `<div class="p-4 text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading practice schedule...</div>`;

    try {
        const res = await F1Api.getPracticeSchedule(currentSeason, roundNo);
        const data = res.data;
        if (!data) {
            card.innerHTML = `<div class="p-4 text-center text-muted">No practice schedule found for this round.</div>`;
            return;
        }

        card.innerHTML = `
            <div class="card-header flex-between">
                <div>
                    <h3><i class="fa-solid fa-stopwatch"></i> Round ${data.round}: ${renderWikiLink(data.grand_prix_name, data.race_wiki_url)}</h3>
                    <p class="text-muted">${data.circuit_name} (${data.country})</p>
                </div>
            </div>
            <div class="card-body">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fa-solid fa-stopwatch"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Practice 1 (FP1)</span>
                            <h3>${formatSessionTime(data.fp1_time_utc, data.fp1_time_wib)}</h3>
                            <p class="stat-sub">Date: ${data.fp1_date || 'TBA'}</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fa-solid fa-stopwatch"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Practice 2 (FP2)</span>
                            <h3>${formatSessionTime(data.fp2_time_utc, data.fp2_time_wib)}</h3>
                            <p class="stat-sub">Date: ${data.fp2_date || 'TBA'}</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fa-solid fa-stopwatch"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Practice 3 (FP3)</span>
                            <h3>${data.fp3_time_utc ? formatSessionTime(data.fp3_time_utc, data.fp3_time_wib) : 'Sprint Weekend'}</h3>
                            <p class="stat-sub">Date: ${data.fp3_date || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        card.innerHTML = `<div class="p-4 text-center text-muted">Error loading practice: ${e.message}</div>`;
    }
}

// =========================================================================
// 4. SPRINT SCHEDULE
// =========================================================================
async function loadSprintSchedule(year) {
    const tbody = document.querySelector('#sprint-schedule-table tbody');
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading sprint weekends for ${year}...</td></tr>`;

    try {
        const res = await F1Api.getSprintSchedule(year);
        const sprints = res.data || [];
        if (sprints.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No sprint race weekends scheduled for ${year}.</td></tr>`;
            return;
        }

        tbody.innerHTML = sprints.map(s => `
            <tr>
                <td><span class="badge badge-f1">R${s.round}</span></td>
                <td>${renderWikiLink(s.grand_prix_name, s.race_wiki_url)}</td>
                <td>${s.circuit_name} <span class="text-muted">(${s.country})</span></td>
                <td>${s.sprint_date || '-'}</td>
                <td><span class="session-time-val">${formatSessionTime(s.sprint_time_utc, s.sprint_time_wib)}</span></td>
                <td>${s.main_race_date || '-'}</td>
                <td><span class="session-time-val">${formatSessionTime(s.main_race_time_utc, s.main_race_time_wib)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="openRaceInWeekendHub(${s.year}, ${s.round}, ${s.raceId})">
                        <i class="fa-solid fa-flag-checkered"></i> View Weekend
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Error loading sprint schedule: ${e.message}</td></tr>`;
    }
}

// =========================================================================
// 5. CHAMPIONSHIP STANDINGS (Driver & Constructor with 2026/Current support)
// =========================================================================
function setStandingsTab(tab) {
    currentStandingsTab = tab;
    document.getElementById('btn-standings-drivers').classList.toggle('active', tab === 'drivers');
    document.getElementById('btn-standings-constructors').classList.toggle('active', tab === 'constructors');
    loadStandingsData();
}

async function loadStandingsData() {
    const table = document.getElementById('standings-main-table');
    const tableTitle = document.getElementById('standings-table-title');
    const badge = document.getElementById('standings-season-badge');

    badge.textContent = `Season ${currentSeason}`;
    table.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading standings for ${currentSeason}...</td></tr>`;

    try {
        if (currentStandingsTab === 'drivers') {
            tableTitle.innerHTML = `<i class="fa-solid fa-trophy"></i> World Drivers Championship (WDC)`;
            const res = await F1Api.getDriverStandingsByYear(currentSeason);
            const data = res.data || [];

            if (data.length === 0) {
                table.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No driver standings recorded for season ${currentSeason}.</td></tr>`;
                return;
            }

            table.innerHTML = `
                <thead>
                    <tr>
                        <th data-sort="championship_rank">Pos <span class="sort-icon"></span></th>
                        <th data-sort="driver_name">Driver <span class="sort-icon"></span></th>
                        <th data-sort="nationality">Nationality <span class="sort-icon"></span></th>
                        <th data-sort="team_name">Team / Constructor <span class="sort-icon"></span></th>
                        <th data-sort="total_wins">Wins <span class="sort-icon"></span></th>
                        <th data-sort="total_points" class="text-right">Total Points <span class="sort-icon"></span></th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((d, i) => `
                        <tr>
                            <td class="pos-${i + 1}">P${d.championship_rank || i + 1}</td>
                            <td>
                                <span class="driver-tag">
                                    <span class="driver-code-pill">${d.driver_code || 'F1'}</span>
                                    ${renderWikiLink(d.driver_name, d.driver_wiki_url)}
                                </span>
                            </td>
                            <td>${d.nationality || '-'}</td>
                            <td>${renderWikiLink(d.team_name, d.constructor_wiki_url)}</td>
                            <td>${d.total_wins || 0}</td>
                            <td class="text-right font-weight-bold" style="font-family: var(--font-mono); font-size: 14px;">${d.total_points || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        } else {
            tableTitle.innerHTML = `<i class="fa-solid fa-car"></i> World Constructors Championship (WCC)`;
            const res = await F1Api.getConstructorStandingsByYear(currentSeason);
            const data = res.data || [];

            if (data.length === 0) {
                table.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No constructor standings recorded for season ${currentSeason}.</td></tr>`;
                return;
            }

            table.innerHTML = `
                <thead>
                    <tr>
                        <th data-sort="championship_rank">Pos <span class="sort-icon"></span></th>
                        <th data-sort="constructor_name">Constructor Team <span class="sort-icon"></span></th>
                        <th data-sort="nationality">Nationality <span class="sort-icon"></span></th>
                        <th data-sort="total_wins">Wins <span class="sort-icon"></span></th>
                        <th data-sort="total_points" class="text-right">Total Points <span class="sort-icon"></span></th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((c, i) => `
                        <tr>
                            <td class="pos-${i + 1}">P${c.championship_rank || i + 1}</td>
                            <td>${renderWikiLink(c.constructor_name, c.constructor_wiki_url)}</td>
                            <td>${c.nationality || '-'}</td>
                            <td>${c.total_wins || 0}</td>
                            <td class="text-right font-weight-bold" style="font-family: var(--font-mono); font-size: 14px;">${c.total_points || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        }
    } catch (e) {
        table.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Error loading standings: ${e.message}</td></tr>`;
    }
}

// =========================================================================
// 6. GRAND PRIX WEEKEND HUB (Results, Official Grid, Quali, Sprints, Pit Stops)
// =========================================================================
async function loadWeekendRacesDropdown(year, selectedRound = null, selectedRaceId = null) {
    try {
        const res = await F1Api.getRaceCalendar(year);
        const races = res.data || [];
        const raceSelect = document.getElementById('weekend-race-select');

        if (races.length === 0) {
            raceSelect.innerHTML = `<option value="">No races in ${year}</option>`;
            document.getElementById('weekend-tab-content').innerHTML = `<div class="p-5 text-center text-muted">No races found for season ${year}.</div>`;
            return;
        }

        raceSelect.innerHTML = races.map(r => `
            <option value="${r.round}" data-raceid="${r.raceId}">Round ${r.round}: ${r.grand_prix_name}</option>
        `).join('');

        if (selectedRound) {
            raceSelect.value = selectedRound;
        }

        onWeekendRaceSelected();
    } catch (e) {
        console.error("Weekend races load error:", e);
    }
}

function onWeekendRaceSelected() {
    loadWeekendTabContent();
}

function setWeekendTab(tab) {
    currentWeekendTab = tab;
    document.querySelectorAll('.weekend-tab').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    loadWeekendTabContent();
}

async function loadWeekendTabContent() {
    const raceSelect = document.getElementById('weekend-race-select');
    const roundNo = raceSelect.value;
    const selectedOption = raceSelect.options[raceSelect.selectedIndex];
    const raceId = selectedOption ? selectedOption.getAttribute('data-raceid') : null;

    const container = document.getElementById('weekend-tab-content');
    container.innerHTML = `<div class="p-5 text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Loading ${currentWeekendTab}...</div>`;

    if (!roundNo) {
        container.innerHTML = `<div class="p-5 text-center text-muted">Please select a valid Grand Prix.</div>`;
        return;
    }

    try {
        switch (currentWeekendTab) {
            case 'race-results':
                await renderRaceResults(currentSeason, roundNo, container);
                break;
            case 'official-grid':
                await renderOfficialStartingGrid(currentSeason, raceId, roundNo, container);
                break;
            case 'qualifying':
                await renderQualifyingResults(currentSeason, roundNo, container);
                break;
            case 'sprint-results':
                await renderSprintResults(currentSeason, roundNo, container);
                break;
            case 'pit-stops':
                await renderPitStops(currentSeason, roundNo, container);
                break;
        }
    } catch (e) {
        container.innerHTML = `<div class="p-5 text-center text-muted">Error loading data: ${e.message}</div>`;
    }
}

// 1. Race Results (Fixed points field & sorting)
async function renderRaceResults(year, roundNo, container) {
    const res = await F1Api.getRaceResults(year, roundNo);
    const data = res.data || [];
    if (data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No race results recorded for this event.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="f1-table" id="race-results-table">
            <thead>
                <tr>
                    <th data-sort="finish_position">Pos <span class="sort-icon"></span></th>
                    <th data-sort="car_number"># <span class="sort-icon"></span></th>
                    <th data-sort="starting_grid">Grid <span class="sort-icon"></span></th>
                    <th data-sort="driver_name">Driver <span class="sort-icon"></span></th>
                    <th data-sort="team_name">Constructor <span class="sort-icon"></span></th>
                    <th data-sort="laps_completed">Laps <span class="sort-icon"></span></th>
                    <th>Time / Gap</th>
                    <th data-sort="points_awarded">Points <span class="sort-icon"></span></th>
                    <th>Fastest Lap</th>
                    <th data-sort="status">Status <span class="sort-icon"></span></th>
                </tr>
            </thead>
            <tbody>
                ${data.map((r, i) => {
        const pos = r.finish_position !== undefined && r.finish_position !== null ? r.finish_position : (i + 1);
        const num = r.car_number !== undefined && r.car_number !== null ? r.car_number : (r.driver_number || '-');
        const grid = r.starting_grid !== undefined && r.starting_grid !== null ? `P${r.starting_grid}` : '-';
        const laps = r.laps_completed !== undefined && r.laps_completed !== null ? r.laps_completed : '-';
        const time = r.race_time_or_gap || r.time_or_gap || r.finish_time || r.status || '-';
        const pts = r.points_awarded !== undefined && r.points_awarded !== null ? r.points_awarded : (r.points_earned || r.points || 0);
        const fastLap = r.fastest_lap_time || r.fastest_lap || '-';
        const status = r.status || r.race_status || 'Finished';

        return `
                        <tr>
                            <td class="pos-${pos}">P${pos}</td>
                            <td style="font-family: var(--font-mono); font-weight: 600;">${num}</td>
                            <td>${grid}</td>
                            <td>
                                <span class="driver-tag">
                                    <span class="driver-code-pill">${r.driver_code || 'F1'}</span>
                                    ${renderWikiLink(r.driver_name, r.driver_wiki_url)}
                                </span>
                            </td>
                            <td>${renderWikiLink(r.team_name || r.constructor_name, r.constructor_wiki_url)}</td>
                            <td>${laps}</td>
                            <td style="font-family: var(--font-mono); font-weight: bold; color: #ffffff;">${time}</td>
                            <td class="text-right font-weight-bold" style="font-family: var(--font-mono); color: var(--f1-cyan); font-size: 13.5px;">+${pts}</td>
                            <td style="font-family: var(--font-mono); color: var(--f1-gold);">${fastLap}</td>
                            <td><span class="badge ${status === 'Finished' ? 'badge-success' : 'badge-neutral'}">${status}</span></td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// 2. Official Starting Grid
async function renderOfficialStartingGrid(year, raceId, roundNo, container) {
    let gridData = [];
    try {
        const res = await F1Api.getStartingGrid(year, raceId);
        gridData = res.data || [];
    } catch (e) { }

    if (gridData.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No official starting grid data found for this Grand Prix (Race ID: ${raceId}).</div>`;
        return;
    }

    container.innerHTML = `
        <table class="f1-table" id="official-grid-table">
            <thead>
                <tr>
                    <th data-sort="starting_grid_position">Grid Pos <span class="sort-icon"></span></th>
                    <th data-sort="car_number"># <span class="sort-icon"></span></th>
                    <th data-sort="driver_name">Driver <span class="sort-icon"></span></th>
                    <th data-sort="team_name">Constructor Team <span class="sort-icon"></span></th>
                    <th data-sort="qualifying_position">Qualifying Pos <span class="sort-icon"></span></th>
                    <th>Best Quali Lap</th>
                    <th data-sort="grid_status">Starting Grid Status <span class="sort-icon"></span></th>
                </tr>
            </thead>
            <tbody>
                ${gridData.map(g => {
        let statusBadge = `<span class="badge badge-neutral">${g.grid_status || 'As Qualified'}</span>`;
        if (g.starting_grid_position === 'PL') {
            statusBadge = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Pit Lane Start</span>`;
        } else if (g.grid_status && g.grid_status.includes('Penalty')) {
            statusBadge = `<span class="badge badge-danger">${g.grid_status}</span>`;
        } else if (g.grid_status && g.grid_status.includes('Promotion')) {
            statusBadge = `<span class="badge badge-success">${g.grid_status}</span>`;
        }

        return `
                        <tr>
                            <td class="pos-${g.starting_grid_position} font-weight-bold" style="font-size: 14px;">${g.starting_grid_position === 'PL' ? 'PL' : `P${g.starting_grid_position}`}</td>
                            <td style="font-family: var(--font-mono);">${g.car_number || '-'}</td>
                            <td>
                                <span class="driver-tag">
                                    <span class="driver-code-pill">${g.driver_code || 'F1'}</span>
                                    ${renderWikiLink(g.driver_name, g.driver_wiki_url)}
                                </span>
                            </td>
                            <td>${renderWikiLink(g.team_name, g.constructor_wiki_url)}</td>
                            <td>${g.qualifying_position ? `P${g.qualifying_position}` : 'N/A'}</td>
                            <td style="font-family: var(--font-mono);">${g.qualifying_best_lap || '-'}</td>
                            <td>${statusBadge}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// 3. Qualifying (Fixed undefined position field)
async function renderQualifyingResults(year, roundNo, container) {
    const res = await F1Api.getQualifying(year, roundNo);
    const data = res.data || [];
    if (data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No qualifying results recorded for this round.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="f1-table" id="qualifying-table">
            <thead>
                <tr>
                    <th data-sort="quali_rank">Pos <span class="sort-icon"></span></th>
                    <th data-sort="driver_name">Driver <span class="sort-icon"></span></th>
                    <th data-sort="team_name">Constructor Team <span class="sort-icon"></span></th>
                    <th>Q1 Lap</th>
                    <th>Q2 Lap</th>
                    <th>Q3 Lap</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((q, idx) => {
        const pos = q.quali_rank !== undefined ? q.quali_rank : (q.position !== undefined ? q.position : idx + 1);
        return `
                        <tr>
                            <td class="pos-${pos}">P${pos}</td>
                            <td>${renderWikiLink(q.driver_name, q.driver_wiki_url)}</td>
                            <td>${renderWikiLink(q.team_name, q.constructor_wiki_url)}</td>
                            <td style="font-family: var(--font-mono);">${q.q1_time || q.q1 || '-'}</td>
                            <td style="font-family: var(--font-mono);">${q.q2_time || q.q2 || '-'}</td>
                            <td style="font-family: var(--font-mono); font-weight: bold;">${q.q3_time || q.q3 || '-'}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// 4. Sprint Results
async function renderSprintResults(year, roundNo, container) {
    try {
        const res = await F1Api.getSprintResults(year, roundNo);
        const data = res.data || [];
        if (data.length === 0) {
            container.innerHTML = `<div class="p-5 text-center text-muted">No sprint race results found (Standard race weekend format).</div>`;
            return;
        }

        container.innerHTML = `
            <table class="f1-table" id="sprint-results-table">
                <thead>
                    <tr>
                        <th data-sort="finish_position">Pos <span class="sort-icon"></span></th>
                        <th data-sort="car_number"># <span class="sort-icon"></span></th>
                        <th data-sort="starting_grid">Grid <span class="sort-icon"></span></th>
                        <th data-sort="driver_name">Driver <span class="sort-icon"></span></th>
                        <th data-sort="team_name">Constructor Team <span class="sort-icon"></span></th>
                        <th data-sort="laps_completed">Laps <span class="sort-icon"></span></th>
                        <th>Sprint Time / Gap</th>
                        <th data-sort="points_awarded">Sprint Points <span class="sort-icon"></span></th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((s, idx) => {
            const pos = s.finish_position !== undefined && s.finish_position !== null ? s.finish_position : (idx + 1);
            const num = s.car_number !== undefined && s.car_number !== null ? s.car_number : '-';
            const grid = s.starting_grid !== undefined && s.starting_grid !== null ? `P${s.starting_grid}` : '-';
            const laps = s.laps_completed !== undefined && s.laps_completed !== null ? s.laps_completed : '-';
            const time = s.time_or_gap || s.time || s.status || '-';
            const pts = s.points_awarded !== undefined && s.points_awarded !== null ? s.points_awarded : (s.sprint_points_earned || s.points || 0);
            const status = s.status || s.sprint_status || 'Finished';

            return `
                            <tr>
                                <td class="pos-${pos}">P${pos}</td>
                                <td style="font-family: var(--font-mono); font-weight: 600;">${num}</td>
                                <td>${grid}</td>
                                <td>
                                    <span class="driver-tag">
                                        <span class="driver-code-pill">${s.driver_code || 'F1'}</span>
                                        ${renderWikiLink(s.driver_name, s.driver_wiki_url)}
                                    </span>
                                </td>
                                <td>${renderWikiLink(s.team_name || s.constructor_name, s.constructor_wiki_url)}</td>
                                <td>${laps}</td>
                                <td style="font-family: var(--font-mono); font-weight: bold; color: #ffffff;">${time}</td>
                                <td class="text-right font-weight-bold" style="font-family: var(--font-mono); color: var(--f1-cyan); font-size: 13.5px;">+${pts}</td>
                                <td><span class="badge ${status === 'Finished' ? 'badge-success' : 'badge-neutral'}">${status}</span></td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No sprint race data for this round.</div>`;
    }
}

// 5. Pit Stops (Fixed undefined time_of_day, duration, milliseconds)
async function renderPitStops(year, roundNo, container) {
    const res = await F1Api.getPitStops(year, roundNo);
    const data = res.data || [];
    if (data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No pit stop telemetry recorded for this round.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="f1-table" id="pit-stops-table">
            <thead>
                <tr>
                    <th data-sort="stop_number">Stop # <span class="sort-icon"></span></th>
                    <th data-sort="driver_name">Driver <span class="sort-icon"></span></th>
                    <th data-sort="team_name">Constructor <span class="sort-icon"></span></th>
                    <th data-sort="lap">Lap <span class="sort-icon"></span></th>
                    <th>Time of Day (UTC)</th>
                    <th data-sort="stop_duration_seconds">Pit Duration</th>
                    <th>Milliseconds</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((p, idx) => {
        const stop = p.stop_number !== undefined && p.stop_number !== null ? p.stop_number : (idx + 1);
        const timeOfDay = p.time_of_day_utc || p.time_of_day || p.time || '-';
        const durationSec = p.stop_duration_seconds !== undefined && p.stop_duration_seconds !== null ? `${p.stop_duration_seconds}s` : (p.duration_seconds ? `${p.duration_seconds}s` : '-');
        const ms = p.total_stop_milliseconds !== undefined && p.total_stop_milliseconds !== null ? `${p.total_stop_milliseconds} ms` : (p.milliseconds ? `${p.milliseconds} ms` : '-');

        return `
                        <tr>
                            <td><span class="badge badge-f1">Stop ${stop}</span></td>
                            <td>
                                <span class="driver-tag">
                                    <span class="driver-code-pill">${p.driver_code || 'F1'}</span>
                                    ${renderWikiLink(p.driver_name, p.driver_wiki_url)}
                                </span>
                            </td>
                            <td>${renderWikiLink(p.team_name || p.constructor_name, p.constructor_wiki_url)}</td>
                            <td style="font-family: var(--font-mono); font-weight: bold;">Lap ${p.lap || p.lap_number || '-'}</td>
                            <td style="font-family: var(--font-mono);">${timeOfDay}</td>
                            <td style="font-family: var(--font-mono); font-weight: bold; color: var(--f1-cyan); font-size: 13px;">${durationSec}</td>
                            <td style="font-family: var(--font-mono); color: var(--f1-gold); font-size: 12px;">${ms}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// =========================================================================
// 7. LAP-BY-LAP PROGRESSION CHART (Interactive Chart.js)
// =========================================================================
async function loadLapChartRacesDropdown(year, selectedRound = null) {
    try {
        const res = await F1Api.getRaceCalendar(year);
        const races = res.data || [];
        const raceSelect = document.getElementById('lapchart-race-select');

        if (races.length === 0) {
            raceSelect.innerHTML = `<option value="">No races in ${year}</option>`;
            if (lapChartInstance) lapChartInstance.destroy();
            return;
        }

        raceSelect.innerHTML = races.map(r => `
            <option value="${r.round}">Round ${r.round}: ${r.grand_prix_name}</option>
        `).join('');

        if (selectedRound) {
            raceSelect.value = selectedRound;
        }

        loadLapChartData();
    } catch (e) {
        console.error("Lap chart races dropdown error:", e);
    }
}

let rawLapChartDatasets = [];

function toggleDriverFilterDropdown() {
    const menu = document.getElementById('driver-filter-menu');
    if (menu) menu.classList.toggle('active');
}

// Close filter dropdown on outside click
document.addEventListener('click', (e) => {
    const container = document.querySelector('.driver-filter-dropdown-container');
    const menu = document.getElementById('driver-filter-menu');
    if (container && menu && !container.contains(e.target)) {
        menu.classList.remove('active');
    }
});

function selectAllDrivers(checked) {
    const checkboxes = document.querySelectorAll('.driver-filter-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });

    if (lapChartInstance && lapChartInstance.data && lapChartInstance.data.datasets) {
        lapChartInstance.data.datasets.forEach(ds => {
            ds.hidden = !checked;
        });
        lapChartInstance.update();
    }

    updateDriverFilterCount();
}

function onDriverCheckboxChange(driverIdx, isChecked) {
    if (lapChartInstance && lapChartInstance.data && lapChartInstance.data.datasets[driverIdx]) {
        lapChartInstance.data.datasets[driverIdx].hidden = !isChecked;
        lapChartInstance.update();
    }
    updateDriverFilterCount();
}

function updateDriverFilterCount() {
    const checkboxes = document.querySelectorAll('.driver-filter-checkbox');
    const total = checkboxes.length;
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const countEl = document.getElementById('driver-filter-count');

    if (countEl) {
        if (checkedCount === total) {
            countEl.textContent = 'All';
        } else {
            countEl.textContent = `${checkedCount}/${total}`;
        }
    }
}

async function loadLapChartData() {
    const roundNo = document.getElementById('lapchart-race-select').value;
    const titleEl = document.getElementById('lapchart-title');

    if (!roundNo) {
        titleEl.innerHTML = `<i class="fa-solid fa-chart-line"></i> No round selected.`;
        if (lapChartInstance) lapChartInstance.destroy();
        document.getElementById('driver-checkbox-list').innerHTML = '';
        return;
    }

    titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading Lap Chart...`;

    try {
        const res = await F1Api.getLapChart(currentSeason, roundNo);
        const rawLaps = res.data || [];

        if (rawLaps.length === 0) {
            titleEl.innerHTML = `<i class="fa-solid fa-chart-line"></i> No Lap Progression data available for ${currentSeason} Round ${roundNo}.`;
            if (lapChartInstance) lapChartInstance.destroy();
            document.getElementById('driver-checkbox-list').innerHTML = '';
            return;
        }

        const driverLapsMap = {};
        let maxLaps = 0;
        let maxPos = 0;

        rawLaps.forEach(row => {
            if (!driverLapsMap[row.driver_name]) {
                driverLapsMap[row.driver_name] = {
                    code: row.driver_code || row.driver_name.substring(0, 3).toUpperCase(),
                    name: row.driver_name,
                    positions: {}
                };
            }
            driverLapsMap[row.driver_name].positions[row.lap] = row.track_position;
            if (row.lap > maxLaps) maxLaps = row.lap;
            if (row.track_position && row.track_position > maxPos) maxPos = row.track_position;
        });

        const driverKeys = Object.keys(driverLapsMap);
        if (driverKeys.length > maxPos) {
            maxPos = driverKeys.length;
        }
        if (maxPos < 20) {
            maxPos = 20;
        }

        titleEl.innerHTML = `<i class="fa-solid fa-chart-line"></i> Lap-by-Lap Progression (${currentSeason} Round ${roundNo} • ${maxLaps} Laps • ${driverKeys.length} Drivers)`;

        const palette = [
            '#e10600', '#00d2be', '#ffb800', '#ff8000', '#00d66c',
            '#0090ff', '#ffffff', '#e000ff', '#33b3a6', '#c0c0c0',
            '#9a0000', '#005f56', '#996e00', '#994c00', '#006633',
            '#d4145a', '#662d91', '#0071bc', '#29b6f6', '#9ccc65',
            '#f06292', '#ba68c8', '#4dd0e1', '#aed581', '#ff8a65', '#ffd54f'
        ];

        const labels = Array.from({ length: maxLaps }, (_, i) => `Lap ${i + 1}`);

        const datasets = driverKeys.map((driverName, idx) => {
            const d = driverLapsMap[driverName];
            const dataPoints = [];
            for (let lap = 1; lap <= maxLaps; lap++) {
                dataPoints.push(d.positions[lap] !== undefined ? d.positions[lap] : null);
            }

            const color = palette[idx % palette.length];
            return {
                label: `${d.code} (${d.name})`,
                data: dataPoints,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                pointRadius: 1.5,
                pointHoverRadius: 5,
                tension: 0.1,
                spanGaps: false,
                hidden: false
            };
        });

        rawLapChartDatasets = datasets;

        // Render Driver Filter Checkboxes in Dropdown
        const checkboxList = document.getElementById('driver-checkbox-list');
        checkboxList.innerHTML = driverKeys.map((driverName, idx) => {
            const d = driverLapsMap[driverName];
            const color = palette[idx % palette.length];
            return `
                <label class="driver-check-label">
                    <input type="checkbox" class="driver-filter-checkbox" checked onchange="onDriverCheckboxChange(${idx}, this.checked)">
                    <span class="driver-color-dot" style="background: ${color};"></span>
                    <span><strong>${d.code}</strong> ${escapeHtml(d.name)}</span>
                </label>
            `;
        }).join('');

        updateDriverFilterCount();

        const ctx = document.getElementById('lapChartCanvas').getContext('2d');
        if (lapChartInstance) lapChartInstance.destroy();

        lapChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#8b93a7', font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        reverse: true,
                        min: 0,
                        max: maxPos + 1,
                        ticks: {
                            stepSize: 1,
                            color: '#8b93a7',
                            font: { family: 'Inter', size: 11, weight: '700' },
                            callback: function (value) {
                                if (Number.isInteger(value) && value >= 1 && value <= maxPos) {
                                    return 'P' + value;
                                }
                                return '';
                            }
                        },
                        grid: {
                            color: function (context) {
                                const val = context.tick ? context.tick.value : null;
                                if (val !== null && Number.isInteger(val) && val >= 1 && val <= maxPos) {
                                    return 'rgba(255, 255, 255, 0.06)';
                                }
                                return 'transparent';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#f0f2f7',
                            font: { family: 'Inter', size: 11 },
                            boxWidth: 12,
                            padding: 10,
                            generateLabels: function (chart) {
                                return Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#12151d',
                        titleColor: '#ffffff',
                        bodyColor: '#f0f2f7',
                        borderColor: '#242938',
                        borderWidth: 1,
                        padding: 10
                    }
                }
            }
        });
    } catch (e) {
        titleEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error loading Lap Chart: ${e.message}`;
    }
}

// =========================================================================
// 8. DATABASE DIRECTORIES WITH PAGINATION & SORTING
// =========================================================================

// DRIVERS DIRECTORY
async function loadDriversDirectory() {
    const tbody = document.querySelector('#drivers-directory-table tbody');
    try {
        const res = await F1Api.getDrivers();
        allDriversCache = res.data || [];
        paginationState.drivers.data = allDriversCache;
        paginationState.drivers.page = 1;
        renderPaginatedDrivers();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Error loading drivers: ${e.message}</td></tr>`;
    }
}

function onDriversSearch(query) {
    const q = query.toLowerCase();
    paginationState.drivers.data = allDriversCache.filter(d =>
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.nationality && d.nationality.toLowerCase().includes(q)) ||
        (d.driver_code && d.driver_code.toLowerCase().includes(q))
    );
    paginationState.drivers.page = 1;
    renderPaginatedDrivers();
}

function renderPaginatedDrivers() {
    const p = paginationState.drivers;
    const sortedData = sortArrayBy(p.data, p.sortCol, p.sortDir);
    const total = sortedData.length;
    p.total = total;

    const start = (p.page - 1) * p.limit;
    const end = start + p.limit;
    const pageItems = sortedData.slice(start, end);

    const tbody = document.querySelector('#drivers-directory-table tbody');
    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No drivers found.</td></tr>`;
    } else {
        tbody.innerHTML = pageItems.map(d => `
            <tr>
                <td style="font-family: var(--font-mono);">${d.permanent_number || '-'}</td>
                <td><span class="driver-code-pill">${d.driver_code || 'F1'}</span></td>
                <td>${renderWikiLink(d.full_name, d.driver_wiki_url)}</td>
                <td>${d.nationality || '-'}</td>
                <td>${d.date_of_birth || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="openDriverProfileModal(${d.driverId})">
                        <i class="fa-solid fa-id-card"></i> Career Stats
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPaginationControls('drivers-pagination', p, 'changeDriversPage');
}

function changeDriversPage(newPage) {
    paginationState.drivers.page = newPage;
    renderPaginatedDrivers();
}

// CONSTRUCTORS DIRECTORY
async function loadConstructorsDirectory() {
    const tbody = document.querySelector('#constructors-directory-table tbody');
    try {
        const res = await F1Api.getConstructors();
        allConstructorsCache = res.data || [];
        paginationState.constructors.data = allConstructorsCache;
        paginationState.constructors.page = 1;
        renderPaginatedConstructors();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Error loading constructors: ${e.message}</td></tr>`;
    }
}

function onConstructorsSearch(query) {
    const q = query.toLowerCase();
    paginationState.constructors.data = allConstructorsCache.filter(c =>
        (c.constructor_name && c.constructor_name.toLowerCase().includes(q)) ||
        (c.constructor_nationality && c.constructor_nationality.toLowerCase().includes(q)) ||
        (c.constructorRef && c.constructorRef.toLowerCase().includes(q))
    );
    paginationState.constructors.page = 1;
    renderPaginatedConstructors();
}

function renderPaginatedConstructors() {
    const p = paginationState.constructors;
    const sortedData = sortArrayBy(p.data, p.sortCol, p.sortDir);
    const total = sortedData.length;
    p.total = total;

    const start = (p.page - 1) * p.limit;
    const end = start + p.limit;
    const pageItems = sortedData.slice(start, end);

    const tbody = document.querySelector('#constructors-directory-table tbody');
    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No constructors found.</td></tr>`;
    } else {
        tbody.innerHTML = pageItems.map(c => `
            <tr>
                <td style="font-family: var(--font-mono);">${c.constructorId}</td>
                <td>${renderWikiLink(c.constructor_name, c.constructor_wiki_url)}</td>
                <td>${c.constructor_nationality || '-'}</td>
                <td class="text-muted" style="font-family: var(--font-mono);">${c.constructorRef || '-'}</td>
                <td>
                    ${c.constructor_wiki_url ? `<a href="${c.constructor_wiki_url}" target="_blank" class="btn btn-sm btn-outline"><i class="fa-brands fa-wikipedia-w"></i> Wikipedia</a>` : '-'}
                </td>
            </tr>
        `).join('');
    }

    renderPaginationControls('constructors-pagination', p, 'changeConstructorsPage');
}

function changeConstructorsPage(newPage) {
    paginationState.constructors.page = newPage;
    renderPaginatedConstructors();
}

// CIRCUITS DIRECTORY
async function loadCircuitsDirectory() {
    const tbody = document.querySelector('#circuits-directory-table tbody');
    try {
        const res = await F1Api.getCircuits();
        allCircuitsCache = res.data || [];
        paginationState.circuits.data = allCircuitsCache;
        paginationState.circuits.page = 1;
        renderPaginatedCircuits();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Error loading circuits: ${e.message}</td></tr>`;
    }
}

function onCircuitsSearch(query) {
    const q = query.toLowerCase();
    paginationState.circuits.data = allCircuitsCache.filter(c =>
        (c.circuit_name && c.circuit_name.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
    paginationState.circuits.page = 1;
    renderPaginatedCircuits();
}

function renderPaginatedCircuits() {
    const p = paginationState.circuits;
    const sortedData = sortArrayBy(p.data, p.sortCol, p.sortDir);
    const total = sortedData.length;
    p.total = total;

    const start = (p.page - 1) * p.limit;
    const end = start + p.limit;
    const pageItems = sortedData.slice(start, end);

    const tbody = document.querySelector('#circuits-directory-table tbody');
    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No circuits found.</td></tr>`;
    } else {
        tbody.innerHTML = pageItems.map(c => `
            <tr>
                <td style="font-family: var(--font-mono);">${c.circuitId}</td>
                <td>${renderWikiLink(c.circuit_name, c.circuit_wiki_url)}</td>
                <td>${c.location || '-'}</td>
                <td>${c.country || '-'}</td>
                <td style="font-family: var(--font-mono);">${c.altitude_meters ? `${c.altitude_meters}m` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="openCircuitHistoryModal(${c.circuitId}, '${escapeHtml(c.circuit_name)}')">
                        <i class="fa-solid fa-trophy"></i> Past Winners
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPaginationControls('circuits-pagination', p, 'changeCircuitsPage');
}

function changeCircuitsPage(newPage) {
    paginationState.circuits.page = newPage;
    renderPaginatedCircuits();
}

// Generic Pagination HTML Renderer
function renderPaginationControls(containerId, pState, changeFnName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPages = Math.ceil(pState.total / pState.limit) || 1;
    const startIdx = pState.total === 0 ? 0 : (pState.page - 1) * pState.limit + 1;
    const endIdx = Math.min(pState.page * pState.limit, pState.total);

    container.innerHTML = `
        <div>Showing <strong>${startIdx} - ${endIdx}</strong> of <strong>${pState.total}</strong> entries</div>
        <div class="pagination-controls">
            <button class="pagination-btn" ${pState.page <= 1 ? 'disabled' : ''} onclick="${changeFnName}(1)"><i class="fa-solid fa-angles-left"></i></button>
            <button class="pagination-btn" ${pState.page <= 1 ? 'disabled' : ''} onclick="${changeFnName}(${pState.page - 1})"><i class="fa-solid fa-chevron-left"></i> Prev</button>
            <span class="page-indicator">Page ${pState.page} / ${totalPages}</span>
            <button class="pagination-btn" ${pState.page >= totalPages ? 'disabled' : ''} onclick="${changeFnName}(${pState.page + 1})">Next <i class="fa-solid fa-chevron-right"></i></button>
            <button class="pagination-btn" ${pState.page >= totalPages ? 'disabled' : ''} onclick="${changeFnName}(${totalPages})"><i class="fa-solid fa-angles-right"></i></button>
        </div>
    `;
}

// Modals
async function openDriverProfileModal(driverId) {
    const modal = document.getElementById('f1-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-content');

    title.innerHTML = `<i class="fa-solid fa-user-astronaut"></i> Driver Career Profile`;
    body.innerHTML = `<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Loading career stats...</div>`;
    modal.classList.add('active');

    try {
        const res = await F1Api.getDriverProfile(driverId);
        const p = res.data;
        if (!p) {
            body.innerHTML = `<div class="text-center py-4 text-muted">No profile found for driver ID ${driverId}.</div>`;
            return;
        }

        body.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h2 style="font-family: var(--font-heading); font-size: 24px;">${renderWikiLink(p.full_name, p.driver_wiki_url)}</h2>
                <p class="text-muted">Nationality: <strong>${p.nationality}</strong> · DOB: ${p.birth_date || 'N/A'} · Car #${p.permanent_number || '-'}</p>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fa-solid fa-trophy"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Career Wins</span>
                        <h3>${p.total_career_wins}</h3>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fa-solid fa-medal"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Career Podiums</span>
                        <h3>${p.total_career_podiums}</h3>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fa-solid fa-flag-checkered"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Races Entered</span>
                        <h3>${p.total_races_entered}</h3>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fa-solid fa-star"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Career Points</span>
                        <h3>${p.total_career_points}</h3>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        body.innerHTML = `<div class="text-center py-4 text-muted">Error: ${e.message}</div>`;
    }
}

async function openCircuitHistoryModal(circuitId, circuitName) {
    const modal = document.getElementById('f1-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-content');

    title.innerHTML = `<i class="fa-solid fa-road"></i> Past Grand Prix Winners · ${circuitName}`;
    body.innerHTML = `<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Loading past winners...</div>`;
    modal.classList.add('active');

    try {
        const res = await F1Api.getCircuitHistory(circuitId);
        const history = res.data || [];
        if (history.length === 0) {
            body.innerHTML = `<div class="text-center py-4 text-muted">No recorded Grand Prix winner history for this circuit.</div>`;
            return;
        }

        body.innerHTML = `
            <div class="table-responsive">
                <table class="f1-table">
                    <thead>
                        <tr>
                            <th>Season</th>
                            <th>Grand Prix</th>
                            <th>Winning Driver</th>
                            <th>Winning Team</th>
                            <th>Winning Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td><strong>${h.year}</strong></td>
                                <td>${renderWikiLink(h.grand_prix_name, h.race_wiki_url)}</td>
                                <td>${renderWikiLink(h.winner_name, h.driver_wiki_url)}</td>
                                <td>${renderWikiLink(h.winning_team, h.constructor_wiki_url)}</td>
                                <td style="font-family: var(--font-mono);">${h.winning_time || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        body.innerHTML = `<div class="text-center py-4 text-muted">Error loading history: ${e.message}</div>`;
    }
}

function closeModal() {
    document.getElementById('f1-modal').classList.remove('active');
}

// =========================================================================
// 9. ADVANCED STRATEGY & PERFORMANCE ANALYTICS (Seasonal vs Historical Tabs)
// =========================================================================
function setAnalyticsCategory(cat) {
    currentAnalyticsCategory = cat;
    document.getElementById('btn-cat-seasonal').classList.toggle('active', cat === 'seasonal');
    document.getElementById('btn-cat-historical').classList.toggle('active', cat === 'historical');

    document.getElementById('seasonal-metrics-container').style.display = cat === 'seasonal' ? 'flex' : 'none';
    document.getElementById('historical-metrics-container').style.display = cat === 'historical' ? 'flex' : 'none';

    const metric = cat === 'seasonal'
        ? document.getElementById('seasonal-metric-select').value
        : document.getElementById('historical-metric-select').value;
    loadAnalyticsFeature(metric);
}


// =========================================================================
// DRIVER FORM INTERACTIVE LINE CHART (5-Race Moving Average)
// =========================================================================
let driverFormChartInstance = null;

function toggleDriverFormFilterDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('driverform-filter-menu');
    if (menu) menu.classList.toggle('active');
}

// Close filter dropdown on outside click
document.addEventListener('click', (e) => {
    const container = document.getElementById('driverform-filter-container');
    const menu = document.getElementById('driverform-filter-menu');
    if (container && menu && !container.contains(e.target)) {
        menu.classList.remove('active');
    }
});

function selectAllDriverForm(checked) {
    const checkboxes = document.querySelectorAll('.driverform-filter-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });

    if (driverFormChartInstance && driverFormChartInstance.data && driverFormChartInstance.data.datasets) {
        driverFormChartInstance.data.datasets.forEach(ds => {
            ds.hidden = !checked;
        });
        driverFormChartInstance.update();
    }

    updateDriverFormFilterCount();
}

function onDriverFormCheckboxChange(driverIdx, isChecked) {
    if (driverFormChartInstance && driverFormChartInstance.data && driverFormChartInstance.data.datasets[driverIdx]) {
        driverFormChartInstance.data.datasets[driverIdx].hidden = !isChecked;
        driverFormChartInstance.update();
    }
    updateDriverFormFilterCount();
}

function updateDriverFormFilterCount() {
    const checkboxes = document.querySelectorAll('.driverform-filter-checkbox');
    const total = checkboxes.length;
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const countEl = document.getElementById('driverform-filter-count');

    if (countEl) {
        if (checkedCount === total) {
            countEl.textContent = 'All';
        } else {
            countEl.textContent = `${checkedCount}/${total}`;
        }
    }
}

async function renderDriverFormLineChart(year, container) {
    if (driverFormChartInstance) {
        driverFormChartInstance.destroy();
        driverFormChartInstance = null;
    }

    const res = await F1Api.getDriverForm(year);
    const data = res.data || [];

    if (data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No rolling form data available for season ${year}.</div>`;
        return;
    }

    // 1. Extract sorted unique rounds with Grand Prix labels
    const roundMap = {};
    data.forEach(r => {
        if (!roundMap[r.round]) {
            const shortGp = (r.grand_prix || '').replace(/ Grand Prix$/, '').replace(/ GP$/, '');
            roundMap[r.round] = `R${r.round} ${shortGp}`;
        }
    });

    const sortedRounds = Object.keys(roundMap).map(Number).sort((a, b) => a - b);
    const roundLabels = sortedRounds.map(rnd => roundMap[rnd]);

    // 2. Group by driver and map to rounds
    const driversMap = {};
    data.forEach(row => {
        if (!driversMap[row.driver_name]) {
            driversMap[row.driver_name] = {
                name: row.driver_name,
                pointsPerRound: {},
                maxAvg: 0
            };
        }
        const val = (row.rolling_avg_points_5_races !== null && row.rolling_avg_points_5_races !== undefined)
            ? Number(Number(row.rolling_avg_points_5_races).toFixed(2))
            : null;
        driversMap[row.driver_name].pointsPerRound[row.round] = val;
        if (val !== null && val > driversMap[row.driver_name].maxAvg) {
            driversMap[row.driver_name].maxAvg = val;
        }
    });

    // Sort drivers by highest peak form so key competitors appear first
    const driverNames = Object.keys(driversMap).sort((a, b) => driversMap[b].maxAvg - driversMap[a].maxAvg);

    const palette = [
        '#e10600', '#00d2be', '#ffb800', '#ff8000', '#00d66c',
        '#0090ff', '#ffffff', '#e000ff', '#33b3a6', '#c0c0c0',
        '#e54d42', '#39b54a', '#a5673f', '#6739b6', '#f37b1d',
        '#1cbbb4', '#9c26b0', '#8dc63f', '#0081ff', '#fbbd08',
        '#d81b60', '#8e24aa', '#3949ab', '#00897b', '#7cb342'
    ];

    const defaultActiveCount = Math.min(6, driverNames.length);

    const datasets = driverNames.map((driverName, idx) => {
        const color = palette[idx % palette.length];
        const dData = sortedRounds.map(rnd => {
            const val = driversMap[driverName].pointsPerRound[rnd];
            return val !== undefined ? val : null;
        });

        const isHiddenByDefault = idx >= defaultActiveCount;

        return {
            label: driverName,
            data: dData,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: color,
            pointBorderColor: '#15151e',
            pointBorderWidth: 1.5,
            tension: 0.3,
            spanGaps: true,
            hidden: isHiddenByDefault
        };
    });

    // 3. Render Chart DOM Structure
    container.innerHTML = `
        <div class="p-3" style="background: rgba(0,0,0,0.15);">
            <div class="flex-between flex-wrap gap-2 mb-2 pb-2" style="border-bottom: 1px solid var(--f1-border-subtle); justify-content: flex-end;">
                <div class="driver-filter-dropdown-container" id="driverform-filter-container">
                    <button class="btn btn-sm btn-outline driver-filter-btn" onclick="toggleDriverFormFilterDropdown(event)">
                        <span class="driver-filter-btn-left"><i class="fa-solid fa-users"></i><span>Filter Drivers (<span id="driverform-filter-count">${defaultActiveCount}/${driverNames.length}</span>)</span></span><i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="driver-filter-menu" id="driverform-filter-menu">
                        <div class="filter-menu-header">
                            <span>Select Drivers</span>
                            <div class="filter-actions">
                                <button class="btn-text-action" onclick="selectAllDriverForm(true)">All</button>
                                <button class="btn-text-action" onclick="selectAllDriverForm(false)">None</button>
                            </div>
                        </div>
                        <div class="filter-checkbox-list" id="driverform-checkbox-list" style="max-height: 280px; overflow-y: auto;">
                            ${driverNames.map((name, idx) => {
                                const color = palette[idx % palette.length];
                                const checked = idx < defaultActiveCount ? 'checked' : '';
                                return `
                                    <label class="driver-check-label">
                                        <input type="checkbox" class="driverform-filter-checkbox" ${checked} onchange="onDriverFormCheckboxChange(${idx}, this.checked)">
                                        <span class="driver-color-dot" style="background: ${color};"></span>
                                        <span>${escapeHtml(name)}</span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="chart-wrapper" style="position: relative; height: 420px; width: 100%;">
                <canvas id="driverFormChartCanvas"></canvas>
            </div>
        </div>
    `;

    updateDriverFormFilterCount();

    // Compute dynamic peak value across all datasets
    let globalPeak = 25;
    data.forEach(r => {
        if (r.rolling_avg_points_5_races && Number(r.rolling_avg_points_5_races) > globalPeak) {
            globalPeak = Number(r.rolling_avg_points_5_races);
        }
    });
    const calculatedMax = Math.ceil(globalPeak) + 3.5;

    // 4. Initialize Chart.js
    const ctx = document.getElementById('driverFormChartCanvas').getContext('2d');
    driverFormChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: roundLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25,
                    bottom: 20,
                    left: 10,
                    right: 15
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
                axis: 'x'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(21, 21, 30, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#e0e0e0',
                    borderColor: 'rgba(225, 6, 0, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    callbacks: {
                        label: function (context) {
                            const val = context.parsed.y;
                            return ` ${context.dataset.label}: ${val !== null ? val.toFixed(2) : '-'} pts/race (5-Race Avg)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#8b93a7',
                        font: { family: 'Inter', size: 11, weight: '600' }
                    }
                },
                y: {
                    min: -1.8,
                    max: calculatedMax,
                    title: {
                        display: true,
                        text: '5-Race Moving Avg Points',
                        color: '#8b93a7',
                        font: { family: 'Inter', size: 12, weight: '700' }
                    },
                    grid: {
                        color: function (context) {
                            if (context.tick && (context.tick.value < 0 || context.tick.value > calculatedMax - 1)) return 'transparent';
                            return 'rgba(255, 255, 255, 0.06)';
                        }
                    },
                    ticks: {
                        stepSize: 5,
                        color: '#8b93a7',
                        font: { family: 'Inter', size: 11 },
                        callback: function (value) {
                            if (value < 0 || value > calculatedMax - 1) return '';
                            if (Number.isInteger(value)) {
                                return value + ' pts';
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}


// =========================================================================
// CUMULATIVE POINTS PROGRESSION INTERACTIVE LINE CHART
// =========================================================================
let pointsProgressionChartInstance = null;

function togglePointsProgressionFilterDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('pointsprog-filter-menu');
    if (menu) menu.classList.toggle('active');
}

// Close filter dropdown on outside click
document.addEventListener('click', (e) => {
    const container = document.getElementById('pointsprog-filter-container');
    const menu = document.getElementById('pointsprog-filter-menu');
    if (container && menu && !container.contains(e.target)) {
        menu.classList.remove('active');
    }
});

function selectAllPointsProgression(checked) {
    const checkboxes = document.querySelectorAll('.pointsprog-filter-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });

    if (pointsProgressionChartInstance && pointsProgressionChartInstance.data && pointsProgressionChartInstance.data.datasets) {
        pointsProgressionChartInstance.data.datasets.forEach(ds => {
            ds.hidden = !checked;
        });
        pointsProgressionChartInstance.update();
    }

    updatePointsProgressionFilterCount();
}

function onPointsProgressionCheckboxChange(driverIdx, isChecked) {
    if (pointsProgressionChartInstance && pointsProgressionChartInstance.data && pointsProgressionChartInstance.data.datasets[driverIdx]) {
        pointsProgressionChartInstance.data.datasets[driverIdx].hidden = !isChecked;
        pointsProgressionChartInstance.update();
    }
    updatePointsProgressionFilterCount();
}

function updatePointsProgressionFilterCount() {
    const checkboxes = document.querySelectorAll('.pointsprog-filter-checkbox');
    const total = checkboxes.length;
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const countEl = document.getElementById('pointsprog-filter-count');

    if (countEl) {
        if (checkedCount === total) {
            countEl.textContent = 'All';
        } else {
            countEl.textContent = `${checkedCount}/${total}`;
        }
    }
}

async function renderPointsProgressionLineChart(year, container) {
    if (pointsProgressionChartInstance) {
        pointsProgressionChartInstance.destroy();
        pointsProgressionChartInstance = null;
    }

    const res = await F1Api.getPointsProgression(year);
    const data = res.data || [];

    if (data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No points trajectory data available for season ${year}.</div>`;
        return;
    }

    // 1. Extract sorted unique rounds with Grand Prix labels
    const roundMap = {};
    data.forEach(r => {
        if (!roundMap[r.round]) {
            const shortGp = (r.grand_prix || '').replace(/ Grand Prix$/, '').replace(/ GP$/, '');
            roundMap[r.round] = `R${r.round} ${shortGp}`;
        }
    });

    const sortedRounds = Object.keys(roundMap).map(Number).sort((a, b) => a - b);
    const roundLabels = sortedRounds.map(rnd => roundMap[rnd]);

    // 2. Group by driver and map cumulative points to rounds
    const driversMap = {};
    let globalPeakPts = 0;

    data.forEach(row => {
        if (!driversMap[row.driver_name]) {
            driversMap[row.driver_name] = {
                name: row.driver_name,
                pointsPerRound: {},
                totalPts: 0
            };
        }
        const pts = (row.cumulative_season_points !== null && row.cumulative_season_points !== undefined)
            ? Number(row.cumulative_season_points)
            : 0;
        driversMap[row.driver_name].pointsPerRound[row.round] = pts;
        if (pts > driversMap[row.driver_name].totalPts) {
            driversMap[row.driver_name].totalPts = pts;
        }
        if (pts > globalPeakPts) {
            globalPeakPts = pts;
        }
    });

    // Sort drivers by highest final championship points
    const driverNames = Object.keys(driversMap).sort((a, b) => driversMap[b].totalPts - driversMap[a].totalPts);

    const palette = [
        '#e10600', '#00d2be', '#ffb800', '#ff8000', '#00d66c',
        '#0090ff', '#ffffff', '#e000ff', '#33b3a6', '#c0c0c0',
        '#e54d42', '#39b54a', '#a5673f', '#6739b6', '#f37b1d',
        '#1cbbb4', '#9c26b0', '#8dc63f', '#0081ff', '#fbbd08',
        '#d81b60', '#8e24aa', '#3949ab', '#00897b', '#7cb342'
    ];

    const defaultActiveCount = Math.min(6, driverNames.length);

    const datasets = driverNames.map((driverName, idx) => {
        const color = palette[idx % palette.length];
        let lastKnownPts = 0;
        const dData = sortedRounds.map(rnd => {
            const val = driversMap[driverName].pointsPerRound[rnd];
            if (val !== undefined) {
                lastKnownPts = val;
                return val;
            }
            return lastKnownPts;
        });

        const isHiddenByDefault = idx >= defaultActiveCount;

        return {
            label: driverName,
            data: dData,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: color,
            pointBorderColor: '#15151e',
            pointBorderWidth: 1.5,
            tension: 0.25,
            spanGaps: true,
            hidden: isHiddenByDefault
        };
    });

    const calculatedMax = globalPeakPts > 0 ? Math.ceil(globalPeakPts * 1.08) : 50;
    const yStep = globalPeakPts > 200 ? 50 : (globalPeakPts > 100 ? 25 : 10);
    const bottomMin = -(Math.max(2, Math.ceil(calculatedMax * 0.05)));

    // 3. Render Chart DOM Structure
    container.innerHTML = `
        <div class="p-3" style="background: rgba(0,0,0,0.15);">
            <div class="flex-between flex-wrap gap-2 mb-2 pb-2" style="border-bottom: 1px solid var(--f1-border-subtle); justify-content: flex-end;">
                <div class="driver-filter-dropdown-container" id="pointsprog-filter-container">
                    <button class="btn btn-sm btn-outline driver-filter-btn" onclick="togglePointsProgressionFilterDropdown(event)">
                        <span class="driver-filter-btn-left"><i class="fa-solid fa-users"></i><span>Filter Drivers (<span id="pointsprog-filter-count">${defaultActiveCount}/${driverNames.length}</span>)</span></span><i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="driver-filter-menu" id="pointsprog-filter-menu">
                        <div class="filter-menu-header">
                            <span>Select Drivers</span>
                            <div class="filter-actions">
                                <button class="btn-text-action" onclick="selectAllPointsProgression(true)">All</button>
                                <button class="btn-text-action" onclick="selectAllPointsProgression(false)">None</button>
                            </div>
                        </div>
                        <div class="filter-checkbox-list" id="pointsprog-checkbox-list" style="max-height: 280px; overflow-y: auto;">
                            ${driverNames.map((name, idx) => {
                                const color = palette[idx % palette.length];
                                const checked = idx < defaultActiveCount ? 'checked' : '';
                                const total = driversMap[name].totalPts;
                                return `
                                    <label class="driver-check-label">
                                        <input type="checkbox" class="driverform-filter-checkbox pointsprog-filter-checkbox" ${checked} onchange="onPointsProgressionCheckboxChange(${idx}, this.checked)">
                                        <span class="driver-color-dot" style="background: ${color};"></span>
                                        <span>${escapeHtml(name)} <small class="text-muted" style="font-family: var(--font-mono); font-weight: 700;">(${total} PTS)</small></span>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="chart-wrapper" style="position: relative; height: 430px; width: 100%;">
                <canvas id="pointsProgressionChartCanvas"></canvas>
            </div>
        </div>
    `;

    updatePointsProgressionFilterCount();

    // 4. Initialize Chart.js
    const ctx = document.getElementById('pointsProgressionChartCanvas').getContext('2d');
    pointsProgressionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: roundLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25,
                    bottom: 20,
                    left: 10,
                    right: 15
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
                axis: 'x'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(21, 21, 30, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#e0e0e0',
                    borderColor: 'rgba(225, 6, 0, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    callbacks: {
                        label: function (context) {
                            const val = context.parsed.y;
                            return ` ${context.dataset.label}: ${val} PTS (Cumulative)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#8b93a7',
                        font: { family: 'Inter', size: 11, weight: '600' }
                    }
                },
                y: {
                    min: bottomMin,
                    max: calculatedMax,
                    title: {
                        display: true,
                        text: 'Cumulative Championship Points',
                        color: '#8b93a7',
                        font: { family: 'Inter', size: 12, weight: '700' }
                    },
                    grid: {
                        color: function (context) {
                            if (context.tick && (context.tick.value < 0 || context.tick.value > calculatedMax - 2)) return 'transparent';
                            return 'rgba(255, 255, 255, 0.06)';
                        }
                    },
                    ticks: {
                        stepSize: yStep,
                        color: '#8b93a7',
                        font: { family: 'Inter', size: 11 },
                        callback: function (value) {
                            if (value < 0 || value > calculatedMax - 2) return '';
                            return value + ' PTS';
                        }
                    }
                }
            }
        }
    });
}


// =========================================================================
// TEAMMATE QUALIFYING BATTLES (Visual Head-to-Head Duel Cards)
// =========================================================================
function renderTeammateBattleCards(data, container, year) {
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No teammate qualifying battle data recorded for season ${year}.</div>`;
        return;
    }

    // Group drivers by Constructor Team
    const teamGroups = {};
    data.forEach(r => {
        if (!teamGroups[r.team_name]) {
            teamGroups[r.team_name] = [];
        }
        teamGroups[r.team_name].push(r);
    });

    const teamNames = Object.keys(teamGroups);

    container.innerHTML = `
        <div style="padding: 16px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px;">
                ${teamNames.map(teamName => {
                    const drivers = teamGroups[teamName];
                    const d1 = drivers[0];
                    const d2 = drivers[1] || { driver_name: 'No Teammate', outqualified_teammate_count: 0, total_sessions_entered: d1.total_sessions_entered };
                    
                    const score1 = Number(d1.outqualified_teammate_count) || 0;
                    const score2 = Number(d2.outqualified_teammate_count) || 0;
                    const totalDuels = (score1 + score2) || 1;
                    const p1 = Math.round((score1 / totalDuels) * 100);
                    const p2 = 100 - p1;
                    const isTie = score1 === score2;

                    return `
                        <div class="race-card" style="background: linear-gradient(145deg, #1d1d2b 0%, #151520 100%); padding: 16px 18px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <!-- Header -->
                                <div class="flex-between" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 14px;">
                                    <span style="font-family: var(--font-heading); font-weight: 800; font-size: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <i class="fa-solid fa-car text-danger" style="margin-right: 6px;"></i> ${escapeHtml(teamName)}
                                    </span>
                                    <span class="badge badge-neutral" style="font-size: 10.5px; font-weight: 700;">
                                        ${d1.total_sessions_entered} SESSIONS
                                    </span>
                                </div>

                                <!-- Drivers Duel Row -->
                                <div class="flex-between" style="align-items: center; margin-bottom: 14px;">
                                    <!-- Driver 1 -->
                                    <div style="text-align: left; flex: 1;">
                                        <div style="font-size: 10.5px; color: ${score1 > score2 ? 'var(--f1-gold)' : 'var(--f1-text-muted)'}; font-weight: 800; text-transform: uppercase;">
                                            ${score1 > score2 ? '<i class="fa-solid fa-crown"></i> LEADER' : (isTie ? 'TIED' : 'TRAILED')}
                                        </div>
                                        <div style="font-family: var(--font-heading); font-weight: 800; font-size: 15px; color: #ffffff; margin-top: 2px;">
                                            ${escapeHtml(d1.driver_name)}
                                        </div>
                                        <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 800; color: ${score1 >= score2 ? 'var(--f1-cyan)' : 'var(--f1-text-muted)'}; line-height: 1.1; margin-top: 4px;">
                                            ${score1} <span style="font-size: 12px; color: var(--f1-text-muted); font-weight: 600;">WINS</span>
                                        </div>
                                    </div>

                                    <!-- VS Center Badge -->
                                    <div style="text-align: center; padding: 0 12px;">
                                        <span class="badge badge-f1" style="font-size: 11px; padding: 4px 8px; letter-spacing: 1px;">VS</span>
                                    </div>

                                    <!-- Driver 2 -->
                                    <div style="text-align: right; flex: 1;">
                                        <div style="font-size: 10.5px; color: ${score2 > score1 ? 'var(--f1-gold)' : 'var(--f1-text-muted)'}; font-weight: 800; text-transform: uppercase;">
                                            ${score2 > score1 ? '<i class="fa-solid fa-crown"></i> LEADER' : (isTie ? 'TIED' : 'TRAILED')}
                                        </div>
                                        <div style="font-family: var(--font-heading); font-weight: 800; font-size: 15px; color: #ffffff; margin-top: 2px;">
                                            ${escapeHtml(d2.driver_name)}
                                        </div>
                                        <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 800; color: ${score2 >= score1 ? 'var(--f1-cyan)' : 'var(--f1-text-muted)'}; line-height: 1.1; margin-top: 4px;">
                                            ${score2} <span style="font-size: 12px; color: var(--f1-text-muted); font-weight: 600;">WINS</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Dual Visual Split Progress Bar -->
                                <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden; display: flex; margin-bottom: 6px;">
                                    <div style="width: ${p1}%; background: ${score1 >= score2 ? 'linear-gradient(90deg, var(--f1-red), var(--f1-cyan))' : 'rgba(255,255,255,0.2)'}; transition: width 0.4s ease;"></div>
                                    <div style="width: ${p2}%; background: ${score2 > score1 ? 'linear-gradient(90deg, var(--f1-cyan), var(--f1-red))' : 'rgba(255,255,255,0.2)'}; transition: width 0.4s ease;"></div>
                                </div>

                                <div class="flex-between" style="font-size: 11px; font-family: var(--font-mono); color: var(--f1-text-muted);">
                                    <span>${p1}% Dominance</span>
                                    <span>${p2}% Dominance</span>
                                </div>
                            </div>

                            ${drivers.length > 2 ? `
                            <div style="margin-top: 10px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.06); font-size: 10.5px; color: var(--f1-text-muted);">
                                <i class="fa-solid fa-user-clock"></i> Reserve/Sub Drivers: ${drivers.slice(2).map(dr => `<strong>${escapeHtml(dr.driver_name)}</strong> (${dr.outqualified_teammate_count}W/${dr.total_sessions_entered})`).join(', ')}
                            </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

async function loadAnalyticsFeature(featureKey) {
    if (driverFormChartInstance) {
        driverFormChartInstance.destroy();
        driverFormChartInstance = null;
    }
    if (pointsProgressionChartInstance) {
        pointsProgressionChartInstance.destroy();
        pointsProgressionChartInstance = null;
    }
    const container = document.getElementById('analytics-table-container');
    const title = document.getElementById('analytics-card-title');
    const badge = document.getElementById('analytics-card-badge');

    container.innerHTML = `<div class="p-5 text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Running telemetry query...</div>`;

    try {
        switch (featureKey) {
            // Seasonal Metrics (React to currentSeason)
            case 'biggest-movers':
                title.innerHTML = `<i class="fa-solid fa-forward-fast"></i> Greatest Comebacks & Positions Gained (${currentSeason})`;
                badge.textContent = `Grid vs Finish Delta`;
                const bmRes = await F1Api.getBiggestMovers(currentSeason);
                renderSimpleAnalyticsTable(container, bmRes.data || [], [
                    { label: 'Grand Prix', field: 'grand_prix', render: (r) => renderWikiLink(r.grand_prix, r.race_wiki_url) },
                    { label: 'Driver', field: 'driver_name', render: (r) => renderWikiLink(r.driver_name, r.driver_wiki_url) },
                    { label: 'Team', field: 'team_name' },
                    { label: 'Starting Grid', field: 'starting_grid', render: (r) => `P${r.starting_grid}` },
                    { label: 'Finish Pos', field: 'finish_position', render: (r) => `P${r.finish_position}` },
                    { label: 'Positions Gained', field: 'positions_gained', render: (r) => `<span class="badge badge-success">+${r.positions_gained} Places</span>` }
                ]);
                break;

            case 'pit-stops-eff':
                title.innerHTML = `<i class="fa-solid fa-wrench"></i> Pit Stop Efficiency & Duration by Team (${currentSeason})`;
                badge.textContent = `Average Duration`;
                const psRes = await F1Api.getPitStopEfficiency(currentSeason);
                renderSimpleAnalyticsTable(container, psRes.data || [], [
                    { label: 'Constructor Team', field: 'team_name', render: (r) => renderWikiLink(r.team_name, r.constructor_wiki_url) },
                    { label: 'Total Pit Stops', field: 'total_pit_stops' },
                    { label: 'Average Stop Time', field: 'avg_duration_seconds', render: (r) => `<span style="font-family: var(--font-mono); font-weight: bold; color: var(--f1-cyan);">${r.avg_duration_seconds}s</span>` },
                    { label: 'Fastest Stop Recorded', field: 'fastest_stop_seconds', render: (r) => `<span style="font-family: var(--font-mono); color: var(--f1-green);">${r.fastest_stop_seconds}s</span>` }
                ]);
                break;

            case 'teammate-quali':
                title.innerHTML = `<i class="fa-solid fa-users-between-lines"></i> Teammate Qualifying Battles & Head-to-Head (${currentSeason})`;
                badge.textContent = `Duel Battles`;
                const tqRes = await F1Api.getTeammateQualifying(currentSeason);
                renderTeammateBattleCards(tqRes.data || [], container, currentSeason);
                break;

            case 'driver-form':
                title.innerHTML = `<i class="fa-solid fa-chart-line"></i> Driver Rolling Form Trend (5-Race Moving Avg) (${currentSeason})`;
                badge.textContent = `Moving Avg Trend`;
                await renderDriverFormLineChart(currentSeason, container);
                break;

            case 'points-progression':
                title.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> Cumulative Season Points Trajectory (${currentSeason})`;
                badge.textContent = `Championship Trajectory`;
                await renderPointsProgressionLineChart(currentSeason, container);
                break;

            // Historical Intelligence Metrics
            case 'pole-to-win':
                title.innerHTML = `<i class="fa-solid fa-trophy"></i> Pole-to-Win Conversion Rate (Historical)`;
                badge.textContent = `Pole Mastery`;
                const pwRes = await F1Api.getPoleToWinRate(2010);
                renderSimpleAnalyticsTable(container, pwRes.data || [], [
                    { label: 'Season Year', field: 'year', render: (r) => `<strong>${r.year}</strong>` },
                    { label: 'Total Races', field: 'total_races' },
                    { label: 'Pole Sitter Won Race', field: 'pole_and_won_count' },
                    { label: 'Conversion %', field: 'pole_to_win_percentage', render: (r) => `<span class="badge ${Number(r.pole_to_win_percentage) >= 50 ? 'badge-success' : 'badge-warning'}">${r.pole_to_win_percentage}%</span>` }
                ]);
                break;

            case 'dnf-circuits':
                title.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> High DNF & Incident-Prone Tracks (All-Time)`;
                badge.textContent = `Track Risk`;
                const dnfRes = await F1Api.getHighDnfCircuits();
                renderSimpleAnalyticsTable(container, dnfRes.data || [], [
                    { label: 'Circuit Name', field: 'circuit_name', render: (r) => renderWikiLink(r.circuit_name, r.circuit_wiki_url) },
                    { label: 'Country', field: 'country' },
                    { label: 'Total DNF Incidents', field: 'total_dnf_incidents', render: (r) => `<span class="badge badge-danger">${r.total_dnf_incidents} DNFs</span>` }
                ]);
                break;

            case 'deep-grid-wins':
                title.innerHTML = `<i class="fa-solid fa-crown"></i> Miracle Wins from Deepest Starting Grid (P10+)`;
                badge.textContent = `Comeback Wins`;
                const dwRes = await F1Api.getDeepGridWins();
                renderSimpleAnalyticsTable(container, dwRes.data || [], [
                    { label: 'Season', field: 'year' },
                    { label: 'Grand Prix', field: 'grand_prix', render: (r) => renderWikiLink(r.grand_prix, r.race_wiki_url) },
                    { label: 'Winning Driver', field: 'driver_name', render: (r) => renderWikiLink(r.driver_name, r.driver_wiki_url) },
                    { label: 'Team', field: 'team_name' },
                    { label: 'Starting Grid', field: 'starting_grid_position', render: (r) => `<span class="badge badge-warning">Started P${r.starting_grid_position}</span>` }
                ]);
                break;

            case 'most-laps-led':
                title.innerHTML = `<i class="fa-solid fa-stopwatch-20"></i> All-Time Laps Led (P1 Race Leaders)`;
                badge.textContent = `Dominance`;
                const mllRes = await F1Api.getMostLapsLed();
                renderSimpleAnalyticsTable(container, mllRes.data || [], [
                    { label: 'Rank', field: 'rank', render: (_, idx) => `<span class="pos-${idx + 1}">#${idx + 1}</span>` },
                    { label: 'Driver', field: 'driver_name', render: (r) => renderWikiLink(r.driver_name, r.driver_wiki_url) },
                    { label: 'Total Laps Led in P1', field: 'total_laps_led', render: (r) => `<span style="font-family: var(--font-mono); font-weight: bold; font-size: 14px;">${r.total_laps_led} Laps</span>` }
                ]);
                break;

            case 'fastest-speeds':
                title.innerHTML = `<i class="fa-solid fa-gauge-high"></i> Fastest Race Speed Traps Recorded in History`;
                badge.textContent = `Speed Traps`;
                const fsRes = await F1Api.getFastestSpeeds();
                renderSimpleAnalyticsTable(container, fsRes.data || [], [
                    { label: 'Year', field: 'year' },
                    { label: 'Grand Prix', field: 'grand_prix' },
                    { label: 'Circuit', field: 'circuit_name', render: (r) => renderWikiLink(r.circuit_name, r.circuit_wiki_url) },
                    { label: 'Driver', field: 'driver_name', render: (r) => renderWikiLink(r.driver_name, r.driver_wiki_url) },
                    { label: 'Top Speed (km/h)', field: 'max_speed_kmh', render: (r) => `<span style="font-family: var(--font-mono); font-weight: 800; color: var(--f1-red); font-size: 14px;">${r.max_speed_kmh} km/h</span>` },
                    { label: 'Lap Time', field: 'fastestLapTime', render: (r) => `<span style="font-family: var(--font-mono);">${r.fastestLapTime || '-'}</span>` }
                ]);
                break;

            case 'all-time-winners':
                title.innerHTML = `<i class="fa-solid fa-medal"></i> All-Time Grand Prix Winners (Hall of Fame)`;
                badge.textContent = `Hall of Fame`;
                const atwRes = await F1Api.getAllTimeWinners();
                renderSimpleAnalyticsTable(container, atwRes.data || [], [
                    { label: 'Rank', field: 'rank', render: (_, idx) => `<span class="pos-${idx + 1}">#${idx + 1}</span>` },
                    { label: 'Driver', field: 'driver_name', render: (r) => renderWikiLink(r.driver_name, r.driver_wiki_url) },
                    { label: 'Nationality', field: 'nationality' },
                    { label: 'Career Grand Prix Wins', field: 'total_race_wins', render: (r) => `<span class="badge badge-f1" style="font-size: 13px;">${r.total_race_wins} Wins</span>` }
                ]);
                break;

            case 'constructor-one-twos':
                title.innerHTML = `<i class="fa-solid fa-car"></i> Constructor 1-2 Finishes in History`;
                badge.textContent = `Team Dominance`;
                const cotRes = await F1Api.getConstructorOneTwos();
                renderSimpleAnalyticsTable(container, cotRes.data || [], [
                    { label: 'Constructor Team', field: 'team_name' },
                    { label: 'Season', field: 'year' },
                    { label: '1-2 Finishes in Season', field: 'total_one_two_finishes', render: (r) => `<span class="badge badge-success">${r.total_one_two_finishes} Times</span>` }
                ]);
                break;

            case 'youngest-winners':
                title.innerHTML = `<i class="fa-solid fa-baby"></i> Youngest Race Winners in F1 History`;
                badge.textContent = `Prodigies`;
                const ywRes = await F1Api.getYoungestWinners();
                renderSimpleAnalyticsTable(container, ywRes.data || [], [
                    { label: 'Driver', field: 'driver_name', render: (r) => renderWikiLink(r.driver_name, r.driver_wiki_url) },
                    { label: 'Age at First Win', field: 'age_years', render: (r) => `<strong>${r.age_years} yrs ${r.age_months} mos ${r.age_days} days</strong>` },
                    { label: 'Grand Prix', field: 'grand_prix', render: (r) => renderWikiLink(r.grand_prix, r.race_wiki_url) },
                    { label: 'Race Date', field: 'race_date' },
                    { label: 'Birth Date', field: 'birth_date' }
                ]);
                break;

            case 'circuit-masters':
                title.innerHTML = `<i class="fa-solid fa-chess-king"></i> King of the Circuit (Mastery per Track)`;
                badge.textContent = `Circuit Mastery`;
                const cmRes = await F1Api.getCircuitMasters();
                renderSimpleAnalyticsTable(container, cmRes.data || [], [
                    { label: 'Circuit Name', field: 'circuit_name', render: (r) => renderWikiLink(r.circuit_name, r.circuit_wiki_url) },
                    { label: 'Country', field: 'country' },
                    { label: 'Driver with Most Wins', field: 'driver_name', render: (r) => renderWikiLink(r.driver_name, r.driver_wiki_url) },
                    { label: 'Track Wins', field: 'total_wins_at_circuit', render: (r) => `<span class="badge badge-f1">${r.total_wins_at_circuit} Wins</span>` }
                ]);
                break;
        }
    } catch (e) {
        container.innerHTML = `<div class="p-5 text-center text-muted">Error running analytics: ${e.message}</div>`;
    }
}

function renderSimpleAnalyticsTable(container, rows, columns) {
    if (!rows || rows.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">No analytics records returned for this metric in season ${currentSeason}.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="f1-table" id="analytics-active-table">
            <thead>
                <tr>
                    ${columns.map(c => `<th data-sort="${c.field}">${c.label} <span class="sort-icon"></span></th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map((row, idx) => `
                    <tr>
                        ${columns.map(c => `<td>${c.render ? c.render(row, idx) : (row[c.field] !== undefined ? row[c.field] : '-')}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}


// ==============================================================================
// Last Sync Metadata Controller (ETL Database Sync Status)
// ==============================================================================
let lastSyncMetadata = null;

async function loadLastSyncStatus() {
    const displayEl = document.getElementById('last-update-display');
    const dotEl = document.getElementById('sync-status-dot');
    if (!displayEl) return;

    try {
        const res = await F1Api.getLastSync();
        if (res && res.success && res.data) {
            lastSyncMetadata = res.data;
            renderLastSyncDisplay();
        } else {
            displayEl.textContent = 'Up to date';
            displayEl.classList.remove('loading');
            if (dotEl) dotEl.innerHTML = '<span class="sync-dot pulse-green"></span>';
        }
    } catch (e) {
        console.warn('Could not fetch last sync metadata:', e);
        displayEl.textContent = 'Up to date';
        displayEl.classList.remove('loading');
        if (dotEl) dotEl.innerHTML = '<span class="sync-dot pulse-green"></span>';
    }
}

function renderLastSyncDisplay() {
    const displayEl = document.getElementById('last-update-display');
    const dotEl = document.getElementById('sync-status-dot');
    if (!displayEl || !lastSyncMetadata) return;

    displayEl.classList.remove('loading');
    
    // Status color
    const isSuccess = lastSyncMetadata.status === 'SUCCESS';
    if (dotEl) {
        dotEl.innerHTML = isSuccess 
            ? '<span class="sync-dot pulse-green" title="Database Synced"></span>' 
            : '<span class="sync-dot pulse-amber" title="Sync Status: ' + (lastSyncMetadata.status || 'Pending') + '"></span>';
    }

    const rawStr = currentTz === 'WIB' 
        ? (lastSyncMetadata.last_synced_at_wib || lastSyncMetadata.last_synced_at_utc || 'Synced')
        : (lastSyncMetadata.last_synced_at_utc || lastSyncMetadata.last_synced_at_wib || 'Synced');

    let shortStr = rawStr;
    const parts = rawStr.split(' ');
    if (parts.length >= 3) {
        const timePart = parts[1].substring(0, 5);
        const tzPart = parts[2];
        shortStr = `${timePart} ${tzPart}`;
    }

    displayEl.innerHTML = `<span class="sync-time-full">${rawStr}</span><span class="sync-time-short">${shortStr}</span>`;
    displayEl.setAttribute('title', `Last Synchronized: ${rawStr}`);

    // Update Popover Details if present
    const popStatus = document.getElementById('popover-sync-status');
    const popWib = document.getElementById('popover-sync-wib');
    const popUtc = document.getElementById('popover-sync-utc');
    const popTables = document.getElementById('popover-sync-tables');

    if (popStatus) {
        popStatus.textContent = lastSyncMetadata.status || 'SUCCESS';
    }
    if (popWib) popWib.textContent = lastSyncMetadata.last_synced_at_wib || '-';
    if (popUtc) popUtc.textContent = lastSyncMetadata.last_synced_at_utc || '-';
    if (popTables) popTables.textContent = `${lastSyncMetadata.total_tables_synced || 14} tables`;
}

// Global outside click handler for dropdowns & popovers
document.addEventListener('click', (e) => {
    // 1. Season dropdown
    const seasonWrapper = document.querySelector('.custom-season-dropdown-wrapper');
    if (seasonWrapper && !seasonWrapper.contains(e.target)) {
        seasonWrapper.classList.remove('active');
    }

    // 2. Sync tooltip popover
    const syncContainer = document.getElementById('last-update-container');
    if (syncContainer && !syncContainer.contains(e.target)) {
        syncContainer.classList.remove('active');
    }

    // 3. Driver filters
    const driverFilterContainer = document.querySelector('.driver-filter-dropdown-container');
    const driverFilterMenu = document.getElementById('driver-filter-menu');
    if (driverFilterContainer && driverFilterMenu && !driverFilterContainer.contains(e.target)) {
        driverFilterMenu.classList.remove('active');
    }
});
