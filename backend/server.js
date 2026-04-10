import express from "express";
import registerUserRoute from "./routes/registerUser.js";
import dataRoutes from "./routes/dataRoutes.js";
import cors from "cors";
import "dotenv/config";

export const app = express();
const PORT = 3000;

const normalizeOrigin = (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";

    // If scheme is missing in env, assume https for deployed frontends.
    const withScheme = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;

    try {
        return new URL(withScheme).origin;
    } catch {
        return "";
    }
};

const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = new Set([
    ...configuredOrigins,
    "http://localhost:5173",
    "http://localhost:4173",
]);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;

    const normalizedRequestOrigin = normalizeOrigin(origin);
    if (!normalizedRequestOrigin) return false;

    // Permit configured origins.
    if (allowedOrigins.has(normalizedRequestOrigin)) {
        return true;
    }

    // Permit Vercel preview/prod deployments for this project.
    return /^https:\/\/cab-managment-dbms-project(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
        normalizedRequestOrigin
    );
};

app.use(
    cors({
        origin(origin, callback) {
            // Never throw from CORS middleware, otherwise browser sees HTTP 500.
            callback(null, isAllowedOrigin(origin));
        },
    })
);
app.use(express.json());

app.use("/api", registerUserRoute);
app.use("/api", dataRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port 3000");
});