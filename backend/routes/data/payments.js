import express from "express";
import getConnection from "../../oracle.js";
import {
  deletePaymentSql,
  insertPaymentSql,
  nextPaymentIdSql,
  paymentSelectSql,
  updatePaymentSql,
} from "../../db/queries/payments.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/payments", async (req, res) => {
  const missing = validateRequired(req.body, ["booking_id", "amount", "method"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const nextRows = await fetchRows(conn, nextPaymentIdSql);
    const paymentId = nextRows[0]?.payment_id;

    await conn.execute(insertPaymentSql, {
        payment_id: paymentId,
        amount: Number(req.body.amount),
        payment_method: req.body.method,
        payment_status: req.body.status ?? "Pending",
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        created_at: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      }, { autoCommit: true });

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

    await conn.execute(updatePaymentSql, {
        payment_id: paymentId,
        amount: Number(req.body.amount),
        payment_method: req.body.method,
        payment_status: req.body.status,
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        created_at: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      }, { autoCommit: true });

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

    const result = await conn.execute(deletePaymentSql, { payment_id: paymentId }, { autoCommit: true });

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
