import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Create a postgres client with the connection string
const client = postgres(process.env.DATABASE_URL);

// Create a drizzle instance with the client and schema
export const db = drizzle(client, { schema });

// Export types for better type safety
export type DbClient = typeof db;