import { useEffect, useMemo, useState } from "react";
import { Users, Plus, Mail, Phone, CalendarDays, Ticket, PencilLine, Trash2 } from "lucide-react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import useBootstrapData from "../hooks/useBootstrapData";

const API_BASE = "http://localhost:3000/api";

const BLANK_FORM = {
  name: "",
  email: "",
  phone: "",
  user_type: "Passenger",
  joined_date: "",
  total_rides: "0",
};

const statusTypeMap = {
  Passenger: "info",
  Admin: "warning",
  Driver: "success",
};

export default function Passengers() {
  const { data, loading, error, reload } = useBootstrapData();
  const users = data.users ?? [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isEditing = editingUserId !== null;

  const editingUser = useMemo(
    () => users.find((user) => user.user_id === editingUserId) ?? null,
    [editingUserId, users]
  );

  useEffect(() => {
    if (modalOpen) {
      if (editingUser) {
        setForm({
          name: editingUser.name ?? "",
          email: editingUser.email ?? "",
          phone: editingUser.phone ?? "",
          user_type: editingUser.user_type ?? "Passenger",
          joined_date: editingUser.joined ?? "",
          total_rides: String(editingUser.total_rides ?? 0),
        });
      } else {
        setForm(BLANK_FORM);
      }
      setErrors({});
      setSubmitError("");
    }
  }, [modalOpen, editingUser]);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    if (!form.phone.trim()) nextErrors.phone = "Phone is required";
    if (!form.total_rides || Number.isNaN(Number(form.total_rides)) || Number(form.total_rides) < 0) {
      nextErrors.total_rides = "Total rides must be 0 or greater";
    }
    return nextErrors;
  };

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUserId(user.user_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUserId(null);
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
        total_rides: Number(form.total_rides),
      };

      if (isEditing) {
        const response = await fetch(`${API_BASE}/users/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");
      } else {
        const response = await fetch(`${API_BASE}/users`, {
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
      setSubmitError(err.message || "Failed to save passenger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    const user = users.find((entry) => entry.user_id === userId);
    if (!user) return;

    const confirmed = window.confirm(`Delete passenger ${user.name}?`);
    if (!confirmed) return;

    setDeleteError("");

    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      await reload();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete passenger");
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching USERS table…</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Passenger Directory</h1>
          <p className="page-sub">{users.length} records · USERS table</p>
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
          {deleteError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{deleteError}</p>}
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={16} /> Add Passenger
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="Passengers" value={users.length} icon={Users} accent="var(--accent-blue)" />
        <StatCard title="Total Rides" value={users.reduce((sum, user) => sum + Number(user.total_rides || 0), 0)} icon={Ticket} accent="var(--accent-emerald)" />
        <StatCard title="New This Month" value={users.filter((user) => (user.joined || "").startsWith("2025-04")).length} icon={CalendarDays} accent="var(--accent-amber)" />
        <StatCard title="Avg. Trips" value={users.length ? (users.reduce((sum, user) => sum + Number(user.total_rides || 0), 0) / users.length).toFixed(1) : "0.0"} icon={Phone} accent="var(--accent-rose)" />
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Joined</th>
                <th>Total Rides</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="mono">#{user.user_id}</td>
                  <td className="font-medium">{user.name}</td>
                  <td>{user.email}</td>
                  <td className="mono">{user.phone}</td>
                  <td><Badge label={user.user_type} type={statusTypeMap[user.user_type] ?? "neutral"} /></td>
                  <td className="mono">{user.joined}</td>
                  <td>{user.total_rides}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn--ghost" onClick={() => openEditModal(user)}>
                        <PencilLine size={14} /> Edit
                      </button>
                      <button className="btn btn--ghost" onClick={() => handleDelete(user.user_id)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Passenger Details" : "Add Passenger Details"}
      >
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Passenger full name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@example.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91-..." />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>
          <div className="form-group">
            <label>User Type</label>
            <select name="user_type" value={form.user_type} onChange={handleChange}>
              <option value="Passenger">Passenger</option>
              <option value="Admin">Admin</option>
              <option value="Driver">Driver</option>
            </select>
          </div>
          <div className="form-group">
            <label>Joined Date</label>
            <input name="joined_date" type="date" value={form.joined_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Total Rides</label>
            <input name="total_rides" type="number" min="0" value={form.total_rides} onChange={handleChange} />
            {errors.total_rides && <span className="form-error">{errors.total_rides}</span>}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            <Plus size={15} /> {saving ? "Saving…" : isEditing ? "Update Passenger" : "Save Passenger"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
