import { useState, useEffect } from "react";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import { Truck, Plus, Wrench, CheckCircle } from "lucide-react";
import { CABS, CAB_MAINTENANCE } from "../data/mockData";

export default function Fleet() {
  const [cabs, setCabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setCabs(CABS); setLoading(false); }, 500);
    return () => clearTimeout(t);
  }, []);

  const activeCabs = cabs.filter((c) => c.status === "Active").length;
  const inServiceCabs = cabs.filter((c) => c.status === "In Service").length;

  const statusTypeMap = { Active: "success", "In Service": "warning", Inactive: "error" };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching CABS table…</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Management</h1>
          <p className="page-sub">{cabs.length} vehicles · CABS ↔ CAB_MAINTENANCE</p>
        </div>
        <button className="btn btn--primary">
          <Plus size={16} /> Register Vehicle
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard title="Total Fleet" value={cabs.length} icon={Truck} accent="var(--accent-blue)" />
        <StatCard title="Active" value={activeCabs} icon={CheckCircle} accent="var(--accent-emerald)" />
        <StatCard title="In Service" value={inServiceCabs} icon={Wrench} accent="var(--accent-amber)" />
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cab ID</th>
                <th>Model</th>
                <th>License Plate</th>
                <th>Type</th>
                <th>Year</th>
                <th>Color</th>
                <th>Last Service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cabs.map((cab) => {
                const lastMaint = CAB_MAINTENANCE
                  .filter((m) => m.cab_id === cab.cab_id)
                  .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))[0];
                return (
                  <tr key={cab.cab_id}>
                    <td className="mono">#{cab.cab_id}</td>
                    <td className="font-medium">{cab.model}</td>
                    <td className="mono">{cab.license_plate}</td>
                    <td>{cab.type}</td>
                    <td>{cab.year}</td>
                    <td>
                      <span className="color-swatch" style={{ background: cab.color.toLowerCase().replace(/\s/g, "") === "pearlwhite" ? "#f5f5f0" : cab.color.toLowerCase().replace(/\s/g, "") }} />
                      {cab.color}
                    </td>
                    <td className="mono">
                      {lastMaint ? lastMaint.service_date : <span className="muted">None</span>}
                    </td>
                    <td>
                      <Badge label={cab.status} type={statusTypeMap[cab.status] ?? "neutral"} />
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
