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
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import PassengerLogin from "./pages/PassengerLogin";
import DriverLogin from "./pages/DriverLogin";
import PassengerDashboard from "./pages/PassengerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import "./styles/global.css";

const AUTH_STORAGE_KEY = "cabex-admin-session";
const PASSENGER_AUTH_STORAGE_KEY = "cabex-passenger-session";
const DRIVER_AUTH_STORAGE_KEY = "cabex-driver-session";

export default function App() {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [currentPassenger, setCurrentPassenger] = useState(null);
  const [currentDriver, setCurrentDriver] = useState(null);

  useEffect(() => {
    const storedAdmin = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAdmin) {
      try {
        setCurrentAdmin(JSON.parse(storedAdmin));
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    const storedPassenger = window.localStorage.getItem(PASSENGER_AUTH_STORAGE_KEY);
    if (storedPassenger) {
      try {
        setCurrentPassenger(JSON.parse(storedPassenger));
      } catch {
        window.localStorage.removeItem(PASSENGER_AUTH_STORAGE_KEY);
      }
    }

    const storedDriver = window.localStorage.getItem(DRIVER_AUTH_STORAGE_KEY);
    if (storedDriver) {
      try {
        setCurrentDriver(JSON.parse(storedDriver));
      } catch {
        window.localStorage.removeItem(DRIVER_AUTH_STORAGE_KEY);
      }
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

  const handlePassengerLogin = (passenger) => {
    setCurrentPassenger(passenger);
    window.localStorage.setItem(PASSENGER_AUTH_STORAGE_KEY, JSON.stringify(passenger));
  };

  const handlePassengerLogout = () => {
    setCurrentPassenger(null);
    window.localStorage.removeItem(PASSENGER_AUTH_STORAGE_KEY);
  };

  const handleDriverLogin = (driver) => {
    setCurrentDriver(driver);
    window.localStorage.setItem(DRIVER_AUTH_STORAGE_KEY, JSON.stringify(driver));
  };

  const handleDriverLogout = () => {
    setCurrentDriver(null);
    window.localStorage.removeItem(DRIVER_AUTH_STORAGE_KEY);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login currentAdmin={currentAdmin} onLogin={handleLogin} />} />
        <Route
          path="/passenger/login"
          element={<PassengerLogin currentPassenger={currentPassenger} onLogin={handlePassengerLogin} />}
        />
        <Route
          path="/driver/login"
          element={<DriverLogin currentDriver={currentDriver} onLogin={handleDriverLogin} />}
        />
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
          <Route path="feedback" element={<Feedback />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route
          path="/passenger/dashboard"
          element={
            currentPassenger ? (
              <PassengerDashboard currentPassenger={currentPassenger} onLogout={handlePassengerLogout} />
            ) : (
              <Navigate to="/passenger/login" replace />
            )
          }
        />
        <Route
          path="/driver/dashboard"
          element={
            currentDriver ? (
              <DriverDashboard currentDriver={currentDriver} onLogout={handleDriverLogout} />
            ) : (
              <Navigate to="/driver/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={
                currentAdmin
                  ? "/dashboard"
                  : currentPassenger
                  ? "/passenger/dashboard"
                  : currentDriver
                  ? "/driver/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
