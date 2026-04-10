import oracledb from "oracledb";
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Avoid Express JSON serialization errors for Oracle CLOB/Lob objects.
oracledb.fetchAsString = [oracledb.CLOB];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function hasOracleNetFiles(dir) {
    if (!dir) {
        return false;
    }

    try {
        const tns = path.join(dir, "tnsnames.ora");
        const sqlnet = path.join(dir, "sqlnet.ora");
        return fs.existsSync(tns) || fs.existsSync(sqlnet);
    } catch {
        return false;
    }
}

function resolveConfigDir() {
    const explicit = String(process.env.TNS_ADMIN || process.env.ORACLE_NET_TNS_ADMIN || "").trim();
    if (explicit) {
        return explicit;
    }

    // Render Secret Files are available from /etc/secrets/<filename>.
    if (hasOracleNetFiles("/etc/secrets")) {
        return "/etc/secrets";
    }

    // Render can also expose secret files at app root.
    const appRoot = process.cwd();
    if (hasOracleNetFiles(appRoot)) {
        return appRoot;
    }

    // Local development fallback.
    const localOracleConfig = path.join(__dirname, "oracle_config");
    if (hasOracleNetFiles(localOracleConfig)) {
        return localOracleConfig;
    }

    return undefined;
}

const configDir = resolveConfigDir();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
};

if (configDir) {
    dbConfig.configDir = configDir;
}

export default async function getConnection() {
    return await oracledb.getConnection(dbConfig);
}
