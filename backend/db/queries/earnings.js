export const earningsSelectSql = `
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
  WHERE earning_id = :earning_id
`;

export const insertEarningSql = `
  INSERT INTO earnings (
    earning_date,
    driver_amount,
    booking_id,
    driver_id,
    platform_fee,
    trips
  ) VALUES (
    :earning_date,
    :driver_amount,
    :booking_id,
    :driver_id,
    :platform_fee,
    :trips
  )
  RETURNING earning_id INTO :earning_id
`;

export const updateEarningSql = `
  UPDATE earnings
  SET earning_date = :earning_date,
      driver_amount = :driver_amount,
      booking_id = :booking_id,
      driver_id = :driver_id,
      platform_fee = :platform_fee,
      trips = :trips
  WHERE earning_id = :earning_id
`;

export const deleteEarningSql = `
  DELETE FROM earnings WHERE earning_id = :earning_id
`;
