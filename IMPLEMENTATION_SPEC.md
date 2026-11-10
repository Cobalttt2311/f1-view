# 🏎️ IMPLEMENTATION SPECIFICATION & GAP AUDIT
## Tifosi (f1-view) ➔ React 1:1 Pixel-Perfect & Data-Exact Migration

> **Dokumen Audit & Spesifikasi Implementasi 100% Presisi**  
> **Referensi Utama:** `legacy/index.legacy.html`, `legacy/js/app.js`, `legacy/js/api.js`, dan live site [Tifosi - Telemetry & Information for Formula One Statistics & Insights](https://f1-view-nine.vercel.app/dashboard)  
> **Tujuan:** Menyelaraskan seluruh tampilan visual (UI/CSS), daftar menu, interaktivitas, dan data API schema agar 100% identik dengan versi aslinya tanpa deviasi.

---

## 1. Analisis & Root Cause Mengapa Tampilan & Data Berbeda

Berikut adalah hasil investigasi detail penyebab mengapa versi React sebelumnya terlihat berbeda dan data tidak muncul lengkap:

### 🔴 1.1 Masalah UI & CSS
1. **Garis Bawah (Underline) pada Sidebar:**
   - **Penyebab:** Pada legacy, menu sidebar menggunakan tag `<button class="nav-item">`. Di React, digunakan `<NavLink to="...">` yang dirender sebagai tag `<a>`. Tag `<a>` secara default memiliki `text-decoration: underline` dari browser karena class `.nav-item` di `styles.css` belum memiliki `text-decoration: none;`.
2. **Daftar Menu Sidebar Tidak Sama:**
   - **Penyebab:** Di legacy terdapat tepat **11 menu** yang terbagi dalam 3 kategori:
     - **CORE RACING**: Dashboard, Race Calendar, Free Practice (FP1-3), Sprint Weekends, Championship Standings.
     * **GRAND PRIX WEEKEND**: Race Weekend Hub, Lap Chart Progression.
     * **DATABASE & STATS**: Drivers Directory, Constructors Directory, Circuits & Winners, Advanced Analytics.
   - Sebelumnya, menu *Drivers*, *Constructors*, dan *Circuits* disederhanakan menjadi 1 menu ("Directories Database"), serta menu *Practices* dan *Sprints* belum dipasang di Sidebar.
3. **Sidebar Collapse Button Hilang:**
   - Di legacy, di samping teks `MENU` terdapat tombol `sidebar-collapse-btn` (`<i class="fa-solid fa-chevron-left icon-collapse"></i>` / `icon-expand`) yang dapat melipat sidebar menjadi icon-only (lebar 64px).
4. **Header Season Selector Berbeda:**
   - Di legacy, Season Selector **bukanlah elemen HTML `<select>` bawaan**, melainkan kustom UI dengan struktur:
     ```html
     <div class="global-season-container custom-season-dropdown-wrapper">
         <span class="global-control-label"><i class="fa-solid fa-flag-checkered"></i> Season:</span>
         <div class="custom-season-select-box">
             <span id="selected-season-display">
                 <span class="season-full">2026 Season</span>
                 <span class="season-short">2026</span>
             </span>
             <i class="fa-solid fa-chevron-down season-chevron"></i>
         </div>
         <div class="custom-season-menu">
             <div class="season-options-list">...scrollable 1950 - 2026...</div>
         </div>
     </div>
     ```
     CSS sudah memiliki styling `.custom-season-select-box`, `.custom-season-menu`, dll. Namun di React kemarin masih dirender sebagai `<select class="btn ...">` standar browser.

---

### 🔴 1.2 Masalah Data API (Mengapa Poin, Tim, dan Wins Kosong / Bug)
Backend FastAPI `f1-api-neon` memiliki skema atribut khusus. Kode React kemarin menggunakan nama properti umum (seperti `row.points`, `row.constructor_name`, `row.position`), sehingga bernilai `undefined`:

| Modul | Properti yang Salah Dipakai di React Kemarin | **Atribut Asli dari Backend FastAPI (Sesuai `app.js`)** |
| :--- | :--- | :--- |
| **Driver Standings** | `row.position`, `row.points`, `row.constructor_name` | `d.championship_rank`, `d.driver_code`, `d.driver_name`, `d.team_name`, `d.total_wins`, **`d.total_points`** |
| **Constructor Standings** | `row.position`, `row.points`, `row.constructor_name` | `c.championship_rank`, `c.constructor_name`, `c.nationality`, `c.total_wins`, **`c.total_points`** |
| **Race Results** | `r.position`, `r.time_gap`, `r.points` | `r.finish_position`, `r.car_number`, `r.starting_grid`, `r.driver_code`, `r.driver_name`, `r.team_name`, `r.laps_completed`, **`r.race_time_or_gap`**, **`r.points_awarded`**, `r.fastest_lap_rank` |
| **Starting Grid** | `g.grid_position`, `g.qualifying_time` | `g.grid_position`, `g.car_number`, `g.driver_name`, `g.team_name`, `g.qualifying_time` |
| **Qualifying** | `q.position`, `q.q1`, `q.q2`, `q.q3` | `q.quali_rank`, `q.driver_name`, `q.team_name`, **`q.q1_lap_time`**, **`q.q2_lap_time`**, **`q.q3_lap_time`** |
| **Sprint Results** | `s.position`, `s.points` | `s.finish_position`, `s.car_number`, `s.starting_grid`, `s.driver_name`, `s.team_name`, `s.laps_completed`, `s.race_time_or_gap`, **`s.points_awarded`** |
| **Pit Stops** | `p.stop`, `p.duration` | `p.stop_number`, `p.driver_name`, `p.team_name`, `p.lap`, `p.time_of_day`, **`p.stop_duration_seconds`**, **`p.duration_millis`** |

Inilah sebab utama mengapa di tabel klasemen tidak muncul poin, nama tim kosong, dan jumlah kemenangan tidak tampil!

---

## 2. Blueprint Komprehensif Arsitektur React 1:1

Untuk menjamin 100% kesesuaian dengan [Tifosi - Telemetry & Information for Formula One Statistics & Insights](https://f1-view-nine.vercel.app/dashboard), kita petakan seluruh file komponen:

```
src/
├── api/
│   └── client.js                     # 39 Endpoint lengkap sesuai legacy/js/api.js
│
├── context/
│   ├── SeasonContext.jsx             # Season aktif (default 2026, memuat 1950 - 2026)
│   └── TimezoneContext.jsx           # Timezone toggle ('WIB' | 'UTC') & formatter
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx                # Brand Logo, Sync Status Popover, Custom Season Box, Timezone Toggle
│   │   ├── CustomSeasonDropdown.jsx  # Reusable F1 Custom Dropdown (1950-2026)
│   │   └── Sidebar.jsx               # Tepat 11 Menu Navigasi + Collapse Toggle Button
│   │
│   ├── common/
│   │   ├── CountryBadge.jsx          # Country pill (ISO 3-letter)
│   │   ├── DriverTag.jsx             # Driver tag pill + Code pill + Wiki external link
│   │   ├── TeamLiveryBadge.jsx       # Livery border color
│   │   ├── Modal.jsx                 # #f1-modal replika
│   │   └── Pagination.jsx            # Pagination footer
│   │
│   └── charts/
│       ├── LapProgressionChart.jsx   # Lap progression (P1-P20, reverse Y axis)
│       ├── DriverFormChart.jsx       # 5-Race moving avg
│       └── PointsProgressionChart.jsx # Points trajectory
│
└── pages/
    ├── Dashboard/DashboardPage.jsx   # 4 Stat Cards, Schedule Table, Top 5 Standings, Next Race Countdown
    ├── Calendar/CalendarPage.jsx     # Race Calendar cards/table dengan jam WIB/UTC
    ├── Practices/PracticesPage.jsx   # FP1, FP2, FP3 timetable per round
    ├── Sprints/SprintsPage.jsx       # Sprint race weekend schedule
    ├── Standings/StandingsPage.jsx   # Driver (WDC) & Constructor (WCC) standings lengkap
    ├── WeekendHub/WeekendHubPage.jsx # 5 Sub-tab: Results, Starting Grid, Qualifying, Sprint, Pit Stops
    ├── LapChart/LapChartPage.jsx     # Full-size telemetry lap progression chart (720px height)
    ├── Drivers/DriversPage.jsx       # Drivers Directory dengan Modal Bio Karir
    ├── Constructors/ConstructorsPage.jsx # Constructors Directory
    ├── Circuits/CircuitsPage.jsx     # Circuits Directory dengan Modal Past Winners
    └── Analytics/AnalyticsPage.jsx   # Seasonal vs All-Time Historical Analytics
```

---

## 3. Rencana Eksekusi Perbaikan (Action Plan)

### Langkah 1: Perbaikan CSS Global
- Tambahkan aturan di `src/styles.css`:
  ```css
  /* Hilangkan underline pada link navigasi sidebar */
  a.nav-item {
      text-decoration: none !important;
  }
  a.wiki-link {
      text-decoration: none;
  }
  ```
- Pastikan class `.f1-sidebar.collapsed` dan `body.sidebar-collapsed` terhubung dengan state React.

### Langkah 2: Buat Komponen `CustomSeasonDropdown.jsx`
- Menggantikan `<select>` bawaan dengan komponen popover kustom yang menggunakan class `.custom-season-select-box`, `.custom-season-menu`, dan `.season-option-item` sehingga tampilannya persis seperti di live site.

### Langkah 3: Perbaiki `Sidebar.jsx`
- Ubah kembali ke **tepat 11 menu navigasi**:
  1. `Dashboard` (`fa-gauge-high`)
  2. `Race Calendar` (`fa-calendar-days`)
  3. `Free Practice (FP1-3)` (`fa-stopwatch`)
  4. `Sprint Weekends` (`fa-bolt`)
  5. `Championship Standings` (`fa-trophy`)
  6. `Race Weekend Hub` (`fa-flag-checkered`)
  7. `Lap Chart Progression` (`fa-chart-line`)
  8. `Drivers Directory` (`fa-user-astronaut`)
  9. `Constructors Directory` (`fa-car`)
  10. `Circuits & Winners` (`fa-road`)
  11. `Advanced Analytics` (`fa-chart-column`)
- Pasang tombol collapse sidebar (`sidebar-toggle-btn`) yang mengecilkan sidebar menjadi 64px dengan icon saja.

### Langkah 4: Sesuaikan Seluruh Properti Data API di Setiap Page
- Update `StandingsPage.jsx`: gunakan `d.total_points`, `d.team_name`, `d.total_wins`, `d.championship_rank`.
- Update `WeekendHubPage.jsx`: gunakan `r.finish_position`, `r.race_time_or_gap`, `r.points_awarded`, `q.q1_lap_time`, `p.stop_duration_seconds`, dll.
- Update `DashboardPage.jsx`: sinkronkan widget Next Race dengan sesi FP1, FP2, FP3, Quali, dan Race.

---

## 4. Poin-Poin Konfirmasi & Pertanyaan untuk Anda

Sebelum saya mulai menuliskan dan menerapkan kode perbaikan di atas, ada beberapa hal yang ingin saya konfirmasikan:

1. **Struktur Halaman Direktori:**
   - Di legacy, ada 3 tombol sidebar terpisah: **Drivers Directory**, **Constructors Directory**, dan **Circuits & Winners**.
   - Apakah Anda ingin kita buatkan 3 file halaman terpisah (`DriversPage.jsx`, `ConstructorsPage.jsx`, `CircuitsPage.jsx`) sesuai 3 menu tersebut, atau tetap 1 halaman dengan 3 sub-tab? *(Rekomendasi: 3 halaman terpisah agar URL-nya `/drivers`, `/constructors`, `/circuits` persis seperti legacy).*
2. **Wikipedia Links:**
   - Di legacy, nama driver, team, dan race memiliki icon external link kecil (`fa-arrow-up-right-from-square`) yang membuka artikel Wikipedia. Apakah ini dipertahankan 100%? *(Rekomendasi: Ya, dipertahankan).*
3. **Sidebar Collapse:**
   - Apakah Anda ingin tombol collapse sidebar desktop (panah kiri/kanan di header sidebar) berfungsi melipat sidebar menjadi icon saja? *(Rekomendasi: Ya, diaktifkan).*

