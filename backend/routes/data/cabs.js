import express from "express";
import getConnection from "../../oracle.js";
import {
  deleteCabSql,
  findCabDeleteUsageSql,
  selectCabByIdSql,
  selectCabExistsSql,
  updateCabSql,
} from "../../db/queries/cabs.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.put("/cabs/:cabId", async (req, res) => {
  const cabId = Number(req.params.cabId);
  if (!Number.isInteger(cabId) || cabId <= 0) {
    return res.status(400).json({ message: "Valid cabId is required" });
  }

  const missing = validateRequired(req.body, ["type", "model", "license_plate", "status"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(conn, selectCabExistsSql, { cab_id: cabId });

    if (existing.length === 0) {
      return res.status(404).json({ message: "Cab not found" });
    }

    await conn.execute(updateCabSql, {
        cab_id: cabId,
        type: req.body.type,
        model: req.body.model,
        license_plate: req.body.license_plate,
        cab_status: req.body.status,
        manufacture_year: req.body.year ? Number(req.body.year) : null,
        color: req.body.color ?? null,
      }, { autoCommit: true });

    const rows = await fetchRows(conn, selectCabByIdSql, { cab_id: cabId });

    return res.status(200).json({ message: "Cab updated", cab: rows[0] });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 1) {
      return res.status(409).json({ message: "License plate already exists" });
    }
    return res.status(500).json({ message: "Failed to update cab" });
  } finally {
    await closeConnection(conn);
  }
});

router.delete("/cabs/:cabId", async (req, res) => {
  const cabId = Number(req.params.cabId);
  if (!Number.isInteger(cabId) || cabId <= 0) {
    return res.status(400).json({ message: "Valid cabId is required" });
  }

  let conn;

  try {
    conn = await getConnection();

    const usageRows = await fetchRows(conn, findCabDeleteUsageSql, { cab_id: cabId });

    if (usageRows.length > 0) {
      return res.status(409).json({
        message: `Cab cannot be removed because related records exist in ${usageRows[0].source_table}`,
      });
    }

    const result = await conn.execute(deleteCabSql, { cab_id: cabId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Cab not found" });
    }

    return res.status(200).json({ message: "Cab deleted" });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 2292) {
      return res.status(409).json({ message: "Cab cannot be removed because related records exist" });
    }
    return res.status(500).json({ message: "Failed to delete cab" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
