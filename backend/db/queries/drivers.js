export const nextDriverIdSql = `
  SELECT NVL(MAX(driver_id), 0) + 1 AS "next_driver_id" FROM drivers
`;

export const insertDriverSql = `
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
`;

export const selectDriverByIdSql = `
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
`;

export const selectDriverExistsSql = `
  SELECT driver_id AS "driver_id" FROM drivers WHERE driver_id = :driver_id
`;

export const updateDriverSql = `
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
`;

export const selectDriverByUserIdSql = `
  SELECT driver_id AS "driver_id"
  FROM drivers
  WHERE user_id = :user_id
`;

export const updateDriverFromUserSql = `
  UPDATE drivers
  SET driver_name = :driver_name,
      phone_number = :phone_number,
      joined_date = :joined_date,
      user_id = :user_id
  WHERE user_id = :user_id
`;

export const updateDriverAvailableSql = `
  UPDATE drivers
  SET availability = 'Available',
      total_trips = total_trips + :trip_increment
  WHERE driver_id = :driver_id
`;

export const updateDriverOnTripSql = `
  UPDATE drivers
  SET availability = 'On Trip'
  WHERE driver_id = :driver_id
`;

export const updateDriverRatingsSql = `
  UPDATE drivers
  SET ratings = (
    SELECT AVG(rating)
    FROM ratings_reviews
    WHERE driver_id = :driver_id
  )
  WHERE driver_id = :driver_id
`;
