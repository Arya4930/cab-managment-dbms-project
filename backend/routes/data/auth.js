import express from "express";
import getConnection from "../../oracle.js";
import { adminLoginSql, driverLoginSql, passengerLoginSql } from "../../db/queries/auth.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/auth/admin-login", async (req, res) => {
  const missing = validateRequired(req.body, ["email", "password"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  const email = String(req.body.email).trim().toLowerCase();
  const password = String(req.body.password);
  let conn;

  try {
    conn = await getConnection();

    const rows = await fetchRows(conn, adminLoginSql, { email, password });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to log in admin" });
  } finally {
    await closeConnection(conn);
  }
});

router.post("/auth/passenger-login", async (req, res) => {
  const missing = validateRequired(req.body, ["email", "password"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  const email = String(req.body.email).trim().toLowerCase();
  const password = String(req.body.password);

  let conn;

  try {
    conn = await getConnection();

    const rows = await fetchRows(conn, passengerLoginSql, { email, password });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid passenger credentials" });
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
  const missing = validateRequired(req.body, ["identifier", "password"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  const identifier = String(req.body.identifier).trim();
  const password = String(req.body.password);
  let conn;

  try {
    conn = await getConnection();

    const rows = await fetchRows(conn, driverLoginSql, { identifier, password });

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid driver credentials" });
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
