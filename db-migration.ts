import { db } from './server/db';
import { documentAccessTokens } from './shared/schema';
import postgres from 'postgres';

async function createDocumentAccessTokensTable() {
  try {
    console.log('Creating document_access_tokens table...');
    
    // Connect directly to the database using postgres client
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Check if the table already exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_access_tokens'
      )
    `;
    
    const tableExists = result[0].exists;
    
    if (tableExists) {
      console.log('Table document_access_tokens already exists');
      return;
    }
    
    // Create the table using SQL with the postgres client
    await sql`
      CREATE TABLE document_access_tokens (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_accessed_at TIMESTAMP,
        access_count INTEGER NOT NULL DEFAULT 0,
        ip_address TEXT,
        revoked BOOLEAN NOT NULL DEFAULT FALSE
      )
    `;
    
    // Clean up
    await sql.end();
    
    console.log('Table document_access_tokens created successfully');
  } catch (error) {
    console.error('Error creating document_access_tokens table:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    await createDocumentAccessTokensTable();
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();