import express from "express";
import getConnection from "../../oracle.js";
import {
  insertFeedbackSql,
  insertFeedbackWithIdSql,
  selectNextFeedbackIdSql,
} from "../../db/queries/feedback.js";
import { fetchRows } from "./helpers.js";
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

    const payload = {
      message: String(req.body.message).trim(),
      user_id: Number(req.body.user_id),
    };

    try {
      await conn.execute(insertFeedbackSql, payload, { autoCommit: true });
    } catch (insertError) {
      if (insertError?.code !== "ORA-00001") {
        throw insertError;
      }

      const nextFeedbackIdRows = await fetchRows(conn, selectNextFeedbackIdSql);
      const nextFeedbackId = Number(nextFeedbackIdRows[0]?.next_feedback_id ?? 0);

      if (!Number.isFinite(nextFeedbackId) || nextFeedbackId <= 0) {
        throw insertError;
      }

      await conn.execute(
        insertFeedbackWithIdSql,
        {
          feedback_id: nextFeedbackId,
          ...payload,
        },
        { autoCommit: true }
      );
    }

    return res.status(201).json({ message: "Feedback submitted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  } finally {
    await closeConnection(conn);
  }
});

export default router;