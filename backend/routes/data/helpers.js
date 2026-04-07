import oracledb from "oracledb";

export const bootstrapQueries = {
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
      TO_CHAR(earning_date, 'YYYY-MM-DD') AS "earning_date",
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

export const bookingSelectSql = `
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
  WHERE UPPER(TRIM(booking_id)) = :booking_id
`;

export async function fetchRows(connection, sql, binds = {}, options = {}) {
  const result = await connection.execute(sql, binds, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    ...options,
  });

  return result.rows;
}

export function validateRequired(payload, fields) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      return field;
    }
  }

  return null;
}

export function normalizeBookingId(bookingId) {
  return String(bookingId ?? "").trim().toUpperCase();
}

export async function syncDriverRecordFromUser(connection, userRecord) {
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

export async function closeConnection(connection) {
  if (!connection) {
    return;
  }

  try {
    await connection.close();
  } catch {
    // No-op
  }
}
