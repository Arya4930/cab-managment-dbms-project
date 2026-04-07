import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, Mail, ShieldCheck, Zap } from "lucide-react";

const API_BASE = "http://localhost:3000/api";
const FALLBACK_ADMIN = {
  user_id: "dev-admin",
  name: "Test Admin",
  email: "admin@cabex.test",
  user_type: "Admin",
};

export default function Login({ currentAdmin, onLogin }) {
  const [email, setEmail] = useState("");
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

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/bootstrap`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load admins");
      }

      const adminUser =
        (data.users ?? []).find(
          (user) =>
            String(user.user_type ?? "").toLowerCase() === "admin" &&
            String(user.email ?? "").trim().toLowerCase() === normalizedEmail
        ) ?? null;

      if (adminUser) {
        onLogin(adminUser);
        return;
      }

      if (normalizedEmail === normalizedFallbackEmail) {
        onLogin(FALLBACK_ADMIN);
        return;
      }

      setError("That email is not an admin account");
    } catch (err) {
      if (normalizedEmail === normalizedFallbackEmail) {
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
            <Zap size={22} />
          </div>
          <div>
            <div className="login-brand__name">CABEX Admin</div>
            <div className="login-brand__sub">Testing-only access with admin email</div>
          </div>
        </div>

        <div className="login-copy">
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">
            Enter an admin email to unlock the dashboard. No password is required in this test flow.
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
      </div>
    </div>
  );
}
