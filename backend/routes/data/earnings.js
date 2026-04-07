import express from "express";
import oracledb from "oracledb";
import getConnection from "../../oracle.js";
import {
  deleteEarningSql,
  earningsSelectSql,
  insertEarningSql,
  updateEarningSql,
} from "../../db/queries/earnings.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/earnings", async (req, res) => {
  const missing = validateRequired(req.body, ["booking_id", "driver_id", "gross"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(insertEarningSql, {
        earning_date: req.body.earning_date ? new Date(req.body.earning_date) : new Date(),
        driver_amount: Number(req.body.gross),
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        driver_id: Number(req.body.driver_id),
        platform_fee: Number(req.body.platform_fee ?? 0),
        trips: Number(req.body.trips ?? 1),
        earning_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }, { autoCommit: true });

    const earningId = result.outBinds.earning_id[0];
    const rows = await fetchRows(conn, earningsSelectSql, { earning_id: earningId });
    return res.status(201).json({ message: "Earning record created", earning: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create earning record" });
  } finally {
    await closeConnection(conn);
  }
});

router.put("/earnings/:earningId", async (req, res) => {
  const earningId = Number(req.params.earningId);
  if (!Number.isInteger(earningId) || earningId <= 0) {
    return res.status(400).json({ message: "Valid earningId is required" });
  }

  const missing = validateRequired(req.body, ["booking_id", "driver_id", "gross"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(conn, earningsSelectSql, { earning_id: earningId });
    if (existing.length === 0) {
      return res.status(404).json({ message: "Earning record not found" });
    }

    await conn.execute(updateEarningSql, {
        earning_id: earningId,
        earning_date: req.body.earning_date ? new Date(req.body.earning_date) : new Date(),
        driver_amount: Number(req.body.gross),
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        driver_id: Number(req.body.driver_id),
        platform_fee: Number(req.body.platform_fee ?? 0),
        trips: Number(req.body.trips ?? 1),
      }, { autoCommit: true });

    const rows = await fetchRows(conn, earningsSelectSql, { earning_id: earningId });
    return res.status(200).json({ message: "Earning record updated", earning: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update earning record" });
  } finally {
    await closeConnection(conn);
  }
});

router.delete("/earnings/:earningId", async (req, res) => {
  const earningId = Number(req.params.earningId);
  if (!Number.isInteger(earningId) || earningId <= 0) {
    return res.status(400).json({ message: "Valid earningId is required" });
  }

  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(deleteEarningSql, { earning_id: earningId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Earning record not found" });
    }

    return res.status(200).json({ message: "Earning record deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete earning record" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
