export const adminLoginSql = `
  SELECT
    user_id AS "user_id",
    name AS "name",
    email AS "email",
    phone_number AS "phone",
    user_type AS "user_type",
    TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined",
    total_rides AS "total_rides"
  FROM users
  WHERE LOWER(email) = LOWER(:email)
    AND password = :password
    AND LOWER(user_type) = 'admin'
  FETCH FIRST 1 ROWS ONLY
`;

export const passengerLoginSql = `
  SELECT
    user_id AS "user_id",
    name AS "name",
    email AS "email",
    phone_number AS "phone",
    user_type AS "user_type",
    TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined",
    total_rides AS "total_rides"
  FROM users
  WHERE LOWER(email) = LOWER(:email)
    AND password = :password
    AND LOWER(user_type) <> 'admin'
  FETCH FIRST 1 ROWS ONLY
`;

export const driverLoginSql = `
  SELECT
    d.driver_id AS "driver_id",
    d.driver_name AS "name",
    d.license_no AS "license_no",
    d.phone_number AS "phone",
    d.availability AS "status",
    d.ratings AS "rating",
    d.total_trips AS "total_trips",
    d.cab_id AS "cab_id",
    d.user_id AS "user_id",
    TO_CHAR(d.joined_date, 'YYYY-MM-DD') AS "joined",
    u.email AS "email"
  FROM drivers d
  LEFT JOIN users u ON u.user_id = d.user_id
  WHERE (
      LOWER(NVL(d.phone_number, '')) = LOWER(:identifier)
      OR LOWER(NVL(d.license_no, '')) = LOWER(:identifier)
      OR LOWER(NVL(u.email, '')) = LOWER(:identifier)
    )
    AND (
      (d.user_id IS NULL AND :password = '123456')
      OR (d.user_id IS NOT NULL AND NVL(u.password, '') = :password)
    )
  FETCH FIRST 1 ROWS ONLY
`;
