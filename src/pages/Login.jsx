import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, CarFront, KeyRound, Mail, ShieldCheck } from "lucide-react";

import { API_BASE } from "../config/apiBase";
const FALLBACK_ADMIN = {
  user_id: "dev-admin",
  name: "Test Admin",
  email: "admin@cabex.test",
  user_type: "Admin",
};

export default function Login({ currentAdmin, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const normalizedFallbackEmail = useMemo(() => FALLBACK_ADMIN.email.toLowerCase(), []);

  if (currentAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Admin email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.user) {
        onLogin(data.user);
        return;
      }

      if (normalizedEmail === normalizedFallbackEmail && password === "123456") {
        onLogin(FALLBACK_ADMIN);
        return;
      }

      setError("Invalid admin credentials");
    } catch (err) {
      if (normalizedEmail === normalizedFallbackEmail && password === "123456") {
        onLogin(FALLBACK_ADMIN);
        return;
      }

      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-brand">
          <div className="login-brand__icon">
            <CarFront size={22} />
          </div>
          <div>
            <div className="login-brand__name">CABEX Admin</div>
            <div className="login-brand__sub">Dispatch booth access with admin email</div>
          </div>
        </div>

        <div className="login-copy">
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">
            Enter admin credentials to open the dispatch board.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="email">
            Admin Email
          </label>
          <div className="login-inputWrap">
            <Mail size={16} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>

          <label className="login-label" htmlFor="password">
            Password
          </label>
          <div className="login-inputWrap">
            <KeyRound size={16} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-submit" type="submit" disabled={submitting}>
            <ShieldCheck size={16} />
            <span>{submitting ? "Checking Access..." : "Login as Admin"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="login-note">
          Dev fallback email: <span className="mono">{FALLBACK_ADMIN.email}</span>
        </div>
        <div className="portal-loginLinks" style={{ marginTop: "16px" }}>
          <Link to="/passenger/login">Passenger login</Link>
          <Link to="/driver/login">Driver login</Link>
        </div>
      </div>
    </div>
  );
}
