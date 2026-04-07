export const selectCabExistsSql = `
  SELECT cab_id AS "cab_id" FROM cabs WHERE cab_id = :cab_id
`;

export const updateCabSql = `
  UPDATE cabs
  SET type = :type,
      model = :model,
      license_plate = :license_plate,
      cab_status = :cab_status,
      manufacture_year = :manufacture_year,
      color = :color
  WHERE cab_id = :cab_id
`;

export const selectCabByIdSql = `
  SELECT
    cab_id AS "cab_id",
    type AS "type",
    model AS "model",
    license_plate AS "license_plate",
    cab_status AS "status",
    manufacture_year AS "year",
    color AS "color"
  FROM cabs
  WHERE cab_id = :cab_id
`;

export const findCabDeleteUsageSql = `
  SELECT source_table AS "source_table" FROM (
    SELECT 'DRIVERS' AS source_table FROM drivers WHERE cab_id = :cab_id
    UNION ALL
    SELECT 'BOOKINGS' AS source_table FROM bookings WHERE cab_id = :cab_id
    UNION ALL
    SELECT 'CAB_MAINTENANCE' AS source_table FROM cab_maintenance WHERE cab_id = :cab_id
    UNION ALL
    SELECT 'REFUNDS' AS source_table FROM refunds WHERE cab_id = :cab_id
  )
  FETCH FIRST 1 ROWS ONLY
`;

export const deleteCabSql = `
  DELETE FROM cabs WHERE cab_id = :cab_id
`;
