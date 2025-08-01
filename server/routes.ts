import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { processDocument } from "./document-processor";
import { analyzeDocumentWithOpenAI, generateTenancyAgreementRewrite } from "./openai";
import { generateSimplePdfReport } from './pdf-generator-new';
import { saveEncryptedFile, readEncryptedFile, reEncryptFile } from "./encryption";
import { extractClauses, detectClauseType, getPromptForClauseType } from './clause-extractor';
import { preScreenDocumentForLegalIssues, checkUKTenancyCompliance } from './uk-tenancy-laws';

import { z } from "zod";
import { insertDocumentSchema } from "@shared/schema";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { setupAuth } from "./auth";
import svgCaptcha from "svg-captcha";
import { randomBytes } from "crypto";
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Import enhanced rate limiting and security measures
import { 
  detectClientIp, 
  apiLimiter, 
  authLimiter, 
  uploadLimiter, 
  captchaLimiter, 
  speedLimiter, 
  blockSuspiciousIPs, 
  trackSuspiciousActivity 
} from './rate-limiter';

// Import Google reCAPTCHA implementation
import { 
  verifyRecaptcha, 
  isGoogleRecaptchaConfigured, 
  getRecaptchaSiteKey 
} from './recaptcha';

// Import signed URL and email functionality
import { verifySignedUrl, generateSignedUrl } from './signed-url';
import { emailService } from './email-service';



// Import response templates functionality
import { seedResponseTemplates } from './response-templates-seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const REPORT_PRICE = 2900; // £29.00 in pence
const COMBINED_PRICE = 4800; // £48.00 for analysis + rewrite (£29 + £19)
const REWRITE_PRICE = 1900; // £19.00 in pence for just the rewrite
// Rewrite is only available as an add-on to analysis, not standalone

// Track if we're using Google reCAPTCHA or fallback to SVG CAPTCHA
const useGoogleRecaptcha = isGoogleRecaptchaConfigured();
console.log(`Using ${useGoogleRecaptcha ? 'Google reCAPTCHA' : 'SVG CAPTCHA'} for verification`);

// Map to track IP-based rate limiting (legacy implementation, kept for backward compatibility)
const ipUploadCounter = new Map<string, { count: number, lastUpload: number }>();

// Map to store SVG CAPTCHA sessions by token (used as fallback if Google reCAPTCHA isn't configured)
const captchaStore = new Map<string, { text: string, expires: number }>();

// Create a function to clean up expired CAPTCHAs
function cleanupExpiredCaptchas() {
  const now = Date.now();
  Array.from(captchaStore.entries()).forEach(([id, data]) => {
    if (data.expires < now) {
      captchaStore.delete(id);
    }
  });
}

// Clean up every 5 minutes
setInterval(cleanupExpiredCaptchas, 5 * 60 * 1000);

// Function to check for suspicious keywords in filenames
function containsSuspiciousPatterns(filename: string): boolean {
  const suspiciousKeywords = [
    'hack', 'virus', 'malware', 'trojan', 'exploit', 'xxx', 'porn', 
    'gambling', 'warez', 'crack', 'keygen', 'bitcoin', 'crypto',
    'password', 'credentials', 'leak'
  ];
  
  const lowerFilename = filename.toLowerCase();
  return suspiciousKeywords.some(keyword => lowerFilename.includes(keyword));
}

// Enhanced multer configuration with additional security measures
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow one file per request
  },
  fileFilter: (req, file, cb) => {
    // Check for allowed file types
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
    
    // Check filename length
    if (file.originalname.length > 100) {
      return cb(new Error('Filename is too long (max 100 characters)'));
    }
    
    // Check for suspicious filenames
    if (containsSuspiciousPatterns(file.originalname)) {
      return cb(new Error('Filename contains prohibited terms'));
    }
    
    // Check for valid file extension that matches mimetype
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const validExtensions: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
    };
    
    const allowedExtensions = (validExtensions[file.mimetype as keyof typeof validExtensions] || []);
    if (!extension || !allowedExtensions.includes(extension)) {
      return cb(new Error('File extension doesn\'t match the actual file type'));
    }
    
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure server for handling concurrent requests without authentication
  app.set('trust proxy', 1);
  
  // Set up authentication (disabled but keeping the code for future reference)
  // setupAuth(app);
  
  /**
   * Health Check Endpoint for Railway Deployment Monitoring
   * 
   * Provides comprehensive health status for all critical application dependencies:
   * - Database connectivity (PostgreSQL)
   * - External API availability (OpenAI, Stripe)
   * - Memory usage monitoring
   * - Service uptime tracking
   * 
   * HTTP Status Codes:
   * - 200 OK: All systems healthy
   * - 503 Service Unavailable: Critical systems unhealthy (database down, etc.)
   * 
   * Response includes:
   * - Overall service status
   * - Individual dependency health checks with response times
   * - Service metadata (version, uptime, environment info)
   * 
   * Designed for:
   * - Railway deployment health monitoring
   * - Load balancer health checks
   * - Application monitoring and alerting
   * - Performance metric collection
   */
  app.get('/api/health', async (req, res) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const version = '1.0.0';
    
    // Track service uptime (approximate since server start)
    const uptime = process.uptime();
    
    const checks = {
      database: { status: 'unknown', message: '', responseTime: 0 },
      openai: { status: 'unknown', message: '', responseTime: 0 },
      stripe: { status: 'unknown', message: '', responseTime: 0 },
      memory: { status: 'unknown', message: '', responseTime: 0 }
    };

    let overallStatus = 'healthy';
    let httpStatus = 200;

    // Database connectivity check
    try {
      const dbStart = Date.now();
      const dbStatus = await storage.checkDatabaseConnection();
      checks.database.responseTime = Date.now() - dbStart;
      
      if (dbStatus) {
        checks.database.status = 'healthy';
        checks.database.message = 'Connected successfully';
      } else {
        checks.database.status = 'unhealthy';
        checks.database.message = 'Connection failed';
        overallStatus = 'degraded';
      }
    } catch (error) {
      checks.database.status = 'unhealthy';
      checks.database.message = error instanceof Error ? error.message : 'Unknown database error';
      checks.database.responseTime = Date.now() - startTime;
      overallStatus = 'degraded';
    }

    // OpenAI API connectivity check (lightweight)
    try {
      const openaiStart = Date.now();
      if (process.env.OPENAI_API_KEY) {
        // Simple API validation - just check if we can create a client
        const testClient = new (await import('openai')).default({
          apiKey: process.env.OPENAI_API_KEY,
        });
        // We don't make an actual API call to avoid costs and rate limits
        checks.openai.status = 'healthy';
        checks.openai.message = 'API key configured';
      } else {
        checks.openai.status = 'unhealthy';
        checks.openai.message = 'API key not configured';
        overallStatus = 'degraded';
      }
      checks.openai.responseTime = Date.now() - openaiStart;
    } catch (error) {
      checks.openai.status = 'unhealthy';
      checks.openai.message = error instanceof Error ? error.message : 'OpenAI initialization error';
      checks.openai.responseTime = Date.now() - startTime;
      overallStatus = 'degraded';
    }

    // Stripe API connectivity check (lightweight)
    try {
      const stripeStart = Date.now();
      if (process.env.STRIPE_SECRET_KEY) {
        // Simple validation - just check if we can create a client
        const testStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        // We don't make an actual API call to avoid unnecessary requests
        checks.stripe.status = 'healthy';
        checks.stripe.message = 'API key configured';
      } else {
        checks.stripe.status = 'unhealthy';
        checks.stripe.message = 'API key not configured';
        overallStatus = 'degraded';
      }
      checks.stripe.responseTime = Date.now() - stripeStart;
    } catch (error) {
      checks.stripe.status = 'unhealthy';
      checks.stripe.message = error instanceof Error ? error.message : 'Stripe initialization error';
      checks.stripe.responseTime = Date.now() - startTime;
      overallStatus = 'degraded';
    }

    // Memory usage check
    try {
      const memStart = Date.now();
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
      const memLimit = 512; // MB - adjust based on your deployment limits
      
      checks.memory.responseTime = Date.now() - memStart;
      
      if (memUsageMB < memLimit * 0.9) { // 90% threshold
        checks.memory.status = 'healthy';
        checks.memory.message = `${memUsageMB}MB used`;
      } else {
        checks.memory.status = 'warning';
        checks.memory.message = `${memUsageMB}MB used (high usage)`;
        if (overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      }
    } catch (error) {
      checks.memory.status = 'unhealthy';
      checks.memory.message = error instanceof Error ? error.message : 'Memory check error';
      checks.memory.responseTime = Date.now() - startTime;
      overallStatus = 'degraded';
    }

    // Set HTTP status based on overall health
    if (overallStatus === 'degraded' || checks.database.status === 'unhealthy') {
      httpStatus = 503; // Service Unavailable
    }

    const totalResponseTime = Date.now() - startTime;

    const healthResponse = {
      status: overallStatus,
      timestamp,
      version,
      uptime: Math.round(uptime),
      responseTime: totalResponseTime,
      dependencies: checks,
      environment: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      }
    };

    res.status(httpStatus).json(healthResponse);
  });
  
  // Admin route to re-encrypt all files with the latest key (protected with admin API key)
  app.post('/api/admin/reencrypt', async (req, res) => {
    try {
      // Verify admin API key
      const adminKey = req.headers['x-admin-key'];
      if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }
      
      const { reencryptAll = false } = req.body;
      
      // If reencryptAll is true, get all documents from storage
      // Otherwise, only process a limited set (e.g., most recent)
      const documents = reencryptAll 
        ? await storage.getAllDocuments()
        : await storage.getDocuments(20, 0); // Get most recent 20 docs
      
      const results = {
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      // Re-encrypt each document's file
      for (const doc of documents) {
        try {
          if (!doc.filePath || !doc.isEncrypted) {
            results.skipped++;
            continue;
          }
          
          // Check if file exists
          if (!fs.existsSync(doc.filePath)) {
            results.skipped++;
            continue;
          }
          
          // Re-encrypt the file (will only update if using an old key version)
          const reEncrypted = reEncryptFile(doc.filePath);
          
          if (reEncrypted) {
            results.success++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Error with document ${doc.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      res.json({
        success: true,
        message: `Re-encryption completed: ${results.success} updated, ${results.skipped} skipped, ${results.failed} failed`,
        details: results
      });
    } catch (error) {
      console.error('Re-encryption error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error during re-encryption process',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Vector database removed - AI now handles all compliance scoring
  // Vector database initialization removed - now using AI-only compliance scoring

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create encrypted uploads directory if it doesn't exist
  const encryptedUploadsDir = path.join(__dirname, '../encrypted-uploads');
  if (!fs.existsSync(encryptedUploadsDir)) {
    fs.mkdirSync(encryptedUploadsDir, { recursive: true });
  }
  
  // Generate CAPTCHA endpoint
  app.get('/api/captcha/generate', (req, res) => {
    try {
      // Create a CAPTCHA
      const captcha = svgCaptcha.create({
        size: 6, // 6 characters
        noise: 2, // Noise level
        color: true,
        width: 200,
        height: 70,
        fontSize: 55
      });
      
      // Create a unique token for this CAPTCHA session
      const token = randomBytes(32).toString('hex');
      
      // Store the CAPTCHA text with an expiration time (10 minutes)
      const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes
      captchaStore.set(token, {
        text: captcha.text.toLowerCase(),
        expires: expirationTime
      });
      
      // Log CAPTCHA details for debugging
      console.log('Generated new CAPTCHA:', {
        text: captcha.text.toLowerCase(),
        token: token.substring(0, 6) + '...',
        storeSize: captchaStore.size,
        expires: new Date(expirationTime).toISOString()
      });
      
      // Return the CAPTCHA image and token
      res.set('Content-Type', 'image/svg+xml');
      res.json({
        image: captcha.data,
        token: token
      });
    } catch (error: any) {
      console.error('CAPTCHA generation error:', error);
      res.status(500).json({ message: 'Error generating CAPTCHA' });
    }
  });

  // Verify CAPTCHA endpoint (used separately)
  app.post('/api/captcha/verify', (req, res) => {
    try {
      const { token, answer } = req.body;
      
      console.log('CAPTCHA verify request:', { 
        token: token ? token.substring(0, 6) + '...' : 'missing',
        answer: answer || 'missing'
      });
      
      if (!token || !answer) {
        return res.status(400).json({ 
          success: false, 
          message: 'CAPTCHA token and answer are required' 
        });
      }
      
      // Get the stored CAPTCHA
      const captcha = captchaStore.get(token);
      
      // Log details for debugging
      console.log('Verify CAPTCHA lookup:', {
        found: !!captcha,
        expected: captcha?.text || 'N/A',
        expired: captcha ? (captcha.expires < Date.now() ? 'yes' : 'no') : 'N/A',
        storeSize: captchaStore.size
      });
      
      // Check if the token exists and hasn't expired
      if (!captcha) {
        return res.status(400).json({ 
          success: false, 
          message: 'CAPTCHA has expired or is invalid' 
        });
      }
      
      if (captcha.expires < Date.now()) {
        captchaStore.delete(token);
        return res.status(400).json({ 
          success: false, 
          message: 'CAPTCHA has expired' 
        });
      }
      
      // Check if answer matches
      const result = captcha.text === answer.toLowerCase();
      console.log('CAPTCHA validation result:', {
        expected: captcha.text,
        received: answer.toLowerCase(),
        matches: result
      });
      
      // IMPORTANT: Do NOT delete the token here - we need it for the actual upload
      // For standalone verification, extend the token lifetime instead
      if (result) {
        // Update the expiration time to give an additional 5 minutes for upload
        captcha.expires = Date.now() + 5 * 60 * 1000;
        console.log('Extended CAPTCHA token lifetime for upload:', {
          token: token.substring(0, 6) + '...',
          newExpiration: new Date(captcha.expires).toISOString()
        });
      }
      
      return res.json({ success: result });
    } catch (error: any) {
      console.error('CAPTCHA verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error verifying CAPTCHA' 
      });
    }
  });

  // Upload document endpoint with enhanced security measures
  app.post('/api/documents/upload', 
    // Handle multipart file upload first
    upload.single('file'),
    // Apply IP detection middleware
    detectClientIp,
    // Apply rate limiting and suspicious IP blocking
    blockSuspiciousIPs,
    uploadLimiter,
    speedLimiter,
    // Apply Google reCAPTCHA verification if configured, otherwise use the legacy CAPTCHA
    useGoogleRecaptcha ? verifyRecaptcha('document_upload') : (req, res, next) => {
      // Legacy CAPTCHA verification for fallback
      const captchaToken = req.body.captchaToken;
      const captchaAnswer = req.body.captchaAnswer;
      
      if (process.env.SKIP_CAPTCHA === 'true') {
        return next();
      }
      
      if (!captchaToken || !captchaAnswer) {
        return res.status(400).json({ 
          message: 'CAPTCHA verification required', 
          requireCaptcha: true 
        });
      }
      
      // Get the stored CAPTCHA
      const captcha = captchaStore.get(captchaToken);
      
      // Check if the token exists and hasn't expired
      if (!captcha || captcha.expires < Date.now()) {
        return res.status(400).json({ 
          message: 'CAPTCHA has expired or is invalid', 
          requireCaptcha: true 
        });
      }
      
      // Check if answer matches
      const matches = captcha.text === captchaAnswer.toLowerCase();
      
      if (!matches) {
        // Remove the used token regardless
        captchaStore.delete(captchaToken);
        
        // Track suspicious activity if multiple failed attempts
        trackSuspiciousActivity(req, true, 2);
        
        return res.status(400).json({ 
          message: 'Incorrect CAPTCHA answer', 
          requireCaptcha: true 
        });
      }
      
      // Remove the used token
      captchaStore.delete(captchaToken);
      next();
    },
    // File was already handled by upload.single('file') middleware at the start of the route
    async (req, res) => {
    try {
      // Log all form data for debugging
      console.log('Form fields received:', Object.keys(req.body).join(', '));
      console.log('Request body details:', {
        recaptchaToken: useGoogleRecaptcha ? ('recaptchaToken' in req.body) : 'Using legacy CAPTCHA',
        captchaToken: !useGoogleRecaptcha ? ('captchaToken' in req.body) : 'Using Google reCAPTCHA',
        fileReceived: !!req.file
      });
      
      // Validate and process the uploaded file
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileType = req.file.mimetype;
      let filename = req.file.originalname;
      
      // Create a sanitized filename (keep original extension, but sanitize the name)
      const extension = filename.split('.').pop()?.toLowerCase();
      const sanitizedName = filename
        .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // Replace unsafe chars with underscores
        .replace(/_{2,}/g, '_');            // Replace multiple consecutive underscores with a single one
      
      // Add timestamp to filename to prevent overwrites
      filename = `${Date.now()}_${sanitizedName}`;
      
      // Process the document to extract text
      const content = await processDocument(req.file.buffer, fileType);
      
      // Check document content length
      if (!content || content.length < 100) {
        return res.status(400).json({ message: 'Document appears to be empty or has insufficient text content' });
      }
      
      // Basic content moderation: check for content that isn't likely to be a tenancy agreement
      if (!content.toLowerCase().includes('lease') && !content.toLowerCase().includes('tenancy') && 
          !content.toLowerCase().includes('rent') && 
          !content.toLowerCase().includes('tenant') && 
          !content.toLowerCase().includes('property') &&
          !content.toLowerCase().includes('landlord')) {
        return res.status(400).json({ message: 'The document does not appear to be a tenancy agreement' });
      }
      
      // Save the original file in an encrypted format
      // Save both encrypted and unencrypted versions for backward compatibility
      // The encrypted version is the primary one for security
      const encryptedFilePath = path.join(encryptedUploadsDir, filename);
      saveEncryptedFile(encryptedFilePath, req.file.buffer);
      
      // Keep unencrypted version for backward compatibility
      // This should eventually be removed in production after ensuring all systems work with encrypted files
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      // Save document metadata to storage (without user ID)
      const document = await storage.createDocument({
        filename,
        fileType,
        content,
        userId: null, // No user association
        filePath: encryptedFilePath,
        isEncrypted: true
      });
      
      // Mark document as processed since text extraction was successful
      await storage.updateDocument(document.id, { processed: true });
      
      // Rate limiting is now handled by the middleware
      // We maintain this legacy counter for backward compatibility
      const clientIp = req.ip || req.socket.remoteAddress || '0.0.0.0';
      const now = Date.now();
      
      let counter = ipUploadCounter.get(clientIp);
      if (!counter) {
        counter = { count: 0, lastUpload: 0 };
        ipUploadCounter.set(clientIp, counter);
      }
      
      counter.count++;
      counter.lastUpload = now;
      ipUploadCounter.set(clientIp, counter);

      return res.status(201).json({ id: document.id, filename: document.filename });
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(500).json({ message: error.message || 'Error uploading document' });
    }
  });

  // Get all documents (public endpoint for demo)
  app.get('/api/documents', async (req, res) => {
    try {
      // In a production app, we would check authentication here
      // But for now, we'll allow access to all documents
      
      // Get all documents 
      const documents = await storage.getAllDocuments();
      
      // Only return the most recent 20 documents for performance
      const recentDocuments = documents
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
        .slice(0, 20);
        
      return res.json(recentDocuments);
    } catch (error: any) {
      console.error('Error retrieving documents:', error);
      return res.status(500).json({ message: error.message || 'Error retrieving documents' });
    }
  });

  // Get document by ID (no authentication required)
  app.get('/api/documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      return res.json(document);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error retrieving document' });
    }
  });

  // Get payments for a document
  app.get('/api/documents/:id/payments', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const payments = await storage.getPaymentsByDocumentId(id);
      return res.json(payments);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error retrieving payments' });
    }
  });


  // Perform real analysis (after payment verification)
  app.post('/api/documents/:id/analyze', 
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter, 
    speedLimiter,
    async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentIntentId, serviceType, customerEmail } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      if (!paymentIntentId) {
        return res.status(402).json({ message: 'Payment required for full analysis' });
      }
      
      // Store the customer email for later use
      let userEmail = customerEmail;
      
      // Validate email format before using it
      if (userEmail) {
        if (typeof userEmail !== 'string' || !userEmail.includes('@')) {
          console.error(`Invalid email format received: "${userEmail}". Cannot send email report.`);
          userEmail = undefined; // Don't use invalid emails
        } else {
          console.log(`Valid customer email for document ${id}: ${userEmail}`);
        }
      } else {
        console.warn(`No customer email provided for document ${id}. Email report cannot be sent.`);
      }
      
      console.log('Full request body:', JSON.stringify(req.body, null, 2));

      // Log the payment information received
      console.log(`Starting analysis with payment: ${paymentIntentId}, service: ${serviceType || 'analysis'}, document: ${id}`);
      
      // Record payment in our database if it doesn't exist yet
      try {
        const existingPayment = await storage.getPaymentByIntentId(paymentIntentId);
        if (!existingPayment) {
          // First verify with Stripe
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (paymentIntent.status === 'succeeded') {
            await storage.recordPayment({
              paymentIntentId,
              documentId: id,
              serviceType: serviceType || 'analysis',
              status: 'succeeded',
              amount: paymentIntent.amount / 100,
              customerEmail: userEmail,
              createTimestamp: new Date()
            });
            console.log(`Recorded successful payment ${paymentIntentId} for document ${id}`);
          }
        } else {
          console.log(`Payment ${paymentIntentId} already recorded in database`);
        }
      } catch (paymentError) {
        console.error('Error recording payment:', paymentError);
        // Continue with analysis even if payment recording fails
      }
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (!document.content) {
        return res.status(400).json({ message: 'Document has no content to analyze' });
      }

      // Preprocess document content to highlight known critical issues for AI analysis
      let enhancedContent = document.content;
      
      // Extract clauses from the document for more targeted analysis
      console.log("Extracting clauses from document...");
      const extractedClauses = extractClauses(document.content);
      console.log(`Extracted ${extractedClauses.length} clauses using advanced extractor`);
      
      // Analysis pipeline simplified - AI now handles all compliance scoring
      console.log("Starting AI-powered compliance analysis...");
      
      // Define the type for prescreenInsights
      interface PreScreenInsight {
        title: string;
        content: string;
        type: 'warning' | 'accent' | 'primary';
        category: string;
        relevantClauses?: number[];
        source: string;
      }

      const prescreenInsights: PreScreenInsight[] = []; // Empty array instead of using pattern matching
      
      // AI will now handle all compliance scoring independently
      
      // Check overall compliance with UK tenancy laws
      console.log("Checking document compliance with UK tenancy laws...");
      const complianceCheck = checkUKTenancyCompliance(document.content);
      console.log(`Overall compliance score: ${complianceCheck.score}%`);
      
      // Enhanced multi-layered clause detection system
      // Strategy 2: Specialized Pattern Matching
      const knownProblematicClauses = [
        // CATEGORY: Unilateral rule changes (Housing Act violations)
        {
          pattern: /rules.{0,30}regulations.{0,50}(change|amend|modify|alter).{0,50}(immediate|without notice|any time|sole discretion)/i,
          issue: "Rules/regulations that can be changed unilaterally by landlord with minimal notice",
          severity: "HIGH",
          law: "Consumer Rights Act 2015",
          weight: 10
        },
        {
          pattern: /clause\s*16|sixteen|landlord.{0,30}(change|amend|modify|alter).{0,30}(notice|period|time|notification)/i,
          issue: "Clause allowing landlord to unilaterally change tenancy terms",
          severity: "HIGH",
          law: "Consumer Rights Act 2015",
          weight: 10
        },
        {
          pattern: /(immediately|at any time|without prior notice).{0,50}(change|amend|modify)/i,
          issue: "Changes allowed without proper notice period",
          severity: "HIGH",
          law: "Consumer Rights Act 2015",
          weight: 9
        },
        {
          pattern: /(landlord|lessor).{0,30}(reserves the right|discretion|decision).{0,50}(change|alter|amend)/i,
          issue: "Landlord reserves right to change terms at their discretion",
          severity: "HIGH",
          law: "Consumer Rights Act 2015",
          weight: 9
        },
        
        // CATEGORY: Unfair repair responsibilities (Landlord and Tenant Act 1985)
        {
          pattern: /tenant.{0,50}(responsible|liable|pay).{0,50}(all|any).{0,30}(repair|damage|maintenance)/i,
          issue: "Potentially unfair repair responsibilities for tenant",
          severity: "HIGH",
          law: "Landlord and Tenant Act 1985, Section 11",
          weight: 8
        },
        {
          pattern: /tenant.{0,50}(repair|maintain|fix).{0,50}(structure|exterior|roof|walls|foundation|boiler|heating|electrical|plumbing)/i,
          issue: "Tenant required to repair items that are landlord's responsibility",
          severity: "HIGH",
          law: "Landlord and Tenant Act 1985, Section 11",
          weight: 10
        },
        {
          pattern: /tenant.{0,30}(cost|expense|pay).{0,30}(wear and tear|fair use|normal deterioration)/i,
          issue: "Tenant charged for normal wear and tear",
          severity: "HIGH",
          law: "Landlord and Tenant Act 1985",
          weight: 8
        },
        
        // CATEGORY: Prohibited fees (Tenant Fees Act 2019)
        {
          pattern: /(prohibited|banned|not allowed).{0,50}fee|tenant.{0,30}pay.{0,30}(admin|administration|setup|reference|inventory|check.?out|check.?in)/i,
          issue: "Possible prohibited fee under Tenant Fees Act 2019",
          severity: "HIGH",
          law: "Tenant Fees Act 2019",
          weight: 10
        },
        {
          pattern: /fee.{0,50}(cleaning|professional clean|cleaning service)/i,
          issue: "Professional cleaning fee - likely prohibited",
          severity: "HIGH",
          law: "Tenant Fees Act 2019",
          weight: 9
        },
        {
          pattern: /charge.{0,50}(renew|renewal|extension|continue|new.{0,10}(tenancy|agreement))/i,
          issue: "Tenancy renewal fee - prohibited since 2019",
          severity: "HIGH",
          law: "Tenant Fees Act 2019",
          weight: 10
        },
        {
          pattern: /charge.{0,50}(refer|reference|credit.{0,10}check)/i,
          issue: "Referencing or credit check fee - prohibited",
          severity: "HIGH",
          law: "Tenant Fees Act 2019",
          weight: 10
        },
        
        // CATEGORY: Deposit issues
        {
          pattern: /deposit.{0,50}(not|no).{0,30}protect/i,
          issue: "Concerning deposit protection clause",
          severity: "HIGH",
          law: "Housing Act 2004",
          weight: 10
        },
        {
          pattern: /deposit.{0,50}exceed.{0,30}(5|five|six|6).{0,30}week/i,
          issue: "Deposit exceeds 5/6 week limit under Tenant Fees Act",
          severity: "HIGH",
          law: "Tenant Fees Act 2019",
          weight: 9
        },
        {
          pattern: /deposit.{0,50}(within|after).{0,30}(3[1-9]|[4-9][0-9]|[1-9][0-9]{2,})\s*days/i,
          issue: "Deposit not protected within 30 days as required by law",
          severity: "HIGH",
          law: "Housing Act 2004",
          weight: 9
        },
        
        // CATEGORY: Landlord access issues
        {
          pattern: /landlord.{0,50}(enter|access).{0,50}(any time|without notice)/i,
          issue: "Unreasonable landlord access clause",
          severity: "HIGH",
          law: "Housing Act 1988",
          weight: 8
        },
        {
          pattern: /landlord.{0,50}(enter|access|inspect|view).{0,50}(less than|under|before).{0,20}(24|twenty.?four).{0,20}(hour|notice)/i,
          issue: "Landlord access with less than 24 hours notice",
          severity: "HIGH",
          law: "Housing Act 1988",
          weight: 8
        },
        {
          pattern: /tenant.{0,50}(must|shall|required|obliged).{0,30}(allow|permit|enable).{0,30}(access|entry|landlord)/i,
          issue: "Mandatory landlord access without proper notice provisions",
          severity: "MEDIUM",
          law: "Housing Act 1988",
          weight: 6
        },
        
        // CATEGORY: Waiving tenant rights
        {
          pattern: /tenant.{0,50}(waive|surrender|give up|relinquish).{0,50}(rights|claims|remedies|recourse)/i,
          issue: "Clause attempting to waive statutory tenant rights",
          severity: "HIGH",
          law: "Consumer Rights Act 2015",
          weight: 10
        },
        {
          pattern: /tenant.{0,50}not.{0,30}(withhold|deduct|reduce).{0,50}rent/i,
          issue: "Clause preventing legitimate rent withholding for repairs",
          severity: "HIGH",
          law: "Landlord and Tenant Act 1985",
          weight: 8
        },
        {
          pattern: /tenant.{0,50}no.{0,30}(claim|compensation|damages|reimbursement)/i,
          issue: "Clause preventing tenant from claiming legitimate compensation",
          severity: "HIGH",
          law: "Consumer Rights Act 2015",
          weight: 9
        },
        
        // CATEGORY: Unfair penalties and charges
        {
          pattern: /(charge|fee|penalty|fine).{0,50}(late|overdue|unpaid).{0,50}(\$|£|€|USD|GBP|EUR|[0-9]+)/i,
          issue: "Potentially excessive late payment charges",
          severity: "MEDIUM",
          law: "Consumer Rights Act 2015",
          weight: 5
        },
        {
          pattern: /(forfeit|lose|surrender).{0,50}deposit/i,
          issue: "Automatic deposit forfeiture clause",
          severity: "HIGH",
          law: "Tenant Fees Act 2019",
          weight: 8
        },
        
        // CATEGORY: Additional unfair terms
        {
          pattern: /(professional|carpet).{0,30}clean/i,
          issue: "Mandatory professional cleaning requirement",
          severity: "MEDIUM",
          law: "Consumer Rights Act 2015",
          weight: 6
        },
        {
          pattern: /(no|not|prevent|prohibit).{0,50}(children|pets|guests|visitors)/i,
          issue: "Potentially unreasonable ban on children/pets/guests",
          severity: "MEDIUM", 
          law: "Consumer Rights Act 2015",
          weight: 5
        }
      ];
      
      // Strategy 4: Clause-Level Analysis
      // Break document into clauses for more targeted analysis
      const clauseBreakPattern = /(?:clause|section|paragraph)\s+\d+|(?:\d+\.)|(?:[A-Z]\.\s+)/gi;
      // Fix for TypeScript error by using a different approach to collect matches
      const clauseMatches: RegExpExecArray[] = [];
      let match: RegExpExecArray | null;
      while ((match = clauseBreakPattern.exec(enhancedContent)) !== null) {
        clauseMatches.push(match);
      }
      
      // Create clause segments if we can identify them
      interface ClauseInfo {
        number: number;
        text: string;
        startPos: number;
        issues: Array<{
          issue: string;
          matchingText: string;
          severity: string;
          law: string;
          weight: number;
          position: number;
          clause?: number;
        }>;
      }
      let clauses: ClauseInfo[] = [];
      
      if (clauseMatches.length > 3) { // Only process if we found enough clause markers
        console.log(`Found ${clauseMatches.length} potential clause markers`);
        
        // Extract clauses based on markers
        for (let i = 0; i < clauseMatches.length; i++) {
          const currentMatch = clauseMatches[i];
          const nextMatch = clauseMatches[i + 1];
          
          if (currentMatch.index !== undefined) {
            const startPos = currentMatch.index;
            const endPos = nextMatch && nextMatch.index !== undefined 
              ? nextMatch.index 
              : enhancedContent.length;
              
            const clauseText = enhancedContent.substring(startPos, endPos);
            
            clauses.push({
              number: i + 1,
              text: clauseText,
              startPos,
              issues: []
            });
          }
        }
        
        console.log(`Successfully extracted ${clauses.length} clauses for individual analysis`);
      } else {
        console.log('Not enough clause markers found, falling back to whole document analysis');
      }
      
      // Strategy 5: Legal Framework Alignment - Add known good/bad clause patterns
      const complianceChecklist = [
        { requirement: "Deposit protection scheme", pattern: /deposit.{0,50}(protect|scheme|tds|dps|mydeposits)/i, lawReference: "Housing Act 2004" },
        { requirement: "Notice period (2 months min)", pattern: /(notice.{0,30}period|notice.{0,30}to quit).{0,50}(2|two).{0,10}month/i, lawReference: "Housing Act 1988" },
        { requirement: "Repairs responsibility", pattern: /(landlord.{0,50}(responsible|undertakes|agrees).{0,50}(repair|maintain))/i, lawReference: "Landlord and Tenant Act 1985" },
        { requirement: "Reasonable notice for access", pattern: /(notice.{0,30}(24|twenty.?four).{0,10}hour|reasonable.{0,10}notice)/i, lawReference: "Housing Act 1988" },
        { requirement: "Safety certification", pattern: /(gas.{0,30}safety|electrical.{0,30}safety|eicr|cp12|smoke.{0,10}(alarm|detector))/i, lawReference: "Various safety regulations" }
      ];
      
      // Find issues in each clause or in the whole document
      // Strategy 6: Weighted Scoring System
      let totalViolationScore = 0; // Track cumulative violation score
      
      // Define a proper type for the detected issues
      interface DetectedIssue {
        issue: string;
        matchingText: string;
        severity: string;
        law: string;
        weight: number;
        position: number;
        clause?: number;
      }
      const detectedIssues: DetectedIssue[] = [];
      
      // Function to check clauses or whole document for violations
      // Pattern matching completely disabled
      // Leaving empty function in case it's being called elsewhere
      const findViolations = (text: string, clauseInfo?: {number: number, startPos: number}) => {
        // Completely disabled as requested
        return;
      };
      
      // PATTERN MATCHER DISABLED - Using pre-screening and AI analysis only
      console.log(`Pattern matcher disabled - using pre-screening and AI analysis only`);
      
      // We'll still track the compliance results for reference, but won't use the pattern matcher
      const complianceResults = complianceChecklist.map(item => {
        const found = item.pattern.test(enhancedContent);
        return {
          requirement: item.requirement,
          found,
          lawReference: item.lawReference
        };
      });
      
      // Using the compliance check from the UK tenancy law module instead
      // This is more reliable than our basic pattern matching
      console.log(`Using compliance score from UK tenancy law module: ${complianceCheck.score}%`);
      
      // If we found critical issues, create an enhanced prompt for OpenAI
      if (detectedIssues.length > 0) {
        console.log(`Pre-analysis detected ${detectedIssues.length} potential issues`);
        
        // Group issues by clause if available
        let issuesByClause = "";
        if (clauses.length > 0) {
          const clausesWithIssues = clauses.filter(c => c.issues.length > 0);
          if (clausesWithIssues.length > 0) {
            issuesByClause = "\n\nISSUES BY CLAUSE:\n" + 
              clausesWithIssues.map(c => 
                `CLAUSE ${c.number}: ${c.issues.map(i => 
                  `- ${i.issue} (${i.severity}, ${i.law})`
                ).join('\n')}`
              ).join('\n\n');
          }
        }
        
        // Add detected issues as a comment at the top of the document
        // This will be seen by the AI but won't affect the original document
        const issuesAnnotation = "CRITICAL DETECTED ISSUES FOR SPECIAL ATTENTION:\n" + 
          detectedIssues.map((issue, i) => 
            `${i+1}. ${issue.issue}: "${issue.matchingText}" - ${issue.severity} severity violation of ${issue.law}`
          ).join("\n") +
          issuesByClause +
          "\n\nMISSING COMPLIANCE REQUIREMENTS:\n" +
          complianceResults.filter(r => !r.found)
            .map(r => `- ${r.requirement} (${r.lawReference})`)
            .join('\n') +
          "\n\nCOMPLIANCE SCORE: " + complianceCheck.score + "%" +
          "\n\n--- ORIGINAL DOCUMENT FOLLOWS ---\n\n";
          
        enhancedContent = issuesAnnotation + enhancedContent;
      }

      // Get primary analysis with OpenAI - use enhanced content with annotations
      const analysisResults = await analyzeDocumentWithOpenAI(enhancedContent);
      console.log("Primary AI analysis completed successfully");
      
      // Combine the AI results with our extract clauses and pre-screening insights
      const finalResults = {
        ...analysisResults,
        // Add the extracted clauses to the analysis results
        clauses: extractedClauses,
        // Add enhanced analysis metadata
        validationPerformed: false, // No secondary validation performed
        ukLawVerificationPerformed: false, // No specialized UK law verification
        doubleVerified: false, // Single AI analysis only
        verificationBadge: "AI Verified", // Single verification badge
        vectorAnalysisPerformed: false,
        validationNote: `Analysis includes single AI analysis and clause-by-clause extraction (${extractedClauses.length} clauses). Overall compliance score determined by AI: ${analysisResults.compliance?.score || complianceCheck.score}%`
      };
      
      // Vector-based insights generation removed - AI now provides all insights
      // Merge pre-screened insights with AI-detected insights if any exist
      if (prescreenInsights.length > 0 && finalResults.insights) {
        // Create a set of existing insight titles to avoid duplicates
        const existingInsightTitles = new Set(finalResults.insights.map(insight => insight.title));
        
        // Add unique pre-screened insights to the results
        prescreenInsights.forEach(insight => {
          if (!existingInsightTitles.has(insight.title)) {
            finalResults.insights.push(insight);
          }
        });
        
        console.log(`Added ${prescreenInsights.length} pre-screened insights to the analysis`);
      }
      
      // Post-process analysis to ensure compliance issues are properly flagged
      // This is a safety measure in case the AI doesn't categorize issues correctly
      const seriousIssueKeywords = [
        'unilateral changes without consent', 'immediate amendment without notice', 
        'illegal clause', 'unfair term that cannot be enforced', 'clearly non-compliant', 
        'direct breach of law', 'explicitly violates',
        'prohibited fee under Tenant Fees Act', 'deposit not protected as required', 
        'unconscionable clause', 'unenforceable', 'void',
        'excessive financial burden', 'direct contradiction of statutory rights',
        'transfer landlord repair obligations', 'shifts statutory obligations',
        'violates section 11', 'tenant responsible for structural repairs'
      ];
      
      // Informational or general keywords that should NOT trigger warnings
      const informationalKeywords = [
        'overall compliance', 'general review', 'summary', 'overview',
        'fair dealing', 'meets requirements', 'largely compliant', 'standard terms'
      ];
      
      // Critical issues that should NEVER be downgraded regardless of other factors
      const criticalIssues = [
        'Deposit Protection Non-compliance', 
        'Excessive Termination Rights for Landlord',
        'Unfair Tenant Liability Clause',
        'Rent Withholding Restriction',
        'Illegal Fee',
        'Security Deposit Violation',
        'Unfair Eviction Clause',
        'Repair Responsibility Transfer'
      ];
      
      // Specific titles to never mark as warnings regardless of content
      const nonWarningTitles = [
        'Overall Compliance', 'Fair Dealing', 'Compliance Summary', 
        'Lease Overview', 'Agreement Summary'
      ];
      
      if (finalResults.insights && Array.isArray(finalResults.insights)) {
        finalResults.insights = finalResults.insights.map(insight => {
          // CRITICAL ISSUE CHECK: Never downgrade critical issues regardless of other factors
          if (insight.type === 'warning' && 
              criticalIssues.some(issue => insight.title && insight.title.includes(issue))) {
            console.log(`Post-processing: Critical issue "${insight.title}" retained as warning`);
            return insight; // Keep it as a warning - don't change it
          }

          // Special handling for repair clauses - only downgrade if high rating AND contains confirmations of compliance
          if (insight.title === 'Repair and Maintenance Responsibilities') {
            // If the repair clause mentions serious violations, ensure it stays a warning
            if (insight.content && (
                insight.content.toLowerCase().includes('shifts responsibility') ||
                insight.content.toLowerCase().includes('tenant responsible for structural') ||
                insight.content.toLowerCase().includes('violates section 11') ||
                insight.content.toLowerCase().includes('illegal transfer'))) {
              console.log(`Post-processing: Ensuring repair insight remains warning due to detected compliance issues`);
              return {
                ...insight,
                type: 'warning'
              };
            }
            
            // If it's a warning but has high rating (85+) AND mentions compliance with Section 11, only then downgrade it
            // We've increased the threshold from 75 to 85 for more strictness
            if (insight.type === 'warning' && 
                insight.rating && 
                insight.rating.value >= 85 &&
                insight.content && 
                (insight.content.toLowerCase().includes('section 11') || 
                 insight.content.toLowerCase().includes('landlord and tenant act'))) {
              console.log(`Post-processing: Downgrading repair insight from warning to accent due to high protection rating (${insight.rating.value}) and compliance indications`);
              return {
                ...insight,
                type: 'accent'
              };
            }
          } 
          
          // Automatically downgrade non-critical warnings for insights with very high ratings (85+)
          // We've increased the threshold from 75 to 85 for more strictness
          else if (insight.type === 'warning' && insight.rating && insight.rating.value >= 85) {
            console.log(`Post-processing: Downgrading insight "${insight.title}" from warning to accent due to high protection rating (${insight.rating.value})`);
            return {
              ...insight,
              type: 'accent'
            };
          }
          
          // Never upgrade summary/overview insights to warnings
          if (nonWarningTitles.some(title => 
              insight.title && insight.title.includes(title))) {
            // Force type to be 'primary' for overview insights
            if (insight.type === 'warning') {
              console.log(`Post-processing: Downgrading overview insight "${insight.title}" from warning to primary`);
              return {
                ...insight,
                type: 'primary'
              };
            }
            return insight;
          }
          
          // Skip upgrading if informational keywords are present in the title or content
          // But do NOT downgrade warnings for critical issues
          if (informationalKeywords.some(keyword => 
              (insight.title && insight.title.toLowerCase().includes(keyword.toLowerCase())) ||
              (insight.content && insight.content.toLowerCase().includes(keyword.toLowerCase()))
          )) {
            // If this is already a warning but contains positive/informational keywords,
            // make sure it's not a critical issue before downgrading
            if (insight.type === 'warning' && 
                !criticalIssues.some(issue => insight.title && insight.title.includes(issue))) {
              console.log(`Post-processing: Downgrading insight "${insight.title}" from warning to accent due to informational content`);
              return {
                ...insight,
                type: 'accent'
              };
            }
            return insight;
          }
          
          // Check if insight contains serious issue keywords but isn't marked as warning
          if (insight.type !== 'warning' && 
              seriousIssueKeywords.some(keyword => 
                (insight.content && insight.content.toLowerCase().includes(keyword.toLowerCase()))
              )) {
            // Only upgrade to warning if it contains truly serious issues
            console.log(`Post-processing: Upgrading insight "${insight.title}" to warning type due to serious issue`);
            return {
              ...insight,
              type: 'warning' // Upgrade to warning type
            };
          }
          return insight;
        });
      }
      
      // Get existing analysis or create new one
      const existingAnalysis = await storage.getAnalysisByDocumentId(id);
      let analysis;
      
      if (existingAnalysis) {
        // Record the ID of any existing mock analysis
        const existingAnalysisId = existingAnalysis.id;
        
        // Check if this analysis is already fully analyzed and paid for
        if (existingAnalysis.isPaid && existingAnalysis.results) {
          console.log(`Document ${id} already has a paid analysis (ID: ${existingAnalysisId}). Returning existing analysis.`);
          return res.json(existingAnalysis);
        }
        
        // Otherwise, update existing analysis with real results
        console.log(`Updating existing analysis (ID: ${existingAnalysisId}) with real paid results for document ${id}`);
        analysis = await storage.updateAnalysis(existingAnalysisId, {
          results: finalResults,
          isPaid: true
        });
      } else {
        // Create new analysis with real results
        console.log(`Creating new paid analysis for document ${id}`);
        analysis = await storage.createAnalysis({
          documentId: id,
          results: finalResults,
          isPaid: true
        });
      }

      // Update the document as fully analyzed
      await storage.updateDocument(id, { processed: true, fullyAnalyzed: true });
      
      // Send email report if customer email was provided
      // Send analysis report email to customer if email was provided
      if (userEmail) {
        try {
          console.log(`[EMAIL] Attempting to send analysis report email to ${userEmail}`);
          
          // Validate email format again just to be safe
          if (typeof userEmail !== 'string' || !userEmail.includes('@')) {
            console.error(`[EMAIL ERROR] Invalid email format, cannot send analysis report: "${userEmail}"`);
          } 
          // Ensure document and analysis are not undefined before sending email
          else if (!document) {
            console.error('[EMAIL ERROR] Cannot send email: Document is undefined or invalid');
            console.error('[EMAIL DEBUG] Document:', document);
          }
          else if (!analysis) {
            console.error('[EMAIL ERROR] Cannot send email: Analysis is undefined or invalid');
            console.error('[EMAIL DEBUG] Analysis ID: undefined');
          } 
          else if (!analysis.results) {
            console.error('[EMAIL ERROR] Cannot send email: Analysis results are empty or invalid');
            console.error('[EMAIL DEBUG] Analysis:', {
              id: analysis.id, 
              documentId: analysis.documentId,
              hasResults: false,
              createdAt: analysis.created_at
            });
          }
          else {
            // Double-check SendGrid configuration
            if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
              console.warn('[EMAIL WARNING] SendGrid may not be properly configured:');
              console.warn(`[EMAIL CONFIG] API Key: ${process.env.SENDGRID_API_KEY ? 'Present' : 'Missing'}`);
              console.warn(`[EMAIL CONFIG] From Email: ${process.env.SENDGRID_FROM_EMAIL || 'Missing'}`);
            } else {
              console.log(`[EMAIL CONFIG] SendGrid is properly configured with API key and sender email`);
            }
            
            // Send the email with detailed logging
            console.log(`[EMAIL] Calling emailService.sendAnalysisReportEmail with valid parameters`);
            
            const emailResult = await emailService.sendAnalysisReportEmail(
              userEmail,
              document,
              analysis
            );
            
            if (emailResult) {
              console.log(`[EMAIL SUCCESS] Analysis report email sent to ${userEmail}`);
              console.log(`[EMAIL DETAILS] SendGrid Message ID: ${emailResult[0]?.messageId || 'N/A'}`);
            } else {
              console.error(`[EMAIL ERROR] Failed to send email to ${userEmail}, emailService returned null`);
            }
          }
        } catch (emailError: any) {
          // Don't fail the request if email sending fails
          console.error('[EMAIL ERROR] Exception while sending analysis report email:');
          console.error(emailError?.message || emailError);
          console.error(emailError instanceof Error ? emailError.stack : 'No stack trace available');
          
          // Check for specific SendGrid errors
          if (emailError?.response?.body) {
            console.error('[SENDGRID ERROR DETAILS]', JSON.stringify(emailError.response.body));
          }
        }
      } else {
        console.log('[EMAIL NOTICE] No customer email provided, skipping analysis report email');
      }

      return res.json(analysis);
    } catch (error: any) {
      console.error('Analysis error:', error);
      return res.status(500).json({ message: error.message || 'Error analyzing document' });
    }
  });

  // Get analysis for a document
  app.get('/api/documents/:id/analysis', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const analysis = await storage.getAnalysisByDocumentId(id);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }

      return res.json(analysis);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error retrieving analysis' });
    }
  });

  // Create payment intent for report purchase
  // Payment API with enhanced security
  app.post('/api/create-payment-intent', 
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter,
    speedLimiter,
    async (req, res) => {
    try {
      const { documentId, serviceType, customerEmail } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }
      
      // Email validation
      if (!customerEmail) {
        return res.status(400).json({ message: 'Customer email is required for payment' });
      }
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }
      
      // Determine the amount based on the service type
      let amount = REPORT_PRICE; // Default to analysis service
      const finalServiceType = serviceType || 'analysis'; // Default to analysis if not specified
      
      // Handle different service types
      if (finalServiceType === 'combined') {
        // Analysis + Rewrite combined package
        amount = COMBINED_PRICE;
      } else if (finalServiceType === 'rewrite') {
        // Just the tenancy agreement rewrite service (separate payment)
        amount = REWRITE_PRICE;
      }
      
      // Create payment intent with customer email in metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'gbp',
        metadata: {
          documentId: documentId.toString(),
          serviceType: finalServiceType,
          customerEmail: customerEmail
        },
        receipt_email: customerEmail, // Stripe will send a receipt email
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      // Pre-create payment record in database with customer email
      await storage.recordPayment({
        paymentIntentId: paymentIntent.id,
        documentId: documentId,
        amount: amount,
        serviceType: finalServiceType,
        customerEmail: customerEmail,
        status: 'pending'
      });
      
      console.log(`Created payment intent: ${paymentIntent.id} for document: ${documentId}, service: ${finalServiceType}, email: ${customerEmail}`);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      return res.status(500).json({ message: error.message || 'Error creating payment intent' });
    }
  });
  
  // Direct checkout endpoint for streamlined payment flow from the analysis options screen
  app.get('/api/checkout', 
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter,
    speedLimiter,
    async (req, res) => {
    try {
      const { documentId, serviceType, returnUrl } = req.query;
      
      if (!documentId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }
      
      if (!returnUrl) {
        return res.status(400).json({ message: 'Return URL is required' });
      }
      
      // Determine the amount based on the service type
      let amount = REPORT_PRICE; // Default to analysis service
      const finalServiceType = serviceType || 'analysis'; // Default to analysis if not specified
      
      if (finalServiceType === 'combined') {
        amount = COMBINED_PRICE;
      }
      
      // Check if we have a valid document
      const document = await storage.getDocument(parseInt(documentId as string));
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Create a session with the appropriate params for the Stripe Checkout API
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: finalServiceType === 'combined' 
                  ? 'Premium Analysis + Lease Rewrite' 
                  : 'Premium Lease Analysis',
                description: finalServiceType === 'combined'
                  ? 'Full legal analysis of your lease plus tenant-friendly rewrite'
                  : 'Complete legal analysis with full compliance assessment',
              },
              unit_amount: amount, // Already in pence
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${returnUrl}?payment_intent={CHECKOUT_SESSION_ID}&redirect_status=succeeded&service_type=${finalServiceType}`,
        cancel_url: `${returnUrl}`,
        metadata: {
          documentId: documentId as string,
          serviceType: finalServiceType as string
        }
      });
      
      // Redirect to Stripe Checkout
      res.redirect(303, session.url as string);
    } catch (error: any) {
      console.error('Checkout session creation error:', error);
      return res.status(500).json({ message: error.message || 'Error creating checkout session' });
    }
  });

  // Webhook for handling successful payments with enhanced security
  app.post('/api/stripe-webhook', 
    // Special security measures for the Stripe webhook
    // We don't rate limit the Stripe webhook to avoid missing payment events
    express.raw({type: 'application/json'}), // Raw body needed for signature verification
    detectClientIp,
    async (req, res) => {
    // Get the signature from the headers
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      console.error('Webhook error: No Stripe signature found in headers');
      return res.status(400).json({ message: 'No Stripe signature found' });
    }
    
    let event;
    
    try {
      // Get webhook secret from environment
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!endpointSecret) {
        console.warn('STRIPE_WEBHOOK_SECRET not set in environment. Webhook signature verification skipped.');
        console.warn('For production, set STRIPE_WEBHOOK_SECRET to verify webhook authenticity.');
        
        // In development, still allow processing without signature verification
        if (process.env.NODE_ENV !== 'production') {
          event = req.body;
        } else {
          // In production, require webhook signature
          throw new Error('Webhook secret not configured');
        }
      } else {
        // Verify the webhook signature with raw body
        const payload = req.body;
        // If payload is empty or not a string/buffer, stripe verification will fail
        if (!payload) {
          throw new Error('Empty payload received');
        }
        
        // Verify the event using Stripe's library
        event = stripe.webhooks.constructEvent(
          payload instanceof Buffer ? payload : Buffer.from(JSON.stringify(payload)),
          sig,
          endpointSecret
        );
        
        console.log('Webhook signature verified successfully');
      }
      
      // Process the verified event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const documentId = paymentIntent.metadata.documentId;
        const customerEmail = paymentIntent.metadata.customerEmail;
        
        console.log(`Payment succeeded for document ${documentId} from ${customerEmail}`);
        
        // Update document as paid
        if (documentId) {
          await storage.updateDocumentStatus(
            parseInt(documentId), 
            { paid: true, paymentIntentId: paymentIntent.id }
          );
        }
        
        // Update any related payment records
        await storage.updatePaymentStatus(paymentIntent.id, 'completed');
      }
      
      // Return a 200 success response to acknowledge receipt
      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      return res.status(400).json({ message: error.message || 'Webhook error' });
    }
  });


  // Helper function to convert markdown text to DOCX format
  async function convertToDocx(markdownText: string, documentName: string): Promise<Buffer> {
    try {
      console.log(`Converting markdown to DOCX format for ${documentName}`);
      
      // Create paragraph collection
      const children: Paragraph[] = [];
      
      // Process the markdown to handle headers, paragraphs, etc.
      const paragraphs = markdownText.split('\n\n');
      
      // Add a title
      children.push(
        new Paragraph({
          text: "UK RESIDENTIAL TENANCY AGREEMENT",
          heading: HeadingLevel.TITLE,
          alignment: "center",
          spacing: { after: 400 }
        })
      );
      
      // Add RentRight AI branding
      children.push(
        new Paragraph({
          text: "Generated by RentRight AI - Tenant-Friendly Legal Document",
          alignment: "center",
          spacing: { after: 800 },
          style: "subtitle"
        })
      );
      
      // Process each paragraph
      paragraphs.forEach(para => {
        if (!para.trim()) return; // Skip empty paragraphs
        
        if (para.startsWith('# ')) {
          // Main heading (H1)
          children.push(
            new Paragraph({
              text: para.substring(2).trim(),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            })
          );
        } else if (para.startsWith('## ')) {
          // Subheading (H2)
          children.push(
            new Paragraph({
              text: para.substring(3).trim(),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 }
            })
          );
        } else if (para.startsWith('### ')) {
          // Sub-subheading (H3)
          children.push(
            new Paragraph({
              text: para.substring(4).trim(),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 }
            })
          );
        } else if (para.startsWith('- ')) {
          // Bullet point
          children.push(
            new Paragraph({
              text: para.substring(2).trim(),
              bullet: { level: 0 },
              spacing: { before: 100, after: 100 }
            })
          );
        } else {
          // Regular paragraph
          children.push(
            new Paragraph({
              text: para.trim(),
              spacing: { before: 100, after: 100 }
            })
          );
        }
      });
      
      // Add legal disclaimer at the end
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "LEGAL DISCLAIMER",
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 400, after: 100 }
        })
      );
      
      children.push(
        new Paragraph({
          text: "This document is generated by RentRight AI and is intended to provide a tenant-friendly lease agreement. While every effort has been made to ensure compliance with UK housing laws, this document should be reviewed by a legal professional before signing. RentRight AI is not a law firm and does not provide legal advice.",
          spacing: { before: 100, after: 400 }
        })
      );
      
      // Create DOCX document with all our content
      const document = new DocxDocument({
        sections: [{
          properties: {},
          children: children
        }]
      });
      
      // Generate DOCX buffer
      return await Packer.toBuffer(document);
    } catch (error) {
      console.error("Error converting to DOCX:", error);
      throw new Error("Failed to generate DOCX document");
    }
  }

  // Generate tenancy agreement rewrite (with payment verification and enhanced security)
  app.post('/api/documents/:id/generate-rewrite', 
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter,
    speedLimiter,
    async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Extract payment intent ID, service type, format, and email from request body
      const { paymentIntentId, serviceType, format = 'docx', email } = req.body || {};
      let isRewritePaid = false;
      
      console.log(`Tenancy agreement rewrite request - Document ID: ${id}, Payment ID: ${paymentIntentId}, Service Type: ${serviceType}, Format: ${format}`);

      // Special case: if paymentIntentId is "already_paid", we'll trust the client
      // This is used when the user has already paid for the combined service
      if (paymentIntentId === "already_paid") {
        console.log(`Client indicates payment already completed for document ${id}. Checking if combined service was purchased.`);
        
        // Check if there's a payment record for this document with service type "combined"
        const documentPayments = await storage.getPaymentsByDocumentId(id);
        const combinedPayment = documentPayments.find(payment => 
          payment.serviceType === 'combined' && payment.status === 'succeeded'
        );
        
        if (combinedPayment) {
          console.log(`Found existing combined payment for document ${id}. Bypassing payment verification.`);
          isRewritePaid = true;
        } else {
          // This verification path is removed - we now require explicit combined service purchase
          // Just having a paid analysis is not enough to generate a lease rewrite
          console.log(`Client indicated "already_paid" but no combined package found for document ${id}. Payment required.`);
          // We don't set isRewritePaid to true here, so the verification will fail below
        }
      }
      // Regular case - verify with Stripe
      else if (paymentIntentId) {
        try {
          // Verify payment status with Stripe
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          console.log(`Payment verification - Intent ID: ${paymentIntentId}, Status: ${paymentIntent.status}, Stripe Metadata: ${JSON.stringify(paymentIntent.metadata)}`);
          
          // Check for any stored service type in the database first
          let storedServiceType = null;
          try {
            // Try to get any previously recorded payment with this ID 
            const storedPayment = await storage.getPaymentByIntentId(paymentIntentId);
            if (storedPayment) {
              storedServiceType = storedPayment.serviceType;
              console.log(`Found stored payment record with service type: ${storedServiceType}`);
            }
          } catch (dbError) {
            console.log('No payment record found in database, continuing with verification');
          }
          
          // Multiple ways to verify the service type:
          // 1. Check database record of payment
          // 2. Check Stripe metadata
          // 3. Trust the client's service type parameter (last resort)
          const paidForServiceType = 
            paymentIntent.status === 'succeeded' && 
            (
              // Check if they paid for combined service
              storedServiceType === 'combined' || 
              paymentIntent.metadata?.serviceType === 'combined' || 
              serviceType === 'combined' ||
              // OR check if they paid for standalone rewrite service
              storedServiceType === 'rewrite' || 
              paymentIntent.metadata?.serviceType === 'rewrite' || 
              serviceType === 'rewrite'
            );
            
          if (paidForServiceType) {
            isRewritePaid = true;
            // Determine which service type was actually paid for
            const actualServiceType = 
              storedServiceType || 
              paymentIntent.metadata?.serviceType || 
              serviceType || 
              'rewrite';
              
            console.log(`✅ Rewrite payment confirmed for document ${id} with payment intent ${paymentIntentId}, service type: ${actualServiceType}`);
            
            // If we don't have a record of this payment yet, save it
            if (!storedServiceType) {
              try {
                await storage.recordPayment({
                  paymentIntentId,
                  serviceType: actualServiceType,
                  documentId: id,
                  status: 'succeeded',
                  amount: paymentIntent.amount / 100, // Convert from cents
                  createTimestamp: new Date()
                });
                console.log(`Payment record created in database for service: ${actualServiceType}`);
              } catch (saveError) {
                console.error('Error saving payment record:', saveError);
              }
            }
          } else {
            console.log(`❌ Rewrite payment rejected - Payment status: ${paymentIntent.status}, Service type from DB: ${storedServiceType}, metadata: ${paymentIntent.metadata?.serviceType}, client: ${serviceType}`);
          }
        } catch (stripeError) {
          console.error('Stripe payment verification error:', stripeError);
        }
      } else {
        console.log('No payment intent ID provided for document', id);
      }

      // Require payment for generating lease rewrite
      if (!isRewritePaid) {
        return res.status(402).json({ message: 'Payment required to generate tenancy agreement rewrite. You can purchase either the Tenancy Rewrite service or the Analysis + Tenancy Rewrite package.' });
      }

      // If we get here, payment is verified. Use OpenAI to generate the rewrite
      console.log(`Payment verified, generating tenancy agreement rewrite for document ${id}`);
      
      // Get document content
      let documentContent = "";
      if (document.content) {
        // If content is already cached in the document record
        documentContent = document.content;
      } else {
        // Otherwise, need to read from encrypted storage
        try {
          // Read encrypted document
          const documentPath = path.join(encryptedUploadsDir, document.filename);
          const decryptedBuffer = readEncryptedFile(documentPath);
          
          // Extract text content
          documentContent = await processDocument(decryptedBuffer, document.fileType);
        } catch (error) {
          console.error(`Error reading document content: ${error}`);
          return res.status(500).json({ message: 'Error reading document content' });
        }
      }
      
      // Get the analysis results to incorporate recommendations
      const analysis = await storage.getAnalysisByDocumentId(id);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found - cannot generate targeted rewrite' });
      }

      // Parse the analysis results to get recommendations
      let analysisResults;
      try {
        analysisResults = typeof analysis.results === 'string' 
          ? JSON.parse(analysis.results) 
          : analysis.results;
      } catch (error) {
        console.error('Error parsing analysis results:', error);
        return res.status(500).json({ message: 'Invalid analysis data' });
      }

      // Generate the rewritten lease with analysis-based recommendations
      const rewriteContent = await generateTenancyAgreementRewrite(documentContent, analysisResults);
      
      // Create a clean filename derived from the document name
      const cleanFilename = `document_${id}`;
        
      const safeFilename = cleanFilename
        .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
        .substring(0, 50); // Limit length
      
      // Based on the requested format, generate either a PDF or DOCX file
      if (format.toLowerCase() === 'pdf') {
        // Create a PDF from the rewrite content
        const pdfDoc = await PDFDocument.create();
        
        // Add a new page
        const page = pdfDoc.addPage();
        
        // Add the title
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const { width, height } = page.getSize();
        const margin = 50;
        let currentY = height - margin;
        
        // Add title
        page.drawText("UK RESIDENTIAL TENANCY AGREEMENT", {
          x: margin,
          y: currentY,
          font: boldFont,
          size: 18,
        });
        currentY -= 30;
        
        // Add RentRight AI branding
        page.drawText("Generated by RentRight AI - Tenant-Friendly Legal Document", {
          x: margin,
          y: currentY,
          font: font,
          size: 12,
        });
        currentY -= 40;
        
        // Split rewriteContent into paragraphs
        const paragraphs = rewriteContent.split('\n\n');
        
        // Process each paragraph
        for (const paragraph of paragraphs) {
          if (!paragraph.trim()) continue;
          
          let paragraphFont = font;
          let fontSize = 11;
          let xOffset = margin;
          let text = paragraph;
          
          // Handle headings
          if (paragraph.startsWith('# ')) {
            text = paragraph.substring(2).trim();
            paragraphFont = boldFont;
            fontSize = 14;
            currentY -= 10; // Add extra space before heading
          } else if (paragraph.startsWith('## ')) {
            text = paragraph.substring(3).trim();
            paragraphFont = boldFont;
            fontSize = 12;
            xOffset = margin + 10;
          } else if (paragraph.startsWith('### ')) {
            text = paragraph.substring(4).trim();
            paragraphFont = boldFont;
            fontSize = 11;
            xOffset = margin + 20;
          }
          
          // Split text into lines to fit page width
          const maxWidth = width - 2 * margin;
          
          // Split text into lines
          const textWidth = (txt: string) => paragraphFont.widthOfTextAtSize(txt, fontSize);
          
          let lines: string[] = [];
          let words = text.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (textWidth(testLine) < maxWidth) {
              currentLine = testLine;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          
          // Check if we need a new page
          const lineHeight = fontSize * 1.2;
          const paragraphHeight = lines.length * lineHeight;
          
          if (currentY - paragraphHeight < margin) {
            // Add a new page
            const newPage = pdfDoc.addPage();
            currentY = height - margin;
          }
          
          // Draw each line
          for (let i = 0; i < lines.length; i++) {
            page.drawText(lines[i], {
              x: xOffset,
              y: currentY - i * lineHeight,
              font: paragraphFont,
              size: fontSize,
            });
          }
          
          currentY -= paragraphHeight + 10; // Move down for next paragraph with spacing
        }
        
        // Serialize the PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);
        
        // Send as a PDF file for download
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=UK_Tenancy_Agreement_${safeFilename}.pdf`,
          'Content-Length': pdfBuffer.length.toString()
        });
        
        return res.send(pdfBuffer);
      } else {
        // Default format: DOCX
        // Convert to proper DOCX format
        const docxBuffer = await convertToDocx(rewriteContent, safeFilename);
        
        // If email is provided, send the document via email
        if (email && email.includes('@')) {
          try {
            console.log(`Sending rewritten lease to email: ${email}`);
            
            // Send email with the rewritten lease attachment
            await emailService.sendEmail({
              to: email,
              subject: 'Your Tenant-Friendly Lease Agreement - RentRight AI',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #EC7134; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">RentRight AI</h1>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">Your Tenant-Friendly Lease Agreement</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #EC7134; margin-top: 0;">Your rewritten lease is ready!</h2>
                    
                    <p>Thank you for using RentRight AI. We've successfully generated a tenant-friendly version of your lease agreement that:</p>
                    
                    <ul style="color: #666; line-height: 1.6;">
                      <li>✓ Balances tenant and landlord rights fairly</li>
                      <li>✓ Uses clear, understandable language</li>
                      <li>✓ Complies with current UK housing laws</li>
                      <li>✓ Includes tenant-protective clauses</li>
                      <li>✓ Removes potentially unfair terms</li>
                    </ul>
                    
                    <p style="color: #666;">The rewritten lease agreement is attached to this email as a Word document.</p>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
                      <p style="margin: 0; color: #856404;"><strong>Important:</strong> While this document has been carefully crafted to be tenant-friendly and legally compliant, we recommend having it reviewed by a qualified legal professional before signing.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://rentrightai.co.uk" style="background-color: #EC7134; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit RentRight AI</a>
                    </div>
                  </div>
                  
                  <div style="background-color: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">© 2024 RentRight AI. This service is provided for informational purposes only and does not constitute legal advice.</p>
                  </div>
                </div>
              `,
              attachments: [{
                filename: `UK_Tenancy_Agreement_${safeFilename}.docx`,
                content: docxBuffer,
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              }]
            });
            
            console.log(`Rewritten lease successfully sent to ${email}`);
          } catch (emailError) {
            console.error('Error sending rewritten lease email:', emailError);
            // Don't fail the request if email fails - still provide download
          }
        }
        
        // Send as a DOCX file for download
        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename=UK_Tenancy_Agreement_${safeFilename}.docx`,
          'Content-Length': docxBuffer.length.toString()
        });
        
        return res.send(docxBuffer);
      }
    } catch (error: any) {
      console.error('Tenancy agreement rewrite generation error:', error);
      return res.status(500).json({ message: error.message || 'Error generating tenancy agreement rewrite' });
    }
  });

  // Generate PDF report (with payment verification and enhanced security)
  app.post('/api/documents/:id/generate-report', 
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter,
    speedLimiter,
    async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const analysis = await storage.getAnalysisByDocumentId(id);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }

      // Extract payment intent ID from request body if provided
      const { paymentIntentId } = req.body || {};

      // If analysis is not paid and payment intent ID is provided, check with Stripe 
      // and update the payment status
      if (!analysis.isPaid && paymentIntentId) {
        try {
          // Verify payment status with Stripe
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (paymentIntent.status === 'succeeded') {
            // Update analysis to mark as paid
            await storage.updateAnalysis(analysis.id, { isPaid: true });
            analysis.isPaid = true;
            console.log(`Payment confirmed for analysis ${analysis.id} with payment intent ${paymentIntentId}`);
          }
        } catch (stripeError) {
          console.error('Stripe payment verification error:', stripeError);
          // Continue with the process, as we'll check isPaid below
        }
      }

      // Verify payment before generating the full report
      if (!analysis.isPaid) {
        return res.status(402).json({ message: 'Payment required to generate report' });
      }

      // Generate PDF report using our simplified generator
      // This implementation is more robust and has better error handling
      const pdfBuffer = await generateSimplePdfReport(document, analysis);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=UK_Tenancy_Analysis_${id}.pdf`,
        'Content-Length': pdfBuffer.length,
      });
      
      return res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Report generation error:', error);
      return res.status(500).json({ message: error.message || 'Error generating report' });
    }
  });
  
  // Send analysis report via email
  app.post('/api/documents/:id/email-report',
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter,
    speedLimiter,
    async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { email } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email address is required' });
      }
      
      // Get document information
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Get analysis results
      const analysis = await storage.getAnalysisByDocumentId(id);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found for this document' });
      }
      
      // Verify payment before sending the email report
      if (!analysis.isPaid) {
        return res.status(402).json({ message: 'Payment required to generate report' });
      }
      
      // Generate secure token for PDF download
      console.log(`Generating secure document token for document ${id}, email ${email}`);
      const token = await generateSignedUrl({
        documentId: id,
        expiresIn: '7d', // Give longer access (7 days) for email reports
        ipAddress: req.clientIp,
      });
      
      console.log(`Generated token: ${token}`);
      
      // Create the download URL for the PDF
      const baseUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG || 'rentrightai'}.replit.app`;
      const downloadUrl = `${baseUrl}/documents/download/${token}`;
      
      // Create the HTML view URL
      const reportUrl = `${baseUrl}/analysis/${id}/report`;
      
      console.log(`Download URL: ${downloadUrl}`);
      console.log(`HTML Report URL: ${reportUrl}`);
      
      // Get insights from analysis results
      let analysisResults: any = null;
      if (typeof analysis.results === 'string') {
        analysisResults = JSON.parse(analysis.results);
      } else {
        analysisResults = analysis.results;
      }
      
      // Extract insights by type for the email
      const warningInsights = analysisResults?.insights?.filter((insight: any) => insight.type === 'warning') || [];
      const accentInsights = analysisResults?.insights?.filter((insight: any) => insight.type === 'accent') || [];
      const standardInsights = analysisResults?.insights?.filter((insight: any) => 
        insight.type !== 'warning' && insight.type !== 'accent') || [];
      
      // Use the AI-generated compliance score directly from the analysis results
      // The AI should dictate the scoring system, not our calculation
      const complianceScore = analysisResults?.complianceScore || 
                          analysisResults?.compliance?.score || 
                          analysisResults?.score || 
                          100; // Default to 100 only if no score is provided
      
      // Determine assessment label
      let scoreLabel = 'Unknown';
      let scoreColorHex = '#888888';
      
      if (complianceScore >= 80) {
        scoreLabel = 'Good - Generally Fair Agreement';
        scoreColorHex = '#34D399'; // Green
      } else if (complianceScore >= 50) {
        scoreLabel = 'Moderate - Some Concerns';
        scoreColorHex = '#F2B705'; // Yellow/Amber
      } else {
        scoreLabel = 'Poor - Multiple Serious Issues';
        scoreColorHex = '#EF4444'; // Red
      }
            
      // Generate HTML email content with full report details
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <title>RentRight AI - Your Tenancy Agreement Analysis Results</title>
          <style>
            /* Base styles */
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto;
              background-color: #FFFAF5;
            }
            .main-container {
              background-color: #FFFFFF;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              overflow: hidden;
              margin: 20px;
            }
            .header { 
              background-color: #EC7134; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              margin-bottom: 0;
            }
            .header h1 { margin: 0; }
            .content-area {
              padding: 30px;
            }
            .section { 
              margin-bottom: 30px; 
              border: 1px solid #eee; 
              padding: 20px; 
              border-radius: 5px;
              background-color: #FFFFFF;
            }
            .section h2 { 
              margin-top: 0; 
              color: #EC7134; 
              border-bottom: 1px solid #eee; 
              padding-bottom: 10px;
            }
            .score-bar {
              height: 30px;
              background-color: #eee;
              border-radius: 15px;
              margin: 15px 0;
              overflow: hidden;
              position: relative;
            }
            .score-bar-fill {
              height: 100%;
              width: ${complianceScore}%;
              background-color: ${scoreColorHex};
              position: absolute;
              left: 0;
              top: 0;
            }
            .score-value {
              position: relative;
              z-index: 1;
              text-align: center;
              padding-top: 5px;
              font-weight: bold;
              color: #fff;
              text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
            }
            .assessment {
              font-size: 18px;
              font-weight: bold;
              color: ${scoreColorHex};
              margin: 10px 0;
              text-align: center;
            }
            .insight {
              margin-bottom: 20px;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #ddd;
              background-color: #f9f9f9;
            }
            .insight.warning { 
              border-left-color: #EF4444; 
              background-color: rgba(239, 68, 68, 0.05);
            }
            .insight.accent { 
              border-left-color: #F2B705; 
              background-color: rgba(242, 183, 5, 0.05);
            }
            .insight.standard { 
              border-left-color: #3B82F6; 
              background-color: rgba(59, 130, 246, 0.05);
            }
            .insight h3 { 
              margin: 0 0 10px 0; 
              color: #333;
            }
            .recommendation {
              margin-bottom: 15px; 
              padding: 15px; 
              border-radius: 5px; 
              background-color: rgba(34, 197, 94, 0.1);
              border: 1px solid rgba(34, 197, 94, 0.2);
            }
            .recommendation h3 {
              margin-top: 0; 
              color: #166534; 
              display: flex; 
              align-items: center;
            }
            .check-icon {
              display: inline-flex; 
              width: 20px; 
              height: 20px; 
              background-color: #22C55E; 
              color: white; 
              border-radius: 50%; 
              justify-content: center; 
              align-items: center; 
              margin-right: 8px; 
              font-size: 12px;
            }
            .footer {
              font-size: 12px;
              color: #777;
              border-top: 1px solid #eee;
              padding: 20px;
              text-align: center;
              background-color: #f9f9f9;
            }
            .button {
              display: inline-block;
              background-color: #EC7134;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              margin: 10px 5px;
              font-weight: bold;
              text-align: center;
            }
            .button-secondary {
              background-color: #3B82F6;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .view-online {
              text-align: center;
              padding: 10px;
              background-color: #f8f8f8;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .summary-data {
              display: flex;
              justify-content: space-around;
              flex-wrap: wrap;
              margin-bottom: 20px;
            }
            .summary-item {
              padding: 15px;
              min-width: 140px;
              text-align: center;
              margin-bottom: 10px;
            }
            .summary-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            @media only screen and (max-width: 600px) {
              .main-container {
                margin: 10px;
              }
              .content-area {
                padding: 15px;
              }
              .section {
                padding: 15px;
              }
              .summary-item {
                min-width: 100px;
              }
            }
          </style>
        </head>
        <body>
          <div class="main-container">
            <div class="header">
              <!-- Logo and branding -->
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
                <div style="font-size: 28px; font-weight: bold; color: white; display: flex; align-items: center; justify-content: center;">
                  <span>Rent<span style="color: #FFFAF5;">Right</span></span>
                  <span style="background-color: #FFFAF5; color: #EC7134; font-size: 13px; border-radius: 9999px; padding: 2px 6px; margin-left: 5px; font-weight: bold;">AI</span>
                </div>
              </div>
              <p>Your Tenancy Agreement Analysis Results</p>
            </div>
            
            <div class="content-area">
              <div class="view-online">
                <p>Having trouble viewing this email? <a href="${reportUrl}" style="color: #3B82F6;">View this report online</a></p>
              </div>
              
              <p>Hello,</p>
              <p>Thank you for using RentRight AI to analyze your tenancy agreement "${document.filename}".</p>
              
              <div class="section">
                <h2>Analysis Summary</h2>
                
                <div class="summary-data">
                  <div class="summary-item">
                    <div class="summary-label">Compliance Score</div>
                    <div class="summary-value" style="color: ${scoreColorHex};">${complianceScore}%</div>
                  </div>
                  
                  <div class="summary-item">
                    <div class="summary-label">Compliance Level</div>
                    <div class="summary-value" style="color: ${scoreColorHex};">${scoreLabel.split(' - ')[0]}</div>
                  </div>
                  
                  <div class="summary-item">
                    <div class="summary-label">Issues Identified</div>
                    <div class="summary-value">${warningInsights.length + accentInsights.length}</div>
                  </div>
                </div>
                
                <div class="score-bar">
                  <div class="score-bar-fill"></div>
                  <div class="score-value">${complianceScore}%</div>
                </div>
                <div class="assessment">${scoreLabel}</div>
              </div>
              
              ${warningInsights.length > 0 ? `
              <div class="section">
                <h2 style="color: #EF4444;">Key Issues Identified</h2>
                ${warningInsights.map((insight: any) => `
                  <div class="insight warning">
                    <h3>${insight.title}</h3>
                    <p>${insight.content}</p>
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              ${accentInsights.length > 0 ? `
              <div class="section">
                <h2 style="color: #F2B705;">Areas of Concern</h2>
                ${accentInsights.map((insight: any) => `
                  <div class="insight accent">
                    <h3>${insight.title}</h3>
                    <p>${insight.content}</p>
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              ${standardInsights.length > 0 ? `
              <div class="section">
                <h2 style="color: #3B82F6;">Additional Information</h2>
                ${standardInsights.map((insight: any) => `
                  <div class="insight standard">
                    <h3>${insight.title}</h3>
                    <p>${insight.content}</p>
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              ${analysisResults?.recommendations && analysisResults.recommendations.length > 0 ? `
              <div class="section">
                <h2 style="color: #22C55E;">Tenant Recommendations</h2>
                ${analysisResults.recommendations.map((recommendation: any, index: number) => `
                  <div class="recommendation">
                    <h3>
                      <span class="check-icon">✓</span>
                      Recommendation ${index + 1}
                    </h3>
                    <p style="margin-bottom: 0;">${recommendation.content}</p>
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              <div class="button-container">
                <p>You can access this report in different formats:</p>
                <a href="${reportUrl}" class="button">View HTML Report</a>
                <a href="${downloadUrl}" class="button button-secondary">Download PDF Report</a>
              </div>
              
              <p>If you have any questions about your analysis, please contact our support team.</p>
              <p>Thank you,<br>The RentRight AI Team</p>
            </div>
            
            <div class="footer">
              <p><strong>DISCLAIMER:</strong> This analysis is generated using artificial intelligence and is provided for informational purposes only. It does not constitute legal advice. The analysis may not be comprehensive or fully accurate in all circumstances. You should consult with a qualified legal professional before making any decisions based on this report.</p>
              <p>© ${new Date().getFullYear()} RentRight AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Send the email
      await emailService.sendEmail({
        to: email,
        subject: `Your Tenancy Agreement Analysis Report: ${document.filename}`,
        html: htmlContent,
      });
      
      console.log(`Email report sent successfully to ${email} with HTML report: ${reportUrl} and PDF download: ${downloadUrl}`);
      
      return res.status(200).json({ 
        message: 'Analysis report email sent successfully',
        downloadToken: token,
        reportUrl: reportUrl
      });
    } catch (error: any) {
      console.error('Email report error:', error);
      return res.status(500).json({ message: error.message || 'Error sending email report' });
    }
  });

  // Response Templates API Routes
  
  // Get all response templates (public endpoint for browsing - preview only)
  app.get('/api/response-templates', async (req: Request, res: Response) => {
    try {
      const templates = await storage.getResponseTemplates();
      // Return templates but without the full template content for security
      const publicTemplates = templates.map(template => ({
        ...template,
        templateContent: template.templateContent.substring(0, 200) + '...' // Preview only
      }));
      res.json(publicTemplates);
    } catch (error) {
      console.error('Error fetching response templates:', error);
      res.status(500).json({ message: 'Failed to fetch response templates' });
    }
  });

  // Get response templates by category
  app.get('/api/response-templates/category/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const templates = await storage.getResponseTemplatesByCategory(category);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching response templates by category:', error);
      res.status(500).json({ message: 'Failed to fetch response templates' });
    }
  });

  // Generate personalized template for document
  app.post('/api/documents/:id/generate-template', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const { templateId, landlordName, propertyAddress, tenantName, specificFindings } = req.body;

      // Validate document exists
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Security Check: Verify user has paid for analysis to access templates
      const payments = await storage.getPaymentsByDocumentId(documentId);
      const hasPaidAnalysis = payments.some((payment: any) => 
        payment.status === 'completed' && 
        (payment.serviceType === 'analysis' || payment.serviceType === 'combined')
      );
      
      if (!hasPaidAnalysis) {
        return res.status(403).json({ 
          message: 'Templates are only available after purchasing a complete analysis',
          requiresPayment: true 
        });
      }

      // Rate limiting check: Limit template generation per document
      const existingTemplates = await storage.getGeneratedTemplatesForDocument(documentId);
      if (existingTemplates.length >= 10) { // Max 10 templates per document
        return res.status(429).json({ 
          message: 'Template generation limit reached for this document. Contact support if you need additional templates.',
          rateLimited: true 
        });
      }

      // Get the template
      const templates = await storage.getResponseTemplates();
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Get analysis to extract relevant findings
      const analysis = await storage.getAnalysisByDocumentId(documentId);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }

      // Parse analysis results
      let analysisResults;
      try {
        analysisResults = typeof analysis.results === 'string' 
          ? JSON.parse(analysis.results) 
          : analysis.results;
      } catch (error) {
        return res.status(500).json({ message: 'Invalid analysis data' });
      }

      // Personalize the template content
      let personalizedContent = template.templateContent;
      
      // Basic placeholder replacements
      personalizedContent = personalizedContent
        .replace(/\[LANDLORD_NAME\]/g, landlordName || '[LANDLORD NAME]')
        .replace(/\[PROPERTY_ADDRESS\]/g, propertyAddress || '[PROPERTY ADDRESS]')
        .replace(/\[TENANT_NAME\]/g, tenantName || '[TENANT NAME]')
        .replace(/\[DATE\]/g, new Date().toLocaleDateString('en-GB'));

      // Advanced replacements based on analysis findings
      if (template.category === 'illegal_fees' && analysisResults.insights) {
        const feeInsights = analysisResults.insights.filter((insight: any) => 
          insight.text && (
            insight.text.toLowerCase().includes('fee') || 
            insight.text.toLowerCase().includes('admin') ||
            insight.text.toLowerCase().includes('charge')
          )
        );
        
        if (feeInsights.length > 0) {
          const feeText = feeInsights[0].text || feeInsights[0].content || '';
          const feeMatch = feeText.match(/£(\d+(?:\.\d{2})?)/);
          if (feeMatch) {
            personalizedContent = personalizedContent.replace(/\[AMOUNT\]/g, feeMatch[1]);
          }
        }
      }

      // Extract relevant findings for this template category
      const relevantFindings = analysisResults.insights?.filter((insight: any) => {
        const text = (insight.text || insight.content || '').toLowerCase();
        switch (template.category) {
          case 'illegal_fees':
            return text.includes('fee') || text.includes('admin') || text.includes('charge');
          case 'deposit_dispute':
            return text.includes('deposit') || text.includes('protection');
          case 'repairs_maintenance':
            return text.includes('repair') || text.includes('maintenance');
          case 'rent_increase':
            return text.includes('rent') || text.includes('increase');
          case 'harassment_privacy':
            return text.includes('harassment') || text.includes('entry') || text.includes('privacy');
          case 'eviction_notice':
            return text.includes('eviction') || text.includes('notice') || text.includes('section');
          default:
            return true;
        }
      }) || [];

      // Store the generated template
      const generatedTemplate = await storage.createGeneratedTemplate({
        documentId,
        templateId,
        personalizedContent,
        analysisFindings: relevantFindings
      });

      res.json({
        success: true,
        template: {
          id: generatedTemplate.id,
          title: template.title,
          category: template.category,
          content: personalizedContent,
          legalBasis: template.legalBasis,
          severity: template.severity,
          relevantFindings
        }
      });

    } catch (error) {
      console.error('Error generating personalized template:', error);
      res.status(500).json({ message: 'Failed to generate personalized template' });
    }
  });

  // Get generated templates for a document
  app.get('/api/documents/:id/templates', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      
      const generatedTemplates = await storage.getGeneratedTemplatesForDocument(documentId);
      
      // Enrich with template details
      const allTemplates = await storage.getResponseTemplates();
      const enrichedTemplates = generatedTemplates.map(gt => {
        const template = allTemplates.find(t => t.id === gt.templateId);
        return {
          id: gt.id,
          title: template?.title || 'Unknown Template',
          category: template?.category || 'unknown',
          content: gt.personalizedContent,
          legalBasis: template?.legalBasis,
          severity: template?.severity,
          createdAt: gt.createdAt,
          relevantFindings: gt.analysisFindings
        };
      });

      res.json(enrichedTemplates);
    } catch (error) {
      console.error('Error fetching generated templates:', error);
      res.status(500).json({ message: 'Failed to fetch generated templates' });
    }
  });

  // Create a secure sharing link for a document
  app.post('/api/documents/:id/share',
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter,
    speedLimiter,
    async (req, res) => {
    try {
      const { id } = req.params;
      const documentId = parseInt(id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      // Get the document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Make sure analysis exists
      const analysis = await storage.getAnalysisByDocumentId(documentId);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }
      
      // Check if document has been paid for
      if (!analysis.isPaid) {
        return res.status(403).json({ 
          message: 'Payment required for document sharing',
          requirePayment: true
        });
      }
      
      // Get recipient email from request body
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email address is required' });
      }
      
      // Generate signed URL
      const token = await generateSignedUrl({
        documentId,
        expiresIn: '24h', // URL will expire in 24 hours
        ipAddress: req.clientIp,
      });
      
      // Send email with the download link
      await emailService.sendDocumentAccessEmail(
        email,
        document,
        analysis,
        token
      );
      
      return res.json({ 
        success: true, 
        message: 'Document shared successfully',
        expiresIn: '24 hours'
      });
    } catch (error: any) {
      console.error('Error sharing document:', error);
      return res.status(500).json({ message: error.message || 'Error sharing document' });
    }
  });
  
  // Download document via signed URL
  app.get('/documents/download/:token',
    verifySignedUrl,
    async (req, res) => {
    try {
      // Get token from the middleware
      const token = req.signedUrlToken;
      if (!token) {
        console.error('Missing token in signed URL verification');
        return res.status(400).json({ message: 'Invalid access token' });
      }
      
      // Debug token information
      console.log(`Processing download request for token: ${token}`);
      
      // Get token record from database
      const tokenRecord = await storage.getDocumentAccessToken(token);
      if (!tokenRecord) {
        console.error(`Token not found in database: ${token}`);
        
        // User-friendly error page instead of JSON
        return res.status(404).send(`
          <html>
            <head>
              <title>Link Expired or Invalid</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background-color: #FFFAF5;
                }
                .container {
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  background-color: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 { 
                  color: #333;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
                }
                .logo {
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-text {
                  font-size: 28px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                }
                .logo-right {
                  color: #EC7134;
                }
                .logo-badge {
                  background-color: #EC7134;
                  color: white;
                  font-size: 13px;
                  border-radius: 9999px;
                  padding: 2px 6px;
                  margin-left: 5px;
                  font-weight: bold;
                }
                .button {
                  background-color: #EC7134;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <div class="logo-text">
                    <span class="logo-right">Rent</span><span>Right</span>
                    <span class="logo-badge">AI</span>
                  </div>
                </div>
                <h1>This Link Has Expired</h1>
                <p>The document you're trying to access is no longer available with this link. Document access links expire after a certain period for security reasons.</p>
                <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      console.log(`Token found: documentId=${tokenRecord.documentId}, expires=${tokenRecord.expiresAt}, revoked=${tokenRecord.revoked}`);
      
      // Check if token is expired
      const now = new Date();
      const expiredToken = tokenRecord.expiresAt < now;
      
      if (expiredToken) {
        const expiredMinutesAgo = Math.floor((now.getTime() - tokenRecord.expiresAt.getTime()) / (1000 * 60));
        console.warn(`Token expired: expired at ${tokenRecord.expiresAt}, ${expiredMinutesAgo} minutes ago`);
        
        // User-friendly error page for expired tokens
        return res.status(403).send(`
          <html>
            <head>
              <title>Link Expired</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background-color: #FFFAF5;
                }
                .container {
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  background-color: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 { 
                  color: #333;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
                }
                .logo {
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-text {
                  font-size: 28px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                }
                .logo-right {
                  color: #EC7134;
                }
                .logo-badge {
                  background-color: #EC7134;
                  color: white;
                  font-size: 13px;
                  border-radius: 9999px;
                  padding: 2px 6px;
                  margin-left: 5px;
                  font-weight: bold;
                }
                .button {
                  background-color: #EC7134;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                }
                .expired-info {
                  background-color: #ffe9e9;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  color: #d32f2f;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <div class="logo-text">
                    <span class="logo-right">Rent</span><span>Right</span>
                    <span class="logo-badge">AI</span>
                  </div>
                </div>
                <h1>Link Expired</h1>
                <div class="expired-info">
                  This document access link expired ${expiredMinutesAgo > 60 
                    ? `${Math.floor(expiredMinutesAgo / 60)} hours and ${expiredMinutesAgo % 60} minutes` 
                    : `${expiredMinutesAgo} minutes`} ago
                </div>
                <p>For security reasons, document access links expire after a period of time. If you still need access to this document, please request a new link from the person who shared it with you.</p>
                <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // Check if token has been revoked
      if (tokenRecord.revoked) {
        console.warn(`Token has been revoked: ${token}`);
        return res.status(403).send(`
          <html>
            <head>
              <title>Access Revoked</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background-color: #FFFAF5;
                }
                .container {
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  background-color: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 { 
                  color: #333;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
                }
                .logo {
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-text {
                  font-size: 28px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                }
                .logo-right {
                  color: #EC7134;
                }
                .logo-badge {
                  background-color: #EC7134;
                  color: white;
                  font-size: 13px;
                  border-radius: 9999px;
                  padding: 2px 6px;
                  margin-left: 5px;
                  font-weight: bold;
                }
                .button {
                  background-color: #EC7134;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <div class="logo-text">
                    <span class="logo-right">Rent</span><span>Right</span>
                    <span class="logo-badge">AI</span>
                  </div>
                </div>
                <h1>Access Revoked</h1>
                <p>The owner of this document has revoked access to it. If you believe this is a mistake, please contact the person who shared this document with you.</p>
                <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // Get the document
      const document = await storage.getDocument(tokenRecord.documentId);
      if (!document) {
        console.error(`Document not found for token: documentId=${tokenRecord.documentId}`);
        return res.status(404).send(`
          <html>
            <head>
              <title>Document Not Found</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background-color: #FFFAF5;
                }
                .container {
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  background-color: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 { 
                  color: #333;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
                }
                .logo {
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-text {
                  font-size: 28px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                }
                .logo-right {
                  color: #EC7134;
                }
                .logo-badge {
                  background-color: #EC7134;
                  color: white;
                  font-size: 13px;
                  border-radius: 9999px;
                  padding: 2px 6px;
                  margin-left: 5px;
                  font-weight: bold;
                }
                .button {
                  background-color: #EC7134;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <div class="logo-text">
                    <span class="logo-right">Rent</span><span>Right</span>
                    <span class="logo-badge">AI</span>
                  </div>
                </div>
                <h1>Document Not Found</h1>
                <p>We couldn't find the document you're looking for. It may have been deleted or moved.</p>
                <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      console.log(`Document found: id=${document.id}, filename=${document.filename}`);
      
      // Get the analysis
      const analysis = await storage.getAnalysisByDocumentId(tokenRecord.documentId);
      if (!analysis) {
        console.error(`Analysis not found for document: documentId=${tokenRecord.documentId}`);
        return res.status(404).send(`
          <html>
            <head>
              <title>Analysis Not Found</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background-color: #FFFAF5;
                }
                .container {
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  background-color: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 { 
                  color: #333;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
                }
                .logo {
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-text {
                  font-size: 28px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                }
                .logo-right {
                  color: #EC7134;
                }
                .logo-badge {
                  background-color: #EC7134;
                  color: white;
                  font-size: 13px;
                  border-radius: 9999px;
                  padding: 2px 6px;
                  margin-left: 5px;
                  font-weight: bold;
                }
                .button {
                  background-color: #EC7134;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <div class="logo-text">
                    <span class="logo-right">Rent</span><span>Right</span>
                    <span class="logo-badge">AI</span>
                  </div>
                </div>
                <h1>Analysis Not Found</h1>
                <p>We couldn't find the analysis for this document. The document might not have been fully processed.</p>
                <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      console.log(`Analysis found: id=${analysis.id}, isPaid=${analysis.isPaid}`);
      
      // Extra check - make sure the analysis has been paid for
      if (!analysis.isPaid) {
        console.warn(`Attempt to access unpaid analysis via token: documentId=${tokenRecord.documentId}`);
        return res.status(402).send(`
          <html>
            <head>
              <title>Payment Required</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background-color: #FFFAF5;
                }
                .container {
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  background-color: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 { 
                  color: #333;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
                }
                .logo {
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-text {
                  font-size: 28px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                }
                .logo-right {
                  color: #EC7134;
                }
                .logo-badge {
                  background-color: #EC7134;
                  color: white;
                  font-size: 13px;
                  border-radius: 9999px;
                  padding: 2px 6px;
                  margin-left: 5px;
                  font-weight: bold;
                }
                .button {
                  background-color: #EC7134;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <div class="logo-text">
                    <span class="logo-right">Rent</span><span>Right</span>
                    <span class="logo-badge">AI</span>
                  </div>
                </div>
                <h1>Payment Required</h1>
                <p>This analysis requires payment before it can be accessed. Please contact the document owner for more information.</p>
                <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // Update access count and last accessed timestamp
      await storage.updateDocumentAccessToken(tokenRecord.id, {
        accessCount: (tokenRecord.accessCount || 0) + 1,
        lastAccessedAt: new Date()
      });
      
      console.log(`Generating PDF report for document ${document.id}`);
      
      try {
        // Generate PDF report
        const pdfBuffer = await generateSimplePdfReport(document, analysis);
        
        console.log(`Generated PDF report (${pdfBuffer.length} bytes)`);
        
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=RentRight_AI_Tenancy_Analysis_${document.id}.pdf`,
          'Content-Length': pdfBuffer.length,
        });
        
        return res.send(pdfBuffer);
      } catch (pdfError: any) {
        console.error('Error generating PDF:', pdfError);
        return res.status(500).send(`
          <html>
            <head>
              <title>Error Generating PDF</title>
              <style>
                body { 
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background-color: #FFFAF5;
                }
                .container {
                  padding: 40px;
                  max-width: 600px;
                  text-align: center;
                  background-color: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                h1 { 
                  color: #333;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
                }
                .logo {
                  margin-bottom: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .logo-text {
                  font-size: 28px;
                  font-weight: bold;
                  display: flex;
                  align-items: center;
                }
                .logo-right {
                  color: #EC7134;
                }
                .logo-badge {
                  background-color: #EC7134;
                  color: white;
                  font-size: 13px;
                  border-radius: 9999px;
                  padding: 2px 6px;
                  margin-left: 5px;
                  font-weight: bold;
                }
                .button {
                  background-color: #EC7134;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                }
                .error-info {
                  background-color: #f9e9e9;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  color: #d32f2f;
                  text-align: left;
                  overflow-wrap: break-word;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <div class="logo-text">
                    <span class="logo-right">Rent</span><span>Right</span>
                    <span class="logo-badge">AI</span>
                  </div>
                </div>
                <h1>Error Generating Report</h1>
                <p>We encountered a problem while generating your PDF report. Our team has been notified of this issue.</p>
                <div class="error-info">
                  Error details: ${pdfError.message || 'Unknown error'} 
                </div>
                <p>Please try again later or contact support if this issue persists.</p>
                <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
    } catch (error: any) {
      console.error('Error downloading shared document:', error);
      return res.status(500).send(`
        <html>
          <head>
            <title>Error</title>
            <style>
              body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #FFFAF5;
              }
              .container {
                padding: 40px;
                max-width: 600px;
                text-align: center;
                background-color: white;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              }
              h1 { 
                color: #333;
                margin-bottom: 20px;
              }
              p {
                color: #666;
                margin-bottom: 30px;
                line-height: 1.6;
              }
              .logo {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .logo-text {
                font-size: 28px;
                font-weight: bold;
                display: flex;
                align-items: center;
              }
              .logo-right {
                color: #EC7134;
              }
              .logo-badge {
                background-color: #EC7134;
                color: white;
                font-size: 13px;
                border-radius: 9999px;
                padding: 2px 6px;
                margin-left: 5px;
                font-weight: bold;
              }
              .button {
                background-color: #EC7134;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                display: inline-block;
              }
              .error-code {
                font-size: 0.8em;
                color: #999;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <div class="logo-text">
                  <span class="logo-right">Rent</span><span>Right</span>
                  <span class="logo-badge">AI</span>
                </div>
              </div>
              <h1>Error Processing Request</h1>
              <p>We experienced a problem while processing your request. Please try again later.</p>
              <a href="https://rentrightai.co.uk" class="button">Go to Homepage</a>
              <div class="error-code">Error code: ${Math.floor(Math.random() * 1000) + 1000}</div>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Sentry test endpoint (development only)
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/test-sentry', (req, res) => {
      const { type } = req.body;
      
      try {
        switch (type) {
          case 'error':
            throw new Error('Test server error for Sentry integration - this is intentional');
          
          case 'async':
            Promise.reject(new Error('Test async error for Sentry integration')).catch(err => {
              console.error('Async error caught:', err);
            });
            res.json({ message: 'Async error triggered' });
            break;
          
          case 'message':
            console.log('Test message logged to Sentry');
            res.json({ message: 'Test message logged' });
            break;
          
          default:
            res.status(400).json({ error: 'Invalid test type' });
        }
      } catch (error) {
        // This will be caught by Sentry error handler
        throw error;
      }
    });
  }

  // Contact form submission endpoint
  app.post('/api/contact', 
    detectClientIp,
    blockSuspiciousIPs,
    apiLimiter,
    speedLimiter,
    async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Email validation
      if (!email.includes('@')) {
        return res.status(400).json({ message: 'Valid email address is required' });
      }
      
      // Create email content
      const plainText = `
New contact form submission from RentRight AI website:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message:
${message}

---
This message was sent from the contact form on the RentRight AI website.
      `;
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #FFFAF5; color: #333333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #FFFFFF; padding: 20px; border-bottom: 3px solid #EC7134; }
    .content { background-color: #FFFFFF; padding: 20px; }
    .footer { font-size: 12px; color: #666666; padding: 20px; text-align: center; }
    h1 { color: #EC7134; margin-top: 0; }
    .field { margin-bottom: 20px; }
    .field-label { font-weight: bold; margin-bottom: 5px; color: #555555; }
    .field-value { padding: 10px; background-color: #F9F9F9; border-left: 3px solid #EC7134; }
    .message-value { white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <p>Someone has submitted the contact form on the RentRight AI website:</p>
      
      <div class="field">
        <div class="field-label">Name:</div>
        <div class="field-value">${name}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Email:</div>
        <div class="field-value">${email}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Subject:</div>
        <div class="field-value">${subject}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Message:</div>
        <div class="field-value message-value">${message}</div>
      </div>
    </div>
    <div class="footer">
      This message was sent from the contact form on the RentRight AI website.
    </div>
  </div>
</body>
</html>
      `;
      
      // Send the email
      await emailService.sendEmail({
        to: 'support@rentrightai.co.uk', // Send to the support email address
        subject: `Contact Form: ${subject}`,
        text: plainText,
        html: html
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Contact form submitted successfully'
      });
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      return res.status(500).json({ 
        message: 'Error submitting contact form',
        error: error.message
      });
    }
  });

  // Admin Dashboard API endpoints
  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user is admin (you can modify this logic based on your user schema)
    // For now, we'll check if the user has admin role or is a specific admin user
    if (req.user.username !== 'admin' && !req.user.username.includes('admin')) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  }

  app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange || '7d';
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Fetch user statistics
      const userStats = await storage.getUserStats(startDate);
      
      // Fetch document statistics
      const documentStats = await storage.getDocumentStats(startDate);
      
      // Fetch payment statistics
      const paymentStats = await storage.getPaymentStats(startDate);
      
      // Fetch system health metrics
      const systemHealth = await storage.getSystemHealth(startDate);
      
      // Fetch recent activity
      const recentActivity = await storage.getRecentActivity(50); // Last 50 activities
      
      // Fetch chart data
      const chartData = await storage.getDashboardChartData(startDate);

      const dashboardData = {
        userStats,
        documentStats,
        paymentStats,
        systemHealth,
        recentActivity,
        chartData
      };

      res.json(dashboardData);
    } catch (error: any) {
      console.error('Dashboard API error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // Admin user management endpoints
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;

      const users = await storage.getUsers(page, limit, search);
      res.json(users);
    } catch (error: any) {
      console.error('Admin users API error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/documents', requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      const documents = await storage.getDocumentsForAdmin(page, limit, status);
      res.json(documents);
    } catch (error: any) {
      console.error('Admin documents API error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  app.get('/api/admin/payments', requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      const payments = await storage.getPaymentsForAdmin(page, limit, status);
      res.json(payments);
    } catch (error: any) {
      console.error('Admin payments API error:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
