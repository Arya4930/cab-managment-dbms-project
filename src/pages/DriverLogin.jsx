import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, CarFront, KeyRound } from "lucide-react";
import { DRIVERS } from "../data/mockData";

const API_BASE = "http://localhost:3000/api";

export default function DriverLogin({ currentDriver, onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (currentDriver) {
    return <Navigate to="/driver/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier) {
      setError("Driver phone or license number is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/driver-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normalizedIdentifier }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      onLogin(data.driver);
    } catch (err) {
      const fallbackDriver =
        DRIVERS.find((driver) => {
          const phone = String(driver.phone ?? "").trim().toLowerCase();
          const license = String(driver.license_no ?? "").trim().toLowerCase();
          return phone === normalizedIdentifier || license === normalizedIdentifier;
        }) ?? null;

      if (fallbackDriver) {
        onLogin(fallbackDriver);
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-loginShell portal-loginShell--driver">
      <div className="portal-loginCard">
        <div className="portal-loginBadge">
          <CarFront size={18} />
          Driver Portal
        </div>
        <h1 className="portal-loginTitle">See assigned rides and move fast</h1>
        <p className="portal-loginText">
          Sign in with your phone or license number to view live assignments, start rides, and complete trips.
        </p>

        <form className="portal-loginForm" onSubmit={handleSubmit}>
          <label htmlFor="driver-identifier">Phone or License No.</label>
          <div className="portal-loginInput">
            <KeyRound size={16} />
            <input
              id="driver-identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="+91-97001-10001 or TN09-20210012"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-submit" type="submit" disabled={submitting}>
            <span>{submitting ? "Checking..." : "Open Driver App"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="portal-loginLinks">
          <Link to="/passenger/login">Passenger login</Link>
          <Link to="/login">Admin login</Link>
        </div>
      </div>
    </div>
  );
}
