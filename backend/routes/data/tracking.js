import express from "express";
import oracledb from "oracledb";
import getConnection from "../../oracle.js";
import {
  deleteTrackingSql,
  insertTrackingSql,
  trackingSelectSql,
  updateTrackingSql,
} from "../../db/queries/tracking.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/tracking", async (req, res) => {
  const missing = validateRequired(req.body, ["booking_id", "driver_location"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(insertTrackingSql, {
        driver_location: req.body.driver_location,
        time_stamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        speed_kmh: req.body.speed_kmh === "" || req.body.speed_kmh === null || req.body.speed_kmh === undefined
          ? null
          : Number(req.body.speed_kmh),
        track_status: req.body.status ?? "En Route",
        tracking_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }, { autoCommit: true });

    const trackingId = result.outBinds.tracking_id[0];
    const rows = await fetchRows(conn, trackingSelectSql, { tracking_id: trackingId });
    return res.status(201).json({ message: "Tracking event created", tracking: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create tracking event" });
  } finally {
    await closeConnection(conn);
  }
});

router.put("/tracking/:trackingId", async (req, res) => {
  const trackingId = Number(req.params.trackingId);
  if (!Number.isInteger(trackingId) || trackingId <= 0) {
    return res.status(400).json({ message: "Valid trackingId is required" });
  }

  const missing = validateRequired(req.body, ["booking_id", "driver_location", "status"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(conn, trackingSelectSql, { tracking_id: trackingId });
    if (existing.length === 0) {
      return res.status(404).json({ message: "Tracking event not found" });
    }

    await conn.execute(updateTrackingSql, {
        tracking_id: trackingId,
        driver_location: req.body.driver_location,
        time_stamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
        booking_id: String(req.body.booking_id).trim().toUpperCase(),
        speed_kmh: req.body.speed_kmh === "" || req.body.speed_kmh === null || req.body.speed_kmh === undefined
          ? null
          : Number(req.body.speed_kmh),
        track_status: req.body.status,
      }, { autoCommit: true });

    const rows = await fetchRows(conn, trackingSelectSql, { tracking_id: trackingId });
    return res.status(200).json({ message: "Tracking event updated", tracking: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update tracking event" });
  } finally {
    await closeConnection(conn);
  }
});

router.delete("/tracking/:trackingId", async (req, res) => {
  const trackingId = Number(req.params.trackingId);
  if (!Number.isInteger(trackingId) || trackingId <= 0) {
    return res.status(400).json({ message: "Valid trackingId is required" });
  }

  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(deleteTrackingSql, { tracking_id: trackingId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Tracking event not found" });
    }

    return res.status(200).json({ message: "Tracking event deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete tracking event" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
