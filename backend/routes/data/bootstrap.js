import express from "express";
import getConnection from "../../oracle.js";
import { bootstrapQueries, closeConnection, fetchRows } from "./helpers.js";

const router = express.Router();

router.get("/bootstrap", async (_req, res) => {
  let conn;

  try {
    conn = await getConnection();
    const data = {};

    for (const [key, sql] of Object.entries(bootstrapQueries)) {
      data[key] = await fetchRows(conn, sql);
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch bootstrap data" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;
