import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testConnection() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'autoclaim_pro',
  };

  console.log('--- AIMS Database Connection Test ---');
  console.log(`Connecting to: ${config.host} as ${config.user}...`);

  if (!config.host) {
    console.error('❌ ERROR: DB_HOST is not defined in environment variables.');
    process.exit(1);
  }

  try {
    // 1. Test basic connection
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
    });
    console.log('✅ Connected to MySQL server.');

    // 2. Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
    console.log(`✅ Database "${config.database}" ensured.`);
    await connection.changeUser({ database: config.database });

    // 3. Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`Executing ${statements.length} schema statements...`);
      for (const statement of statements) {
        await connection.query(statement);
      }
      console.log('✅ Schema applied successfully.');
    } else {
      console.warn('⚠️ schema.sql not found, skipping table creation.');
    }

    // 4. Test a simple query
    const [rows] = await connection.query('SHOW TABLES');
    console.log('✅ Tables in database:', rows);

    await connection.end();
    console.log('--- Test Completed Successfully ---');
  } catch (error: any) {
    console.error('❌ ERROR: Connection failed.');
    console.error('Details:', error.message);
    process.exit(1);
  }
}

testConnection();
