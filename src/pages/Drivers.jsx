import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import { Users, Star, Truck, UserCheck, Plus, PencilLine } from "lucide-react";
import useBootstrapData from "../hooks/useBootstrapData";

const API_BASE = "http://localhost:3000/api";

const BLANK_FORM = {
  name: "",
  license_no: "",
  phone: "",
  availability: "Available",
  ratings: "0",
  total_trips: "0",
  joined_date: "",
  user_id: "",
  cab_id: "",
};

function DriverCard({ driver, cabs, earningsData, onEdit }) {
  const cab = cabs.find((c) => c.cab_id === driver.cab_id);
  const earnings = earningsData.find((e) => e.driver_id === driver.driver_id);
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
      <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn--ghost" onClick={() => onEdit(driver)}>
          <PencilLine size={14} /> Edit
        </button>
      </div>
    </div>
  );
}

export default function Drivers() {
  const { data, loading, error, reload } = useBootstrapData();
  const drivers = data.drivers ?? [];
  const cabs = data.cabs ?? [];
  const users = data.users ?? [];
  const earningsData = data.earnings ?? [];
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = editingDriverId !== null;

  const editingDriver = useMemo(
    () => drivers.find((driver) => driver.driver_id === editingDriverId) ?? null,
    [drivers, editingDriverId]
  );

  useEffect(() => {
    if (!modalOpen) return;

    if (editingDriver) {
      setForm({
        name: editingDriver.name ?? "",
        license_no: editingDriver.license_no ?? "",
        phone: editingDriver.phone ?? "",
        availability: editingDriver.status ?? "Available",
        ratings: String(editingDriver.rating ?? 0),
        total_trips: String(editingDriver.total_trips ?? 0),
        joined_date: editingDriver.joined ?? "",
        user_id: editingDriver.user_id ? String(editingDriver.user_id) : "",
        cab_id: editingDriver.cab_id ? String(editingDriver.cab_id) : "",
      });
    } else {
      setForm(BLANK_FORM);
    }
    setErrors({});
    setSubmitError("");
  }, [modalOpen, editingDriver]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Driver name is required";
    if (!form.license_no.trim()) nextErrors.license_no = "License number is required";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required";
    if (!form.ratings || Number.isNaN(Number(form.ratings)) || Number(form.ratings) < 0 || Number(form.ratings) > 5) {
      nextErrors.ratings = "Rating must be between 0 and 5";
    }
    if (!form.total_trips || Number.isNaN(Number(form.total_trips)) || Number(form.total_trips) < 0) {
      nextErrors.total_trips = "Trips must be 0 or greater";
    }
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingDriverId(null);
    setModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriverId(driver.driver_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDriverId(null);
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
      const payload = {
        ...form,
        ratings: Number(form.ratings),
        total_trips: Number(form.total_trips),
        user_id: form.user_id || null,
        cab_id: form.cab_id || null,
      };

      if (isEditing) {
        const response = await fetch(`${API_BASE}/drivers/${editingDriverId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");
      } else {
        const response = await fetch(`${API_BASE}/drivers`, {
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
      setSubmitError(err.message || "Failed to save driver");
    } finally {
      setSaving(false);
    }
  };

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
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={16} /> Add Driver
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="Total Drivers" value={drivers.length} icon={Users} accent="var(--accent-blue)" />
        <StatCard title="Available" value={drivers.filter((d) => d.status === "Available").length} icon={UserCheck} accent="var(--accent-emerald)" />
        <StatCard title="On Trip" value={drivers.filter((d) => d.status === "On Trip").length} icon={Truck} accent="var(--accent-amber)" />
        <StatCard title="Avg. Rating" value={(drivers.length ? (drivers.reduce((s, d) => s + Number(d.rating), 0) / drivers.length).toFixed(2) : "0.00") + " ★"} icon={Star} accent="var(--accent-rose)" />
      </div>

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
        {displayed.map((d) => <DriverCard key={d.driver_id} driver={d} cabs={cabs} earningsData={earningsData} onEdit={openEditModal} />)}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Driver Details" : "Add Driver Details"}
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Driver Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Driver full name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>License No.</label>
            <input name="license_no" value={form.license_no} onChange={handleChange} placeholder="TN09-20240001" />
            {errors.license_no && <span className="form-error">{errors.license_no}</span>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91-..." />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>
          <div className="form-group">
            <label>Availability</label>
            <select name="availability" value={form.availability} onChange={handleChange}>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
            </select>
          </div>
          <div className="form-group">
            <label>Rating</label>
            <input name="ratings" type="number" min="0" max="5" step="0.1" value={form.ratings} onChange={handleChange} />
            {errors.ratings && <span className="form-error">{errors.ratings}</span>}
          </div>
          <div className="form-group">
            <label>Total Trips</label>
            <input name="total_trips" type="number" min="0" value={form.total_trips} onChange={handleChange} />
            {errors.total_trips && <span className="form-error">{errors.total_trips}</span>}
          </div>
          <div className="form-group">
            <label>Joined Date</label>
            <input name="joined_date" type="date" value={form.joined_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>User Link <span className="fk-badge">Optional FK → USERS</span></label>
            <select name="user_id" value={form.user_id} onChange={handleChange}>
              <option value="">No linked user</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name} (#{user.user_id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cab Link <span className="fk-badge">Optional FK → CABS</span></label>
            <select name="cab_id" value={form.cab_id} onChange={handleChange}>
              <option value="">No cab assigned</option>
              {cabs.map((cab) => (
                <option key={cab.cab_id} value={cab.cab_id}>
                  {cab.model} · {cab.license_plate}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            <Plus size={15} /> {saving ? "Saving…" : isEditing ? "Update Driver" : "Save Driver"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
