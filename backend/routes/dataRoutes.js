import express from "express";
import oracledb from "oracledb";
import getConnection from "../oracle.js";

const router = express.Router();

const bootstrapQueries = {
  users: `
    SELECT
      user_id AS "user_id",
      name AS "name",
      email AS "email",
      phone_number AS "phone",
      user_type AS "user_type",
      TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined",
      total_rides AS "total_rides"
    FROM users
    ORDER BY user_id
  `,
  drivers: `
    SELECT
      driver_id AS "driver_id",
      driver_name AS "name",
      license_no AS "license_no",
      phone_number AS "phone",
      availability AS "status",
      ratings AS "rating",
      total_trips AS "total_trips",
      cab_id AS "cab_id",
      user_id AS "user_id",
      TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined"
    FROM drivers
    ORDER BY driver_id
  `,
  cabs: `
    SELECT
      cab_id AS "cab_id",
      type AS "type",
      model AS "model",
      license_plate AS "license_plate",
      cab_status AS "status",
      manufacture_year AS "year",
      color AS "color"
    FROM cabs
    ORDER BY cab_id
  `,
  cab_maintenance: `
    SELECT
      maintenance_id AS "maint_id",
      TO_CHAR(service_date, 'YYYY-MM-DD') AS "service_date",
      service_type AS "service_type",
      cost AS "cost",
      cab_id AS "cab_id",
      technician AS "technician",
      notes AS "notes",
      status AS "status"
    FROM cab_maintenance
    ORDER BY maintenance_id DESC
  `,
  bookings: `
    SELECT
      booking_id AS "booking_id",
      pickup_loc AS "pickup",
      dropoff_loc AS "dropoff",
      TO_CHAR(pickup_time, 'YYYY-MM-DD HH24:MI') AS "pickup_time",
      fare AS "fare",
      status AS "status",
      user_id AS "user_id",
      driver_id AS "driver_id",
      cab_id AS "cab_id",
      distance_km AS "distance_km"
    FROM bookings
    ORDER BY booking_id DESC
  `,
  ride_tracking: `
    SELECT
      tracking_id AS "track_id",
      driver_location AS "driver_location",
      TO_CHAR(time_stamp, 'YYYY-MM-DD HH24:MI') AS "timestamp",
      booking_id AS "booking_id",
      speed_kmh AS "speed_kmh",
      track_status AS "status"
    FROM ride_tracking
    ORDER BY tracking_id
  `,
  ratings_reviews: `
    SELECT
      review_id AS "review_id",
      rating AS "rating",
      DBMS_LOB.SUBSTR(review, 4000, 1) AS "review",
      user_id AS "user_id",
      driver_id AS "driver_id",
      booking_id AS "booking_id",
      TO_CHAR(review_date, 'YYYY-MM-DD') AS "date"
    FROM ratings_reviews
    ORDER BY review_id
  `,
  payments: `
    SELECT
      payment_id AS "payment_id",
      amount AS "amount",
      payment_method AS "method",
      payment_status AS "status",
      booking_id AS "booking_id",
      TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS "timestamp"
    FROM payment
    ORDER BY payment_id DESC
  `,
  earnings: `
    SELECT
      earning_id AS "earnings_id",
      TO_CHAR(earning_date, 'Month YYYY') AS "period",
      driver_amount AS "gross",
      platform_fee AS "platform_fee",
      (driver_amount - platform_fee) AS "net",
      booking_id AS "booking_id",
      driver_id AS "driver_id",
      trips AS "trips"
    FROM earnings
    ORDER BY earning_id
  `,
};

async function fetchRows(connection, sql, binds = {}) {
  const result = await connection.execute(sql, binds, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
  });
  return result.rows;
}

function validateRequired(payload, fields) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      return field;
    }
  }
  return null;
}

async function syncDriverRecordFromUser(connection, userRecord) {
  if ((userRecord.user_type ?? "").toLowerCase() !== "driver") {
    return;
  }

  const existing = await fetchRows(
    connection,
    `
    SELECT driver_id AS "driver_id"
    FROM drivers
    WHERE user_id = :user_id
    `,
    { user_id: userRecord.user_id }
  );

  if (existing.length > 0) {
    await connection.execute(
      `
      UPDATE drivers
      SET driver_name = :driver_name,
          phone_number = :phone_number,
          joined_date = :joined_date,
          user_id = :user_id
      WHERE user_id = :user_id
      `,
      {
        driver_name: userRecord.name,
        phone_number: userRecord.phone,
        joined_date: userRecord.joined ? new Date(userRecord.joined) : new Date(),
        user_id: userRecord.user_id,
      },
      { autoCommit: true }
    );
    return;
  }

  const nextDriverIdRows = await fetchRows(
    connection,
    `SELECT NVL(MAX(driver_id), 0) + 1 AS "next_driver_id" FROM drivers`
  );
  const nextDriverId = nextDriverIdRows[0]?.next_driver_id ?? 1;

  await connection.execute(
    `
    INSERT INTO drivers (
      driver_id,
      driver_name,
      availability,
      ratings,
      user_id,
      cab_id,
      license_no,
      phone_number,
      total_trips,
      joined_date
    ) VALUES (
      :driver_id,
      :driver_name,
      :availability,
      :ratings,
      :user_id,
      :cab_id,
      :license_no,
      :phone_number,
      :total_trips,
      :joined_date
    )
    `,
    {
      driver_id: nextDriverId,
      driver_name: userRecord.name,
      availability: "Available",
      ratings: 0,
      user_id: userRecord.user_id,
      cab_id: null,
      license_no: `AUTO-${String(userRecord.user_id).padStart(4, "0")}`,
      phone_number: userRecord.phone,
      total_trips: 0,
      joined_date: userRecord.joined ? new Date(userRecord.joined) : new Date(),
    },
    { autoCommit: true }
  );
}

router.post("/users", async (req, res) => {
  const missing = validateRequired(req.body, ["name", "email", "phone"]);

  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(
      conn,
      `
      SELECT user_id AS "user_id"
      FROM users
      WHERE LOWER(email) = LOWER(:email)
      `,
      { email: req.body.email }
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }

    const nextUserIdRows = await fetchRows(
      conn,
      `SELECT NVL(MAX(user_id), 0) + 1 AS "next_user_id" FROM users`
    );
    const nextUserId = nextUserIdRows[0]?.next_user_id ?? 1;

    await conn.execute(
      `
      INSERT INTO users (
        user_id,
        name,
        email,
        phone_number,
        user_type,
        joined_date,
        total_rides
      ) VALUES (
        :user_id,
        :name,
        :email,
        :phone_number,
        :user_type,
        :joined_date,
        :total_rides
      )
      `,
      {
        user_id: nextUserId,
        name: req.body.name,
        email: req.body.email,
        phone_number: req.body.phone,
        user_type: req.body.user_type ?? "Passenger",
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
        total_rides: Number(req.body.total_rides ?? 0),
      },
      { autoCommit: true }
    );

    await syncDriverRecordFromUser(conn, {
      user_id: nextUserId,
      name: req.body.name,
      phone: req.body.phone,
      joined: req.body.joined_date,
      user_type: req.body.user_type ?? "Passenger",
    });

    const rows = await fetchRows(
      conn,
      `
      SELECT
        user_id AS "user_id",
        name AS "name",
        email AS "email",
        phone_number AS "phone",
        user_type AS "user_type",
        TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined",
        total_rides AS "total_rides"
      FROM users
      WHERE user_id = :user_id
      `,
      { user_id: nextUserId }
    );

    return res.status(201).json({ message: "Passenger created", user: rows[0] });
  } catch (error) {
    if (error.errorNum === 1) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }
    console.error(error);
    return res.status(500).json({ message: "Failed to create passenger" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

router.put("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId is required" });
  }

  const missing = validateRequired(req.body, ["name", "email", "phone"]);

  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const userRows = await fetchRows(
      conn,
      `SELECT user_id AS "user_id" FROM users WHERE user_id = :user_id`,
      { user_id: userId }
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    const emailRows = await fetchRows(
      conn,
      `
      SELECT user_id AS "user_id"
      FROM users
      WHERE LOWER(email) = LOWER(:email)
        AND user_id <> :user_id
      `,
      { email: req.body.email, user_id: userId }
    );

    if (emailRows.length > 0) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }

    await conn.execute(
      `
      UPDATE users
      SET name = :name,
          email = :email,
          phone_number = :phone_number,
          user_type = :user_type,
          joined_date = :joined_date,
          total_rides = :total_rides
      WHERE user_id = :user_id
      `,
      {
        user_id: userId,
        name: req.body.name,
        email: req.body.email,
        phone_number: req.body.phone,
        user_type: req.body.user_type ?? "Passenger",
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
        total_rides: Number(req.body.total_rides ?? 0),
      },
      { autoCommit: true }
    );

    await syncDriverRecordFromUser(conn, {
      user_id: userId,
      name: req.body.name,
      phone: req.body.phone,
      joined: req.body.joined_date,
      user_type: req.body.user_type ?? "Passenger",
    });

    const rows = await fetchRows(
      conn,
      `
      SELECT
        user_id AS "user_id",
        name AS "name",
        email AS "email",
        phone_number AS "phone",
        user_type AS "user_type",
        TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined",
        total_rides AS "total_rides"
      FROM users
      WHERE user_id = :user_id
      `,
      { user_id: userId }
    );

    return res.status(200).json({ message: "Passenger updated", user: rows[0] });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 1) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }
    return res.status(500).json({ message: "Failed to update passenger" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

router.delete("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId is required" });
  }

  let conn;

  try {
    conn = await getConnection();

    const usageRows = await fetchRows(
      conn,
      `
      SELECT source_table AS "source_table" FROM (
        SELECT 'BOOKINGS' AS source_table FROM bookings WHERE user_id = :user_id
        UNION ALL
        SELECT 'DRIVERS' AS source_table FROM drivers WHERE user_id = :user_id
        UNION ALL
        SELECT 'FEEDBACK' AS source_table FROM feedback WHERE user_id = :user_id
        UNION ALL
        SELECT 'SAVED_LOCATION' AS source_table FROM saved_location WHERE user_id = :user_id
        UNION ALL
        SELECT 'REFUNDS' AS source_table FROM refunds WHERE user_id = :user_id
        UNION ALL
        SELECT 'RATINGS_REVIEWS' AS source_table FROM ratings_reviews WHERE user_id = :user_id
      )
      FETCH FIRST 1 ROWS ONLY
      `,
      { user_id: userId }
    );

    if (usageRows.length > 0) {
      return res.status(409).json({
        message: `Passenger cannot be removed because related records exist in ${usageRows[0].source_table}`,
      });
    }

    const result = await conn.execute(
      `DELETE FROM users WHERE user_id = :user_id`,
      { user_id: userId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    return res.status(200).json({ message: "Passenger deleted" });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 2292) {
      return res.status(409).json({ message: "Passenger cannot be removed because related records exist" });
    }
    return res.status(500).json({ message: "Failed to delete passenger" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

router.post("/drivers", async (req, res) => {
  const missing = validateRequired(req.body, ["name", "license_no", "phone"]);

  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const nextDriverIdRows = await fetchRows(
      conn,
      `SELECT NVL(MAX(driver_id), 0) + 1 AS "next_driver_id" FROM drivers`
    );
    const nextDriverId = nextDriverIdRows[0]?.next_driver_id ?? 1;

    await conn.execute(
      `
      INSERT INTO drivers (
        driver_id,
        driver_name,
        availability,
        ratings,
        user_id,
        cab_id,
        license_no,
        phone_number,
        total_trips,
        joined_date
      ) VALUES (
        :driver_id,
        :driver_name,
        :availability,
        :ratings,
        :user_id,
        :cab_id,
        :license_no,
        :phone_number,
        :total_trips,
        :joined_date
      )
      `,
      {
        driver_id: nextDriverId,
        driver_name: req.body.name,
        availability: req.body.availability ?? "Available",
        ratings: Number(req.body.ratings ?? 0),
        user_id: req.body.user_id ? Number(req.body.user_id) : null,
        cab_id: req.body.cab_id ? Number(req.body.cab_id) : null,
        license_no: req.body.license_no,
        phone_number: req.body.phone,
        total_trips: Number(req.body.total_trips ?? 0),
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
      SELECT
        driver_id AS "driver_id",
        driver_name AS "name",
        license_no AS "license_no",
        phone_number AS "phone",
        availability AS "status",
        ratings AS "rating",
        total_trips AS "total_trips",
        cab_id AS "cab_id",
        TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined"
      FROM drivers
      WHERE driver_id = :driver_id
      `,
      { driver_id: nextDriverId }
    );

    return res.status(201).json({ message: "Driver created", driver: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create driver" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

router.put("/drivers/:driverId", async (req, res) => {
  const driverId = Number(req.params.driverId);
  if (!Number.isInteger(driverId) || driverId <= 0) {
    return res.status(400).json({ message: "Valid driverId is required" });
  }

  const missing = validateRequired(req.body, ["name", "license_no", "phone"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const driverRows = await fetchRows(
      conn,
      `SELECT driver_id AS "driver_id" FROM drivers WHERE driver_id = :driver_id`,
      { driver_id: driverId }
    );

    if (driverRows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    await conn.execute(
      `
      UPDATE drivers
      SET driver_name = :driver_name,
          availability = :availability,
          ratings = :ratings,
          user_id = :user_id,
          cab_id = :cab_id,
          license_no = :license_no,
          phone_number = :phone_number,
          total_trips = :total_trips,
          joined_date = :joined_date
      WHERE driver_id = :driver_id
      `,
      {
        driver_id: driverId,
        driver_name: req.body.name,
        availability: req.body.availability ?? "Available",
        ratings: Number(req.body.ratings ?? 0),
        user_id: req.body.user_id ? Number(req.body.user_id) : null,
        cab_id: req.body.cab_id ? Number(req.body.cab_id) : null,
        license_no: req.body.license_no,
        phone_number: req.body.phone,
        total_trips: Number(req.body.total_trips ?? 0),
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
      SELECT
        driver_id AS "driver_id",
        driver_name AS "name",
        license_no AS "license_no",
        phone_number AS "phone",
        availability AS "status",
        ratings AS "rating",
        total_trips AS "total_trips",
        cab_id AS "cab_id",
        user_id AS "user_id",
        TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined"
      FROM drivers
      WHERE driver_id = :driver_id
      `,
      { driver_id: driverId }
    );

    return res.status(200).json({ message: "Driver updated", driver: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update driver" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

router.get("/bootstrap", async (_req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const data = {};

    for (const [key, sql] of Object.entries(bootstrapQueries)) {
      data[key] = await fetchRows(conn, sql);
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bootstrap data" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

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

router.put("/bookings/:bookingId", async (req, res) => {
  const bookingId = String(req.params.bookingId).trim().toUpperCase();
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

    const existing = await fetchRows(
      conn,
      `SELECT booking_id AS "booking_id" FROM bookings WHERE booking_id = :booking_id`,
      { booking_id: bookingId }
    );

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
      WHERE booking_id = :booking_id
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

    const rows = await fetchRows(
      conn,
      `
      SELECT
        booking_id AS "booking_id",
        pickup_loc AS "pickup",
        dropoff_loc AS "dropoff",
        TO_CHAR(pickup_time, 'YYYY-MM-DD HH24:MI') AS "pickup_time",
        fare AS "fare",
        status AS "status",
        user_id AS "user_id",
        driver_id AS "driver_id",
        cab_id AS "cab_id",
        distance_km AS "distance_km"
      FROM bookings
      WHERE booking_id = :booking_id
      `,
      { booking_id: bookingId }
    );

    return res.status(200).json({ message: "Booking updated", booking: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update booking" });
  } finally {
    if (conn) {
      try { await conn.close(); } catch {}
    }
  }
});

router.delete("/bookings/:bookingId", async (req, res) => {
  const bookingId = String(req.params.bookingId).trim().toUpperCase();
  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(
      conn,
      `SELECT booking_id AS "booking_id" FROM bookings WHERE TRIM(booking_id) = :booking_id`,
      { booking_id: bookingId }
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const result = await conn.execute(
      `DELETE FROM bookings WHERE TRIM(booking_id) = :booking_id`,
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
    if (conn) {
      try { await conn.close(); } catch {}
    }
  }
});

router.put("/maintenance/:maintenanceId", async (req, res) => {
  const maintenanceId = Number(req.params.maintenanceId);
  if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
    return res.status(400).json({ message: "Valid maintenanceId is required" });
  }

  const missing = validateRequired(req.body, ["cab_id", "service_date", "service_type", "cost", "technician", "status"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();
    const existing = await fetchRows(
      conn,
      `SELECT maintenance_id AS "maintenance_id" FROM cab_maintenance WHERE maintenance_id = :maintenance_id`,
      { maintenance_id: maintenanceId }
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    await conn.execute(
      `
      UPDATE cab_maintenance
      SET service_date = :service_date,
          service_type = :service_type,
          cost = :cost,
          cab_id = :cab_id,
          technician = :technician,
          notes = :notes,
          status = :status
      WHERE maintenance_id = :maintenance_id
      `,
      {
        maintenance_id: maintenanceId,
        service_date: new Date(req.body.service_date),
        service_type: req.body.service_type,
        cost: Number(req.body.cost),
        cab_id: Number(req.body.cab_id),
        technician: req.body.technician,
        notes: req.body.notes ?? null,
        status: req.body.status,
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
      SELECT
        maintenance_id AS "maint_id",
        TO_CHAR(service_date, 'YYYY-MM-DD') AS "service_date",
        service_type AS "service_type",
        cost AS "cost",
        cab_id AS "cab_id",
        technician AS "technician",
        notes AS "notes",
        status AS "status"
      FROM cab_maintenance
      WHERE maintenance_id = :maintenance_id
      `,
      { maintenance_id: maintenanceId }
    );

    return res.status(200).json({ message: "Maintenance updated", record: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update maintenance record" });
  } finally {
    if (conn) {
      try { await conn.close(); } catch {}
    }
  }
});

router.delete("/maintenance/:maintenanceId", async (req, res) => {
  const maintenanceId = Number(req.params.maintenanceId);
  if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
    return res.status(400).json({ message: "Valid maintenanceId is required" });
  }

  let conn;

  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM cab_maintenance WHERE maintenance_id = :maintenance_id`,
      { maintenance_id: maintenanceId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    return res.status(200).json({ message: "Maintenance deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete maintenance record" });
  } finally {
    if (conn) {
      try { await conn.close(); } catch {}
    }
  }
});

router.put("/cabs/:cabId", async (req, res) => {
  const cabId = Number(req.params.cabId);
  if (!Number.isInteger(cabId) || cabId <= 0) {
    return res.status(400).json({ message: "Valid cabId is required" });
  }

  const missing = validateRequired(req.body, ["type", "model", "license_plate", "status"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();
    const existing = await fetchRows(
      conn,
      `SELECT cab_id AS "cab_id" FROM cabs WHERE cab_id = :cab_id`,
      { cab_id: cabId }
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Cab not found" });
    }

    await conn.execute(
      `
      UPDATE cabs
      SET type = :type,
          model = :model,
          license_plate = :license_plate,
          cab_status = :cab_status,
          manufacture_year = :manufacture_year,
          color = :color
      WHERE cab_id = :cab_id
      `,
      {
        cab_id: cabId,
        type: req.body.type,
        model: req.body.model,
        license_plate: req.body.license_plate,
        cab_status: req.body.status,
        manufacture_year: req.body.year ? Number(req.body.year) : null,
        color: req.body.color ?? null,
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
      SELECT
        cab_id AS "cab_id",
        type AS "type",
        model AS "model",
        license_plate AS "license_plate",
        cab_status AS "status",
        manufacture_year AS "year",
        color AS "color"
      FROM cabs
      WHERE cab_id = :cab_id
      `,
      { cab_id: cabId }
    );

    return res.status(200).json({ message: "Cab updated", cab: rows[0] });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 1) {
      return res.status(409).json({ message: "License plate already exists" });
    }
    return res.status(500).json({ message: "Failed to update cab" });
  } finally {
    if (conn) {
      try { await conn.close(); } catch {}
    }
  }
});

router.delete("/cabs/:cabId", async (req, res) => {
  const cabId = Number(req.params.cabId);
  if (!Number.isInteger(cabId) || cabId <= 0) {
    return res.status(400).json({ message: "Valid cabId is required" });
  }

  let conn;

  try {
    conn = await getConnection();

    const usageRows = await fetchRows(
      conn,
      `
      SELECT source_table AS "source_table" FROM (
        SELECT 'DRIVERS' AS source_table FROM drivers WHERE cab_id = :cab_id
        UNION ALL
        SELECT 'BOOKINGS' AS source_table FROM bookings WHERE cab_id = :cab_id
        UNION ALL
        SELECT 'CAB_MAINTENANCE' AS source_table FROM cab_maintenance WHERE cab_id = :cab_id
        UNION ALL
        SELECT 'REFUNDS' AS source_table FROM refunds WHERE cab_id = :cab_id
      )
      FETCH FIRST 1 ROWS ONLY
      `,
      { cab_id: cabId }
    );

    if (usageRows.length > 0) {
      return res.status(409).json({
        message: `Cab cannot be removed because related records exist in ${usageRows[0].source_table}`,
      });
    }

    const result = await conn.execute(
      `DELETE FROM cabs WHERE cab_id = :cab_id`,
      { cab_id: cabId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Cab not found" });
    }

    return res.status(200).json({ message: "Cab deleted" });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 2292) {
      return res.status(409).json({ message: "Cab cannot be removed because related records exist" });
    }
    return res.status(500).json({ message: "Failed to delete cab" });
  } finally {
    if (conn) {
      try { await conn.close(); } catch {}
    }
  }
});
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

    const rows = await fetchRows(
      conn,
      `
      SELECT
        booking_id AS "booking_id",
        pickup_loc AS "pickup",
        dropoff_loc AS "dropoff",
        TO_CHAR(pickup_time, 'YYYY-MM-DD HH24:MI') AS "pickup_time",
        fare AS "fare",
        status AS "status",
        user_id AS "user_id",
        driver_id AS "driver_id",
        cab_id AS "cab_id",
        distance_km AS "distance_km"
      FROM bookings
      WHERE booking_id = :booking_id
      `,
      { booking_id: bookingId }
    );

    return res.status(201).json({ message: "Booking created", booking: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create booking" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

router.post("/maintenance", async (req, res) => {
  const missing = validateRequired(req.body, [
    "cab_id",
    "service_date",
    "service_type",
    "cost",
    "technician",
  ]);

  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      INSERT INTO cab_maintenance (
        service_date,
        service_type,
        cost,
        cab_id,
        technician,
        notes,
        status
      ) VALUES (
        :service_date,
        :service_type,
        :cost,
        :cab_id,
        :technician,
        :notes,
        :status
      )
      RETURNING maintenance_id INTO :maintenance_id
      `,
      {
        service_date: new Date(req.body.service_date),
        service_type: req.body.service_type,
        cost: Number(req.body.cost),
        cab_id: Number(req.body.cab_id),
        technician: req.body.technician,
        notes: req.body.notes ?? null,
        status: req.body.status ?? "Scheduled",
        maintenance_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );

    const maintenanceId = result.outBinds.maintenance_id[0];

    const rows = await fetchRows(
      conn,
      `
      SELECT
        maintenance_id AS "maint_id",
        TO_CHAR(service_date, 'YYYY-MM-DD') AS "service_date",
        service_type AS "service_type",
        cost AS "cost",
        cab_id AS "cab_id",
        technician AS "technician",
        notes AS "notes",
        status AS "status"
      FROM cab_maintenance
      WHERE maintenance_id = :maintenance_id
      `,
      { maintenance_id: maintenanceId }
    );

    return res.status(201).json({ message: "Maintenance record created", record: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create maintenance record" });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        // No-op
      }
    }
  }
});

export default router;
