# 🏎️ Panduan Praktis Migrasi In-Place: Tifosi (f1-view) ke React

> **Panduan Mandiri (DIY Execution Guide)**
> **Target:** Migrasi langsung di dalam folder `f1-view` tanpa membuat folder proyek baru di luar, mempertahankan remote git GitHub (`origin/main`), dan menjaga riwayat commit tetap aman.

---

## 📌 Daftar Isi

1. [Prinsip &amp; Solusi Migrasi In-Place](#1-prinsip--solusi-migrasi-in-place)
2. [Langkah 0: Git Branching &amp; Safet		y Net](#langkah-0-git-branching--safety-net)
3. [Langkah 1: Setup `.gitignore` &amp; Restrukturisasi Aset](#langkah-1-setup-gitignore--restrukturisasi-aset)
4. [Langkah 2: Inisialisasi Vite + React di Folder yang Sama](#langkah-2-inisialisasi-vite--react-di-folder-yang-sama)
5. [Langkah 3: Instalasi Dependencies yang Dibutuhkan](#langkah-3-instalasi-dependencies-yang-dibutuhkan)
6. [Langkah 4: Konfigurasi Proyek (`vite.config.js`, `.env`, `index.html`)](#langkah-4-konfigurasi-proyek-viteconfigjs-env-indexhtml)
7. [Langkah 5: Migrasi Styling &amp; Aset Desain](#langkah-5-migrasi-styling--aset-desain)
8. [Langkah 6: Pembuatan Struktur Folder `src/`](#langkah-6-pembuatan-struktur-folder-src)
9. [Langkah 7: Implementasi Kode Inti (Step-by-Step Template)](#langkah-7-implementasi-kode-inti-step-by-step-template)
   - 7.1. API Layer (`src/api/`)
   - 7.2. Global Context (`SeasonContext` & `TimezoneContext`)
   - 7.3. Root Layout (Header & Sidebar)
   - 7.4. Halaman-Halaman Utama (Dashboard, Standings, Weekend Hub)
10. [Langkah 8: Testing Lokal &amp; Build Verifikasi](#langkah-8-testing-lokal--build-verifikasi)
11. [Langkah 9: Pembersihan File Legacy](#langkah-9-pembersihan-file-legacy)
12. [Langkah 10: Commit, Push ke GitHub &amp; Merge](#langkah-10-commit-push-ke-github--merge)

---

## 1. Prinsip & Solusi Migrasi In-Place

### Pertanyaan Anda:

> *"Bagaimana migrasi dilakukan di dalam folder `f1-view` yang sama tanpa membuat folder baru, dan tetap bisa push ke repository GitHub yang sudah ada?"*

### Solusinya:

1. **Tetap di Folder yang Sama:** Kita akan menginisialisasi `package.json` dan `Vite` langsung di root folder `f1-view`. File kode lama (`js/app.js`, `js/api.js`, dll.) kita amankan sementara ke dalam folder `legacy/` di dalam git agar Anda tetap bisa mencontek logikanya selama proses migrasi berlangsung.
2. **Koneksi Git Tidak Berubah:** Folder `.git` bawaan tetap utuh di tempatnya. Remote URL GitHub (`origin: https://github.com/Cobalttt2311/f1-view.git`) tidak terpengaruh sama sekali.
3. **Safety Branching:** Kita akan membuat branch baru khusus migrasi: `migrate/react`. Jika ada kesalahan, branch `main` Anda tetap 100% aman dan utuh. Setelah React siap, branch ini tinggal di-merge ke `main` dan di-push ke GitHub.

---

## Langkah 0: Git Branching & Safety Net

Buka terminal **PowerShell** di folder `c:\Users\basga\Downloads\Project\f1-view`:

```powershell
# 1. Pastikan status git bersih di branch main
git status

# 2. Buat dan pindah ke branch baru untuk migrasi
git checkout -b migrate/react

# 3. Verifikasi branch aktif
git branch
```

*Hasil yang diharapkan: Anda berada di branch `migrate/react`.*

---

## Langkah 1: Setup `.gitignore` & Restrukturisasi Aset

Sebelum menginstal Node packages, kita wajib membuat file `.gitignore` agar folder `node_modules` dan file build tidak ikut ter-upload ke GitHub.

### 1.1 Buat / Update file `.gitignore`

Buat file bernama `.gitignore` di root folder dengan isi:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing & Coverage
coverage/

# Production Build Output
dist/
build/

# Environment Variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor & OS Files
.DS_Store
Thumbs.db
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

### 1.2 Pindahkan File Lama ke Folder `legacy/` (Agar Rapi)

Jalankan perintah ini di PowerShell agar file lama tetap tersimpan di riwayat Git sebagai referensi:

```powershell
# Buat folder penampung kode vanilla lama
mkdir legacy

# Pindahkan file JavaScript lama dan index.html lama ke legacy
git mv js legacy/js
git mv index.html legacy/index.legacy.html
```

---

## Langkah 2: Inisialisasi Vite + React di Folder yang Sama

Karena folder `f1-view` sudah berisi file, cara paling aman dan bersih tanpa konflik template adalah membuat `package.json` langsung:

### 2.1 Buat `package.json`

Jalankan di terminal:

```powershell
npm init -y
```

Kemudian buka file `package.json` yang baru terbentuk, dan perbarui isinya menjadi:

```json
{
  "name": "f1-view",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## Langkah 3: Instalasi Dependencies yang Dibutuhkan

Jalankan perintah berikut di PowerShell untuk memasang React, Vite, dan pustaka pendukung telemetri:

```powershell
# 1. Pasang React & Vite Core
npm install react react-dom
npm install -D vite @vitejs/plugin-react

# 2. Pasang Routing & Server State Caching
npm install react-router-dom @tanstack/react-query

# 3. Pasang Chart.js untuk Telemetri Lap & Analitik
npm install chart.js react-chartjs-2
```

---

## Langkah 4: Konfigurasi Proyek (`vite.config.js`, `.env`, `index.html`)

### 4.1 Buat `vite.config.js` di root folder

Buat file `vite.config.js` dengan isi:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
```

### 4.2 Buat file `.env` di root folder

Buat file `.env` untuk menyimpan konfigurasi API FastAPI backend:

```env
VITE_API_BASE_URL=https://f1-api-neon.vercel.app/api/v1
```

### 4.3 Buat `index.html` Baru untuk React

Buat file `index.html` baru di root folder (menggantikan yang lama yang sudah diarsipkan ke `legacy/`):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tifosi - Formula 1 Application</title>
    <link rel="icon" type="image/png" href="/assets/logo.png" />
  
    <!-- Google Fonts F1 Typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;0,800;1,600;1,700;1,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Titillium+Web:ital,wght@0,400;0,600;0,700;0,900;1,600;1,700;1,900&display=swap"
      rel="stylesheet"
    />
  
    <!-- Font Awesome Icons -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
    />
  </head>
  <body class="f1-dark">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## Langkah 5: Migrasi Styling & Aset Desain

Salah satu keuntungan besar dari rencana ini adalah **Anda tidak perlu menulis ulang 2.800 baris CSS**. Desain Motorsport Dark Theme yang ada di `css/styles.css` bisa langsung kita pakai:

```powershell
# 1. Buat folder public untuk aset statis jika belum ada
if (!(Test-Path "public")) { mkdir public }

# 2. Pindahkan folder assets ke dalam public agar dapat diakses oleh Vite
# (Pastikan logo.png ada di public/assets/logo.png)
Move-Item -Path "assets" -Destination "public/assets"
```

File `css/styles.css` dapat kita biarkan atau pindahkan ke `src/styles.css` untuk diimpor ke dalam React.

---

## Langkah 6: Pembuatan Struktur Folder `src/`

Jalankan perintah ini di PowerShell untuk membuat struktur modular:

```powershell
mkdir src
mkdir src/api
mkdir src/context
mkdir src/components
mkdir src/components/layout
mkdir src/components/common
mkdir src/components/charts
mkdir src/pages
mkdir src/pages/Dashboard
mkdir src/pages/Calendar
mkdir src/pages/Standings
mkdir src/pages/WeekendHub
mkdir src/pages/LapChart
mkdir src/pages/Directories
mkdir src/pages/Analytics
mkdir src/utils
```

Pindahkan `css/styles.css` ke `src/`:

```powershell
Move-Item -Path "css\styles.css" -Destination "src\styles.css"
```

---

## Langkah 7: Implementasi Kode Inti (Step-by-Step Template)

Berikut adalah template kode siap pakai untuk setiap layer arsitektur:

### 7.1. API Layer (`src/api/client.js`)

Buat file `src/api/client.js`:

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://f1-api-neon.vercel.app/api/v1';

async function fetchJson(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const F1Api = {
  // Seasons & Calendar
  getSeasons: () => fetchJson('/seasons'),
  getCalendar: (year = 2026) => fetchJson(`/races/calendar?year=${year}`),
  
  // Standings
  getDriverStandings: (year = 2026) => fetchJson(`/standings/drivers?year=${year}`),
  getConstructorStandings: (year = 2026) => fetchJson(`/standings/constructors?year=${year}`),
  
  // Weekend Hub & Telemetry
  getRaceResults: (year, round) => fetchJson(`/races/${year}/${round}/results`),
  getStartingGrid: (year, raceId) => fetchJson(`/races/${year}/${raceId}/starting-grid`),
  getQualifying: (year, round) => fetchJson(`/races/${year}/${round}/qualifying`),
  getPitStops: (year, round) => fetchJson(`/races/${year}/${round}/pit-stops`),
  getLapChart: (year, round) => fetchJson(`/races/${year}/${round}/lap-chart`),
  
  // System Sync Metadata
  getLastSync: () => fetchJson('/analytics/last-sync')
};
```

---

### 7.2. Global Context (`SeasonContext` & `TimezoneContext`)

#### A. `src/context/SeasonContext.jsx`

Menjaga tahun musim yang sedang dipilih di seluruh aplikasi (1950–2026):

```jsx
import React, { createContext, useContext, useState } from 'react';

const SeasonContext = createContext();

export function SeasonProvider({ children }) {
  const [season, setSeason] = useState(2026);

  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export const useSeason = () => useContext(SeasonContext);
```

#### B. `src/context/TimezoneContext.jsx`

Mengatur pergantian timezone antara **WIB (UTC+7)** dan **UTC**:

```jsx
import React, { createContext, useContext, useState } from 'react';

const TimezoneContext = createContext();

export function TimezoneProvider({ children }) {
  const [timezone, setTimezone] = useState('WIB'); // 'WIB' atau 'UTC'

  const formatSessionTime = (utcTimeStr, wibTimeStr) => {
    if (timezone === 'UTC') return utcTimeStr || '-';
    return wibTimeStr || '-';
  };

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone, formatSessionTime }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export const useTimezone = () => useContext(TimezoneContext);
```

---

### 7.3. Root Setup & Entry Point (`src/main.jsx` & `src/App.jsx`)

#### A. `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { SeasonProvider } from './context/SeasonContext';
import { TimezoneProvider } from './context/TimezoneContext';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // Cache data selama 10 menit
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SeasonProvider>
          <TimezoneProvider>
            <App />
          </TimezoneProvider>
        </SeasonProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

#### B. `src/App.jsx`

```jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/Dashboard/DashboardPage';
import StandingsPage from './pages/Standings/StandingsPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import WeekendHubPage from './pages/WeekendHub/WeekendHubPage';

export default function App() {
  return (
    <>
      <Header />
      <div className="f1-app-container">
        <Sidebar />
        <main className="f1-main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/weekend-hub" element={<WeekendHubPage />} />
            {/* Tambahkan route lainnya sesuai kebutuhan */}
          </Routes>
        </main>
      </div>
    </>
  );
}
```

---

### 7.4. Komponen Layout (`Header.jsx` & `Sidebar.jsx`)

#### A. `src/components/layout/Header.jsx`

```jsx
import React from 'react';
import { useSeason } from '../../context/SeasonContext';
import { useTimezone } from '../../context/TimezoneContext';

export default function Header() {
  const { season, setSeason } = useSeason();
  const { timezone, setTimezone } = useTimezone();

  return (
    <header className="f1-header">
      <div className="header-left">
        <div className="header-brand">
          <img src="/assets/logo.png" alt="Tifosi Logo" className="brand-logo-img" />
          <div className="brand-title">
            <h1 className="brand-logo-text">TIFOSI</h1>
            <p className="brand-subtitle">Formula 1 Application</p>
          </div>
        </div>
      </div>

      <div className="header-controls">
        {/* Season Selector */}
        <div className="global-season-container">
          <span className="global-control-label">
            <i className="fa-solid fa-flag-checkered"></i> Season:
          </span>
          <select 
            className="btn btn-sm btn-outline text-white bg-dark"
            value={season} 
            onChange={(e) => setSeason(Number(e.target.value))}
            style={{ background: '#1a1a24', color: '#fff', border: '1px solid #2c2c3b', padding: '6px 12px', borderRadius: '4px' }}
          >
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((yr) => (
              <option key={yr} value={yr}>{yr} Season</option>
            ))}
          </select>
        </div>

        {/* Timezone Switcher */}
        <div className="tz-switch-container">
          <span className="tz-label"><i className="fa-regular fa-clock"></i> Time Zone:</span>
          <div className="tz-toggle-group">
            <button 
              className={`tz-btn ${timezone === 'WIB' ? 'active' : ''}`}
              onClick={() => setTimezone('WIB')}
            >
              WIB
            </button>
            <button 
              className={`tz-btn ${timezone === 'UTC' ? 'active' : ''}`}
              onClick={() => setTimezone('UTC')}
            >
              UTC
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### B. `src/components/layout/Sidebar.jsx`

```jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="f1-sidebar">
      <div className="sidebar-top-header">
        <span className="sidebar-top-label">MENU</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-title">CORE RACING</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-gauge-high"></i> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-regular fa-calendar-days"></i> <span>Race Calendar</span>
        </NavLink>
        <NavLink to="/standings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-trophy"></i> <span>Championship Standings</span>
        </NavLink>

        <div className="nav-section-title">GRAND PRIX WEEKEND</div>
        <NavLink to="/weekend-hub" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-flag-checkered"></i> <span>Race Weekend Hub</span>
        </NavLink>
      </nav>
    </aside>
  );
}
```

---

### 7.5. Contoh Halaman: `DashboardPage.jsx` dengan Data Caching

Buat file `src/pages/Dashboard/DashboardPage.jsx`:

```jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '../../context/SeasonContext';
import { F1Api } from '../../api/client';

export default function DashboardPage() {
  const { season } = useSeason();

  // Otomatis fetch dan cache data kalender musim terpilih
  const { data: calendar, isLoading } = useQuery({
    queryKey: ['calendar', season],
    queryFn: () => F1Api.getCalendar(season),
  });

  return (
    <section className="content-view active">
      <div className="view-header">
        <div>
          <h2>Season Overview & Telemetry Dashboard</h2>
          <p className="text-muted">
            High-level statistics and Grand Prix telemetry for <strong>{season} Season</strong>.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5 text-muted">
          <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
          <p className="mt-2">Loading {season} Data...</p>
        </div>
      ) : (
        <div className="f1-card">
          <div className="card-header">
            <h3><i className="fa-solid fa-calendar-check"></i> Season Grand Prix Schedule</h3>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="f1-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Grand Prix</th>
                    <th>Circuit</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar && calendar.length > 0 ? (
                    calendar.map((race) => (
                      <tr key={race.round}>
                        <td><span className="badge badge-round">R{race.round}</span></td>
                        <td><strong>{race.race_name || race.grand_prix_name}</strong></td>
                        <td>{race.circuit_name}</td>
                        <td>{race.race_date}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-3">No races found for this season.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
```

---

## Langkah 8: Testing Lokal & Build Verifikasi

Jalankan server development Vite:

```powershell
npm run dev
```

Browser Anda akan terbuka secara otomatis di `http://localhost:3000`. Anda sekarang memiliki:

- Aplikasi React yang berjalan langsung di folder `f1-view`.
- Tampilan Dark Theme F1 yang persis sama dengan sebelumnya.
- Hot Module Replacement (HMR): saat mengedit komponen, tampilan ter-update instan dalam hitungan milidetik tanpa reload browser.

Uji juga apakah hasil build siap produksi berhasil:

```powershell
npm run build
```

*Hasil build akan tersimpan rapi di folder `dist/`.*

---

## Langkah 9: Pembersihan File Legacy (Setelah Semua Fitur Selesai)

Setelah Anda memigrasikan fitur-fitur lainnya (Weekend Hub, Lap Chart, Directories, dan Analytics), folder `legacy/` bisa dihapus agar repository tetap ramping:

```powershell
# Hapus folder legacy dari git
git rm -rf legacy
```

---

## Langkah 10: Commit, Push ke GitHub & Merge

Karena remote git Anda sudah mengarah ke `origin (https://github.com/Cobalttt2311/f1-view.git)`, Anda tinggal melakukan commit dan push:

```powershell
# 1. Cek file yang berubah
git status

# 2. Tambahkan semua file baru ke staging
git add .

# 3. Buat commit pertama untuk migrasi React
git commit -m "feat: migrate frontend architecture to React + Vite + TanStack Query"

# 4. Push branch migrasi ke GitHub
git push -u origin migrate/react
```

### Menggabungkan ke Branch Utama (`main`):

Jika Anda sudah puas dan ingin menjadikan versi React ini sebagai versi utama di repository GitHub Anda:

```powershell
# 1. Pindah kembali ke branch main
git checkout main

# 2. Gabungkan branch migrasi ke main
git merge migrate/react

# 3. Push hasil gabungan ke GitHub
git push origin main
```

Selamat! Proyek **`f1-view`** Anda kini resmi menggunakan arsitektur **React modern** langsung di folder dan repository yang sama tanpa kehilangan riwayat Git.
