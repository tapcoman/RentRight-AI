import { db } from './db';
import { documents, analyses } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { encryptBuffer, decryptBuffer } from './encryption';
import fs from 'fs';
import path from 'path';

// Encryption/decryption helpers for database fields
export function encryptText(text: string): string {
  if (!text) return text;
  const buffer = Buffer.from(text, 'utf-8');
  const encrypted = encryptBuffer(buffer);
  
  // Format as base64 string with IV and authTag appended
  const ivBase64 = encrypted.iv.toString('base64');
  const authTagBase64 = encrypted.authTag.toString('base64');
  const encryptedBase64 = encrypted.encryptedData.toString('base64');
  
  return `${ivBase64}:${authTagBase64}:${encryptedBase64}`;
}

export function decryptText(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  
  try {
    const [ivBase64, authTagBase64, encryptedBase64] = encryptedText.split(':');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encryptedData = Buffer.from(encryptedBase64, 'base64');
    
    const decrypted = decryptBuffer(encryptedData, iv, authTag);
    return decrypted.toString('utf-8');
  } catch (error) {
    console.error('Error decrypting text:', error);
    return '[Decryption Error]';
  }
}

/**
 * Execute database cleanup for records older than 30 days
 */
export async function cleanupDatabaseRecords(): Promise<{
  deleted: number;
  errors: Array<string>;
}> {
  const result = { deleted: 0, errors: [] as Array<string> };
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    // Cleanup documents
    const deleteDocumentsResult = await db.delete(documents)
      .where(sql`created_at < ${thirtyDaysAgo.toISOString()}`)
      .returning({ id: documents.id });
    
    result.deleted += deleteDocumentsResult.length;
    
    // Also clean up analysis records
    const deleteAnalysisResult = await db.delete(analyses)
      .where(sql`created_at < ${thirtyDaysAgo.toISOString()}`)
      .returning({ id: analyses.id });
    
    result.deleted += deleteAnalysisResult.length;
    
    // Cleanup user accounts that were never verified (if we add users in the future)
    // This would go here
    
    console.log(`Deleted ${result.deleted} records during scheduled cleanup`);
    
    // Also cleanup encrypted uploads directory for files not linked to documents
    cleanupUnlinkedFiles().catch(err => {
      result.errors.push(`File cleanup error: ${err instanceof Error ? err.message : String(err)}`);
    });
    
    return result;
  } catch (error) {
    const errorMessage = `Database cleanup error: ${error instanceof Error ? error.message : String(error)}`;
    result.errors.push(errorMessage);
    console.error(errorMessage);
    return result;
  }
}

/**
 * Clean up any files in both encrypted-uploads and uploads directories that don't have 
 * corresponding entries in the database
 */
async function cleanupUnlinkedFiles(): Promise<void> {
  const encryptedUploadsDir = path.join(process.cwd(), 'encrypted-uploads');
  const regularUploadsDir = path.join(process.cwd(), 'uploads');
  let totalDeletedCount = 0;
  
  // Get all filenames from the database
  const databaseFiles = await db.select({ 
    filename: documents.filename,
    filePath: documents.filePath 
  }).from(documents);
  
  // Create Sets of both filename and filepath basenames for easy lookup
  const databaseFilenames = new Set(databaseFiles.map(record => record.filename).filter(Boolean)) as Set<string>;
  
  // Make sure we only include valid string paths in the set, filtering out nulls
  const databaseFilePathsSet = new Set(
    databaseFiles
      .map(record => record.filePath ? path.basename(record.filePath) : null)
      .filter((path): path is string => path !== null)
  );
  
  // Clean up encrypted uploads directory
  if (fs.existsSync(encryptedUploadsDir)) {
    const encryptedFiles = fs.readdirSync(encryptedUploadsDir);
    totalDeletedCount += await cleanupDirectory(
      encryptedUploadsDir, 
      encryptedFiles, 
      databaseFilePathsSet, 
      'encrypted'
    );
  }
  
  // Clean up regular uploads directory
  if (fs.existsSync(regularUploadsDir)) {
    const regularFiles = fs.readdirSync(regularUploadsDir);
    totalDeletedCount += await cleanupDirectory(
      regularUploadsDir, 
      regularFiles, 
      databaseFilenames, 
      'regular'
    );
  }
  
  if (totalDeletedCount > 0) {
    console.log(`Deleted ${totalDeletedCount} unlinked files during cleanup`);
  }
}

/**
 * Helper function to clean a specific directory
 */
async function cleanupDirectory(
  dirPath: string, 
  files: string[], 
  validFilesSet: Set<string>, 
  dirType: string
): Promise<number> {
  // Files to delete (those in the directory but not in the database)
  const filesToDelete = files.filter(file => !validFilesSet.has(file));
  
  // Delete each file
  let deletedCount = 0;
  for (const file of filesToDelete) {
    const filePath = path.join(dirPath, file);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      const stats = fs.statSync(filePath);
      // Only delete if older than 30 days
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    } catch (error) {
      console.error(`Error deleting ${dirType} file ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Deleted ${deletedCount} unlinked ${dirType} files during cleanup`);
  }
  
  return deletedCount;
}

/**
 * Schedule periodic database cleanup
 */
export function scheduleDataCleanup(): void {
  // Schedule cleanup to run daily at midnight
  const millisecondsInADay = 24 * 60 * 60 * 1000;
  
  // Calculate time until midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const timeUntilMidnight = midnight.getTime() - now.getTime();
  
  // Schedule first run at midnight
  setTimeout(() => {
    cleanupDatabaseRecords().catch(err => {
      console.error(`Scheduled cleanup error: ${err instanceof Error ? err.message : String(err)}`);
    });
    
    // Then schedule to run every day
    setInterval(() => {
      cleanupDatabaseRecords().catch(err => {
        console.error(`Scheduled cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, millisecondsInADay);
  }, timeUntilMidnight);
  
  console.log(`Database cleanup scheduled, first run in ${Math.round(timeUntilMidnight / (60 * 1000))} minutes`);
}