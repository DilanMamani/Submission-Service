const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const testConnection = async () => {
  try {
    const result = await pool.query("select now() as current_time");
    console.log("PostgreSQL conectado:", result.rows[0].current_time);
  } catch (error) {
    console.error("Error conectando a PostgreSQL:", error.message);
  }
};

module.exports = {
  pool,
  testConnection,
};