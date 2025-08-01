import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema';

// Get database URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(databaseUrl);
const db = drizzle(client, { schema });

async function pushSchema() {
  try {
    console.log('Creating response_templates table...');
    
    await client`
      CREATE TABLE IF NOT EXISTS response_templates (
        id SERIAL PRIMARY KEY,
        category VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
        legal_basis TEXT NOT NULL,
        template_content TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;

    console.log('Creating generated_templates table...');
    
    await client`
      CREATE TABLE IF NOT EXISTS generated_templates (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id),
        template_id INTEGER NOT NULL REFERENCES response_templates(id),
        personalized_content TEXT NOT NULL,
        analysis_findings JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;

    console.log('Schema created successfully!');
    
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  } finally {
    await client.end();
  }
}

pushSchema();