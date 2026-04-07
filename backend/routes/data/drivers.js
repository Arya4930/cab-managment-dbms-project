import express from "express";
import getConnection from "../../oracle.js";
import { closeConnection, fetchRows, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/drivers", async (req, res) => {
  const missing = validateRequired(req.body, ["name", "license_no", "phone"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const nextDriverIdRows = await fetchRows(
      conn,
      `SELECT NVL(MAX(driver_id), 0) + 1 AS "next_driver_id" FROM drivers`
    );
    const nextDriverId = nextDriverIdRows[0]?.next_driver_id ?? 1;

    await conn.execute(
      `
        INSERT INTO drivers (
          driver_id,
          driver_name,
          availability,
          ratings,
          user_id,
          cab_id,
          license_no,
          phone_number,
          total_trips,
          joined_date
        ) VALUES (
          :driver_id,
          :driver_name,
          :availability,
          :ratings,
          :user_id,
          :cab_id,
          :license_no,
          :phone_number,
          :total_trips,
          :joined_date
        )
      `,
      {
        driver_id: nextDriverId,
        driver_name: req.body.name,
        availability: req.body.availability ?? "Available",
        ratings: Number(req.body.ratings ?? 0),
        user_id: req.body.user_id ? Number(req.body.user_id) : null,
        cab_id: req.body.cab_id ? Number(req.body.cab_id) : null,
        license_no: req.body.license_no,
        phone_number: req.body.phone,
        total_trips: Number(req.body.total_trips ?? 0),
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
        SELECT
          driver_id AS "driver_id",
          driver_name AS "name",
          license_no AS "license_no",
          phone_number AS "phone",
          availability AS "status",
          ratings AS "rating",
          total_trips AS "total_trips",
          cab_id AS "cab_id",
          TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined"
        FROM drivers
        WHERE driver_id = :driver_id
      `,
      { driver_id: nextDriverId }
    );

    return res.status(201).json({ message: "Driver created", driver: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create driver" });
  } finally {
    await closeConnection(conn);
  }
});

router.put("/drivers/:driverId", async (req, res) => {
  const driverId = Number(req.params.driverId);
  if (!Number.isInteger(driverId) || driverId <= 0) {
    return res.status(400).json({ message: "Valid driverId is required" });
  }

  const missing = validateRequired(req.body, ["name", "license_no", "phone"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    const driverRows = await fetchRows(
      conn,
      `SELECT driver_id AS "driver_id" FROM drivers WHERE driver_id = :driver_id`,
      { driver_id: driverId }
    );

    if (driverRows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    await conn.execute(
      `
        UPDATE drivers
        SET driver_name = :driver_name,
            availability = :availability,
            ratings = :ratings,
            user_id = :user_id,
            cab_id = :cab_id,
            license_no = :license_no,
            phone_number = :phone_number,
            total_trips = :total_trips,
            joined_date = :joined_date
        WHERE driver_id = :driver_id
      `,
      {
        driver_id: driverId,
        driver_name: req.body.name,
        availability: req.body.availability ?? "Available",
        ratings: Number(req.body.ratings ?? 0),
        user_id: req.body.user_id ? Number(req.body.user_id) : null,
        cab_id: req.body.cab_id ? Number(req.body.cab_id) : null,
        license_no: req.body.license_no,
        phone_number: req.body.phone,
        total_trips: Number(req.body.total_trips ?? 0),
        joined_date: req.body.joined_date ? new Date(req.body.joined_date) : new Date(),
      },
      { autoCommit: true }
    );

    const rows = await fetchRows(
      conn,
      `
        SELECT
          driver_id AS "driver_id",
          driver_name AS "name",
          license_no AS "license_no",
          phone_number AS "phone",
          availability AS "status",
          ratings AS "rating",
          total_trips AS "total_trips",
          cab_id AS "cab_id",
          user_id AS "user_id",
          TO_CHAR(joined_date, 'YYYY-MM-DD') AS "joined"
        FROM drivers
        WHERE driver_id = :driver_id
      `,
      { driver_id: driverId }
    );

    return res.status(200).json({ message: "Driver updated", driver: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update driver" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
