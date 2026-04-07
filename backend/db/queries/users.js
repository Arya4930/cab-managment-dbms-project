export const selectUserByEmailSql = `
  SELECT user_id AS "user_id"
  FROM users
  WHERE LOWER(email) = LOWER(:email)
`;

export const nextUserIdSql = `
  SELECT NVL(MAX(user_id), 0) + 1 AS "next_user_id" FROM users
`;

export const insertUserSql = `
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
`;

export const selectUserByIdSql = `
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
`;

export const selectUserExistsSql = `
  SELECT user_id AS "user_id" FROM users WHERE user_id = :user_id
`;

export const selectUserEmailConflictSql = `
  SELECT user_id AS "user_id"
  FROM users
  WHERE LOWER(email) = LOWER(:email)
    AND user_id <> :user_id
`;

export const updateUserSql = `
  UPDATE users
  SET name = :name,
      email = :email,
      phone_number = :phone_number,
      user_type = :user_type,
      joined_date = :joined_date,
      total_rides = :total_rides
  WHERE user_id = :user_id
`;

export const findUserDeleteUsageSql = `
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
`;

export const deleteUserSql = `
  DELETE FROM users WHERE user_id = :user_id
`;
