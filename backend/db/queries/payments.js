export const paymentSelectSql = `
  SELECT
    payment_id AS "payment_id",
    amount AS "amount",
    payment_method AS "method",
    payment_status AS "status",
    booking_id AS "booking_id",
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS "timestamp"
  FROM payment
  WHERE UPPER(TRIM(payment_id)) = :payment_id
`;

export const nextPaymentIdSql = `
  SELECT 'PAY-' || LPAD(NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(payment_id, '[0-9]+'))), 0) + 1, 3, '0') AS "payment_id"
  FROM payment
`;

export const insertPaymentSql = `
  INSERT INTO payment (
    payment_id,
    amount,
    payment_method,
    payment_status,
    booking_id,
    created_at
  ) VALUES (
    :payment_id,
    :amount,
    :payment_method,
    :payment_status,
    :booking_id,
    :created_at
  )
`;

export const updatePaymentSql = `
  UPDATE payment
  SET amount = :amount,
      payment_method = :payment_method,
      payment_status = :payment_status,
      booking_id = :booking_id,
      created_at = :created_at
  WHERE UPPER(TRIM(payment_id)) = :payment_id
`;

export const deletePaymentSql = `
  DELETE FROM payment WHERE UPPER(TRIM(payment_id)) = :payment_id
`;

export const selectPaymentByBookingIdSql = `
  SELECT payment_id AS "payment_id"
  FROM payment
  WHERE UPPER(TRIM(booking_id)) = :booking_id
  FETCH FIRST 1 ROWS ONLY
`;

export const updatePortalPaymentSql = `
  UPDATE payment
  SET amount = :amount,
      payment_method = :payment_method,
      payment_status = 'Success',
      created_at = :created_at
  WHERE payment_id = :payment_id
`;

export const insertPortalPaymentSql = `
  INSERT INTO payment (
    payment_id,
    amount,
    payment_method,
    payment_status,
    booking_id,
    created_at
  ) VALUES (
    :payment_id,
    :amount,
    :payment_method,
    'Success',
    :booking_id,
    :created_at
  )
`;
