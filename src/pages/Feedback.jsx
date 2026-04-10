import { MessageSquare, Users } from "lucide-react";
import StatCard from "../components/Shared/StatCard";
import useBootstrapData from "../hooks/useBootstrapData";

export default function Feedback() {
  const { data, loading, error } = useBootstrapData();
  const feedbackRows = data.feedback ?? [];
  const users = data.users ?? [];

  const enrichedFeedback = feedbackRows.map((row) => {
    const user = users.find((entry) => Number(entry.user_id) === Number(row.user_id)) ?? null;
    return { ...row, user };
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching FEEDBACK table...</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedback</h1>
          <p className="page-sub">{enrichedFeedback.length} records · FEEDBACK ↔ USERS</p>
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <StatCard title="Total Feedback" value={enrichedFeedback.length} icon={MessageSquare} accent="var(--accent-blue)" />
        <StatCard
          title="Unique Passengers"
          value={new Set(enrichedFeedback.map((entry) => entry.user_id)).size}
          icon={Users}
          accent="var(--accent-emerald)"
        />
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feedback ID</th>
                <th>User ID</th>
                <th>Passenger</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {enrichedFeedback.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-row">No feedback submitted yet.</td>
                </tr>
              ) : (
                enrichedFeedback.map((entry) => (
                  <tr key={entry.feedback_id}>
                    <td className="mono">#{entry.feedback_id}</td>
                    <td className="mono">#{entry.user_id}</td>
                    <td>{entry.user?.name ?? "Unknown Passenger"}</td>
                    <td>{entry.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}