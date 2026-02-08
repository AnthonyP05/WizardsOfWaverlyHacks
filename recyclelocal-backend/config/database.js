/**
 * MySQL Database Connection
 * 
 * Uses mysql2/promise for async/await support.
 * Connection pool handles multiple concurrent queries efficiently.
 * 
 * Required .env variables:
 *   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'recyclelocal',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Quick connectivity test
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('   ✅ MySQL connected');
    connection.release();
    return true;
  } catch (err) {
    console.error('   ❌ MySQL connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };
