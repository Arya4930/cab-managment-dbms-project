import express from "express";
import oracledb from "oracledb";
import getConnection from "../../oracle.js";
import { portalBookingSelectSql } from "../../db/queries/bookings.js";
import {
  insertEarningSql,
  selectEarningByBookingIdSql,
  updateEarningSql,
} from "../../db/queries/earnings.js";
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
  insertReviewWithIdSql,
  insertReviewSql,
  selectNextReviewIdSql,
  selectReviewByBookingAndUserSql,
  updateBookingCancelledSql,
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
  const bookingId = String(booking.booking_id).trim().toUpperCase();
  const rideAmount = Number(booking.fare ?? 0);
  const grossAmount = Number((rideAmount * 0.8).toFixed(2));
  const platformFee = Number((rideAmount * 0.2).toFixed(2));

  await conn.execute(updateBookingCompletedSql, {
    booking_id: bookingId,
  });

  await conn.execute(updateDriverAvailableSql, {
    driver_id: booking.driver_id,
    trip_increment: wasCompleted ? 0 : 1,
  });

  await conn.execute(updateUserRidesSql, {
    user_id: booking.user_id,
    ride_increment: wasCompleted ? 0 : 1,
  });

  const earningRows = await fetchRows(conn, selectEarningByBookingIdSql, { booking_id: bookingId });
  const existingEarningId = Number(earningRows[0]?.earnings_id ?? earningRows[0]?.earning_id ?? 0);

  if (existingEarningId > 0) {
    await conn.execute(updateEarningSql, {
      earning_id: existingEarningId,
      earning_date: new Date(),
      driver_amount: grossAmount,
      booking_id: bookingId,
      driver_id: booking.driver_id,
      platform_fee: platformFee,
      trips: 1,
    });
  } else {
    const nextTripCount = Number(booking.trip_count ?? 1);

    try {
      await conn.execute(insertEarningSql, {
        earning_date: new Date(),
        driver_amount: grossAmount,
        booking_id: bookingId,
        driver_id: booking.driver_id,
        platform_fee: platformFee,
        trips: Number.isFinite(nextTripCount) && nextTripCount > 0 ? nextTripCount : 1,
        earning_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      });
    } catch (insertError) {
      if (insertError?.code !== "ORA-00001") {
        throw insertError;
      }

      const retryRows = await fetchRows(conn, selectEarningByBookingIdSql, { booking_id: bookingId });
      const retryEarningId = Number(retryRows[0]?.earnings_id ?? retryRows[0]?.earning_id ?? 0);

      if (retryEarningId <= 0) {
        throw insertError;
      }

      await conn.execute(updateEarningSql, {
        earning_id: retryEarningId,
        earning_date: new Date(),
        driver_amount: grossAmount,
        booking_id: bookingId,
        driver_id: booking.driver_id,
        platform_fee: platformFee,
        trips: 1,
      });
    }
  }
}

async function cancelBooking(conn, booking) {
  await conn.execute(updateBookingCancelledSql, {
    booking_id: String(booking.booking_id).trim().toUpperCase(),
  });

  await conn.execute(updateDriverAvailableSql, {
    driver_id: booking.driver_id,
    trip_increment: 0,
  });
}

router.post("/passenger/bookings/:bookingId/start", async (req, res) => {
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

    if (String(booking.status ?? "").toLowerCase() === "cancelled") {
      return res.status(409).json({ message: "Cancelled rides cannot be started" });
    }

    if (String(booking.status ?? "").toLowerCase() === "completed") {
      return res.status(409).json({ message: "Completed rides cannot be started" });
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

router.post("/passenger/bookings/:bookingId/cancel", async (req, res) => {
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

    if (["completed", "cancelled"].includes(String(booking.status ?? "").toLowerCase())) {
      return res.status(409).json({ message: "Only scheduled or in-progress rides can be cancelled" });
    }

    await cancelBooking(conn, booking);
    await conn.commit();
    return res.status(200).json({ message: "Ride cancelled" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to cancel ride" });
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

router.post("/driver/bookings/:bookingId/cancel", async (req, res) => {
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

    if (["completed", "cancelled"].includes(String(booking.status ?? "").toLowerCase())) {
      return res.status(409).json({ message: "Only scheduled or in-progress rides can be cancelled" });
    }

    await cancelBooking(conn, booking);
    await conn.commit();
    return res.status(200).json({ message: "Ride cancelled" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to cancel ride" });
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

    const reviewPayload = {
      rating: Number(req.body.rating),
      review: req.body.review ?? null,
      user_id: Number(req.body.user_id),
      driver_id: booking.driver_id,
      booking_id: String(booking.booking_id).trim().toUpperCase(),
      review_date: new Date(),
    };

    if (existingRows.length > 0) {
      await conn.execute(updateReviewSql, {
        review_id: existingRows[0].review_id,
        rating: reviewPayload.rating,
        review: reviewPayload.review,
        review_date: reviewPayload.review_date,
      });
    } else {
      try {
        await conn.execute(insertReviewSql, reviewPayload);
      } catch (insertError) {
        if (insertError?.code !== "ORA-00001") {
          throw insertError;
        }

        const conflictingRows = await fetchRows(conn, selectReviewByBookingAndUserSql, {
          booking_id: reviewPayload.booking_id,
          user_id: reviewPayload.user_id,
        });

        if (conflictingRows.length > 0) {
          await conn.execute(updateReviewSql, {
            review_id: conflictingRows[0].review_id,
            rating: reviewPayload.rating,
            review: reviewPayload.review,
            review_date: reviewPayload.review_date,
          });
        } else {
          const nextReviewIdRows = await fetchRows(conn, selectNextReviewIdSql);
          const nextReviewId = Number(nextReviewIdRows[0]?.next_review_id ?? 0);

          if (!Number.isFinite(nextReviewId) || nextReviewId <= 0) {
            throw insertError;
          }

          await conn.execute(insertReviewWithIdSql, {
            review_id: nextReviewId,
            ...reviewPayload,
          });
        }
      }
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
