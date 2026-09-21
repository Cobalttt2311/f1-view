# 🏎️ Tifosi - Formula 1 Analytics & Telemetry Web Dashboard

<p align="center">
  <img src="assets/logo.png" alt="Tifosi F1 Logo" width="120" style="border-radius: 12px;"/>
</p>

**Tifosi** is Formula 1 web application and telemetry dashboard. It provides comprehensive race analytics, live session schedules, historical championship archives (1950 – present), and interactive lap progression charts powered by an asynchronous RESTful API.

---

## 🔗 Related Repositories & Ecosystem

This web application is the frontend client in the complete **Formula 1 End-to-End Analytics Platform**:

| Component | Repository | Description |
| :--- | :--- | :--- |
| **🏎️ Frontend Web App (This Repo)** | [`f1-view`](https://github.com/Cobalttt2311/f1-view) | Interactive motorsport dashboard built with Vanilla JS & Chart.js |
| **⚡ Backend REST API** | [**`f1-api`**](https://github.com/Cobalttt2311/f1-api) | High-performance FastAPI service connected to PostgreSQL |
| **🔄 Data Pipeline (ETL)** | [**`f1-race-data`**](https://github.com/Cobalttt2311/f1-race-data) | Automated Kaggle-to-PostgreSQL data ingestion and synchronization pipeline |

---

## 🌟 Key Features

* **🏎️ Season Dashboard & Telemetry Overview**:
  * Real-time championship standings preview (Top 5 Drivers & Teams).
  * Upcoming Grand Prix widget with session countdown and live round indicators.
  * Season race calendar matrix with dynamic sorting.
* **📅 Race Calendar & Schedules**:
  * Complete Grand Prix timetable for all seasons (1950 – 2026+).
  * Dedicated session breakdowns for Main Race, Qualifying, FP1, FP2, FP3, and Sprint events.
* **🌐 Dual Timezone Switcher**:
  * Seamless one-click global timezone conversion between **WIB (UTC+7)** and **UTC** across all schedule views.
* **🏆 Championship Standings**:
  * Comprehensive Driver and Constructor standings with points, ranks, wins, and team affiliations.
* **🏁 Grand Prix Weekend Hub**:
  * Detailed Grand Prix telemetry tabs:
    * **Race Results**: Final classifications, gaps, fastest lap indicators, and points.
    * **Official Starting Grid**: Grid positions, penalties, and pit-lane starts.
    * **Qualifying Breakdown**: Q1, Q2, and Q3 session lap times.
    * **Sprint Race Results**: Sprint classifications and points scored.
    * **Pit Stop Telemetry**: Lap numbers, stop counts, durations, and millisecond precision.
* **📈 Interactive Lap-by-Lap Progression Chart**:
  * Dynamic track position line graph (P1 – P22) visualizing overtakes, pit window strategies, and leader changes powered by Chart.js.
  * Multi-driver filter dropdown with select/clear controls.
* **📚 Motorsport Database & Directory**:
  * **Drivers Directory**: Searchable driver database with career stats, permanent numbers, nationalities, and modal profile popups.
  * **Constructors Directory**: Complete archive of all historical and current Formula 1 teams.
  * **Circuits & Winners**: Track locations, altitudes, and historical Grand Prix winners per circuit.
* **🧠 Advanced Strategy & Performance Analytics**:
  * **Seasonal Intelligence**: Greatest comebacks & movers, pit stop efficiency, teammate head-to-head qualifying battles, driver rolling form (5-race moving average), and cumulative season points progression.
  * **All-Time Historical Intelligence**: Pole-to-Win conversion rate, high DNF circuits, miracle wins from deep grid (P10+), most laps led, fastest speed traps recorded, constructor 1-2 finishes, youngest winners, and circuit masters.
* **🎨 Motorsport Dark Design System**:
  * Custom carbon-fiber and dark slate motorsport UI with official team color accents, responsive sidebar navigation, and mobile-ready layouts.

---

## 🛠️ Technology Stack

* **Structure & Markup**: HTML5 (Semantic HTML)
* **Styling & UI**: Pure Vanilla CSS3 (Custom design system, CSS Grid/Flexbox, responsive breakpoints)
* **Logic & Networking**: Vanilla JavaScript (ES6+ `async/await`, Fetch API, Modular Architecture)
* **Data Visualization**: [Chart.js (v4.4.1)](https://www.chartjs.org/)
* **Icons & Fonts**: [Font Awesome 6](https://fontawesome.com/), Google Fonts (*Titillium Web*, *Barlow Condensed*, *Inter*, *JetBrains Mono*)

---

## ⚙️ Installation & Running the Project

Because **Tifosi** is built with lightweight Vanilla JavaScript and CSS, no complex build tools or `npm install` steps are required.

### 1. Clone the Repository
```bash
git clone https://github.com/Cobalttt2311/f1-view.git
cd f1-view
```

### 2. Configure Backend API Endpoint
Open [`js/config.js`](file:///d:/Eksplorasi/f1-view/js/config.js) and set your target backend URL:

```javascript
const CONFIG = {
    // Live Cloud API (Default):
    BACKEND_URL: 'https://f1-api-neon.vercel.app',

    // Or use Local Backend:
    // BACKEND_URL: 'http://127.0.0.1:8000',

    API_PREFIX: '/api/v1',

    get API_BASE() {
        const cleanBase = this.BACKEND_URL.replace(/\/+$/, '');
        const cleanPrefix = this.API_PREFIX.startsWith('/') ? this.API_PREFIX : `/${this.API_PREFIX}`;
        return `${cleanBase}${cleanPrefix}`;
    }
};

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
```

> 💡 **Note**: By default, it connects directly to the deployed cloud backend API at `https://f1-api-neon.vercel.app`. If you are running `f1-api` locally on your computer, switch `BACKEND_URL` to `'http://127.0.0.1:8000'`.

---

### 3. Run the Web Application

You can launch the project using any of the methods below:

#### Option A: Using VS Code Live Server (Recommended)
1. Open the `f1-view` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (if not already installed).
3. Right-click on `index.html` and select **"Open with Live Server"**.

#### Option B: Using Python Local Server
```bash
# Python 3
python -m http.server 5500
```
Open your browser and navigate to:
```text
http://127.0.0.1:5500
```

#### Option C: Using Node.js `serve` / `http-server`
```bash
npx serve .
```

#### Option D: Direct Browser Open
Simply double-click `index.html` to open it directly in Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari.

---

## 📁 Project Structure

```text
f1-view/
├── css/
│   └── styles.css          # Core motorsport design system & responsive stylesheet
├── js/
│   ├── config.js           # Centralized backend URL & API configuration
│   ├── api.js              # RESTful API client & fetch methods
│   └── app.js              # UI controller, state management, table sorting & Chart.js logic
├── assets/                 # Static branding assets & icons
├── index.html              # Single-page application entrypoint
└── README.md               # Project documentation
```

---

## 🏎️ Complete Pipeline Workflow

```text
┌────────────────────────────────────────┐
│  Kaggle Motorsport Data (1950 - 2026)  │
└───────────────────┬────────────────────┘
                    │ (KaggleHub Download)
                    ▼
┌────────────────────────────────────────┐
│    f1-race-data (ETL Pipeline)         │
│  - Data Cleaning & Normalization       │
│  - 14 Relational PostgreSQL Tables     │
└───────────────────┬────────────────────┘
                    │ (SQLAlchemy / Psycopg2)
                    ▼
┌────────────────────────────────────────┐
│         PostgreSQL Database            │
└───────────────────┬────────────────────┘
                    │ (Raw SQL Queries)
                    ▼
┌────────────────────────────────────────┐
│         f1-api (FastAPI REST)          │
│  - Repository-Service-Controller       │
│  - Live on Vercel / Local :8000        │
└───────────────────┬────────────────────┘
                    │ (JSON REST Endpoints)
                    ▼
┌────────────────────────────────────────┐
│       f1-view (Tifosi Dashboard)       │
│  - Interactive Telemetry & Lap Charts  │
│  - Dual Timezone (WIB ↔ UTC)           │
└────────────────────────────────────────┘
```

---

## 📄 License & Credits

* **Data Source**: [Formula 1 Race Data by James Trotman](https://www.kaggle.com/datasets/jtrotman/formula-1-race-data) on Kaggle.
* **License**: This project is developed for educational and portfolio demonstration purposes.

Made with ❤️ by [Cobalt](https://github.com/Cobalttt2311)
