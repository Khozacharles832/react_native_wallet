import { neon } from "@neondatabase/serverless";
import "dotenv/config";

// Create a sql connection to my database using DATABASE_URL
export const sql = neon(process.env.DATABASE_URL);