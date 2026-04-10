import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS papers (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        first_author TEXT NOT NULL,
        domain TEXT NOT NULL CHECK (domain IN (
          'Computer Science', 'Biology', 'Physics', 'Chemistry', 'Mathematics', 'Social Sciences'
        )),
        reading_stage TEXT NOT NULL CHECK (reading_stage IN (
          'Abstract Read', 'Introduction Done', 'Methodology Done', 'Results Analyzed', 'Fully Read', 'Notes Completed'
        )),
        citation_count INTEGER NOT NULL DEFAULT 0,
        impact_score TEXT NOT NULL CHECK (impact_score IN (
          'High Impact', 'Medium Impact', 'Low Impact', 'Unknown'
        )),
        date_added DATE NOT NULL,
        file_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Add column if it doesn't exist to accommodate existing table
    await client.query(`
      ALTER TABLE papers ADD COLUMN IF NOT EXISTS file_url TEXT;
    `);
    console.log("Database initialized — papers table ready");
  } finally {
    client.release();
  }
}

export default pool;
