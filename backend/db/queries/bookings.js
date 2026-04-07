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

export const nextBookingIdSql = `
  SELECT 'BK-' || LPAD(bookings_seq.NEXTVAL, 3, '0') AS booking_id FROM dual
`;

export const insertBookingSql = `
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
`;

export const updateBookingSql = `
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
`;

export const bookingDeleteDependencySql = {
  tracking: `DELETE FROM ride_tracking WHERE UPPER(TRIM(booking_id)) = :booking_id`,
  ratings: `DELETE FROM ratings_reviews WHERE UPPER(TRIM(booking_id)) = :booking_id`,
  payments: `DELETE FROM payment WHERE UPPER(TRIM(booking_id)) = :booking_id`,
  earnings: `DELETE FROM earnings WHERE UPPER(TRIM(booking_id)) = :booking_id`,
  refunds: `DELETE FROM refunds WHERE UPPER(TRIM(booking_id)) = :booking_id`,
};

export const deleteBookingSql = `
  DELETE FROM bookings WHERE UPPER(TRIM(booking_id)) = :booking_id
`;

export const portalBookingSelectSql = `
  SELECT
    booking_id AS "booking_id",
    user_id AS "user_id",
    driver_id AS "driver_id",
    cab_id AS "cab_id",
    status AS "status",
    fare AS "fare"
  FROM bookings
  WHERE UPPER(TRIM(booking_id)) = :booking_id
`;
