import express from "express";
import getConnection from "../oracle.js";
import oracledb from "oracledb";
import { registerUserSql } from "../db/queries/registerUser.js";

const router = express.Router();

router.post("/register", async (req, res) => {
    const { name, email, phone, user_type } = req.body;

    // 🔒 Basic validation
    if (!name || !email || !phone || !user_type) {
        return res.status(400).json({ message: "All fields are required" });
    }

    let conn;

    try {
        conn = await getConnection();

        const result = await conn.execute(
            registerUserSql,
            {
                name,
                email,
                password: "123456",
                phone,
                user_type,
                id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );

        const userId = result.outBinds.id[0];

        res.status(201).json({
            message: "User registered successfully",
            userId
        });

    } catch (err) {
        console.error(err);

        if (err.errorNum === 1) {
            return res.status(400).json({ message: "Email already exists" });
        }

        res.status(500).json({ message: "Server error" });

    } finally {
        if (conn) {
            try { await conn.close(); } catch {}
        }
    }
});

export default router;
