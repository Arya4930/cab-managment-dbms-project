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
  feedback: `
    SELECT
      feedback_id AS "feedback_id",
      DBMS_LOB.SUBSTR(message, 4000, 1) AS "message",
      user_id AS "user_id"
    FROM feedback
    ORDER BY feedback_id DESC
  `,
  saved_locations: `
    SELECT
      location_id AS "location_id",
      location_name AS "location_name",
      address AS "address",
      user_id AS "user_id"
    FROM saved_location
    ORDER BY location_id DESC
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
      e.driver_id AS "driver_id",
      d.driver_name AS "driver_name",
      driver_amount AS "gross",
      platform_fee AS "platform_fee",
      (driver_amount - platform_fee) AS "net",
      trips AS "trips"
    FROM earnings e
    LEFT JOIN drivers d ON d.driver_id = e.driver_id
    ORDER BY earning_id
  `,
};
