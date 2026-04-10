import useBootstrapData from "../hooks/useBootstrapData";
import StatCard from "../components/shared/StatCard";
import Badge from "../components/shared/Badge";
import {
  CalendarCheck, Users, Truck, TrendingUp,
  Star, CreditCard, Activity, Clock,
} from "lucide-react";

// ── Mini bar chart (pure CSS / inline SVG, no external chart lib needed) ──────
function BarChart({ data, label }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="chart-wrap">
      <div className="chart-label">{label}</div>
      <div className="bar-chart">
        {data.map((d, i) => (
          <div key={i} className="bar-col">
            {d.value}
            <div
              className="bar"
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.name}: ${d.value}`}
            />
            <span className="bar-tick">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut chart (inline SVG) ──────────────────────────────────────────────────
function DonutChart({ segments, title }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const colors = ["var(--accent-blue)", "var(--accent-emerald)", "var(--accent-amber)", "var(--accent-rose)"];
  let cumulative = 0;
  const r = 60, cx = 70, cy = 70, stroke = 22;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="chart-wrap">
      <div className="chart-label">{title}</div>
      <div className="donut-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const dash = pct * circumference;
            const offset = cumulative * circumference;
            cumulative += pct;
            return (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset + circumference * 0.25}
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            );
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" className="donut-center-val">
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="donut-center-label">
            Total
          </text>
        </svg>
        <div className="donut-legend">
          {segments.map((seg, i) => (
            <div key={i} className="donut-legend-item">
              <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
              <span>{seg.name}</span>
              <span className="legend-val">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error } = useBootstrapData();
  const BOOKINGS = data.bookings ?? [];
  const DRIVERS = data.drivers ?? [];
  const CABS = data.cabs ?? [];
  const PAYMENTS = data.payments ?? [];
  const EARNINGS = data.earnings ?? [];
  const RATINGS_REVIEWS = data.ratings_reviews ?? [];

  // Derived stats
  const totalRevenue = PAYMENTS.filter((p) => p.status === "Success")
    .reduce((s, p) => s + p.amount, 0);
  const avgRating = RATINGS_REVIEWS.length
    ? RATINGS_REVIEWS.reduce((s, r) => s + Number(r.rating), 0) / RATINGS_REVIEWS.length
    : 0;
  const activeDrivers = DRIVERS.filter((d) => d.status === "Available").length;
  const completedBookings = BOOKINGS.filter((b) => b.status === "Completed").length;

  const bookingStatusData = [
    { name: "Completed", value: BOOKINGS.filter((b) => b.status === "Completed").length },
    { name: "In Progress", value: BOOKINGS.filter((b) => b.status === "In Progress").length },
    { name: "Scheduled", value: BOOKINGS.filter((b) => b.status === "Scheduled").length },
    { name: "Cancelled", value: BOOKINGS.filter((b) => b.status === "Cancelled").length },
  ];

  const weeklyRevenue = [
    { name: "Mon", value: 4200 },
    { name: "Tue", value: 6800 },
    { name: "Wed", value: 5100 },
    { name: "Thu", value: 7900 },
    { name: "Fri", value: 9200 },
    { name: "Sat", value: 11400 },
    { name: "Sun", value: 8700 },
  ];

  const recentBookings = BOOKINGS.slice(0, 5);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Syncing with Oracle DB…</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-sub">Live overview across all 11 data tables · April 2025</p>
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
        </div>
        <div className="header-badge">
          <Activity size={14} />
          <span>Live</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="stat-grid">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          delta="+18.4%"
          deltaType="up"
          icon={CreditCard}
          accent="var(--accent-blue)"
          subtitle="This month"
        />
        <StatCard
          title="Completed Rides"
          value={completedBookings}
          delta="+7.2%"
          deltaType="up"
          icon={CalendarCheck}
          accent="var(--accent-emerald)"
          subtitle="Out of 7 bookings"
        />
        <StatCard
          title="Active Drivers"
          value={activeDrivers}
          delta="–1"
          deltaType="down"
          icon={Users}
          accent="var(--accent-amber)"
          subtitle={`of ${DRIVERS.length} total`}
        />
        <StatCard
          title="Fleet Size"
          value={CABS.length}
          delta="+1 this month"
          deltaType="up"
          icon={Truck}
          accent="var(--accent-violet)"
          subtitle="Vehicles registered"
        />
        <StatCard
          title="Avg. Rating"
          value={avgRating.toFixed(1) + " ★"}
          delta="+0.2"
          deltaType="up"
          icon={Star}
          accent="var(--accent-rose)"
          subtitle="Across all drivers"
        />
        <StatCard
          title="Net Earnings"
          value={`₹${EARNINGS.reduce((s, e) => s + e.net, 0).toLocaleString()}`}
          delta="+22.1%"
          deltaType="up"
          icon={TrendingUp}
          accent="var(--accent-emerald)"
          subtitle="Driver payouts"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <BarChart data={weeklyRevenue} label="Weekly Revenue (₹)" />
        </div>
        <div className="chart-card">
          <DonutChart segments={bookingStatusData} title="Booking Status Breakdown" />
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="section-card">
        <div className="section-card__header">
          <h2 className="section-title">
            <Clock size={16} /> Recent Bookings
          </h2>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Pickup</th>
                <th>Drop-off</th>
                <th>Driver</th>
                <th>Fare</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => {
                const driver = DRIVERS.find((d) => d.driver_id === b.driver_id);
                const statusMap = {
                  Completed: "success", "In Progress": "info",
                  Scheduled: "warning", Cancelled: "error",
                };
                return (
                  <tr key={b.booking_id}>
                    <td className="mono">{b.booking_id}</td>
                    <td className="truncate-cell">{b.pickup}</td>
                    <td className="truncate-cell">{b.dropoff}</td>
                    <td>{driver?.name ?? "—"}</td>
                    <td>₹{b.fare}</td>
                    <td>
                      <Badge label={b.status} type={statusMap[b.status] ?? "neutral"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
