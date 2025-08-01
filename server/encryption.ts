import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Key management for encryption
// Primary key used for all new encryptions
let PRIMARY_KEY: Buffer;
// List of all valid keys for decryption (includes current and previous keys)
const VALID_KEYS: Buffer[] = [];

// Support for key rotation - version 0 is the initial key format
// This version number can be used in the future for format changes
const CURRENT_KEY_VERSION = 0;

// Primary method: Try to load the encryption keys from environment variables (recommended for production)
// Secondary method: Fall back to file-based storage only if environment variable isn't available
const KEY_PATH = path.join(__dirname, '../.encryption-key');
let envKeyWarningDisplayed = false;

// Function to load environment variable based encryption key
function loadEnvBasedKey(): boolean {
  if (process.env.ENCRYPTION_KEY) {
    try {
      PRIMARY_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      VALID_KEYS.push(PRIMARY_KEY);
      console.log('Using primary encryption key from ENCRYPTION_KEY environment variable');
      
      // Check for previous keys that should still be valid for decryption
      if (process.env.ENCRYPTION_KEY_PREVIOUS) {
        try {
          const previousKeys = process.env.ENCRYPTION_KEY_PREVIOUS.split(',');
          for (const key of previousKeys) {
            const keyBuffer = Buffer.from(key.trim(), 'hex');
            VALID_KEYS.push(keyBuffer);
          }
          console.log(`Loaded ${previousKeys.length} previous encryption key(s) for decryption`);
        } catch (error) {
          console.error('Error parsing ENCRYPTION_KEY_PREVIOUS, ignoring previous keys:', error);
        }
      }
      return true;
    } catch (error) {
      console.error('Invalid encryption key in environment variable');
      throw new Error('Invalid ENCRYPTION_KEY environment variable format. Must be a hex string.');
    }
  }
  return false;
}

// Function to load file based encryption key (fallback)
function loadFileBasedKey(): boolean {
  if (fs.existsSync(KEY_PATH)) {
    try {
      const keyHex = fs.readFileSync(KEY_PATH, 'utf8');
      PRIMARY_KEY = Buffer.from(keyHex, 'hex');
      VALID_KEYS.push(PRIMARY_KEY);
      
      if (!envKeyWarningDisplayed) {
        console.log('Loaded existing encryption key from file (not recommended for production)');
        console.log('SECURITY NOTICE: For production, set the ENCRYPTION_KEY environment variable with this value:');
        console.log(PRIMARY_KEY.toString('hex'));
        envKeyWarningDisplayed = true;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load encryption key from file, will generate new one');
      return false;
    }
  }
  return false;
}

// Function to generate a new key and save it to file
function generateAndSaveNewKey(): void {
  PRIMARY_KEY = crypto.randomBytes(32); // 256 bit key
  VALID_KEYS.push(PRIMARY_KEY);
  
  // Save to file as fallback
  try {
    fs.writeFileSync(KEY_PATH, PRIMARY_KEY.toString('hex'));
    console.log('Generated new encryption key and saved to file');
  } catch (error) {
    console.error('Failed to save encryption key to file:', error);
  }
  
  console.log('SECURITY NOTICE: For production, set the ENCRYPTION_KEY environment variable with this value:');
  console.log(PRIMARY_KEY.toString('hex'));
}

// First try environment variables (preferred method)
const envKeyLoaded = loadEnvBasedKey();

// If env variable is not available, try file-based key as fallback
if (!envKeyLoaded) {
  const fileKeyLoaded = loadFileBasedKey();
  
  // If no key is available at all, generate a new one
  if (!fileKeyLoaded) {
    generateAndSaveNewKey();
  }
}

// Advanced Encryption Standard (AES) algorithm in GCM mode
// GCM provides both encryption and authentication
export function encryptBuffer(buffer: Buffer): { 
  encryptedData: Buffer; 
  iv: Buffer; 
  authTag: Buffer;
  keyVersion: number;
} {
  // Always encrypt with the primary key
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher with primary key
  const cipher = crypto.createCipheriv('aes-256-gcm', PRIMARY_KEY, iv);
  
  // Encrypt the data
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    iv,
    authTag,
    keyVersion: CURRENT_KEY_VERSION
  };
}

export function decryptBuffer(encryptedData: Buffer, iv: Buffer, authTag: Buffer): Buffer {
  let lastError: Error | null = null;

  // Try decryption with all valid keys (current and previous)
  for (const key of VALID_KEYS) {
    try {
      // Create decipher with this key
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      
      // Set authentication tag
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      
      // If successful, return the decrypted data
      return decrypted;
    } catch (error) {
      // Store the error but try the next key
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  // If we get here, all keys failed
  console.error('Decryption failed with all keys:', lastError);
  throw new Error('Failed to decrypt document. Data may be corrupted or tampered with.');
}

/**
 * Helper function to save an encrypted file
 * The format is: [1 byte version][16 bytes IV][auth tag length][auth tag][encrypted data]
 */
export function saveEncryptedFile(filePath: string, buffer: Buffer): void {
  // Encrypt the buffer
  const { encryptedData, iv, authTag, keyVersion } = encryptBuffer(buffer);
  
  // Create a header with version, IV and auth tag
  const header = Buffer.alloc(1 + 16 + 4 + authTag.length);
  header.writeUInt8(keyVersion, 0);    // Version byte
  iv.copy(header, 1);                  // 16 bytes IV
  header.writeUInt32BE(authTag.length, 17); // Auth tag length at position 17 (after version + IV)
  authTag.copy(header, 21);            // Auth tag starts at position 21
  
  // Combine header and encrypted data
  const fileData = Buffer.concat([header, encryptedData]);
  
  // Write to disk
  fs.writeFileSync(filePath, fileData);
}

/**
 * Helper function to read an encrypted file
 * Supports both legacy format and new versioned format
 */
export function readEncryptedFile(filePath: string): Buffer {
  // Read the encrypted file
  const fileData = fs.readFileSync(filePath);
  
  // Check the first byte for version
  const firstByte = fileData.readUInt8(0);
  
  // Version 0 is our new format starting with a version byte
  if (firstByte === 0) {
    // New format: [1 byte version][16 bytes IV][auth tag length][auth tag][encrypted data]
    const iv = fileData.subarray(1, 17);
    const authTagLength = fileData.readUInt32BE(17);
    const authTag = fileData.subarray(21, 21 + authTagLength);
    const encryptedData = fileData.subarray(21 + authTagLength);
    
    // Decrypt and return
    return decryptBuffer(encryptedData, iv, authTag);
  } else {
    // Legacy format: [16 bytes IV][auth tag length][auth tag][encrypted data]
    // This assumes the first byte is part of the IV, which is fine for backward compatibility
    const iv = fileData.subarray(0, 16);
    const authTagLength = fileData.readUInt32BE(16);
    const authTag = fileData.subarray(20, 20 + authTagLength);
    const encryptedData = fileData.subarray(20 + authTagLength);
    
    // Decrypt and return
    return decryptBuffer(encryptedData, iv, authTag);
  }
}

/**
 * Utility function to re-encrypt a file with the current primary key
 * Useful during key rotation to migrate files to the newest key
 * @param filePath Path to the encrypted file
 * @returns true if re-encryption was successful, false if the file is already using the current key
 */
export function reEncryptFile(filePath: string): boolean {
  try {
    // First read and decrypt the file
    const decrypted = readEncryptedFile(filePath);
    
    // Check if the file already uses the current format and key
    const fileData = fs.readFileSync(filePath);
    const firstByte = fileData.readUInt8(0);
    
    // If the file is already using the current key version, no need to re-encrypt
    if (firstByte === CURRENT_KEY_VERSION) {
      return false;
    }
    
    // Re-encrypt with the current primary key
    saveEncryptedFile(filePath, decrypted);
    return true;
  } catch (error) {
    console.error(`Failed to re-encrypt file ${filePath}:`, error);
    throw new Error(`Failed to re-encrypt file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Utility to generate a new encryption key
 * @returns The new key as a hex string
 */
export function generateNewEncryptionKey(): string {
  const newKey = crypto.randomBytes(32); // 256 bit key
  return newKey.toString('hex');
}