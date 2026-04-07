import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Mail, MapPinned } from "lucide-react";
import { USERS } from "../data/mockData";

const API_BASE = "http://localhost:3000/api";

export default function PassengerLogin({ currentPassenger, onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (currentPassenger) {
    return <Navigate to="/passenger/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Passenger email is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/passenger-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      onLogin(data.user);
    } catch (err) {
      const fallbackUser =
        USERS.find((user) => String(user.email ?? "").trim().toLowerCase() === normalizedEmail) ?? null;

      if (fallbackUser) {
        onLogin({ ...fallbackUser, user_type: fallbackUser.user_type ?? "Passenger" });
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-loginShell portal-loginShell--passenger">
      <div className="portal-loginCard">
        <div className="portal-loginBadge">
          <MapPinned size={18} />
          Passenger Portal
        </div>
        <h1 className="portal-loginTitle">Track every ride from one clean screen</h1>
        <p className="portal-loginText">
          Use your passenger email to see booked cabs, live trip status, payment actions, and trip ratings.
        </p>

        <form className="portal-loginForm" onSubmit={handleSubmit}>
          <label htmlFor="passenger-email">Passenger Email</label>
          <div className="portal-loginInput">
            <Mail size={16} />
            <input
              id="passenger-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-submit" type="submit" disabled={submitting}>
            <span>{submitting ? "Checking..." : "Open Passenger App"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="portal-loginLinks">
          <Link to="/driver/login">Driver login</Link>
          <Link to="/login">Admin login</Link>
        </div>
      </div>
    </div>
  );
}
