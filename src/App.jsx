import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Fleet from "./pages/Fleet";
import Drivers from "./pages/Drivers";
import Maintenance from "./pages/Maintenance";
import "./styles/global.css";

// Placeholder stubs for routes not yet fully built
const Placeholder = ({ title }) => (
  <div className="page">
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">This section is under construction.</p>
    </div>
    <div className="section-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
      <p>Coming soon…</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect root → dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="payments" element={<Placeholder title="Payments" />} />
          <Route path="earnings" element={<Placeholder title="Earnings" />} />
          <Route path="tracking" element={<Placeholder title="Live Tracking" />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
