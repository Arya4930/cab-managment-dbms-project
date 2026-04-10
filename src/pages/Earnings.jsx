import { useEffect, useMemo, useState } from "react";
import { Banknote, Coins, Plus, Wallet, PencilLine, Trash2 } from "lucide-react";
import Modal from "../components/Shared/Modal";
import StatCard from "../components/Shared/StatCard";
import useBootstrapData from "../hooks/useBootstrapData";

import { API_BASE } from "../config/apiBase";

const BLANK_FORM = {
  booking_id: "",
  driver_id: "",
  gross: "",
  platform_fee: "",
  trips: "1",
  earning_date: "",
};

export default function Earnings() {
  const { data, loading, error, reload } = useBootstrapData();
  const drivers = data.drivers ?? [];
  const bookings = data.bookings ?? [];
  const [earnings, setEarnings] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEarningId, setEditingEarningId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = editingEarningId !== null;
  const editingEarning = useMemo(
    () => earnings.find((entry) => entry.earnings_id === editingEarningId) ?? null,
    [earnings, editingEarningId]
  );

  const resolvedEarnings = useMemo(
    () =>
      earnings.map((entry) => ({
        ...entry,
        driver_name:
          entry.driver_name ?? drivers.find((driverRow) => driverRow.driver_id === entry.driver_id)?.name ?? "—",
      })),
    [drivers, earnings]
  );

  useEffect(() => {
    setEarnings(data.earnings ?? []);
  }, [data.earnings]);

  useEffect(() => {
    if (!modalOpen) return;

    if (editingEarning) {
      setForm({
        booking_id: editingEarning.booking_id ?? "",
        driver_id: String(editingEarning.driver_id ?? ""),
        gross: String(editingEarning.gross ?? ""),
        platform_fee: String(editingEarning.platform_fee ?? 0),
        trips: String(editingEarning.trips ?? 1),
        earning_date: editingEarning.earning_date ?? "",
      });
    } else {
      setForm(BLANK_FORM);
    }

    setErrors({});
    setSubmitError("");
  }, [modalOpen, editingEarning]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.booking_id) nextErrors.booking_id = "Select a booking";
    if (!form.driver_id) nextErrors.driver_id = "Select a driver";
    if (!form.gross || Number.isNaN(Number(form.gross)) || Number(form.gross) <= 0) {
      nextErrors.gross = "Valid gross amount required";
    }
    if (form.platform_fee !== "" && (Number.isNaN(Number(form.platform_fee)) || Number(form.platform_fee) < 0)) {
      nextErrors.platform_fee = "Platform fee cannot be negative";
    }
    if (!form.trips || Number.isNaN(Number(form.trips)) || Number(form.trips) <= 0) {
      nextErrors.trips = "Trips must be at least 1";
    }
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingEarningId(null);
    setModalOpen(true);
  };

  const openEditModal = (earning) => {
    setEditingEarningId(earning.earnings_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEarningId(null);
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setSubmitError("");

    const payload = {
      booking_id: form.booking_id,
      driver_id: Number(form.driver_id),
      gross: Number(form.gross),
      platform_fee: Number(form.platform_fee || 0),
      trips: Number(form.trips || 1),
      earning_date: form.earning_date || null,
    };

    try {
      const response = await fetch(
        isEditing ? `${API_BASE}/earnings/${editingEarningId}` : `${API_BASE}/earnings`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");

      await reload();
      closeModal();
      setForm(BLANK_FORM);
    } catch (err) {
      setSubmitError(err.message || "Failed to save earning record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (earningId) => {
    const confirmed = window.confirm(`Delete earning record #${earningId}?`);
    if (!confirmed) return;

    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/earnings/${earningId}`, { method: "DELETE" });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to delete earning record");
    }
  };

  const totalGross = earnings.reduce((sum, entry) => sum + Number(entry.gross || 0), 0);
  const totalFee = earnings.reduce((sum, entry) => sum + Number(entry.platform_fee || 0), 0);
  const totalTrips = earnings.reduce((sum, entry) => sum + Number(entry.trips || 0), 0);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching EARNINGS table...</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="page-sub">{earnings.length} records · EARNINGS ↔ DRIVERS ↔ BOOKINGS</p>
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
          {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{actionError}</p>}
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={16} /> Add Earnings
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="Driver Share" value={`Rs ${totalGross.toLocaleString()}`} icon={Banknote} accent="var(--accent-emerald)" />
        <StatCard title="Platform Fee" value={`Rs ${totalFee.toLocaleString()}`} icon={Wallet} accent="var(--accent-amber)" />
        <StatCard title="Trips Logged" value={totalTrips} icon={Plus} accent="var(--accent-blue)" />
        <StatCard title="Records" value={resolvedEarnings.length} icon={Coins} accent="var(--accent-violet)" />
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Earning ID</th>
                <th>Driver ID</th>
                <th>Driver Name</th>
                <th>Gross</th>
                <th>Platform Fee</th>
                <th>Trips</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resolvedEarnings.map((entry) => {
                return (
                  <tr key={entry.earnings_id}>
                    <td className="mono">#{entry.earnings_id}</td>
                    <td className="mono">#{entry.driver_id}</td>
                    <td>{entry.driver_name}</td>
                    <td>Rs {Number(entry.gross || 0).toLocaleString()}</td>
                    <td>Rs {Number(entry.platform_fee || 0).toLocaleString()}</td>
                    <td>{entry.trips}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn--ghost" onClick={() => openEditModal(entry)}>
                          <PencilLine size={14} /> Edit
                        </button>
                        <button className="btn btn--ghost" onClick={() => handleDelete(entry.earnings_id)}>
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={isEditing ? "Edit Earnings" : "Create Earnings"}>
        <div className="form-grid">
          <div className="form-group">
            <label>Booking ID</label>
            <select name="booking_id" value={form.booking_id} onChange={handleChange}>
              <option value="">Select booking...</option>
              {bookings.map((booking) => (
                <option key={booking.booking_id} value={booking.booking_id}>
                  {booking.booking_id} · {booking.pickup}
                </option>
              ))}
            </select>
            {errors.booking_id && <span className="form-error">{errors.booking_id}</span>}
          </div>
          <div className="form-group">
            <label>Driver ID</label>
            <select name="driver_id" value={form.driver_id} onChange={handleChange}>
              <option value="">Select driver...</option>
              {drivers.map((driver) => (
                <option key={driver.driver_id} value={driver.driver_id}>#{driver.driver_id} · {driver.name}</option>
              ))}
            </select>
            {errors.driver_id && <span className="form-error">{errors.driver_id}</span>}
          </div>
          <div className="form-group">
            <label>Gross</label>
            <input type="number" min="1" name="gross" value={form.gross} onChange={handleChange} />
            {errors.gross && <span className="form-error">{errors.gross}</span>}
          </div>
          <div className="form-group">
            <label>Platform Fee</label>
            <input type="number" min="0" name="platform_fee" value={form.platform_fee} onChange={handleChange} />
            {errors.platform_fee && <span className="form-error">{errors.platform_fee}</span>}
          </div>
          <div className="form-group">
            <label>Trips</label>
            <input type="number" min="1" name="trips" value={form.trips} onChange={handleChange} />
            {errors.trips && <span className="form-error">{errors.trips}</span>}
          </div>
          <div className="form-group">
            <label>Earning Date</label>
            <input type="date" name="earning_date" value={form.earning_date} onChange={handleChange} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            <Plus size={15} /> {saving ? "Saving..." : isEditing ? "Update Earnings" : "Save Earnings"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
