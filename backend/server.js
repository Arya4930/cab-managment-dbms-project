import express from "express";
import registerUserRoute from "./routes/registerUser.js";
import dataRoutes from "./routes/dataRoutes.js";
import cors from "cors";
import "dotenv/config";

export const app = express();
const PORT = 3000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/api", registerUserRoute);
app.use("/api", dataRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port 3000");
});