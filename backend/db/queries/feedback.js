export const insertFeedbackSql = `
  INSERT INTO feedback (
    message,
    user_id
  ) VALUES (
    :message,
    :user_id
  )
`;

export const selectNextFeedbackIdSql = `
  SELECT NVL(MAX(feedback_id), 0) + 1 AS "next_feedback_id"
  FROM feedback
`;

export const insertFeedbackWithIdSql = `
  INSERT INTO feedback (
    feedback_id,
    message,
    user_id
  ) VALUES (
    :feedback_id,
    :message,
    :user_id
  )
`;

export const feedbackSelectByUserSql = `
  SELECT
    feedback_id AS "feedback_id",
    DBMS_LOB.SUBSTR(message, 4000, 1) AS "message",
    user_id AS "user_id"
  FROM feedback
  WHERE user_id = :user_id
  ORDER BY feedback_id DESC
`;