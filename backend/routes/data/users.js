import express from "express";
import getConnection from "../../oracle.js";
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

    const existing = await fetchRows(
      conn,
      `
        SELECT user_id AS "user_id"
        FROM users
        WHERE LOWER(email) = LOWER(:email)
      `,
      { email: req.body.email }
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }

    const nextUserIdRows = await fetchRows(
      conn,
      `SELECT NVL(MAX(user_id), 0) + 1 AS "next_user_id" FROM users`
    );
    const nextUserId = nextUserIdRows[0]?.next_user_id ?? 1;

    await conn.execute(
      `
        INSERT INTO users (
          user_id,
          name,
          email,
          phone_number,
          user_type,
          joined_date,
          total_rides
        ) VALUES (
          :user_id,
          :name,
          :email,
          :phone_number,
          :user_type,
          :joined_date,
          :total_rides
        )
      `,
      {
        user_id: nextUserId,
        name: req.body.name,
        email: req.body.email,
        phone_number: req.body.phone,
        user_type: req.body.user_type ?? "Passenger",
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
        total_rides: Number(req.body.total_rides ?? 0),
      },
      { autoCommit: true }
    );

    await syncDriverRecordFromUser(conn, {
      user_id: nextUserId,
      name: req.body.name,
      phone: req.body.phone,
      joined: req.body.joined_date,
      user_type: req.body.user_type ?? "Passenger",
    });

    const rows = await fetchRows(
      conn,
      `
        SELECT
          user_id AS "user_id",
          name AS "name",
          email AS "email",
          phone_number AS "phone",
          user_type AS "user_type",
          TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined",
          total_rides AS "total_rides"
        FROM users
        WHERE user_id = :user_id
      `,
      { user_id: nextUserId }
    );

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

    const userRows = await fetchRows(
      conn,
      `SELECT user_id AS "user_id" FROM users WHERE user_id = :user_id`,
      { user_id: userId }
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    const emailRows = await fetchRows(
      conn,
      `
        SELECT user_id AS "user_id"
        FROM users
        WHERE LOWER(email) = LOWER(:email)
          AND user_id <> :user_id
      `,
      { email: req.body.email, user_id: userId }
    );

    if (emailRows.length > 0) {
      return res.status(409).json({ message: "A passenger with this email already exists" });
    }

    await conn.execute(
      `
        UPDATE users
        SET name = :name,
            email = :email,
            phone_number = :phone_number,
            user_type = :user_type,
            joined_date = :joined_date,
            total_rides = :total_rides
        WHERE user_id = :user_id
      `,
      {
        user_id: userId,
        name: req.body.name,
        email: req.body.email,
        phone_number: req.body.phone,
        user_type: req.body.user_type ?? "Passenger",
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
        total_rides: Number(req.body.total_rides ?? 0),
      },
      { autoCommit: true }
    );

    await syncDriverRecordFromUser(conn, {
      user_id: userId,
      name: req.body.name,
      phone: req.body.phone,
      joined: req.body.joined_date,
      user_type: req.body.user_type ?? "Passenger",
    });

    const rows = await fetchRows(
      conn,
      `
        SELECT
          user_id AS "user_id",
          name AS "name",
          email AS "email",
          phone_number AS "phone",
          user_type AS "user_type",
          TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined",
          total_rides AS "total_rides"
        FROM users
        WHERE user_id = :user_id
      `,
      { user_id: userId }
    );

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

    const usageRows = await fetchRows(
      conn,
      `
        SELECT source_table AS "source_table" FROM (
          SELECT 'BOOKINGS' AS source_table FROM bookings WHERE user_id = :user_id
          UNION ALL
          SELECT 'DRIVERS' AS source_table FROM drivers WHERE user_id = :user_id
          UNION ALL
          SELECT 'FEEDBACK' AS source_table FROM feedback WHERE user_id = :user_id
          UNION ALL
          SELECT 'SAVED_LOCATION' AS source_table FROM saved_location WHERE user_id = :user_id
          UNION ALL
          SELECT 'REFUNDS' AS source_table FROM refunds WHERE user_id = :user_id
          UNION ALL
          SELECT 'RATINGS_REVIEWS' AS source_table FROM ratings_reviews WHERE user_id = :user_id
        )
        FETCH FIRST 1 ROWS ONLY
      `,
      { user_id: userId }
    );

    if (usageRows.length > 0) {
      return res.status(409).json({
        message: `Passenger cannot be removed because related records exist in ${usageRows[0].source_table}`,
      });
    }

    const result = await conn.execute(
      `DELETE FROM users WHERE user_id = :user_id`,
      { user_id: userId },
      { autoCommit: true }
    );

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
