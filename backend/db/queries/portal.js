export const updateBookingCompletedSql = `
  UPDATE bookings
  SET status = 'Completed'
  WHERE UPPER(TRIM(booking_id)) = :booking_id
`;

export const updateBookingInProgressSql = `
  UPDATE bookings
  SET status = 'In Progress'
  WHERE UPPER(TRIM(booking_id)) = :booking_id
`;

export const updateUserRidesSql = `
  UPDATE users
  SET total_rides = total_rides + :ride_increment
  WHERE user_id = :user_id
`;

export const selectReviewByBookingAndUserSql = `
  SELECT review_id AS "review_id"
  FROM ratings_reviews
  WHERE UPPER(TRIM(booking_id)) = :booking_id
    AND user_id = :user_id
  FETCH FIRST 1 ROWS ONLY
`;

export const updateReviewSql = `
  UPDATE ratings_reviews
  SET rating = :rating,
      review = :review,
      review_date = :review_date
  WHERE review_id = :review_id
`;

export const insertReviewSql = `
  INSERT INTO ratings_reviews (
    rating,
    review,
    user_id,
    driver_id,
    booking_id,
    review_date
  ) VALUES (
    :rating,
    :review,
    :user_id,
    :driver_id,
    :booking_id,
    :review_date
  )
`;
