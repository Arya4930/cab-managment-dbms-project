import express from "express";
import getConnection from "../../oracle.js";
import { portalBookingSelectSql } from "../../db/queries/bookings.js";
import {
  updateDriverAvailableSql,
  updateDriverOnTripSql,
  updateDriverRatingsSql,
} from "../../db/queries/drivers.js";
import {
  insertPortalPaymentSql,
  nextPaymentIdSql,
  selectPaymentByBookingIdSql,
  updatePortalPaymentSql,
} from "../../db/queries/payments.js";
import {
  insertReviewSql,
  selectReviewByBookingAndUserSql,
  updateBookingCompletedSql,
  updateBookingInProgressSql,
  updateReviewSql,
  updateUserRidesSql,
} from "../../db/queries/portal.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

async function fetchBooking(conn, bookingId) {
  const rows = await fetchRows(conn, portalBookingSelectSql, {
    booking_id: String(bookingId).trim().toUpperCase(),
  });

  return rows[0] ?? null;
}

async function completeBooking(conn, booking) {
  const wasCompleted = String(booking.status ?? "").toLowerCase() === "completed";

  await conn.execute(updateBookingCompletedSql, {
    booking_id: String(booking.booking_id).trim().toUpperCase(),
  });

  await conn.execute(updateDriverAvailableSql, {
    driver_id: booking.driver_id,
    trip_increment: wasCompleted ? 0 : 1,
  });

  await conn.execute(updateUserRidesSql, {
    user_id: booking.user_id,
    ride_increment: wasCompleted ? 0 : 1,
  });
}

router.post("/passenger/bookings/:bookingId/end", async (req, res) => {
  const missing = validateRequired(req.body, ["user_id"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();
    const booking = await fetchBooking(conn, req.params.bookingId);

    if (!booking || Number(booking.user_id) !== Number(req.body.user_id)) {
      return res.status(404).json({ message: "Booking not found for passenger" });
    }

    await completeBooking(conn, booking);
    await conn.commit();
    return res.status(200).json({ message: "Trip ended successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to end trip" });
  } finally {
    await closeConnection(conn);
  }
});

router.post("/driver/bookings/:bookingId/start", async (req, res) => {
  const missing = validateRequired(req.body, ["driver_id"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();
    const booking = await fetchBooking(conn, req.params.bookingId);

    if (!booking || Number(booking.driver_id) !== Number(req.body.driver_id)) {
      return res.status(404).json({ message: "Booking not found for driver" });
    }

    await conn.execute(updateBookingInProgressSql, {
      booking_id: String(booking.booking_id).trim().toUpperCase(),
    });

    await conn.execute(updateDriverOnTripSql, { driver_id: booking.driver_id });

    await conn.commit();
    return res.status(200).json({ message: "Ride started" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to start ride" });
  } finally {
    await closeConnection(conn);
  }
});

router.post("/driver/bookings/:bookingId/complete", async (req, res) => {
  const missing = validateRequired(req.body, ["driver_id"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();
    const booking = await fetchBooking(conn, req.params.bookingId);

    if (!booking || Number(booking.driver_id) !== Number(req.body.driver_id)) {
      return res.status(404).json({ message: "Booking not found for driver" });
    }

    await completeBooking(conn, booking);
    await conn.commit();
    return res.status(200).json({ message: "Ride completed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to complete ride" });
  } finally {
    await closeConnection(conn);
  }
});

router.post("/passenger/bookings/:bookingId/pay", async (req, res) => {
  const missing = validateRequired(req.body, ["user_id", "method"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();
    const booking = await fetchBooking(conn, req.params.bookingId);

    if (!booking || Number(booking.user_id) !== Number(req.body.user_id)) {
      return res.status(404).json({ message: "Booking not found for passenger" });
    }

    const existingRows = await fetchRows(conn, selectPaymentByBookingIdSql, {
      booking_id: String(booking.booking_id).trim().toUpperCase(),
    });

    if (existingRows.length > 0) {
      await conn.execute(updatePortalPaymentSql, {
        payment_id: existingRows[0].payment_id,
        amount: Number(req.body.amount ?? booking.fare ?? 0),
        payment_method: req.body.method,
        created_at: new Date(),
      });
    } else {
      const nextRows = await fetchRows(conn, nextPaymentIdSql);

      await conn.execute(insertPortalPaymentSql, {
        payment_id: nextRows[0].payment_id,
        amount: Number(req.body.amount ?? booking.fare ?? 0),
        payment_method: req.body.method,
        booking_id: String(booking.booking_id).trim().toUpperCase(),
        created_at: new Date(),
      });
    }

    await conn.commit();
    return res.status(200).json({ message: "Payment recorded successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to record payment" });
  } finally {
    await closeConnection(conn);
  }
});

router.post("/passenger/bookings/:bookingId/rate", async (req, res) => {
  const missing = validateRequired(req.body, ["user_id", "rating"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();
    const booking = await fetchBooking(conn, req.params.bookingId);

    if (!booking || Number(booking.user_id) !== Number(req.body.user_id)) {
      return res.status(404).json({ message: "Booking not found for passenger" });
    }

    const existingRows = await fetchRows(conn, selectReviewByBookingAndUserSql, {
      booking_id: String(booking.booking_id).trim().toUpperCase(),
      user_id: Number(req.body.user_id),
    });

    if (existingRows.length > 0) {
      await conn.execute(updateReviewSql, {
        review_id: existingRows[0].review_id,
        rating: Number(req.body.rating),
        review: req.body.review ?? null,
        review_date: new Date(),
      });
    } else {
      await conn.execute(insertReviewSql, {
        rating: Number(req.body.rating),
        review: req.body.review ?? null,
        user_id: Number(req.body.user_id),
        driver_id: booking.driver_id,
        booking_id: String(booking.booking_id).trim().toUpperCase(),
        review_date: new Date(),
      });
    }

    await conn.execute(updateDriverRatingsSql, { driver_id: booking.driver_id });

    await conn.commit();
    return res.status(200).json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to submit rating" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
