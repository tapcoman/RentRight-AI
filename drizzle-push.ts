import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function pushSchema() {
  console.log('Updating document schema...');
  
  try {
    // Add payment fields to documents table
    await db.execute(sql`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
    `);
    
    // Update payments table with customer_email column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS customer_email TEXT;
    `);
    
    console.log('Schema migration complete!');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
  
  process.exit(0);
}

pushSchema();