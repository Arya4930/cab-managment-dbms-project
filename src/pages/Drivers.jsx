import { useState, useEffect } from "react";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import { Users, Star, Truck, UserCheck } from "lucide-react";
import { DRIVERS, CABS, EARNINGS } from "../data/mockData";

function DriverCard({ driver }) {
  const cab = CABS.find((c) => c.cab_id === driver.cab_id);
  const earnings = EARNINGS.find((e) => e.driver_id === driver.driver_id);
  const statusTypeMap = { Available: "success", "On Trip": "info", "Off Duty": "neutral" };

  return (
    <div className="driver-card">
      <div className="driver-card__header">
        <div className="driver-avatar">
          {driver.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="driver-card__info">
          <div className="driver-name">{driver.name}</div>
          <div className="driver-license mono">{driver.license_no}</div>
        </div>
        <Badge label={driver.status} type={statusTypeMap[driver.status] ?? "neutral"} />
      </div>
      <div className="driver-card__stats">
        <div className="driver-stat">
          <Star size={13} className="stat-icon--yellow" />
          <span>{driver.rating}</span>
          <span className="muted">Rating</span>
        </div>
        <div className="driver-stat">
          <Truck size={13} className="stat-icon--blue" />
          <span>{driver.total_trips}</span>
          <span className="muted">Trips</span>
        </div>
        <div className="driver-stat">
          <span className="rupee-icon">₹</span>
          <span>{earnings ? earnings.net.toLocaleString() : "—"}</span>
          <span className="muted">Net Earned</span>
        </div>
      </div>
      {cab && (
        <div className="driver-cab">
          <Truck size={12} />
          <span>{cab.model}</span>
          <span className="mono muted">{cab.license_plate}</span>
        </div>
      )}
    </div>
  );
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const t = setTimeout(() => { setDrivers(DRIVERS); setLoading(false); }, 500);
    return () => clearTimeout(t);
  }, []);

  const displayed = filter === "All" ? drivers : drivers.filter((d) => d.status === filter);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching DRIVERS table…</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Profiles</h1>
          <p className="page-sub">{drivers.length} drivers · DRIVERS ↔ CABS ↔ EARNINGS</p>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="Total Drivers" value={drivers.length} icon={Users} accent="var(--accent-blue)" />
        <StatCard title="Available" value={drivers.filter((d) => d.status === "Available").length} icon={UserCheck} accent="var(--accent-emerald)" />
        <StatCard title="On Trip" value={drivers.filter((d) => d.status === "On Trip").length} icon={Truck} accent="var(--accent-amber)" />
        <StatCard title="Avg. Rating" value={(drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(2) + " ★"} icon={Star} accent="var(--accent-rose)" />
      </div>

      {/* Status Filter */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {["All", "Available", "On Trip", "Off Duty"].map((s) => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? "filter-tab--active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="driver-grid">
        {displayed.map((d) => <DriverCard key={d.driver_id} driver={d} />)}
      </div>
    </div>
  );
}
