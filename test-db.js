import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co') || process.env.DATABASE_URL?.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Connected to DB successfully!");
    
    // Check if users table exists
    const tableRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);
    console.log("Users table exists:", tableRes.rows[0].exists);

    if (tableRes.rows[0].exists) {
      // Show table structure
      const columnsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
      console.log("Users table columns:", columnsRes.rows.map(r => r.column_name).join(', '));
      
      const countRes = await client.query("SELECT COUNT(*) FROM users");
      console.log("Total users in DB:", countRes.rows[0].count);
    }
    
    client.release();
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    pool.end();
  }
}

testConnection();
