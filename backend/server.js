import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import ratelimiter from "./middleware/ratelimiter.js";

dotenv.config();


const app = express();
app.use(ratelimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

// 🗑️ DELETE a transaction by ID
app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql`
            DELETE FROM transitions WHERE id = ${id} RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({ message: "Transaction not found!" });
        }

        res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.log("Error deleting transaction", error);
        res.status(500).json({ message: "Failed to delete transaction" });
    }
});

// 📥 POST a new transaction
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

// 📄 GET all transactions for a user
app.get("/api/transactions/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await sql`
            SELECT * FROM transitions WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        res.status(200).json(transactions);
    } catch (error) {
        console.log("Error fetching transactions", error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
});

// 📊 GET transaction summary for a user
app.get("/api/transactions/summary/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const balanceResults = await sql`
            SELECT COALESCE(SUM(amount), 0) AS balance
            FROM transitions
            WHERE user_id = ${userId}
        `;

        const incomeResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS income
            FROM transitions
            WHERE user_id = ${userId}
            AND amount > 0
        `;

        const expenseResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS expense
            FROM transitions
            WHERE user_id = ${userId}
            AND amount < 0
        `;

        res.status(200).json({
            balance: balanceResults[0].balance,
            income: incomeResult[0].income,
            expense: expenseResult[0].expense
        });
    } catch (error) {
        console.log("Error fetching summary", error);
        res.status(500).json({ message: "Failed to fetch summary" });
    }
});

// 🛠️ DB Initialization
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
        console.log("Database initialized successfully!");
    } catch (error) {
        console.log("Error initializing database", error);
        process.exit(1);
    }
}

// 🔃 Health check
app.get("/", (req, res) => {
    res.send("Hang in there Khoza, you are doing much better");
});

// 🚀 Start server after DB is ready
initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server up and running on PORT:", PORT);
    });
});
