import express from "express";
import getConnection from "../../oracle.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

const paymentSelectSql = `
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

router.post("/payments", async (req, res) => {
  const missing = validateRequired(req.body, ["booking_id", "amount", "method"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const nextRows = await fetchRows(
      conn,
      `
        SELECT 'PAY-' || LPAD(NVL(MAX(TO_NUMBER(REGEXP_SUBSTR(payment_id, '[0-9]+'))), 0) + 1, 3, '0') AS "payment_id"
        FROM payment
      `
    );
    const paymentId = nextRows[0]?.payment_id;

    await conn.execute(
      `
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
      `,
      {
        payment_id: paymentId,
        amount: Number(req.body.amount),
        payment_method: req.body.method,
        payment_status: req.body.status ?? "Pending",
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        created_at: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(conn, paymentSelectSql, { payment_id: paymentId });
    return res.status(201).json({ message: "Payment created", payment: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create payment" });
  } finally {
    await closeConnection(conn);
  }
});

router.put("/payments/:paymentId", async (req, res) => {
  const paymentId = String(req.params.paymentId).trim().toUpperCase();
  const missing = validateRequired(req.body, ["booking_id", "amount", "method", "status"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(conn, paymentSelectSql, { payment_id: paymentId });
    if (existing.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await conn.execute(
      `
        UPDATE payment
        SET amount = :amount,
            payment_method = :payment_method,
            payment_status = :payment_status,
            booking_id = :booking_id,
            created_at = :created_at
        WHERE UPPER(TRIM(payment_id)) = :payment_id
      `,
      {
        payment_id: paymentId,
        amount: Number(req.body.amount),
        payment_method: req.body.method,
        payment_status: req.body.status,
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        created_at: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(conn, paymentSelectSql, { payment_id: paymentId });
    return res.status(200).json({ message: "Payment updated", payment: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update payment" });
  } finally {
    await closeConnection(conn);
  }
});

router.delete("/payments/:paymentId", async (req, res) => {
  const paymentId = String(req.params.paymentId).trim().toUpperCase();
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `DELETE FROM payment WHERE UPPER(TRIM(payment_id)) = :payment_id`,
      { payment_id: paymentId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({ message: "Payment deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete payment" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
