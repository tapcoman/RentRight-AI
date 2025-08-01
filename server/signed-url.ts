import crypto from 'crypto';
import { storage } from './storage';
import { Request, Response, NextFunction } from 'express';
import { InsertDocumentAccessToken } from '../shared/schema';

interface SignedUrlOptions {
  documentId: number;
  userId?: number;
  expiresIn?: string; // e.g., '24h', '7d'
  ipAddress?: string;
}

/**
 * Generate a time-limited, signed URL for secure document sharing
 * 
 * @param options Configuration options for the signed URL
 * @returns The signed URL token
 */
export async function generateSignedUrl(options: SignedUrlOptions): Promise<string> {
  // Generate a secure random token
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString('hex');
  
  // Calculate expiration
  const expiresAt = calculateExpiration(options.expiresIn || '24h');
  
  // Store the token in the database
  const tokenData: InsertDocumentAccessToken = {
    documentId: options.documentId,
    userId: options.userId,
    token,
    expiresAt,
    ipAddress: options.ipAddress
  };
  
  await storage.createDocumentAccessToken(tokenData);
  
  return token;
}

/**
 * Middleware to verify and process signed URLs for document access
 */
export function verifySignedUrl(req: Request, res: Response, next: NextFunction) {
  const token = req.params.token || req.query.token;
  
  console.log(`Verifying signed URL: path=${req.path}, token param=${req.params.token}, token query=${req.query.token}`);
  
  if (!token) {
    console.error('Missing token in verifySignedUrl middleware');
    return res.status(401).json({ 
      error: 'Missing access token', 
      message: 'No access token provided' 
    });
  }
  
  // Validate token format
  if (typeof token !== 'string' || token.length < 32) {
    console.error(`Invalid token format: ${token}`);
    return res.status(400).json({
      error: 'Invalid token format',
      message: 'The provided access token is malformed'
    });
  }
  
  console.log(`Token verified: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
  
  // Store token in request for later use
  req.signedUrlToken = token as string;
  next();
}

/**
 * Calculate expiration date based on duration string
 * 
 * @param duration Duration string (e.g., '24h', '7d')
 * @returns Date object representing the expiration time
 */
function calculateExpiration(duration: string): Date {
  const now = new Date();
  const unit = duration.charAt(duration.length - 1);
  const value = parseInt(duration.slice(0, -1));
  
  switch (unit) {
    case 'h': // hours
      now.setHours(now.getHours() + value);
      break;
    case 'd': // days
      now.setDate(now.getDate() + value);
      break;
    case 'w': // weeks
      now.setDate(now.getDate() + (value * 7));
      break;
    case 'm': // months (approximate)
      now.setMonth(now.getMonth() + value);
      break;
    default:
      // Default to 24 hours if format is invalid
      now.setHours(now.getHours() + 24);
  }
  
  return now;
}