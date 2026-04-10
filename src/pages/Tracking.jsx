import { useEffect, useMemo, useState } from "react";
import { Activity, Gauge, MapPin, Plus, RadioTower, PencilLine, Trash2 } from "lucide-react";
import Modal from "../components/shared/Modal";
import Badge from "../components/shared/Badge";
import StatCard from "../components/shared/StatCard";
import useBootstrapData from "../hooks/useBootstrapData";

import { API_BASE } from "../config/apiBase";
const TRACKING_STATUS = ["En Route", "Arrived", "Paused", "No Signal"];

const BLANK_FORM = {
  booking_id: "",
  driver_location: "",
  timestamp: "",
  speed_kmh: "",
  status: "En Route",
};

const statusTypeMap = {
  "En Route": "info",
  Arrived: "success",
  Paused: "warning",
  "No Signal": "error",
};

export default function Tracking() {
  const { data, loading, error, reload } = useBootstrapData();
  const bookings = data.bookings ?? [];
  const drivers = data.drivers ?? [];
  const cabs = data.cabs ?? [];
  const [tracking, setTracking] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrackingId, setEditingTrackingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = editingTrackingId !== null;
  const editingTracking = useMemo(
    () => tracking.find((entry) => entry.track_id === editingTrackingId) ?? null,
    [tracking, editingTrackingId]
  );

  useEffect(() => {
    setTracking(data.ride_tracking ?? []);
  }, [data.ride_tracking]);

  useEffect(() => {
    if (!modalOpen) return;

    if (editingTracking) {
      setForm({
        booking_id: editingTracking.booking_id ?? "",
        driver_location:
          editingTracking.driver_location ??
          (editingTracking.lat !== undefined && editingTracking.lng !== undefined
            ? `${editingTracking.lat}, ${editingTracking.lng}`
            : ""),
        timestamp: editingTracking.timestamp ? editingTracking.timestamp.replace(" ", "T") : "",
        speed_kmh: String(editingTracking.speed_kmh ?? ""),
        status: editingTracking.status ?? "En Route",
      });
    } else {
      setForm(BLANK_FORM);
    }

    setErrors({});
    setSubmitError("");
  }, [modalOpen, editingTracking]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.booking_id) nextErrors.booking_id = "Select a booking";
    if (!form.driver_location.trim()) nextErrors.driver_location = "Driver location is required";
    if (form.speed_kmh && (Number.isNaN(Number(form.speed_kmh)) || Number(form.speed_kmh) < 0)) {
      nextErrors.speed_kmh = "Speed cannot be negative";
    }
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingTrackingId(null);
    setModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingTrackingId(entry.track_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTrackingId(null);
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
      driver_location: form.driver_location,
      timestamp: form.timestamp || null,
      speed_kmh: form.speed_kmh === "" ? null : Number(form.speed_kmh),
      status: form.status,
    };

    try {
      const response = await fetch(
        isEditing ? `${API_BASE}/tracking/${editingTrackingId}` : `${API_BASE}/tracking`,
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
      setSubmitError(err.message || "Failed to save tracking event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trackingId) => {
    const confirmed = window.confirm(`Delete tracking event #${trackingId}?`);
    if (!confirmed) return;

    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/tracking/${trackingId}`, { method: "DELETE" });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to delete tracking event");
    }
  };

  const latestByCab = cabs.map((cab) => {
    const cabBookings = bookings.filter((booking) => booking.cab_id === cab.cab_id);
    const matchingTracking = tracking
      .filter((entry) => cabBookings.some((booking) => booking.booking_id === entry.booking_id))
      .sort((a, b) => new Date((b.timestamp ?? "").replace(" ", "T")) - new Date((a.timestamp ?? "").replace(" ", "T")));

    const latest = matchingTracking[0] ?? null;
    const booking = latest ? cabBookings.find((entry) => entry.booking_id === latest.booking_id) ?? null : null;
    const driver = booking ? drivers.find((entry) => entry.driver_id === booking.driver_id) ?? null : null;

    return { cab, latest, booking, driver };
  });

  const trackedCabs = latestByCab.filter((entry) => entry.latest).length;
  const averageSpeed = tracking.length
    ? tracking.reduce((sum, entry) => sum + Number(entry.speed_kmh || 0), 0) / tracking.length
    : 0;
  const activeTrips = tracking.filter((entry) => entry.status === "En Route").length;
  const latestPing = tracking
    .map((entry) => entry.timestamp)
    .sort((left, right) => new Date((right ?? "").replace(" ", "T")) - new Date((left ?? "").replace(" ", "T")))[0];

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching RIDE_TRACKING table...</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Tracking</h1>
          <p className="page-sub">{tracking.length} tracking events · all cabs snapshot</p>
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
          {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{actionError}</p>}
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={16} /> Log Tracking Event
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="Fleet Units" value={cabs.length} icon={RadioTower} accent="var(--accent-blue)" />
        <StatCard title="Tracked Cabs" value={trackedCabs} icon={Activity} accent="var(--accent-emerald)" />
        <StatCard title="Active Trips" value={activeTrips} icon={MapPin} accent="var(--accent-amber)" />
        <StatCard title="Avg Speed" value={`${averageSpeed.toFixed(1)} km/h`} icon={Gauge} accent="var(--accent-violet)" subtitle={latestPing ? `Last ping ${latestPing}` : "No live pings"} />
      </div>

      <div className="tracking-grid">
        {latestByCab.map(({ cab, latest, booking, driver }) => (
          <div key={cab.cab_id} className="tracking-card">
            <div className="tracking-card__top">
              <div>
                <div className="tracking-card__title">{cab.model}</div>
                <div className="tracking-card__sub mono">{cab.license_plate}</div>
              </div>
              <Badge label={latest?.status ?? "Idle"} type={statusTypeMap[latest?.status] ?? "neutral"} />
            </div>
            <div className="tracking-card__body">
              <div className="tracking-card__row">
                <span>Current location</span>
                <strong>{latest?.driver_location ?? "No active signal"}</strong>
              </div>
              <div className="tracking-card__row">
                <span>Booking</span>
                <strong>{booking?.booking_id ?? "—"}</strong>
              </div>
              <div className="tracking-card__row">
                <span>Driver</span>
                <strong>{driver?.name ?? "—"}</strong>
              </div>
              <div className="tracking-card__row">
                <span>Speed</span>
                <strong>{latest?.speed_kmh ?? 0} km/h</strong>
              </div>
              <div className="tracking-card__row">
                <span>Last ping</span>
                <strong>{latest?.timestamp ?? "—"}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Track ID</th>
                <th>Booking</th>
                <th>Cab</th>
                <th>Driver</th>
                <th>Location</th>
                <th>Speed</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracking.map((entry) => {
                const booking = bookings.find((row) => row.booking_id === entry.booking_id);
                const cab = cabs.find((row) => row.cab_id === booking?.cab_id);
                const driver = drivers.find((row) => row.driver_id === booking?.driver_id);

                return (
                  <tr key={entry.track_id}>
                    <td className="mono">#{entry.track_id}</td>
                    <td className="mono">{entry.booking_id}</td>
                    <td>{cab?.license_plate ?? "—"}</td>
                    <td>{driver?.name ?? "—"}</td>
                    <td>{entry.driver_location ?? "—"}</td>
                    <td>{entry.speed_kmh ?? 0} km/h</td>
                    <td><Badge label={entry.status} type={statusTypeMap[entry.status] ?? "neutral"} /></td>
                    <td className="mono">{entry.timestamp}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn--ghost" onClick={() => openEditModal(entry)}>
                          <PencilLine size={14} /> Edit
                        </button>
                        <button className="btn btn--ghost" onClick={() => handleDelete(entry.track_id)}>
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={isEditing ? "Edit Tracking Event" : "Log Tracking Event"}>
        <div className="form-grid">
          <div className="form-group">
            <label>Booking</label>
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
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {TRACKING_STATUS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="form-group form-group--full">
            <label>Driver Location</label>
            <input name="driver_location" value={form.driver_location} onChange={handleChange} placeholder="OMR Signal, Chennai" />
            {errors.driver_location && <span className="form-error">{errors.driver_location}</span>}
          </div>
          <div className="form-group">
            <label>Speed (km/h)</label>
            <input type="number" min="0" name="speed_kmh" value={form.speed_kmh} onChange={handleChange} />
            {errors.speed_kmh && <span className="form-error">{errors.speed_kmh}</span>}
          </div>
          <div className="form-group">
            <label>Timestamp</label>
            <input type="datetime-local" name="timestamp" value={form.timestamp} onChange={handleChange} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            <Plus size={15} /> {saving ? "Saving..." : isEditing ? "Update Tracking" : "Save Tracking"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
