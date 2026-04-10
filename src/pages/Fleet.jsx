import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import { Truck, Wrench, CheckCircle, PencilLine, Trash2 } from "lucide-react";
import useBootstrapData from "../hooks/useBootstrapData";

import { API_BASE } from "../config/apiBase";

const BLANK_FORM = {
  type: "",
  model: "",
  license_plate: "",
  status: "Active",
  year: "",
  color: "",
};

export default function Fleet() {
  const { data, loading, error, reload } = useBootstrapData();
  const cabs = data.cabs ?? [];
  const maintenanceRecords = data.cab_maintenance ?? [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCabId, setEditingCabId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = editingCabId !== null;
  const editingCab = useMemo(
    () => cabs.find((cab) => cab.cab_id === editingCabId) ?? null,
    [cabs, editingCabId]
  );

  const activeCabs = cabs.filter((c) => c.status === "Active").length;
  const inServiceCabs = cabs.filter((c) => c.status === "In Service").length;

  const statusTypeMap = { Active: "success", "In Service": "warning", Inactive: "error" };

  useEffect(() => {
    if (!modalOpen) return;

    if (editingCab) {
      setForm({
        type: editingCab.type ?? "",
        model: editingCab.model ?? "",
        license_plate: editingCab.license_plate ?? "",
        status: editingCab.status ?? "Active",
        year: editingCab.year ? String(editingCab.year) : "",
        color: editingCab.color ?? "",
      });
    } else {
      setForm(BLANK_FORM);
    }
    setErrors({});
    setSubmitError("");
  }, [modalOpen, editingCab]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.type.trim()) nextErrors.type = "Cab type is required";
    if (!form.model.trim()) nextErrors.model = "Model is required";
    if (!form.license_plate.trim()) nextErrors.license_plate = "License plate is required";
    if (!form.status.trim()) nextErrors.status = "Status is required";
    return nextErrors;
  };

  const openEditModal = (cab) => {
    setEditingCabId(cab.cab_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCabId(null);
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const response = await fetch(`${API_BASE}/cabs/${editingCabId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        type: form.type,
        model: form.model,
        license_plate: form.license_plate,
        status: form.status,
        year: form.year ? Number(form.year) : null,
        color: form.color,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      await reload();
      closeModal();
      setForm(BLANK_FORM);
    } catch (err) {
      setSubmitError(err.message || "Failed to save cab");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cabId) => {
    const confirmed = window.confirm(`Delete cab #${cabId}?`);
    if (!confirmed) return;

    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/cabs/${cabId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to delete cab");
    }
  };

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
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
          {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{actionError}</p>}
        </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cabs.map((cab) => {
                const lastMaint = maintenanceRecords
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
                      <span
                        className="color-swatch"
                        style={{
                          background:
                            cab.color.toLowerCase().replace(/\s/g, "") === "pearlwhite"
                              ? "#f5f5f0"
                              : cab.color.toLowerCase().replace(/\s/g, ""),
                        }}
                      />
                      {cab.color}
                    </td>
                    <td className="mono">{lastMaint ? lastMaint.service_date : <span className="muted">None</span>}</td>
                    <td><Badge label={cab.status} type={statusTypeMap[cab.status] ?? "neutral"} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn--ghost" onClick={() => openEditModal(cab)}>
                          <PencilLine size={14} /> Edit
                        </button>
                        <button className="btn btn--ghost" onClick={() => handleDelete(cab.cab_id)}>
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

      <Modal isOpen={modalOpen} onClose={closeModal} title="Edit Vehicle Details">
        <div className="form-grid">
          <div className="form-group">
            <label>Type</label>
            <input name="type" value={form.type} onChange={handleChange} />
            {errors.type && <span className="form-error">{errors.type}</span>}
          </div>
          <div className="form-group">
            <label>Model</label>
            <input name="model" value={form.model} onChange={handleChange} />
            {errors.model && <span className="form-error">{errors.model}</span>}
          </div>
          <div className="form-group">
            <label>License Plate</label>
            <input name="license_plate" value={form.license_plate} onChange={handleChange} />
            {errors.license_plate && <span className="form-error">{errors.license_plate}</span>}
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="In Service">In Service</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.status && <span className="form-error">{errors.status}</span>}
          </div>
          <div className="form-group">
            <label>Year</label>
            <input name="year" type="number" value={form.year} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <input name="color" value={form.color} onChange={handleChange} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            <PencilLine size={15} /> {saving ? "Saving…" : "Update Vehicle"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
