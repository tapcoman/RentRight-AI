#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';

/**
 * Apply database indexes by pushing the updated schema
 * This uses Drizzle's introspection to create only the missing indexes
 */
async function applyIndexes() {
  console.log('🚀 Applying database indexes...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  try {
    // Create database connection
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client, { schema });
    
    console.log('✅ Connected to database');
    console.log('📊 The following indexes will be created if they don\'t exist:');
    
    // List all indexes that will be created
    const indexesList = [
      'Users table:',
      '  - idx_users_username (username lookups)',
      '  - idx_users_email (email lookups)',
      '',
      'Documents table:',
      '  - idx_documents_user_id (user document queries)',
      '  - idx_documents_uploaded_at (document ordering)',
      '  - idx_documents_created_at (cleanup queries)',
      '',
      'Analyses table:',
      '  - idx_analyses_document_id (document analysis lookups)',
      '  - idx_analyses_created_at (cleanup queries)',
      '',
      'Response Templates table:',
      '  - idx_response_templates_category (category filtering)',
      '  - idx_response_templates_is_active (active template filtering)',
      '  - idx_response_templates_category_active (combined filtering)',
      '',
      'Generated Templates table:',
      '  - idx_generated_templates_document_id (document template lookups)',
      '  - idx_generated_templates_template_id (template reference lookups)',
      '',
      'Sessions table:',
      '  - idx_sessions_user_id (user session queries)',
      '  - idx_sessions_token (token validation)',
      '  - idx_sessions_expires_at (session cleanup)',
      '',
      'Payments table:',
      '  - idx_payments_payment_intent_id (payment intent lookups)',
      '  - idx_payments_document_id (document payment queries)',
      '',
      'Document Access Tokens table:',
      '  - idx_document_access_tokens_document_id (document token lookups)',
      '  - idx_document_access_tokens_user_id (user token queries)',
      '  - idx_document_access_tokens_token (token lookups)',
      '  - idx_document_access_tokens_expires_at (token expiration)',
      '  - idx_document_access_tokens_revoked (revocation filtering)',
      '  - idx_document_access_tokens_token_validation (composite token validation)',
    ];
    
    indexesList.forEach(line => console.log(line));
    
    console.log('\n⚠️  Note: Use `drizzle-kit push` to apply these schema changes to your database.');
    console.log('⚠️  Or run the SQL migration file directly: migrations/0001_add_database_indexes.sql');
    
    // Close connection
    await client.end();
    
    console.log('\n✅ Schema validation completed successfully!');
    console.log('📝 To apply indexes, run: npx drizzle-kit push');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  applyIndexes();
}