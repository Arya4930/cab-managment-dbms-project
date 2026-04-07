import { useMemo, useState } from "react";
import { CreditCard, MapPin, Plus, Star, TimerReset, Wallet } from "lucide-react";
import PortalShell from "../components/Portal/PortalShell";
import Modal from "../components/Shared/Modal";
import Badge from "../components/Shared/Badge";
import StatCard from "../components/Shared/StatCard";
import useBootstrapData from "../hooks/useBootstrapData";

const API_BASE = "http://localhost:3000/api";
const PAYMENT_METHODS = ["UPI", "Card", "Cash", "Wallet"];

const statusTypeMap = {
  Completed: "success",
  "In Progress": "info",
  Scheduled: "warning",
  Cancelled: "error",
};

export default function PassengerDashboard({ currentPassenger, onLogout }) {
  const { data, loading, error, reload } = useBootstrapData();
  const [paymentBookingId, setPaymentBookingId] = useState(null);
  const [ratingBookingId, setRatingBookingId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [ratingValue, setRatingValue] = useState("5");
  const [ratingReview, setRatingReview] = useState("");
  const [actionError, setActionError] = useState("");
  const [processing, setProcessing] = useState(false);

  const myBookings = useMemo(
    () =>
      (data.bookings ?? [])
        .filter((booking) => Number(booking.user_id) === Number(currentPassenger?.user_id))
        .sort((a, b) => new Date((b.pickup_time ?? "").replace(" ", "T")) - new Date((a.pickup_time ?? "").replace(" ", "T"))),
    [data.bookings, currentPassenger]
  );

  const activeBooking = myBookings.find((booking) => booking.status === "In Progress" || booking.status === "Scheduled") ?? null;
  const paidBookings = new Set(
    (data.payments ?? [])
      .filter((payment) => payment.status === "Success")
      .map((payment) => payment.booking_id)
  );
  const reviewedBookings = new Set((data.ratings_reviews ?? []).filter((review) => Number(review.user_id) === Number(currentPassenger?.user_id)).map((review) => review.booking_id));

  const enrichedBookings = myBookings.map((booking) => {
    const driver = (data.drivers ?? []).find((entry) => entry.driver_id === booking.driver_id) ?? null;
    const cab = (data.cabs ?? []).find((entry) => entry.cab_id === booking.cab_id) ?? null;
    const latestTracking =
      (data.ride_tracking ?? [])
        .filter((entry) => entry.booking_id === booking.booking_id)
        .sort((a, b) => new Date((b.timestamp ?? "").replace(" ", "T")) - new Date((a.timestamp ?? "").replace(" ", "T")))[0] ?? null;

    return {
      ...booking,
      driver,
      cab,
      latestTracking,
      isPaid: paidBookings.has(booking.booking_id),
      isRated: reviewedBookings.has(booking.booking_id),
    };
  });

  const totalSpent = (data.payments ?? [])
    .filter((payment) => paidBookings.has(payment.booking_id) && myBookings.some((booking) => booking.booking_id === payment.booking_id))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const handleEndTrip = async (bookingId) => {
    setProcessing(true);
    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/passenger/bookings/${bookingId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentPassenger.user_id }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to end trip");
    } finally {
      setProcessing(false);
    }
  };

  const submitPayment = async () => {
    const booking = myBookings.find((entry) => entry.booking_id === paymentBookingId);
    if (!booking) return;

    setProcessing(true);
    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/passenger/bookings/${paymentBookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentPassenger.user_id,
          amount: booking.fare,
          method: paymentMethod,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");
      setPaymentBookingId(null);
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to make payment");
    } finally {
      setProcessing(false);
    }
  };

  const submitRating = async () => {
    setProcessing(true);
    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/passenger/bookings/${ratingBookingId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentPassenger.user_id,
          rating: Number(ratingValue),
          review: ratingReview,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");
      setRatingBookingId(null);
      setRatingReview("");
      setRatingValue("5");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to submit rating");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Loading passenger app...</span>
      </div>
    );
  }

  return (
    <PortalShell
      title="Passenger Dashboard"
      subtitle="Track your cab, manage payments, and rate completed trips."
      currentUser={currentPassenger}
      onLogout={onLogout}
      accentClass="portal-shell--passenger"
    >
      {error && <p className="page-sub" style={{ color: "var(--accent-amber)", marginBottom: "16px" }}>{error}</p>}
      {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)", marginBottom: "16px" }}>{actionError}</p>}

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard title="My Bookings" value={myBookings.length} icon={MapPin} accent="var(--accent-blue)" />
        <StatCard title="Active Ride" value={activeBooking ? 1 : 0} icon={TimerReset} accent="var(--accent-emerald)" />
        <StatCard title="Paid Trips" value={paidBookings.size} icon={Wallet} accent="var(--accent-amber)" />
        <StatCard title="Total Spent" value={`Rs ${totalSpent.toLocaleString()}`} icon={CreditCard} accent="var(--accent-rose)" />
      </div>

      {activeBooking && (
        <div className="portal-heroCard">
          <div>
            <div className="portal-eyebrow">Current Ride</div>
            <h2>{activeBooking.pickup} to {activeBooking.dropoff}</h2>
            <p>
              Latest update: {enrichedBookings.find((entry) => entry.booking_id === activeBooking.booking_id)?.latestTracking?.driver_location ?? "Driver assigned"}
            </p>
          </div>
          <div className="portal-heroCard__actions">
            <Badge label={activeBooking.status} type={statusTypeMap[activeBooking.status] ?? "neutral"} />
            <button className="btn btn--primary" disabled={processing} onClick={() => handleEndTrip(activeBooking.booking_id)}>
              End Trip
            </button>
          </div>
        </div>
      )}

      <div className="portal-bookingList">
        {enrichedBookings.map((booking) => (
          <div key={booking.booking_id} className="portal-bookingCard">
            <div className="portal-bookingCard__head">
              <div>
                <div className="portal-bookingCard__title">{booking.pickup}</div>
                <div className="portal-bookingCard__sub">{booking.dropoff}</div>
              </div>
              <Badge label={booking.status} type={statusTypeMap[booking.status] ?? "neutral"} />
            </div>
            <div className="portal-bookingCard__meta">
              <span>Driver: <strong>{booking.driver?.name ?? "Awaiting assignment"}</strong></span>
              <span>Cab: <strong>{booking.cab?.license_plate ?? "Pending"}</strong></span>
              <span>Track: <strong>{booking.latestTracking?.driver_location ?? "No live ping"}</strong></span>
              <span>Fare: <strong>Rs {Number(booking.fare || 0).toLocaleString()}</strong></span>
            </div>
            <div className="portal-bookingCard__actions">
              {!booking.isPaid && booking.status === "Completed" && (
                <button className="btn btn--primary" onClick={() => setPaymentBookingId(booking.booking_id)}>
                  <Plus size={14} /> Pay
                </button>
              )}
              {!booking.isRated && booking.status === "Completed" && (
                <button className="btn btn--ghost" onClick={() => setRatingBookingId(booking.booking_id)}>
                  <Star size={14} /> Rate Ride
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={paymentBookingId !== null} onClose={() => setPaymentBookingId(null)} title="Pay For Ride">
        <div className="form-grid">
          <div className="form-group form-group--full">
            <label>Payment Method</label>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={() => setPaymentBookingId(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={submitPayment} disabled={processing}>Pay Now</button>
        </div>
      </Modal>

      <Modal isOpen={ratingBookingId !== null} onClose={() => setRatingBookingId(null)} title="Rate Your Trip">
        <div className="form-grid">
          <div className="form-group">
            <label>Rating</label>
            <select value={ratingValue} onChange={(event) => setRatingValue(event.target.value)}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Stars</option>)}
            </select>
          </div>
          <div className="form-group form-group--full">
            <label>Review</label>
            <textarea rows={4} value={ratingReview} onChange={(event) => setRatingReview(event.target.value)} placeholder="Share how the ride went..." />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={() => setRatingBookingId(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={submitRating} disabled={processing}>Submit Rating</button>
        </div>
      </Modal>
    </PortalShell>
  );
}
