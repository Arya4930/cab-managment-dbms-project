export const insertMaintenanceSql = `
  INSERT INTO cab_maintenance (
    service_date,
    service_type,
    cost,
    cab_id,
    technician,
    notes,
    status
  ) VALUES (
    :service_date,
    :service_type,
    :cost,
    :cab_id,
    :technician,
    :notes,
    :status
  )
  RETURNING maintenance_id INTO :maintenance_id
`;

export const selectMaintenanceByIdSql = `
  SELECT
    maintenance_id AS "maint_id",
    TO_CHAR(service_date, 'YYYY-MM-DD') AS "service_date",
    service_type AS "service_type",
    cost AS "cost",
    cab_id AS "cab_id",
    technician AS "technician",
    notes AS "notes",
    status AS "status"
  FROM cab_maintenance
  WHERE maintenance_id = :maintenance_id
`;

export const selectMaintenanceExistsSql = `
  SELECT maintenance_id AS "maintenance_id" FROM cab_maintenance WHERE maintenance_id = :maintenance_id
`;

export const updateMaintenanceSql = `
  UPDATE cab_maintenance
  SET service_date = :service_date,
      service_type = :service_type,
      cost = :cost,
      cab_id = :cab_id,
      technician = :technician,
      notes = :notes,
      status = :status
  WHERE maintenance_id = :maintenance_id
`;

export const deleteMaintenanceSql = `
  DELETE FROM cab_maintenance WHERE maintenance_id = :maintenance_id
`;
