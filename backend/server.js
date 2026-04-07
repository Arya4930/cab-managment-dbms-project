import express from "express";
import registerUserRoute from "./routes/registerUser.js";
import "dotenv/config";

export const app = express();
const PORT = 3000;
app.use(express.json());

app.use("/api", registerUserRoute);

app.listen(PORT, () => {
    console.log("Server is running on port 3000");
});