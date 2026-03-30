import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 60000,
});

export async function query(sql, params = [], retries = 3) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      lastError = error;
      console.error(`Database attempt ${i + 1} failed:`, error.message);

      // Wait before retry (exponential backoff)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError;
}

export default pool;