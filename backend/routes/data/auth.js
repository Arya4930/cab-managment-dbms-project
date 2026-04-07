import express from "express";
import getConnection from "../../oracle.js";
import { driverLoginSql, passengerLoginSql } from "../../db/queries/auth.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/auth/passenger-login", async (req, res) => {
  const missing = validateRequired(req.body, ["email"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const rows = await fetchRows(conn, passengerLoginSql, { email: req.body.email });

    if (rows.length === 0) {
      return res.status(404).json({ message: "Passenger account not found" });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to log in passenger" });
  } finally {
    await closeConnection(conn);
  }
});

router.post("/auth/driver-login", async (req, res) => {
  const missing = validateRequired(req.body, ["identifier"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  const identifier = String(req.body.identifier).trim();
  let conn;

  try {
    conn = await getConnection();

    const rows = await fetchRows(conn, driverLoginSql, { identifier });

    if (rows.length === 0) {
      return res.status(404).json({ message: "Driver account not found" });
    }

    return res.status(200).json({ driver: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to log in driver" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
