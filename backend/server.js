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
    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
    }

    return trimmed;
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

app.use(
    cors({
        origin(origin, callback) {
            // Allow non-browser or same-origin requests with no Origin header.
            if (!origin) {
                callback(null, true);
                return;
            }

            if (allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error(`CORS blocked for origin: ${origin}`));
        },
    })
);
app.use(express.json());

app.use("/api", registerUserRoute);
app.use("/api", dataRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port 3000");
});