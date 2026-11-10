import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// 11 Core Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import PracticesPage from './pages/Practices/PracticesPage';
import SprintsPage from './pages/Sprints/SprintsPage';
import StandingsPage from './pages/Standings/StandingsPage';
import WeekendHubPage from './pages/WeekendHub/WeekendHubPage';
import LapChart from './pages/LapChart/LapChart';
import DriversPage from './pages/Drivers/DriversPage';
import ConstructorsPage from './pages/Constructors/ConstructorsPage';
import CircuitsPage from './pages/Circuits/CircuitsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';

export default function App() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync sidebar-collapsed class with document.body matching legacy
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  return (
    <>
      <Header
        onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)}
      />
      <div className="f1-app-container">
        <Sidebar
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
        <main className="f1-main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/practices" element={<PracticesPage />} />
            <Route path="/sprints" element={<SprintsPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/weekend-hub" element={<WeekendHubPage />} />
            <Route path="/lap-chart" element={<LapChart />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/constructors" element={<ConstructorsPage />} />
            <Route path="/circuits" element={<CircuitsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
