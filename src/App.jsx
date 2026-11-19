import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";

// 11 Core Pages
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CalendarPage from "./pages/Calendar/CalendarPage";
import PracticesPage from "./pages/Practices/PracticesPage";
import SprintsPage from "./pages/Sprints/SprintsPage";
import StandingsPage from "./pages/Standings/StandingsPage";
import WeekendHubPage from "./pages/WeekendHub/WeekendHubPage";
import LapChart from "./pages/LapChart/LapChart";
import DriversPage from "./pages/Drivers/DriversPage";
import ConstructorsPage from "./pages/Constructors/ConstructorsPage";
import CircuitsPage from "./pages/Circuits/CircuitsPage";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";

class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="f1-empty-state" style={{ marginTop: "24px" }}>
          <h3 style={{ color: "#ffffff", fontSize: "18px" }}>
            Unable to render telemetry view
          </h3>
          <p>{this.state.error?.message || "Unexpected data format received."}</p>
          <button
            type="button"
            className="f1-btn-primary mt-2"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
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
          <ViewErrorBoundary resetKey={location.pathname}>
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
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ViewErrorBoundary>
        </main>
      </div>
    </>
  );
}
