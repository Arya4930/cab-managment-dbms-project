import oracledb from "oracledb";
import "dotenv/config";

// Avoid Express JSON serialization errors for Oracle CLOB/Lob objects.
oracledb.fetchAsString = [oracledb.CLOB];

function isLikelyTnsAlias(value) {
    if (!value) {
        return false;
    }

    const text = String(value).trim();
    if (!text) {
        return false;
    }

    // Alias usually looks like: mydb_high
    // Direct strings usually contain host/service delimiters.
    return (
        !text.includes(":") &&
        !text.includes("/") &&
        !text.includes("(") &&
        !text.includes("=")
    );
}

function resolveConnectString() {
    const configured = String(process.env.DB_CONNECT_STRING ?? "").trim();
    const host = String(process.env.DB_HOST ?? "").trim();
    const port = String(process.env.DB_PORT ?? "1521").trim();
    const service = String(process.env.DB_SERVICE_NAME ?? process.env.DB_SERVICE ?? "").trim();
    const tnsAdmin = String(
        process.env.TNS_ADMIN ?? process.env.ORACLE_NET_TNS_ADMIN ?? process.env.DB_CONFIG_DIR ?? ""
    ).trim();

    if (!configured && host && service) {
        return `${host}:${port}/${service}`;
    }

    if (configured && isLikelyTnsAlias(configured) && !tnsAdmin) {
        if (host && service) {
            return `${host}:${port}/${service}`;
        }

        console.warn(
            "[oracle] DB_CONNECT_STRING looks like a TNS alias but no TNS config directory is set. " +
            "Set TNS_ADMIN/ORACLE_NET_TNS_ADMIN (wallet + tnsnames.ora), or set DB_HOST + DB_PORT + DB_SERVICE_NAME " +
            "to use Easy Connect."
        );
        return configured;
    }

    return configured;
}

const tnsAdmin = String(
    process.env.TNS_ADMIN ?? process.env.ORACLE_NET_TNS_ADMIN ?? process.env.DB_CONFIG_DIR ?? ""
).trim();
const walletLocation = String(process.env.DB_WALLET_LOCATION ?? "").trim();
const walletPassword = String(process.env.DB_WALLET_PASSWORD ?? "").trim();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: resolveConnectString(),
};

if (tnsAdmin) {
    dbConfig.configDir = tnsAdmin;
}

if (walletLocation) {
    dbConfig.walletLocation = walletLocation;
}

if (walletPassword) {
    dbConfig.walletPassword = walletPassword;
}

export default async function getConnection() {
    return await oracledb.getConnection(dbConfig);
}
