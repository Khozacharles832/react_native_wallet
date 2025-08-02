import express from "express";
import dotenv from "dotenv";
import ratelimiter from "./middleware/ratelimiter.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import { sql } from "./config/db.js";
import job from "./config/cron.js";

dotenv.config();

const app = express();
if (process.env.NODE_ENV === "production") job.start();
app.use(ratelimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

// ✅ Use routes
app.use("/api/transactions", transactionRoutes);

// 🔃 Health check
app.get("/", (req, res) => {
    res.send("Hang in there Khoza, you are doing much better");
});

// ✅ DB setup
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

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server up and running on PORT: ${PORT}`);
    });
});
