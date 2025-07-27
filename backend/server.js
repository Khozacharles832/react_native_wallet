import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";

dotenv.config();

const app = express();
app.use(express.json()); // ✅ Middleware to parse JSON

const PORT = process.env.PORT || 5001;

//DELETE route to delete from database
app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const result = await sql `
            DELETE FROM transitions WHERE id = ${id} RETURNING *
        `
        if (result.lenth === 0) {
            return res.status(404).json({message: "Failed!"});
        }

        res.status(200).json({message: "deleted successfully"});
    } catch (error) {
        console.log("Error deleting", error);
        res.status(500).json({message: "failed"})
        
    }
})

// GET route to get transactions from database
app.get("/api/transactions/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await sql `
            SELECT * FROM transitions WHERE user_id = ${userId} ORDER BY created_at DESC
        `
        res.status(200).json(transactions);
    } catch (error) {
        console.log("Error creating the transaction", error);
        res.status(500).json({ message: "Internal Server Error!" });
        
    }
})

// ✅ POST route to create a transaction
app.post("/api/transactions", async (req, res) => {
    try {
        const { title, amount, category, user_id } = req.body;

        if (!title || !user_id || !category || amount === undefined) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const transitions = await sql`
            INSERT INTO transitions (user_id, title, amount, category)
            VALUES (${user_id}, ${title}, ${amount}, ${category})
            RETURNING *
        `;

        res.status(201).json(transitions[0]);
    } catch (error) {
        console.log("Error creating the transaction", error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
});

// ✅ Database initialization
async function initDB() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS transitions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(255) NOT NULL,
                created_at DATE NOT NULL DEFAULT CURRENT_DATE
            )
        `;
        console.log("Database initialized Successfully!");
    } catch (error) {
        console.log("Error initializing database", error);
        process.exit(1); // Exit app on DB failure
    }
}

// ✅ Basic health check route
app.get("/", (req, res) => {
    res.send("Hang in there Khoza, you are doing much better");
});

// ✅ Start server after DB init
initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server up and running on PORT:", PORT);
    });
});
