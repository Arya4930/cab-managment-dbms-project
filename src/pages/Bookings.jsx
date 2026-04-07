import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import { Plus, Search, Filter, MapPin, PencilLine, Trash2 } from "lucide-react";
import useBootstrapData from "../hooks/useBootstrapData";

const API_BASE = "http://localhost:3000/api";

const STATUS_OPTIONS = ["All", "Completed", "In Progress", "Scheduled", "Cancelled"];

const BLANK_FORM = {
  user_id: "",
  driver_id: "",
  cab_id: "",
  pickup: "",
  dropoff: "",
  pickup_time: "",
  fare: "",
  status: "Scheduled",
  distance_km: "0",
};

const statusTypeMap = {
  Completed: "success",
  "In Progress": "info",
  Scheduled: "warning",
  Cancelled: "error",
};

export default function Bookings() {
  const { data, loading, error, reload } = useBootstrapData();
  const drivers = data.drivers ?? [];
  const cabs = data.cabs ?? [];
  const users = data.users ?? [];
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const isEditing = editingBookingId !== null;
  const editingBooking = useMemo(
    () => bookings.find((booking) => booking.booking_id === editingBookingId) ?? null,
    [bookings, editingBookingId]
  );

  useEffect(() => {
    setBookings(data.bookings ?? []);
  }, [data.bookings]);

  useEffect(() => {
    if (!modalOpen) return;

    if (editingBooking) {
      setForm({
        user_id: String(editingBooking.user_id ?? ""),
        driver_id: String(editingBooking.driver_id ?? ""),
        cab_id: String(editingBooking.cab_id ?? ""),
        pickup: editingBooking.pickup ?? "",
        dropoff: editingBooking.dropoff ?? "",
        pickup_time: editingBooking.pickup_time ? editingBooking.pickup_time.replace(" ", "T") : "",
        fare: String(editingBooking.fare ?? ""),
        status: editingBooking.status ?? "Scheduled",
        distance_km: String(editingBooking.distance_km ?? 0),
      });
    } else {
      setForm(BLANK_FORM);
    }
    setErrors({});
    setSubmitError("");
  }, [modalOpen, editingBooking]);

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.booking_id.toLowerCase().includes(q) ||
      b.pickup.toLowerCase().includes(q) ||
      b.dropoff.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.user_id) nextErrors.user_id = "Select a passenger";
    if (!form.driver_id) nextErrors.driver_id = "Select a driver";
    if (!form.cab_id) nextErrors.cab_id = "Select a cab";
    if (!form.pickup.trim()) nextErrors.pickup = "Pickup location required";
    if (!form.dropoff.trim()) nextErrors.dropoff = "Drop-off location required";
    if (!form.pickup_time) nextErrors.pickup_time = "Pickup time required";
    if (!form.fare || isNaN(form.fare) || Number(form.fare) <= 0) nextErrors.fare = "Valid fare required";
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingBookingId(null);
    setModalOpen(true);
  };

  const openEditModal = (booking) => {
    setEditingBookingId(booking.booking_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBookingId(null);
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
      ...form,
      user_id: Number(form.user_id),
      driver_id: Number(form.driver_id),
      cab_id: Number(form.cab_id),
      fare: Number(form.fare),
      distance_km: Number(form.distance_km || 0),
    };

    try {
      if (isEditing) {
        const response = await fetch(`${API_BASE}/bookings/${editingBookingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");
      } else {
        const response = await fetch(`${API_BASE}/bookings`, {
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
      setSubmitError(err.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookingId) => {
    const confirmed = window.confirm(`Delete booking ${bookingId}?`);
    if (!confirmed) return;

    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to delete booking");
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching BOOKINGS table…</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-sub">{bookings.length} records · BOOKINGS ↔ USERS ↔ DRIVERS ↔ CABS</p>
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
          {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{actionError}</p>}
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={16} /> New Booking
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by ID, pickup, drop-off…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <Filter size={14} />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? "filter-tab--active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Passenger</th>
                <th>Driver</th>
                <th>Cab</th>
                <th>Pickup</th>
                <th>Drop-off</th>
                <th>Pickup Time</th>
                <th>Fare (₹)</th>
                <th>Dist.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-row">No bookings match your filters.</td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const driver = drivers.find((d) => d.driver_id === b.driver_id);
                  const user = users.find((u) => u.user_id === b.user_id);
                  const cab = cabs.find((c) => c.cab_id === b.cab_id);
                  return (
                    <tr key={b.booking_id}>
                      <td className="mono">{b.booking_id}</td>
                      <td>{user?.name ?? "—"}</td>
                      <td>{driver?.name ?? "—"}</td>
                      <td className="mono">{cab?.license_plate ?? "—"}</td>
                      <td className="truncate-cell"><MapPin size={12} className="inline-icon" /> {b.pickup}</td>
                      <td className="truncate-cell">{b.dropoff}</td>
                      <td className="mono">{b.pickup_time}</td>
                      <td>₹{b.fare}</td>
                      <td>{b.distance_km} km</td>
                      <td><Badge label={b.status} type={statusTypeMap[b.status] ?? "neutral"} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="btn btn--ghost" onClick={() => openEditModal(b)}>
                            <PencilLine size={14} /> Edit
                          </button>
                          <button className="btn btn--ghost" onClick={() => handleDelete(b.booking_id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={isEditing ? "Edit Booking" : "Create New Booking"}>
        <div className="form-grid">
          <div className="form-group">
            <label>Passenger <span className="fk-badge">FK → USERS</span></label>
            <select name="user_id" value={form.user_id} onChange={handleChange}>
              <option value="">Select passenger…</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.name} (#{u.user_id})</option>
              ))}
            </select>
            {errors.user_id && <span className="form-error">{errors.user_id}</span>}
          </div>
          <div className="form-group">
            <label>Driver <span className="fk-badge">FK → DRIVERS</span></label>
            <select name="driver_id" value={form.driver_id} onChange={handleChange}>
              <option value="">Select driver…</option>
              {drivers.filter((d) => d.status === "Available" || String(d.driver_id) === String(form.driver_id)).map((d) => (
                <option key={d.driver_id} value={d.driver_id}>{d.name} · ★{d.rating}</option>
              ))}
            </select>
            {errors.driver_id && <span className="form-error">{errors.driver_id}</span>}
          </div>
          <div className="form-group">
            <label>Cab <span className="fk-badge">FK → CABS</span></label>
            <select name="cab_id" value={form.cab_id} onChange={handleChange}>
              <option value="">Select cab…</option>
              {cabs.filter((c) => c.status === "Active" || String(c.cab_id) === String(form.cab_id)).map((c) => (
                <option key={c.cab_id} value={c.cab_id}>{c.model} · {c.license_plate}</option>
              ))}
            </select>
            {errors.cab_id && <span className="form-error">{errors.cab_id}</span>}
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.filter((s) => s !== "All").map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Pickup Time</label>
            <input type="datetime-local" name="pickup_time" value={form.pickup_time} onChange={handleChange} />
            {errors.pickup_time && <span className="form-error">{errors.pickup_time}</span>}
          </div>
          <div className="form-group">
            <label>Distance (km)</label>
            <input type="number" name="distance_km" min="0" value={form.distance_km} onChange={handleChange} />
          </div>
          <div className="form-group form-group--full">
            <label>Pickup Location</label>
            <input type="text" name="pickup" placeholder="e.g. Chennai Central Railway Station" value={form.pickup} onChange={handleChange} />
            {errors.pickup && <span className="form-error">{errors.pickup}</span>}
          </div>
          <div className="form-group form-group--full">
            <label>Drop-off Location</label>
            <input type="text" name="dropoff" placeholder="e.g. Chennai Airport (MAA)" value={form.dropoff} onChange={handleChange} />
            {errors.dropoff && <span className="form-error">{errors.dropoff}</span>}
          </div>
          <div className="form-group">
            <label>Fare (₹)</label>
            <input type="number" name="fare" placeholder="e.g. 750" value={form.fare} onChange={handleChange} min="1" />
            {errors.fare && <span className="form-error">{errors.fare}</span>}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            <Plus size={15} /> {saving ? "Saving…" : isEditing ? "Update Booking" : "Confirm Booking"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
