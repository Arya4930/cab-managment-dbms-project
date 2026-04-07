import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Passengers from "./pages/Passengers";
import Fleet from "./pages/Fleet";
import Drivers from "./pages/Drivers";
import Maintenance from "./pages/Maintenance";
import Payments from "./pages/Payments";
import Earnings from "./pages/Earnings";
import Tracking from "./pages/Tracking";
import Login from "./pages/Login";
import "./styles/global.css";

const AUTH_STORAGE_KEY = "cabex-admin-session";

export default function App() {
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    const storedAdmin = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedAdmin) {
      return;
    }

    try {
      setCurrentAdmin(JSON.parse(storedAdmin));
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const handleLogin = (adminUser) => {
    setCurrentAdmin(adminUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login currentAdmin={currentAdmin} onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            currentAdmin ? (
              <Layout currentAdmin={currentAdmin} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="passengers" element={<Passengers />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="payments" element={<Payments />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to={currentAdmin ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
