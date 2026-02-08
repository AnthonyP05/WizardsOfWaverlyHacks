/**
 * Database Setup Script
 * 
 * Run this ONCE to create the database and users table:
 *   node config/setupDatabase.js
 * 
 * It will:
 *   1. Create the 'recyclelocal' database if it doesn't exist
 *   2. Create the 'users' table with username, hashed password, zip code
 *   3. Add a unique index on username
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setup() {
  // First connect WITHOUT a database to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  const dbName = process.env.DB_NAME || 'recyclelocal';

  console.log('♻️  RecycleLocal Database Setup');
  console.log('─'.repeat(40));

  // Create database
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  console.log(`✅ Database '${dbName}' ready`);

  // Switch to the database
  await connection.changeUser({ database: dbName });

  // Create users table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      zip_code VARCHAR(10) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Users table ready');

  await connection.end();
  console.log('');
  console.log('🎉 Database setup complete!');
  console.log(`   Database: ${dbName}`);
  console.log(`   Host:     ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
