import express from "express";
import oracledb from "oracledb";
import getConnection from "../../oracle.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/maintenance", async (req, res) => {
  const missing = validateRequired(req.body, [
    "cab_id",
    "service_date",
    "service_type",
    "cost",
    "technician",
  ]);

  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
        INSERT INTO cab_maintenance (
          service_date,
          service_type,
          cost,
          cab_id,
          technician,
          notes,
          status
        ) VALUES (
          :service_date,
          :service_type,
          :cost,
          :cab_id,
          :technician,
          :notes,
          :status
        )
        RETURNING maintenance_id INTO :maintenance_id
      `,
      {
        service_date: new Date(req.body.service_date),
        service_type: req.body.service_type,
        cost: Number(req.body.cost),
        cab_id: Number(req.body.cab_id),
        technician: req.body.technician,
        notes: req.body.notes ?? null,
        status: req.body.status ?? "Scheduled",
        maintenance_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );

    const maintenanceId = result.outBinds.maintenance_id[0];

    const rows = await fetchRows(
      conn,
      `
        SELECT
          maintenance_id AS "maint_id",
          TO_CHAR(service_date, 'YYYY-MM-DD') AS "service_date",
          service_type AS "service_type",
          cost AS "cost",
          cab_id AS "cab_id",
          technician AS "technician",
          notes AS "notes",
          status AS "status"
        FROM cab_maintenance
        WHERE maintenance_id = :maintenance_id
      `,
      { maintenance_id: maintenanceId }
    );

    return res.status(201).json({ message: "Maintenance record created", record: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create maintenance record" });
  } finally {
    await closeConnection(conn);
  }
});

router.put("/maintenance/:maintenanceId", async (req, res) => {
  const maintenanceId = Number(req.params.maintenanceId);
  if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
    return res.status(400).json({ message: "Valid maintenanceId is required" });
  }

  const missing = validateRequired(req.body, ["cab_id", "service_date", "service_type", "cost", "technician", "status"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(
      conn,
      `SELECT maintenance_id AS "maintenance_id" FROM cab_maintenance WHERE maintenance_id = :maintenance_id`,
      { maintenance_id: maintenanceId }
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    await conn.execute(
      `
        UPDATE cab_maintenance
        SET service_date = :service_date,
            service_type = :service_type,
            cost = :cost,
            cab_id = :cab_id,
            technician = :technician,
            notes = :notes,
            status = :status
        WHERE maintenance_id = :maintenance_id
      `,
      {
        maintenance_id: maintenanceId,
        service_date: new Date(req.body.service_date),
        service_type: req.body.service_type,
        cost: Number(req.body.cost),
        cab_id: Number(req.body.cab_id),
        technician: req.body.technician,
        notes: req.body.notes ?? null,
        status: req.body.status,
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
        SELECT
          maintenance_id AS "maint_id",
          TO_CHAR(service_date, 'YYYY-MM-DD') AS "service_date",
          service_type AS "service_type",
          cost AS "cost",
          cab_id AS "cab_id",
          technician AS "technician",
          notes AS "notes",
          status AS "status"
        FROM cab_maintenance
        WHERE maintenance_id = :maintenance_id
      `,
      { maintenance_id: maintenanceId }
    );

    return res.status(200).json({ message: "Maintenance updated", record: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update maintenance record" });
  } finally {
    await closeConnection(conn);
  }
});

router.delete("/maintenance/:maintenanceId", async (req, res) => {
  const maintenanceId = Number(req.params.maintenanceId);
  if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
    return res.status(400).json({ message: "Valid maintenanceId is required" });
  }

  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `DELETE FROM cab_maintenance WHERE maintenance_id = :maintenance_id`,
      { maintenance_id: maintenanceId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    return res.status(200).json({ message: "Maintenance deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete maintenance record" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
