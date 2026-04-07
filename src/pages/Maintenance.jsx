import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock, PencilLine, Trash2 } from "lucide-react";
import useBootstrapData from "../hooks/useBootstrapData";

const API_BASE = "http://localhost:3000/api";

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
  const { data, loading, error, reload } = useBootstrapData();
  const cabs = data.cabs ?? [];
  const [records, setRecords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("All");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const isEditing = editingMaintenanceId !== null;
  const editingRecord = useMemo(
    () => records.find((record) => record.maint_id === editingMaintenanceId) ?? null,
    [records, editingMaintenanceId]
  );

  useEffect(() => {
    setRecords(data.cab_maintenance ?? []);
  }, [data.cab_maintenance]);

  useEffect(() => {
    if (!modalOpen) return;

    if (editingRecord) {
      setForm({
        cab_id: String(editingRecord.cab_id ?? ""),
        service_date: editingRecord.service_date ?? "",
        service_type: editingRecord.service_type ?? "",
        cost: String(editingRecord.cost ?? ""),
        technician: editingRecord.technician ?? "",
        notes: editingRecord.notes ?? "",
        status: editingRecord.status ?? "Scheduled",
      });
    } else {
      setForm(BLANK_FORM);
    }
    setErrors({});
    setSubmitError("");
  }, [modalOpen, editingRecord]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.cab_id) nextErrors.cab_id = "Select a cab (FK → CABS)";
    if (!form.service_date) nextErrors.service_date = "Service date required";
    if (!form.service_type) nextErrors.service_type = "Select service type";
    if (!form.cost || isNaN(form.cost) || Number(form.cost) <= 0) nextErrors.cost = "Valid cost required";
    if (!form.technician.trim()) nextErrors.technician = "Technician / garage name required";
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingMaintenanceId(null);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingMaintenanceId(record.maint_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMaintenanceId(null);
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setSaving(true);
    setSubmitError("");

    const payload = {
      ...form,
      cab_id: Number(form.cab_id),
      cost: Number(form.cost),
    };

    try {
      if (isEditing) {
        const response = await fetch(`${API_BASE}/maintenance/${editingMaintenanceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");
      } else {
        const response = await fetch(`${API_BASE}/maintenance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");
      }
      await reload();
      closeModal();
      setForm(BLANK_FORM);
    } catch (err) {
      setSubmitError(err.message || "Failed to save maintenance record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (maintenanceId) => {
    const confirmed = window.confirm(`Delete maintenance record #${maintenanceId}?`);
    if (!confirmed) return;

    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/maintenance/${maintenanceId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to delete maintenance record");
    }
  };

  useEffect(() => {
    if (data.cab_maintenance) {
      setRecords(data.cab_maintenance);
    }
  }, [data.cab_maintenance]);

  const displayed = filter === "All" ? records : records.filter((r) => r.status === filter);
  const totalCost = records.reduce((s, r) => s + Number(r.cost || 0), 0);

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
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
          {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{actionError}</p>}
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={16} /> Log Service
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="Total Service Cost" value={`₹${totalCost.toLocaleString()}`} icon={Wrench} accent="var(--accent-violet)" />
        <StatCard title="Completed" value={records.filter((r) => r.status === "Completed").length} icon={CheckCircle} accent="var(--accent-emerald)" />
        <StatCard title="In Progress" value={records.filter((r) => r.status === "In Progress").length} icon={AlertTriangle} accent="var(--accent-amber)" />
        <StatCard title="Scheduled" value={records.filter((r) => r.status === "Scheduled").length} icon={Clock} accent="var(--accent-blue)" />
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          {["All", "Completed", "In Progress", "Scheduled"].map((s) => (
            <button key={s} className={`filter-tab ${filter === s ? "filter-tab--active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => {
                const cab = cabs.find((c) => c.cab_id === r.cab_id);
                return (
                  <tr key={r.maint_id}>
                    <td className="mono muted">{r.maint_id}</td>
                    <td className="mono">{cab?.license_plate ?? `#${r.cab_id}`}</td>
                    <td>{cab?.model ?? "—"}</td>
                    <td className="mono">{r.service_date}</td>
                    <td><span className="service-type-pill">{r.service_type}</span></td>
                    <td className="font-medium">₹{Number(r.cost || 0).toLocaleString()}</td>
                    <td>{r.technician}</td>
                    <td className="truncate-cell muted">{r.notes || "—"}</td>
                    <td><Badge label={r.status} type={statusTypeMap[r.status] ?? "neutral"} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn--ghost" onClick={() => openEditModal(r)}>
                          <PencilLine size={14} /> Edit
                        </button>
                        <button className="btn btn--ghost" onClick={() => handleDelete(r.maint_id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={isEditing ? "Edit Service Record" : "Log New Service Record"}>
        <div className="form-grid">
          <div className="form-group">
            <label>Cab <span className="fk-badge">FK → CABS</span></label>
            <select name="cab_id" value={form.cab_id} onChange={handleChange}>
              <option value="">Select cab…</option>
              {cabs.map((c) => (<option key={c.cab_id} value={c.cab_id}>{c.model} · {c.license_plate}</option>))}
            </select>
            {errors.cab_id && <span className="form-error">{errors.cab_id}</span>}
          </div>
          <div className="form-group">
            <label>Service Type</label>
            <select name="service_type" value={form.service_type} onChange={handleChange}>
              <option value="">Select type…</option>
              {SERVICE_TYPES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            {errors.service_type && <span className="form-error">{errors.service_type}</span>}
          </div>
          <div className="form-group">
            <label>Service Date</label>
            <input type="date" name="service_date" value={form.service_date} onChange={handleChange} />
            {errors.service_date && <span className="form-error">{errors.service_date}</span>}
          </div>
          <div className="form-group">
            <label>Cost (₹)</label>
            <input type="number" name="cost" placeholder="e.g. 3500" value={form.cost} onChange={handleChange} min="1" />
            {errors.cost && <span className="form-error">{errors.cost}</span>}
          </div>
          <div className="form-group form-group--full">
            <label>Technician / Garage</label>
            <input type="text" name="technician" placeholder="e.g. Honda Service Center" value={form.technician} onChange={handleChange} />
            {errors.technician && <span className="form-error">{errors.technician}</span>}
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="form-group form-group--full">
            <label>Notes</label>
            <textarea name="notes" rows={3} placeholder="Optional notes…" value={form.notes} onChange={handleChange} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            <Plus size={15} /> {saving ? "Saving…" : isEditing ? "Update Record" : "Save Record"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
