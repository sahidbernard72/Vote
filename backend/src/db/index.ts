import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

const connectionUri =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  `mysql://${process.env.DB_USER || "root"}:${process.env.DB_PASSWORD || ""}@${
    process.env.DB_HOST || "localhost"
  }:${process.env.DB_PORT || "3306"}/${process.env.DB_NAME || "dpt_db"}`;

// Pool connection for MySQL
export const pool = mysql.createPool(connectionUri);

export const db = drizzle(pool, { schema, mode: "default" });

export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { connected: true, message: "Koneksi database MySQL berhasil" };
  } catch (error: any) {
    return {
      connected: false,
      message: `Gagal terhubung ke MySQL: ${error.message}`,
    };
  }
}
