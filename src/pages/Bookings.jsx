import { useState, useEffect } from "react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import { Plus, Search, Filter, MapPin } from "lucide-react";
import { BOOKINGS, DRIVERS, CABS, USERS } from "../data/mockData";

const STATUS_OPTIONS = ["All", "Completed", "In Progress", "Scheduled", "Cancelled"];

const BLANK_FORM = {
  user_id: "",
  driver_id: "",
  cab_id: "",
  pickup: "",
  dropoff: "",
  pickup_time: "",
  fare: "",
};

const statusTypeMap = {
  Completed: "success",
  "In Progress": "info",
  Scheduled: "warning",
  Cancelled: "error",
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});

  // Simulate data fetch
  useEffect(() => {
    const t = setTimeout(() => {
      setBookings(BOOKINGS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
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

  // ── Form handling ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.user_id) e.user_id = "Select a passenger";
    if (!form.driver_id) e.driver_id = "Select a driver";
    if (!form.cab_id) e.cab_id = "Select a cab";
    if (!form.pickup.trim()) e.pickup = "Pickup location required";
    if (!form.dropoff.trim()) e.dropoff = "Drop-off location required";
    if (!form.pickup_time) e.pickup_time = "Pickup time required";
    if (!form.fare || isNaN(form.fare) || Number(form.fare) <= 0)
      e.fare = "Valid fare required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const newBooking = {
      ...form,
      booking_id: `BK-${String(bookings.length + 1).padStart(3, "0")}`,
      user_id: Number(form.user_id),
      driver_id: Number(form.driver_id),
      cab_id: Number(form.cab_id),
      fare: Number(form.fare),
      status: "Scheduled",
      distance_km: Math.floor(Math.random() * 30) + 5,
    };
    setBookings((prev) => [newBooking, ...prev]);
    setModalOpen(false);
    setForm(BLANK_FORM);
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
        </div>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Booking
        </button>
      </div>

      {/* Filters */}
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

      {/* Table */}
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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-row">No bookings match your filters.</td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const driver = DRIVERS.find((d) => d.driver_id === b.driver_id);
                  const user = USERS.find((u) => u.user_id === b.user_id);
                  const cab = CABS.find((c) => c.cab_id === b.cab_id);
                  return (
                    <tr key={b.booking_id}>
                      <td className="mono">{b.booking_id}</td>
                      <td>{user?.name ?? "—"}</td>
                      <td>{driver?.name ?? "—"}</td>
                      <td className="mono">{cab?.license_plate ?? "—"}</td>
                      <td className="truncate-cell">
                        <MapPin size={12} className="inline-icon" /> {b.pickup}
                      </td>
                      <td className="truncate-cell">{b.dropoff}</td>
                      <td className="mono">{b.pickup_time}</td>
                      <td>₹{b.fare}</td>
                      <td>{b.distance_km} km</td>
                      <td>
                        <Badge label={b.status} type={statusTypeMap[b.status] ?? "neutral"} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Booking Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Booking">
        <div className="form-grid">

          {/* Passenger – FK → USERS */}
          <div className="form-group">
            <label>Passenger <span className="fk-badge">FK → USERS</span></label>
            <select name="user_id" value={form.user_id} onChange={handleChange}>
              <option value="">Select passenger…</option>
              {USERS.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} (#{u.user_id})
                </option>
              ))}
            </select>
            {errors.user_id && <span className="form-error">{errors.user_id}</span>}
          </div>

          {/* Driver – FK → DRIVERS */}
          <div className="form-group">
            <label>Driver <span className="fk-badge">FK → DRIVERS</span></label>
            <select name="driver_id" value={form.driver_id} onChange={handleChange}>
              <option value="">Select driver…</option>
              {DRIVERS.filter((d) => d.status === "Available").map((d) => (
                <option key={d.driver_id} value={d.driver_id}>
                  {d.name} · ★{d.rating}
                </option>
              ))}
            </select>
            {errors.driver_id && <span className="form-error">{errors.driver_id}</span>}
          </div>

          {/* Cab – FK → CABS */}
          <div className="form-group">
            <label>Cab <span className="fk-badge">FK → CABS</span></label>
            <select name="cab_id" value={form.cab_id} onChange={handleChange}>
              <option value="">Select cab…</option>
              {CABS.filter((c) => c.status === "Active").map((c) => (
                <option key={c.cab_id} value={c.cab_id}>
                  {c.model} · {c.license_plate}
                </option>
              ))}
            </select>
            {errors.cab_id && <span className="form-error">{errors.cab_id}</span>}
          </div>

          {/* Pickup Time */}
          <div className="form-group">
            <label>Pickup Time</label>
            <input
              type="datetime-local"
              name="pickup_time"
              value={form.pickup_time}
              onChange={handleChange}
            />
            {errors.pickup_time && <span className="form-error">{errors.pickup_time}</span>}
          </div>

          {/* Pickup */}
          <div className="form-group form-group--full">
            <label>Pickup Location</label>
            <input
              type="text"
              name="pickup"
              placeholder="e.g. Chennai Central Railway Station"
              value={form.pickup}
              onChange={handleChange}
            />
            {errors.pickup && <span className="form-error">{errors.pickup}</span>}
          </div>

          {/* Drop-off */}
          <div className="form-group form-group--full">
            <label>Drop-off Location</label>
            <input
              type="text"
              name="dropoff"
              placeholder="e.g. Chennai Airport (MAA)"
              value={form.dropoff}
              onChange={handleChange}
            />
            {errors.dropoff && <span className="form-error">{errors.dropoff}</span>}
          </div>

          {/* Fare */}
          <div className="form-group">
            <label>Fare (₹)</label>
            <input
              type="number"
              name="fare"
              placeholder="e.g. 750"
              value={form.fare}
              onChange={handleChange}
              min="1"
            />
            {errors.fare && <span className="form-error">{errors.fare}</span>}
          </div>

        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            <Plus size={15} /> Confirm Booking
          </button>
        </div>
      </Modal>
    </div>
  );
}
