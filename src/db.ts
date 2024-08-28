import { Pool } from "pg";
import * as dotenv from "dotenv";

// load environment variables from .env file
dotenv.config();

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
});

export default pool;
