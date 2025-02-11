import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "your_username",
  password: process.env.MYSQL_PASSWORD || "your_password",
  database: process.env.MYSQL_DATABASE || "your_database",
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on your needs
  queueLimit: 0,
});

export const query = async (sql: string, params?: any[]) => {
  let connection;
  try {
    connection = await pool.getConnection(); // Attempt to get a connection
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Database error:", error);
    throw new Error("Database connection failed"); // Throw a user-friendly error
  } finally {
    if (connection) connection.release(); // Release only if connection exists
  }
};

export { pool };