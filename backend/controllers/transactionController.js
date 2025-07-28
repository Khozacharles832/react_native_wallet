import { sql } from "../config/db.js";

// Get all transactions
export const getTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await sql`
            SELECT * FROM transitions WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error fetching transactions", error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// Create a new transaction
export const createTransaction = async (req, res) => {
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
        console.error("Error creating transaction", error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
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
        console.error("Error deleting transaction", error);
        res.status(500).json({ message: "Failed to delete transaction" });
    }
};

// Get summary
export const getSummary = async (req, res) => {
    try {
        const { userId } = req.params;

        const balanceResults = await sql`
            SELECT COALESCE(SUM(amount), 0) AS balance
            FROM transitions
            WHERE user_id = ${userId}
        `;

        const incomeResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS income
            FROM transitions WHERE user_id = ${userId} AND amount > 0
        `;

        const expenseResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS expense
            FROM transitions WHERE user_id = ${userId} AND amount < 0
        `;

        res.status(200).json({
            balance: balanceResults[0].balance,
            income: incomeResult[0].income,
            expense: expenseResult[0].expense,
        });
    } catch (error) {
        console.error("Error fetching summary", error);
        res.status(500).json({ message: "Failed to fetch summary" });
    }
};
