import express from "express";
import getConnection from "../../oracle.js";
import { insertFeedbackSql } from "../../db/queries/feedback.js";
import { closeConnection, validateRequired } from "./helpers.js";

const router = express.Router();

router.post("/feedback", async (req, res) => {
  const missing = validateRequired(req.body, ["user_id", "message"]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required` });
  }

  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      insertFeedbackSql,
      {
        message: String(req.body.message).trim(),
        user_id: Number(req.body.user_id),
      },
      { autoCommit: true }
    );

    return res.status(201).json({ message: "Feedback submitted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;