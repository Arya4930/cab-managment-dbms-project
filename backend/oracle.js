import oracledb from "oracledb";
import "dotenv/config";

// Avoid Express JSON serialization errors for Oracle CLOB/Lob objects.
oracledb.fetchAsString = [oracledb.CLOB];

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
}

export default async function getConnection() {
    return await oracledb.getConnection(dbConfig);
}
