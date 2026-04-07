import oracledb from "oracledb";
import "dotenv/config";

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
}

export default async function getConnection() {
    return await oracledb.getConnection(dbConfig);
}
