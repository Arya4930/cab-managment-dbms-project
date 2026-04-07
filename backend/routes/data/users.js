import express from "express";
import getConnection from "../../oracle.js";
import {
  deleteUserSql,
  findUserDeleteUsageSql,
  insertUserSql,
  nextUserIdSql,
  selectUserByEmailSql,
  selectUserByIdSql,
  selectUserEmailConflictSql,
  selectUserExistsSql,
  updateUserSql,
} from "../../db/queries/users.js";
import { closeConnection, fetchRows, syncDriverRecordFromUser, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/users", async (req, res) => {
  const missing = validateRequired(req.body, ["name", "email", "phone"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const existing = await fetchRows(conn, selectUserByEmailSql, { email: req.body.email });

    if (existing.length > 0) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }

    const nextUserIdRows = await fetchRows(conn, nextUserIdSql);
    const nextUserId = nextUserIdRows[0]?.next_user_id ?? 1;

    await conn.execute(insertUserSql, {
        user_id: nextUserId,
        name: req.body.name,
        email: req.body.email,
        phone_number: req.body.phone,
        user_type: req.body.user_type ?? "Passenger",
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
        total_rides: Number(req.body.total_rides ?? 0),
      }, { autoCommit: true });

    await syncDriverRecordFromUser(conn, {
      user_id: nextUserId,
      name: req.body.name,
      phone: req.body.phone,
      joined: req.body.joined_date,
      user_type: req.body.user_type ?? "Passenger",
    });

    const rows = await fetchRows(conn, selectUserByIdSql, { user_id: nextUserId });

    return res.status(201).json({ message: "Passenger created", user: rows[0] });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 1) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }
    return res.status(500).json({ message: "Failed to create passenger" });
  } finally {
    await closeConnection(conn);
  }
});

router.put("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId is required" });
  }

  const missing = validateRequired(req.body, ["name", "email", "phone"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const userRows = await fetchRows(conn, selectUserExistsSql, { user_id: userId });

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    const emailRows = await fetchRows(conn, selectUserEmailConflictSql, {
      email: req.body.email,
      user_id: userId,
    });

    if (emailRows.length > 0) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }

    await conn.execute(updateUserSql, {
        user_id: userId,
        name: req.body.name,
        email: req.body.email,
        phone_number: req.body.phone,
        user_type: req.body.user_type ?? "Passenger",
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
        total_rides: Number(req.body.total_rides ?? 0),
      }, { autoCommit: true });

    await syncDriverRecordFromUser(conn, {
      user_id: userId,
      name: req.body.name,
      phone: req.body.phone,
      joined: req.body.joined_date,
      user_type: req.body.user_type ?? "Passenger",
    });

    const rows = await fetchRows(conn, selectUserByIdSql, { user_id: userId });

    return res.status(200).json({ message: "Passenger updated", user: rows[0] });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 1) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }
    return res.status(500).json({ message: "Failed to update passenger" });
  } finally {
    await closeConnection(conn);
  }
});

router.delete("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId is required" });
  }

  let conn;

  try {
    conn = await getConnection();

    const usageRows = await fetchRows(conn, findUserDeleteUsageSql, { user_id: userId });

    if (usageRows.length > 0) {
      return res.status(409).json({
        message: `Passenger cannot be removed because related records exist in ${usageRows[0].source_table}`,
      });
    }

    const result = await conn.execute(deleteUserSql, { user_id: userId }, { autoCommit: true });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    return res.status(200).json({ message: "Passenger deleted" });
  } catch (error) {
    console.error(error);
    if (error.errorNum === 2292) {
      return res.status(409).json({ message: "Passenger cannot be removed because related records exist" });
    }
    return res.status(500).json({ message: "Failed to delete passenger" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
