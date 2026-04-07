import { useState, useEffect } from "react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { CAB_MAINTENANCE, CABS } from "../data/mockData";

const SERVICE_TYPES = [
  "Oil Change", "Tyre Replacement", "Brake Inspection",
  "Engine Overhaul", "AC Service", "Full Service",
  "Windshield Repair", "Battery Replacement", "Suspension Check",
];

const BLANK_FORM = {
  cab_id: "",
  service_date: "",
  service_type: "",
  cost: "",
  technician: "",
  notes: "",
  status: "Scheduled",
};

const statusTypeMap = {
  Completed: "success",
  "In Progress": "info",
  Scheduled: "warning",
};

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const t = setTimeout(() => { setRecords(CAB_MAINTENANCE); setLoading(false); }, 500);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.cab_id) e.cab_id = "Select a cab (FK → CABS)";
    if (!form.service_date) e.service_date = "Service date required";
    if (!form.service_type) e.service_type = "Select service type";
    if (!form.cost || isNaN(form.cost) || Number(form.cost) <= 0) e.cost = "Valid cost required";
    if (!form.technician.trim()) e.technician = "Technician / garage name required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const newRecord = {
      ...form,
      maint_id: records.length + 1,
      cab_id: Number(form.cab_id),
      cost: Number(form.cost),
    };
    setRecords((prev) => [newRecord, ...prev]);
    setModalOpen(false);
    setForm(BLANK_FORM);
  };

  const displayed = filter === "All" ? records : records.filter((r) => r.status === filter);
  const totalCost = records.reduce((s, r) => s + r.cost, 0);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching CAB_MAINTENANCE table…</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Logs</h1>
          <p className="page-sub">{records.length} records · CAB_MAINTENANCE ↔ CABS</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Log Service
        </button>
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard
          title="Total Service Cost"
          value={`₹${totalCost.toLocaleString()}`}
          icon={Wrench}
          accent="var(--accent-violet)"
        />
        <StatCard
          title="Completed"
          value={records.filter((r) => r.status === "Completed").length}
          icon={CheckCircle}
          accent="var(--accent-emerald)"
        />
        <StatCard
          title="In Progress"
          value={records.filter((r) => r.status === "In Progress").length}
          icon={AlertTriangle}
          accent="var(--accent-amber)"
        />
        <StatCard
          title="Scheduled"
          value={records.filter((r) => r.status === "Scheduled").length}
          icon={Clock}
          accent="var(--accent-blue)"
        />
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {["All", "Completed", "In Progress", "Scheduled"].map((s) => (
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

      {/* Table */}
      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cab (FK)</th>
                <th>Model</th>
                <th>Service Date</th>
                <th>Service Type</th>
                <th>Cost (₹)</th>
                <th>Technician</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => {
                const cab = CABS.find((c) => c.cab_id === r.cab_id);
                return (
                  <tr key={r.maint_id}>
                    <td className="mono muted">{r.maint_id}</td>
                    <td className="mono">{cab?.license_plate ?? `#${r.cab_id}`}</td>
                    <td>{cab?.model ?? "—"}</td>
                    <td className="mono">{r.service_date}</td>
                    <td>
                      <span className="service-type-pill">{r.service_type}</span>
                    </td>
                    <td className="font-medium">₹{r.cost.toLocaleString()}</td>
                    <td>{r.technician}</td>
                    <td className="truncate-cell muted">{r.notes || "—"}</td>
                    <td>
                      <Badge label={r.status} type={statusTypeMap[r.status] ?? "neutral"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Service Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Service Record">
        <div className="form-grid">

          {/* Cab ID – FK → CABS */}
          <div className="form-group">
            <label>
              Cab <span className="fk-badge">FK → CABS</span>
            </label>
            <select name="cab_id" value={form.cab_id} onChange={handleChange}>
              <option value="">Select cab…</option>
              {CABS.map((c) => (
                <option key={c.cab_id} value={c.cab_id}>
                  {c.model} · {c.license_plate}
                </option>
              ))}
            </select>
            {errors.cab_id && <span className="form-error">{errors.cab_id}</span>}
          </div>

          {/* Service Type */}
          <div className="form-group">
            <label>Service Type</label>
            <select name="service_type" value={form.service_type} onChange={handleChange}>
              <option value="">Select type…</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.service_type && <span className="form-error">{errors.service_type}</span>}
          </div>

          {/* Service Date */}
          <div className="form-group">
            <label>Service Date</label>
            <input type="date" name="service_date" value={form.service_date} onChange={handleChange} />
            {errors.service_date && <span className="form-error">{errors.service_date}</span>}
          </div>

          {/* Cost */}
          <div className="form-group">
            <label>Cost (₹)</label>
            <input type="number" name="cost" placeholder="e.g. 3500" value={form.cost} onChange={handleChange} min="1" />
            {errors.cost && <span className="form-error">{errors.cost}</span>}
          </div>

          {/* Technician */}
          <div className="form-group form-group--full">
            <label>Technician / Garage</label>
            <input type="text" name="technician" placeholder="e.g. Honda Service Center" value={form.technician} onChange={handleChange} />
            {errors.technician && <span className="form-error">{errors.technician}</span>}
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-group form-group--full">
            <label>Notes</label>
            <textarea name="notes" rows={3} placeholder="Optional notes…" value={form.notes} onChange={handleChange} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            <Plus size={15} /> Save Record
          </button>
        </div>
      </Modal>
    </div>
  );
}
