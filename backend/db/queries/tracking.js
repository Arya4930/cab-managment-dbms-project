export const trackingSelectSql = `
  SELECT
    tracking_id AS "track_id",
    driver_location AS "driver_location",
    TO_CHAR(time_stamp, 'YYYY-MM-DD HH24:MI') AS "timestamp",
    booking_id AS "booking_id",
    speed_kmh AS "speed_kmh",
    track_status AS "status"
  FROM ride_tracking
  WHERE tracking_id = :tracking_id
`;

export const insertTrackingSql = `
  INSERT INTO ride_tracking (
    driver_location,
    time_stamp,
    booking_id,
    speed_kmh,
    track_status
  ) VALUES (
    :driver_location,
    :time_stamp,
    :booking_id,
    :speed_kmh,
    :track_status
  )
  RETURNING tracking_id INTO :tracking_id
`;

export const updateTrackingSql = `
  UPDATE ride_tracking
  SET driver_location = :driver_location,
      time_stamp = :time_stamp,
      booking_id = :booking_id,
      speed_kmh = :speed_kmh,
      track_status = :track_status
  WHERE tracking_id = :tracking_id
`;

export const deleteTrackingSql = `
  DELETE FROM ride_tracking WHERE tracking_id = :tracking_id
`;
