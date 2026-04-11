import { useMemo, useState } from "react";
import { BriefcaseBusiness, CarFront, Gauge, MapPinned, CheckCircle2, Star, Ban } from "lucide-react";
import PortalShell from "../components/Portal/PortalShell";
import Badge from "../components/shared/Badge";
import StatCard from "../components/shared/StatCard";
import useBootstrapData from "../hooks/useBootstrapData";

import { API_BASE } from "../config/apiBase";

const statusTypeMap = {
  Completed: "success",
  "In Progress": "info",
  Scheduled: "warning",
  Cancelled: "error",
};

const bookingPriority = {
  Scheduled: 0,
  "In Progress": 1,
  Completed: 2,
  Cancelled: 3,
};

export default function DriverDashboard({ currentDriver, onLogout }) {
  const { data, loading, error, reload } = useBootstrapData();
  const [actionError, setActionError] = useState("");
  const [processing, setProcessing] = useState(false);

  const myBookings = useMemo(
    () =>
      (data.bookings ?? [])
        .filter((booking) => Number(booking.driver_id) === Number(currentDriver?.driver_id))
        .sort((a, b) => {
          const priorityDiff = (bookingPriority[a.status] ?? 99) - (bookingPriority[b.status] ?? 99);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }
          return new Date((b.pickup_time ?? "").replace(" ", "T")) - new Date((a.pickup_time ?? "").replace(" ", "T"));
        }),
    [data.bookings, currentDriver]
  );

  const enrichedBookings = myBookings.map((booking) => {
    const passenger = (data.users ?? []).find((entry) => entry.user_id === booking.user_id) ?? null;
    const cab = (data.cabs ?? []).find((entry) => entry.cab_id === booking.cab_id) ?? null;
    return { ...booking, passenger, cab };
  });

  const parseReviewDate = (review) => {
    const value = String(review.date ?? review.review_date ?? "").trim();
    if (!value) {
      return 0;
    }

    return new Date(value.includes(" ") ? value.replace(" ", "T") : value).getTime();
  };

  const myReviews = useMemo(
    () =>
      (data.ratings_reviews ?? [])
        .filter((review) => Number(review.driver_id) === Number(currentDriver?.driver_id))
        .map((review) => {
          const passenger = (data.users ?? []).find((entry) => Number(entry.user_id) === Number(review.user_id)) ?? null;
          const booking = (data.bookings ?? []).find((entry) => String(entry.booking_id).trim().toUpperCase() === String(review.booking_id).trim().toUpperCase()) ?? null;
          return { ...review, passenger, booking };
        })
        .sort((a, b) => parseReviewDate(b) - parseReviewDate(a)),
    [data.bookings, data.ratings_reviews, data.users, currentDriver]
  );

  const averageReviewRating = myReviews.length
    ? myReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / myReviews.length
    : 0;

  const activeRide = enrichedBookings.find((booking) => booking.status === "In Progress") ?? null;
  const scheduledRides = enrichedBookings.filter((booking) => booking.status === "Scheduled").length;
  const myNet = (data.earnings ?? [])
    .filter((entry) => Number(entry.driver_id) === Number(currentDriver?.driver_id))
    .reduce((sum, entry) => sum + Number(entry.net || 0), 0);

  const handleDriverAction = async (bookingId, action) => {
    setProcessing(true);
    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/driver/bookings/${bookingId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: currentDriver.driver_id }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Request failed");
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to update ride");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Loading driver app...</span>
      </div>
    );
  }

  return (
    <PortalShell
      title="Driver Dashboard"
      subtitle="See your assigned rides, cab details, and complete trips with one tap."
      currentUser={currentDriver}
      onLogout={onLogout}
      accentClass="portal-shell--driver"
    >
      {error && <p className="page-sub" style={{ color: "var(--accent-amber)", marginBottom: "16px" }}>{error}</p>}
      {actionError && <p className="page-sub" style={{ color: "var(--accent-amber)", marginBottom: "16px" }}>{actionError}</p>}

      {activeRide && (
        <div className="portal-heroCard portal-heroCard--driver">
          <div>
            <div className="portal-eyebrow">Current Assignment</div>
            <h2>{activeRide.pickup} to {activeRide.dropoff}</h2>
            <p>
              Passenger {activeRide.passenger?.name ?? "Unknown"} · Cab {activeRide.cab?.license_plate ?? "Unassigned"}
            </p>
          </div>
          <button className="btn btn--primary" disabled={processing} onClick={() => handleDriverAction(activeRide.booking_id, "complete")}>
            <CheckCircle2 size={14} /> Complete Ride
          </button>
          <button className="btn btn--ghost" disabled={processing} onClick={() => handleDriverAction(activeRide.booking_id, "cancel")}>
            <Ban size={14} /> Cancel Ride
          </button>
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
              <span>Passenger: <strong>{booking.passenger?.name ?? "—"}</strong></span>
              <span>Cab: <strong>{booking.cab?.license_plate ?? "—"}</strong></span>
              <span>Pickup time: <strong>{booking.pickup_time}</strong></span>
              <span>Fare: <strong>Rs {Number(booking.fare || 0).toLocaleString()}</strong></span>
            </div>
            <div className="portal-bookingCard__actions">
              {booking.status === "In Progress" && (
                <button className="btn btn--ghost" disabled={processing} onClick={() => handleDriverAction(booking.booking_id, "complete")}>
                  <CheckCircle2 size={14} /> Complete Ride
                </button>
              )}
              {["Scheduled", "In Progress"].includes(booking.status) && (
                <button className="btn btn--ghost" disabled={processing} onClick={() => handleDriverAction(booking.booking_id, "cancel")}>
                  <Ban size={14} /> Cancel Ride
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="stat-grid stat-grid--compact-mobile" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <StatCard title="Assigned Rides" value={myBookings.length} icon={BriefcaseBusiness} accent="var(--accent-blue)" />
        <StatCard title="Scheduled" value={scheduledRides} icon={MapPinned} accent="var(--accent-amber)" />
        <StatCard title="Current Status" value={currentDriver?.status ?? "Available"} icon={CarFront} accent="var(--accent-emerald)" />
        <StatCard title="Net Earnings" value={`Rs ${myNet.toLocaleString()}`} icon={Gauge} accent="var(--accent-violet)" />
        <StatCard
          title="Avg. Review"
          value={myReviews.length ? averageReviewRating.toFixed(1) : "N/A"}
          subtitle={myReviews.length ? `${myReviews.length} passenger reviews` : "No reviews yet"}
          icon={Star}
          accent="var(--accent-amber)"
        />
      </div>

      <div className="section-card portal-reviewSection">
        <div className="section-card__header">
          <h2 className="section-title">
            <Star size={16} /> Passenger Reviews
          </h2>
        </div>
        <div className="portal-reviewList">
          {myReviews.length > 0 ? (
            myReviews.map((review) => (
              <article key={review.review_id} className="portal-reviewCard">
                <div className="portal-reviewCard__head">
                  <div>
                    <div className="portal-reviewCard__name">{review.passenger?.name ?? "Passenger"}</div>
                    <div className="portal-reviewCard__meta">
                      Booking <span className="mono">{review.booking_id}</span>
                      {review.date ? ` · ${review.date}` : ""}
                    </div>
                  </div>
                  <div className="portal-reviewCard__rating">
                    <Star size={14} />
                    <span>{Number(review.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
                <p className="portal-reviewCard__text">{review.review || "No written review provided."}</p>
                {review.booking && (
                  <div className="portal-reviewCard__footer">
                    {review.booking.pickup} to {review.booking.dropoff}
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="portal-emptyState">
              <div className="portal-emptyState__title">No reviews yet</div>
              <p className="portal-emptyState__text">Passenger ratings will appear here after completed rides are reviewed.</p>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
