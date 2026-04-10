import express from "express";
import registerUserRoute from "./routes/registerUser.js";
import dataRoutes from "./routes/dataRoutes.js";
import cors from "cors";
import "dotenv/config";

export const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.status(200).send("server is running");
});

app.use("/api", registerUserRoute);
app.use("/api", dataRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port 3000");
});