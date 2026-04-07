import express from "express";
import getConnection from "../../oracle.js";
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

    const existing = await fetchRows(
      conn,
      `SELECT cab_id AS "cab_id" FROM cabs WHERE cab_id = :cab_id`,
      { cab_id: cabId }
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Cab not found" });
    }

    await conn.execute(
      `
        UPDATE cabs
        SET type = :type,
            model = :model,
            license_plate = :license_plate,
            cab_status = :cab_status,
            manufacture_year = :manufacture_year,
            color = :color
        WHERE cab_id = :cab_id
      `,
      {
        cab_id: cabId,
        type: req.body.type,
        model: req.body.model,
        license_plate: req.body.license_plate,
        cab_status: req.body.status,
        manufacture_year: req.body.year ? Number(req.body.year) : null,
        color: req.body.color ?? null,
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
        SELECT
          cab_id AS "cab_id",
          type AS "type",
          model AS "model",
          license_plate AS "license_plate",
          cab_status AS "status",
          manufacture_year AS "year",
          color AS "color"
        FROM cabs
        WHERE cab_id = :cab_id
      `,
      { cab_id: cabId }
    );

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

    const usageRows = await fetchRows(
      conn,
      `
        SELECT source_table AS "source_table" FROM (
          SELECT 'DRIVERS' AS source_table FROM drivers WHERE cab_id = :cab_id
          UNION ALL
          SELECT 'BOOKINGS' AS source_table FROM bookings WHERE cab_id = :cab_id
          UNION ALL
          SELECT 'CAB_MAINTENANCE' AS source_table FROM cab_maintenance WHERE cab_id = :cab_id
          UNION ALL
          SELECT 'REFUNDS' AS source_table FROM refunds WHERE cab_id = :cab_id
        )
        FETCH FIRST 1 ROWS ONLY
      `,
      { cab_id: cabId }
    );

    if (usageRows.length > 0) {
      return res.status(409).json({
        message: `Cab cannot be removed because related records exist in ${usageRows[0].source_table}`,
      });
    }

    const result = await conn.execute(
      `DELETE FROM cabs WHERE cab_id = :cab_id`,
      { cab_id: cabId },
      { autoCommit: true }
    );

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
