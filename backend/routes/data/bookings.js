import express from "express";
import oracledb from "oracledb";
import getConnection from "../../oracle.js";
import {
  bookingSelectSql,
  closeConnection,
  fetchRows,
  normalizeBookingId,
  validateRequired,
} from "./helpers.js";

const router = express.Router();

router.post("/bookings", async (req, res) => {
  const missing = validateRequired(req.body, [
    "user_id",
    "driver_id",
    "cab_id",
    "pickup",
    "dropoff",
    "pickup_time",
    "fare",
  ]);

  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const bookingIdResult = await conn.execute(
      `SELECT 'BK-' || LPAD(bookings_seq.NEXTVAL, 3, '0') AS booking_id FROM dual`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const bookingId = bookingIdResult.rows[0].BOOKING_ID;

    await conn.execute(
      `
        INSERT INTO bookings (
          booking_id,
          pickup_loc,
          dropoff_loc,
          pickup_time,
          fare,
          status,
          user_id,
          driver_id,
          cab_id,
          distance_km
        ) VALUES (
          :booking_id,
          :pickup,
          :dropoff,
          :pickup_time,
          :fare,
          :status,
          :user_id,
          :driver_id,
          :cab_id,
          :distance_km
        )
      `,
      {
        booking_id: bookingId,
        pickup: req.body.pickup,
        dropoff: req.body.dropoff,
        pickup_time: new Date(req.body.pickup_time),
        fare: Number(req.body.fare),
        status: req.body.status ?? "Scheduled",
        user_id: Number(req.body.user_id),
        driver_id: Number(req.body.driver_id),
        cab_id: Number(req.body.cab_id),
        distance_km: Number(req.body.distance_km ?? 0),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(conn, bookingSelectSql, { booking_id: bookingId });
    return res.status(201).json({ message: "Booking created", booking: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create booking" });
  } finally {
    await closeConnection(conn);
  }
});

router.put("/bookings/:bookingId", async (req, res) => {
  const bookingId = normalizeBookingId(req.params.bookingId);
  const missing = validateRequired(req.body, [
    "user_id",
    "driver_id",
    "cab_id",
    "pickup",
    "dropoff",
    "pickup_time",
    "fare",
    "status",
  ]);

  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(conn, bookingSelectSql, { booking_id: bookingId });
    if (existing.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await conn.execute(
      `
        UPDATE bookings
        SET pickup_loc = :pickup,
            dropoff_loc = :dropoff,
            pickup_time = :pickup_time,
            fare = :fare,
            status = :status,
            user_id = :user_id,
            driver_id = :driver_id,
            cab_id = :cab_id,
            distance_km = :distance_km
        WHERE UPPER(TRIM(booking_id)) = :booking_id
      `,
      {
        booking_id: bookingId,
        pickup: req.body.pickup,
        dropoff: req.body.dropoff,
        pickup_time: new Date(req.body.pickup_time),
        fare: Number(req.body.fare),
        status: req.body.status,
        user_id: Number(req.body.user_id),
        driver_id: Number(req.body.driver_id),
        cab_id: Number(req.body.cab_id),
        distance_km: Number(req.body.distance_km ?? 0),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(conn, bookingSelectSql, { booking_id: bookingId });
    return res.status(200).json({ message: "Booking updated", booking: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update booking" });
  } finally {
    await closeConnection(conn);
  }
});

router.delete("/bookings/:bookingId", async (req, res) => {
  const bookingId = normalizeBookingId(req.params.bookingId);
  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(conn, bookingSelectSql, { booking_id: bookingId });
    if (existing.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await conn.execute(`DELETE FROM ride_tracking WHERE UPPER(TRIM(booking_id)) = :booking_id`, { booking_id: bookingId });
    await conn.execute(`DELETE FROM ratings_reviews WHERE UPPER(TRIM(booking_id)) = :booking_id`, { booking_id: bookingId });
    await conn.execute(`DELETE FROM payment WHERE UPPER(TRIM(booking_id)) = :booking_id`, { booking_id: bookingId });
    await conn.execute(`DELETE FROM earnings WHERE UPPER(TRIM(booking_id)) = :booking_id`, { booking_id: bookingId });
    await conn.execute(`DELETE FROM refunds WHERE UPPER(TRIM(booking_id)) = :booking_id`, { booking_id: bookingId });

    const result = await conn.execute(
      `DELETE FROM bookings WHERE UPPER(TRIM(booking_id)) = :booking_id`,
      { booking_id: bookingId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ message: "Booking deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete booking" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
