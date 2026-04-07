import { useEffect, useMemo, useState } from "react";
import { CreditCard, Plus, Wallet, Clock3, RotateCcw, PencilLine, Trash2 } from "lucide-react";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import useBootstrapData from "../hooks/useBootstrapData";

const API_BASE = "http://localhost:3000/api";
const PAYMENT_METHODS = ["UPI", "Card", "Cash", "Wallet"];
const PAYMENT_STATUS = ["Success", "Pending", "Refunded", "Failed"];

const BLANK_FORM = {
  booking_id: "",
  amount: "",
  method: "UPI",
  status: "Pending",
  timestamp: "",
};

const statusTypeMap = {
  Success: "success",
  Pending: "warning",
  Refunded: "info",
  Failed: "error",
};

export default function Payments() {
  const { data, loading, error, reload } = useBootstrapData();
  const bookings = data.bookings ?? [];
  const users = data.users ?? [];
  const [payments, setPayments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = editingPaymentId !== null;
  const editingPayment = useMemo(
    () => payments.find((payment) => payment.payment_id === editingPaymentId) ?? null,
    [payments, editingPaymentId]
  );

  useEffect(() => {
    setPayments(data.payments ?? []);
  }, [data.payments]);

  useEffect(() => {
    if (!modalOpen) return;

    if (editingPayment) {
      setForm({
        booking_id: editingPayment.booking_id ?? "",
        amount: String(editingPayment.amount ?? ""),
        method: editingPayment.method ?? "UPI",
        status: editingPayment.status ?? "Pending",
        timestamp: editingPayment.timestamp ? editingPayment.timestamp.replace(" ", "T") : "",
      });
    } else {
      setForm(BLANK_FORM);
    }

    setErrors({});
    setSubmitError("");
  }, [modalOpen, editingPayment]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.booking_id) nextErrors.booking_id = "Select a booking";
    if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      nextErrors.amount = "Valid amount required";
    }
    if (!form.method) nextErrors.method = "Select a payment method";
    if (!form.status) nextErrors.status = "Select a status";
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingPaymentId(null);
    setModalOpen(true);
  };

  const openEditModal = (payment) => {
    setEditingPaymentId(payment.payment_id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPaymentId(null);
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
      amount: Number(form.amount),
      method: form.method,
      status: form.status,
      timestamp: form.timestamp || null,
    };

    try {
      const response = await fetch(
        isEditing ? `${API_BASE}/payments/${editingPaymentId}` : `${API_BASE}/payments`,
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
      setSubmitError(err.message || "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (paymentId) => {
    const confirmed = window.confirm(`Delete payment ${paymentId}?`);
    if (!confirmed) return;

    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/payments/${paymentId}`, { method: "DELETE" });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to delete payment");
    }
  };

  const successfulRevenue = payments
    .filter((payment) => payment.status === "Success")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingCount = payments.filter((payment) => payment.status === "Pending").length;
  const refundedCount = payments.filter((payment) => payment.status === "Refunded").length;
  const activeMethods = new Set(payments.map((payment) => payment.method).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Fetching PAYMENT table...</span>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-sub">{payments.length} records · PAYMENT ↔ BOOKINGS</p>
          {error && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{error}</p>}
          {submitError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{submitError}</p>}
          {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)" }}>{actionError}</p>}
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={16} /> Add Payment
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="Successful Revenue" value={`Rs ${successfulRevenue.toLocaleString()}`} icon={CreditCard} accent="var(--accent-blue)" />
        <StatCard title="Pending Payments" value={pendingCount} icon={Clock3} accent="var(--accent-amber)" />
        <StatCard title="Refunded" value={refundedCount} icon={RotateCcw} accent="var(--accent-rose)" />
        <StatCard title="Payment Methods" value={activeMethods} icon={Wallet} accent="var(--accent-emerald)" />
      </div>

      <div className="section-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Booking</th>
                <th>Passenger</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const booking = bookings.find((entry) => entry.booking_id === payment.booking_id);
                const passenger = users.find((user) => user.user_id === booking?.user_id);

                return (
                  <tr key={payment.payment_id}>
                    <td className="mono">{payment.payment_id}</td>
                    <td className="mono">{payment.booking_id}</td>
                    <td>{passenger?.name ?? "—"}</td>
                    <td>Rs {Number(payment.amount || 0).toLocaleString()}</td>
                    <td>{payment.method}</td>
                    <td><Badge label={payment.status} type={statusTypeMap[payment.status] ?? "neutral"} /></td>
                    <td className="mono">{payment.timestamp}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn--ghost" onClick={() => openEditModal(payment)}>
                          <PencilLine size={14} /> Edit
                        </button>
                        <button className="btn btn--ghost" onClick={() => handleDelete(payment.payment_id)}>
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={isEditing ? "Edit Payment" : "Create Payment"}>
        <div className="form-grid">
          <div className="form-group">
            <label>Booking</label>
            <select name="booking_id" value={form.booking_id} onChange={handleChange}>
              <option value="">Select booking...</option>
              {bookings.map((booking) => (
                <option key={booking.booking_id} value={booking.booking_id}>
                  {booking.booking_id} · {booking.pickup} to {booking.dropoff}
                </option>
              ))}
            </select>
            {errors.booking_id && <span className="form-error">{errors.booking_id}</span>}
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" min="0" name="amount" value={form.amount} onChange={handleChange} />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>
          <div className="form-group">
            <label>Method</label>
            <select name="method" value={form.method} onChange={handleChange}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {PAYMENT_STATUS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="form-group form-group--full">
            <label>Timestamp</label>
            <input type="datetime-local" name="timestamp" value={form.timestamp} onChange={handleChange} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            <Plus size={15} /> {saving ? "Saving..." : isEditing ? "Update Payment" : "Save Payment"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
