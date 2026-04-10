export const insertFeedbackSql = `
  INSERT INTO feedback (
    message,
    user_id
  ) VALUES (
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