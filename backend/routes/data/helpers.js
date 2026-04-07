import oracledb from "oracledb";
import { bootstrapQueries } from "../../db/queries/bootstrap.js";
import { bookingSelectSql } from "../../db/queries/bookings.js";
import {
  insertDriverSql,
  nextDriverIdSql,
  selectDriverByUserIdSql,
  updateDriverFromUserSql,
} from "../../db/queries/drivers.js";

export { bootstrapQueries, bookingSelectSql };

export async function fetchRows(connection, sql, binds = {}, options = {}) {
  const result = await connection.execute(sql, binds, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    ...options,
  });

  return result.rows;
}

export function validateRequired(payload, fields) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      return field;
    }
  }

  return null;
}

export function normalizeBookingId(bookingId) {
  return String(bookingId ?? "").trim().toUpperCase();
}

export async function syncDriverRecordFromUser(connection, userRecord) {
  if ((userRecord.user_type ?? "").toLowerCase() !== "driver") {
    return;
  }

  const existing = await fetchRows(
    connection,
    selectDriverByUserIdSql,
    { user_id: userRecord.user_id }
  );

  if (existing.length > 0) {
    await connection.execute(
      updateDriverFromUserSql,
      {
        driver_name: userRecord.name,
        phone_number: userRecord.phone,
        joined_date: userRecord.joined ? new Date(userRecord.joined) : new Date(),
        user_id: userRecord.user_id,
      },
      { autoCommit: true }
    );
    return;
  }

  const nextDriverIdRows = await fetchRows(
    connection,
    nextDriverIdSql
  );
  const nextDriverId = nextDriverIdRows[0]?.next_driver_id ?? 1;

  await connection.execute(
    insertDriverSql,
    {
      driver_id: nextDriverId,
      driver_name: userRecord.name,
      availability: "Available",
      ratings: 0,
      user_id: userRecord.user_id,
      cab_id: null,
      license_no: `AUTO-${String(userRecord.user_id).padStart(4, "0")}`,
      phone_number: userRecord.phone,
      total_trips: 0,
      joined_date: userRecord.joined ? new Date(userRecord.joined) : new Date(),
    },
    { autoCommit: true }
  );
}

export async function closeConnection(connection) {
  if (!connection) {
    return;
  }

  try {
    await connection.close();
  } catch {
    // No-op
  }
}
