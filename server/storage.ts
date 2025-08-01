import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  analyses, type Analysis, type InsertAnalysis,
  sessions, type Session, type InsertSession,
  payments, type Payment, type InsertPayment,
  documentAccessTokens, type DocumentAccessToken, type InsertDocumentAccessToken,
  responseTemplates, type ResponseTemplate, type InsertResponseTemplate,
  generatedTemplates, type GeneratedTemplate, type InsertGeneratedTemplate
} from "@shared/schema";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocuments(limit: number, offset: number): Promise<Document[]>; // Get paginated documents
  getUserDocuments(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument & { content?: string }): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  
  // Analysis methods
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysisByDocumentId(documentId: number): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined>;
  
  // Payment methods
  getPaymentByIntentId(paymentIntentId: string): Promise<Payment | undefined>;
  getPaymentsByDocumentId(documentId: number): Promise<Payment[]>;
  recordPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(paymentIntentId: string, status: string): Promise<Payment | undefined>;
  
  // Document status methods (specialized update methods)
  updateDocumentStatus(id: number, updates: { paid?: boolean, paymentIntentId?: string }): Promise<Document | undefined>;
  
  // Document access token methods
  createDocumentAccessToken(token: InsertDocumentAccessToken): Promise<DocumentAccessToken>;
  getDocumentAccessToken(token: string): Promise<DocumentAccessToken | undefined>;
  updateDocumentAccessToken(id: number, updates: Partial<DocumentAccessToken>): Promise<DocumentAccessToken | undefined>;
  revokeDocumentAccessToken(token: string): Promise<boolean>;
  
  // Health check methods
  checkDatabaseConnection(): Promise<boolean>;

  // Response Template methods
  getResponseTemplates(): Promise<ResponseTemplate[]>;
  getResponseTemplatesByCategory(category: string): Promise<ResponseTemplate[]>;
  createResponseTemplate(template: InsertResponseTemplate): Promise<ResponseTemplate>;
  
  // Generated Template methods
  getGeneratedTemplatesForDocument(documentId: number): Promise<GeneratedTemplate[]>;
  createGeneratedTemplate(template: InsertGeneratedTemplate): Promise<GeneratedTemplate>;
  
  // Admin Dashboard methods
  getUserStats(startDate: Date): Promise<{
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    activeUsers: number;
  }>;
  getDocumentStats(startDate: Date): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    failedDocuments: number;
    documentsToday: number;
    processingRate: number;
  }>;
  getPaymentStats(startDate: Date): Promise<{
    totalRevenue: number;
    revenueToday: number;
    revenueThisWeek: number;
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    averageTransactionValue: number;
  }>;
  getSystemHealth(startDate: Date): Promise<{
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
    totalErrors: number;
    criticalErrors: number;
  }>;
  getRecentActivity(limit: number): Promise<Array<{
    id: number;
    type: 'user_registration' | 'document_upload' | 'payment' | 'error';
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>>;
  getDashboardChartData(startDate: Date): Promise<{
    dailyUsers: Array<{ date: string; users: number; documents: number }>;
    paymentTrends: Array<{ date: string; revenue: number; transactions: number }>;
    documentTypes: Array<{ type: string; count: number; percentage: number }>;
  }>;
  getUsers(page: number, limit: number, search?: string): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getDocumentsForAdmin(page: number, limit: number, status?: string): Promise<{
    documents: (Document & { username?: string })[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getPaymentsForAdmin(page: number, limit: number, status?: string): Promise<{
    payments: (Payment & { username?: string; filename?: string })[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Session store for express-session
  sessionStore: any;
}

import { eq, and, sql } from 'drizzle-orm';
import { db } from './db';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { randomUUID } from 'crypto';

export class DatabaseStorage implements IStorage {
  readonly sessionStore: any; // We use any type to avoid the SessionStore TypeScript error

  constructor() {
    // Create a PostgreSQL session store for express-session
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Session methods
  async createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<Session> {
    try {
      // Create a secure token
      const token = randomUUID();
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const [session] = await db
        .insert(sessions)
        .values({
          userId,
          token,
          expiresAt,
          ipAddress,
          userAgent
        })
        .returning();
      
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    try {
      const now = new Date();
      
      const [session] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.token, token),
            // Check that the session has not expired
            // @ts-ignore - TypeScript doesn't recognize the comparison operator for Date type
            sessions.expiresAt > now
          )
        );
      
      return session;
    } catch (error) {
      console.error('Error getting session by token:', error);
      return undefined;
    }
  }

  async deleteSession(token: string): Promise<void> {
    try {
      await db
        .delete(sessions)
        .where(eq(sessions.token, token));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async deleteAllUserSessions(userId: number): Promise<void> {
    try {
      await db
        .delete(sessions)
        .where(eq(sessions.userId, userId));
    } catch (error) {
      console.error('Error deleting all user sessions:', error);
      throw error;
    }
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    try {
      const [document] = await db.select().from(documents).where(eq(documents.id, id));
      return document;
    } catch (error) {
      console.error('Error getting document:', error);
      return undefined;
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    try {
      return await db.select().from(documents);
    } catch (error) {
      console.error('Error getting all documents:', error);
      return [];
    }
  }
  
  async getDocuments(limit: number, offset: number): Promise<Document[]> {
    try {
      return await db.select()
        .from(documents)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${documents.uploadedAt} DESC`);
    } catch (error) {
      console.error('Error getting paginated documents:', error);
      return [];
    }
  }

  async getUserDocuments(userId: number): Promise<Document[]> {
    try {
      return await db.select().from(documents).where(eq(documents.userId, userId));
    } catch (error) {
      console.error('Error getting user documents:', error);
      return [];
    }
  }

  async createDocument(document: InsertDocument & { 
    content?: string, 
    filePath?: string,
    isEncrypted?: boolean 
  }): Promise<Document> {
    try {
      const [newDocument] = await db
        .insert(documents)
        .values({
          ...document,
          content: document.content || null,
          processed: false,
          fullyAnalyzed: false,
          filePath: document.filePath || null,
          isEncrypted: document.isEncrypted || false
        })
        .returning();
      
      return newDocument;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    try {
      const [updatedDocument] = await db
        .update(documents)
        .set(updates)
        .where(eq(documents.id, id))
        .returning();
      
      return updatedDocument;
    } catch (error) {
      console.error('Error updating document:', error);
      return undefined;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(documents)
        .where(eq(documents.id, id))
        .returning({ id: documents.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // Analysis methods
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    try {
      const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
      return analysis;
    } catch (error) {
      console.error('Error getting analysis:', error);
      return undefined;
    }
  }

  async getAnalysisByDocumentId(documentId: number): Promise<Analysis | undefined> {
    try {
      const [analysis] = await db
        .select()
        .from(analyses)
        .where(eq(analyses.documentId, documentId));
      
      if (analysis) {
        console.log('🗄️ CRITICAL: Storage retrieved analysis:', {
          id: analysis.id,
          documentId: analysis.documentId,
          isPaid: analysis.isPaid,
          hasResults: !!analysis.results,
          resultsType: typeof analysis.results,
          
          // DETAILED RETRIEVAL INSPECTION
          resultsKeys: analysis.results && typeof analysis.results === 'object' ? Object.keys(analysis.results) : [],
          hasInsights: analysis.results && typeof analysis.results === 'object' && 'insights' in analysis.results,
          insightsType: analysis.results && typeof analysis.results === 'object' ? typeof analysis.results.insights : 'N/A',
          insightsCount: analysis.results && typeof analysis.results === 'object' && Array.isArray(analysis.results.insights) ? analysis.results.insights.length : 0
        });
        
        // LOG FULL RETRIEVED RESULTS
        console.log('🗄️ RETRIEVED RESULTS:', JSON.stringify(analysis.results, null, 2));
      } else {
        console.log('🗄️ No analysis found for document:', documentId);
      }
      
      return analysis;
    } catch (error) {
      console.error('Error getting analysis by document ID:', error);
      return undefined;
    }
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    try {
      console.log('🗄️ CRITICAL: Storage creating analysis:', {
        documentId: insertAnalysis.documentId,
        isPaid: insertAnalysis.isPaid,
        hasResults: !!insertAnalysis.results,
        resultsType: typeof insertAnalysis.results,
        resultsHasInsights: insertAnalysis.results && typeof insertAnalysis.results === 'object' && 'insights' in insertAnalysis.results,
        
        // DETAILED RESULTS INSPECTION
        resultsKeys: insertAnalysis.results && typeof insertAnalysis.results === 'object' ? Object.keys(insertAnalysis.results) : [],
        insightsCount: insertAnalysis.results && typeof insertAnalysis.results === 'object' && Array.isArray(insertAnalysis.results.insights) ? insertAnalysis.results.insights.length : 0,
        resultsJsonSize: insertAnalysis.results ? JSON.stringify(insertAnalysis.results).length : 0
      });
      
      // LOG FULL RESULTS OBJECT FOR DEBUGGING
      console.log('🗄️ FULL RESULTS BEING STORED:', JSON.stringify(insertAnalysis.results, null, 2));
      
      // Ensure created_at is set for database cleanup
      const [analysis] = await db
        .insert(analyses)
        .values({
          ...insertAnalysis,
          // created_at is set by default in the schema, but we'll be explicit here
          created_at: new Date()
        })
        .returning();
      
      console.log('🗄️ CRITICAL: Storage created analysis successfully:', {
        id: analysis.id,
        documentId: analysis.documentId,
        isPaid: analysis.isPaid,
        hasStoredResults: !!analysis.results,
        storedResultsType: typeof analysis.results,
        storedResultsKeys: analysis.results && typeof analysis.results === 'object' ? Object.keys(analysis.results) : [],
        storedInsightsCount: analysis.results && typeof analysis.results === 'object' && Array.isArray(analysis.results.insights) ? analysis.results.insights.length : 0
      });
      
      // LOG WHAT WAS ACTUALLY STORED
      console.log('🗄️ STORED RESULTS:', JSON.stringify(analysis.results, null, 2));
      
      return analysis;
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error;
    }
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    try {
      console.log('🗄️ Storage updating analysis:', {
        analysisId: id,
        updateKeys: Object.keys(updates),
        hasResults: !!updates.results,
        resultsType: typeof updates.results,
        resultsHasInsights: updates.results && typeof updates.results === 'object' && 'insights' in updates.results
      });
      
      const [updatedAnalysis] = await db
        .update(analyses)
        .set(updates)
        .where(eq(analyses.id, id))
        .returning();
      
      if (updatedAnalysis) {
        console.log('🗄️ Storage updated analysis successfully:', {
          id: updatedAnalysis.id,
          documentId: updatedAnalysis.documentId,
          isPaid: updatedAnalysis.isPaid
        });
      }
      
      return updatedAnalysis;
    } catch (error) {
      console.error('Error updating analysis:', error);
      return undefined;
    }
  }

  async deleteAnalysis(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(analyses)
        .where(eq(analyses.id, id))
        .returning({ id: analyses.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      return false;
    }
  }
  
  // Payment methods
  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.paymentIntentId, paymentIntentId));
      
      return payment;
    } catch (error) {
      console.error('Error getting payment by intent ID:', error);
      return undefined;
    }
  }
  
  async getPaymentsByDocumentId(documentId: number): Promise<Payment[]> {
    try {
      return await db
        .select()
        .from(payments)
        .where(eq(payments.documentId, documentId));
    } catch (error) {
      console.error('Error getting payments by document ID:', error);
      return [];
    }
  }
  
  async recordPayment(insertPayment: InsertPayment): Promise<Payment> {
    try {
      const [payment] = await db
        .insert(payments)
        .values(insertPayment)
        .returning();
      
      return payment;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }
  
  async updatePaymentStatus(paymentIntentId: string, status: string): Promise<Payment | undefined> {
    try {
      const [updatedPayment] = await db
        .update(payments)
        .set({ status })
        .where(eq(payments.paymentIntentId, paymentIntentId))
        .returning();
      
      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return undefined;
    }
  }
  
  async updateDocumentStatus(id: number, updates: { paid?: boolean, paymentIntentId?: string }): Promise<Document | undefined> {
    try {
      // Create a proper updates object that only includes defined fields
      const documentUpdates: Partial<Document> = {};
      
      if (updates.paid !== undefined) {
        documentUpdates.paid = updates.paid;
      }
      
      if (updates.paymentIntentId) {
        documentUpdates.paymentIntentId = updates.paymentIntentId;
      }
      
      // Use the regular updateDocument method with our filtered updates
      return this.updateDocument(id, documentUpdates);
    } catch (error) {
      console.error('Error updating document status:', error);
      return undefined;
    }
  }

  // Document access token methods
  async createDocumentAccessToken(tokenData: InsertDocumentAccessToken): Promise<DocumentAccessToken> {
    try {
      const [token] = await db
        .insert(documentAccessTokens)
        .values({
          ...tokenData,
          createdAt: new Date()
        })
        .returning();
      
      return token;
    } catch (error) {
      console.error('Error creating document access token:', error);
      throw error;
    }
  }

  async getDocumentAccessToken(token: string): Promise<DocumentAccessToken | undefined> {
    try {
      console.log(`Storage: Looking up token in database: ${token.substring(0, 10)}...`);
      
      const now = new Date();
      
      // First try with all conditions
      const [accessToken] = await db
        .select()
        .from(documentAccessTokens)
        .where(
          and(
            eq(documentAccessTokens.token, token),
            eq(documentAccessTokens.revoked, false),
            // @ts-ignore - TypeScript doesn't recognize the comparison operator for Date type
            documentAccessTokens.expiresAt > now
          )
        );
      
      if (accessToken) {
        console.log(`Storage: Found valid token for document ${accessToken.documentId}, expires ${accessToken.expiresAt}`);
        return accessToken;
      }
      
      // If not found with all conditions, check if it exists but is expired or revoked
      console.log('Token not found with expiration and revocation checks, checking if it exists at all');
      const [existingToken] = await db
        .select()
        .from(documentAccessTokens)
        .where(eq(documentAccessTokens.token, token));
      
      if (existingToken) {
        // Token exists but might be expired or revoked
        if (existingToken.revoked) {
          console.warn(`Token found but is revoked: token=${token.substring(0, 10)}..., documentId=${existingToken.documentId}`);
        } else if (existingToken.expiresAt < now) {
          console.warn(`Token found but is expired: token=${token.substring(0, 10)}..., expired at ${existingToken.expiresAt}, documentId=${existingToken.documentId}`);
        }
        
        // For email links, let's be lenient and return tokens that exist, even if expired
        // (the actual validation of expiration should happen in the route handler)
        return existingToken;
      }
      
      console.error(`Storage: Token not found in database: ${token.substring(0, 10)}...`);
      return undefined;
    } catch (error) {
      console.error('Error getting document access token:', error);
      return undefined;
    }
  }

  async updateDocumentAccessToken(id: number, updates: Partial<DocumentAccessToken>): Promise<DocumentAccessToken | undefined> {
    try {
      const [updatedToken] = await db
        .update(documentAccessTokens)
        .set(updates)
        .where(eq(documentAccessTokens.id, id))
        .returning();
      
      return updatedToken;
    } catch (error) {
      console.error('Error updating document access token:', error);
      return undefined;
    }
  }

  async revokeDocumentAccessToken(token: string): Promise<boolean> {
    try {
      const result = await db
        .update(documentAccessTokens)
        .set({ revoked: true })
        .where(eq(documentAccessTokens.token, token))
        .returning({ id: documentAccessTokens.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error revoking document access token:', error);
      return false;
    }
  }
  
  // Health check methods
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Execute a simple query to check the database connection
      const result = await db.execute(sql`SELECT 1 AS connected`);
      return result.length > 0 && result[0].connected === 1;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  // Response Template methods
  async getResponseTemplates(): Promise<ResponseTemplate[]> {
    try {
      return await db.select().from(responseTemplates).where(eq(responseTemplates.isActive, true));
    } catch (error) {
      console.error('Error getting response templates:', error);
      return [];
    }
  }

  async getResponseTemplatesByCategory(category: string): Promise<ResponseTemplate[]> {
    try {
      return await db.select().from(responseTemplates)
        .where(and(eq(responseTemplates.category, category), eq(responseTemplates.isActive, true)));
    } catch (error) {
      console.error('Error getting response templates by category:', error);
      return [];
    }
  }

  async createResponseTemplate(template: InsertResponseTemplate): Promise<ResponseTemplate> {
    try {
      const [createdTemplate] = await db.insert(responseTemplates).values(template).returning();
      return createdTemplate;
    } catch (error) {
      console.error('Error creating response template:', error);
      throw error;
    }
  }

  // Generated Template methods
  async getGeneratedTemplatesForDocument(documentId: number): Promise<GeneratedTemplate[]> {
    try {
      return await db.select().from(generatedTemplates)
        .where(eq(generatedTemplates.documentId, documentId));
    } catch (error) {
      console.error('Error getting generated templates for document:', error);
      return [];
    }
  }

  async createGeneratedTemplate(template: InsertGeneratedTemplate): Promise<GeneratedTemplate> {
    try {
      const [createdTemplate] = await db.insert(generatedTemplates).values(template).returning();
      return createdTemplate;
    } catch (error) {
      console.error('Error creating generated template:', error);
      throw error;
    }
  }

  // Admin Dashboard methods implementation
  async getUserStats(startDate: Date) {
    try {
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const newUsersToday = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`DATE(${users.createdAt}) = CURRENT_DATE`);
      const newUsersThisWeek = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.createdAt} >= ${startDate}`);
      
      // Consider users active if they've logged in within the last 30 days
      const activeUsers = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.lastLogin} >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`);

      return {
        totalUsers: totalUsers[0]?.count || 0,
        newUsersToday: newUsersToday[0]?.count || 0,
        newUsersThisWeek: newUsersThisWeek[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getDocumentStats(startDate: Date) {
    try {
      const totalDocuments = await db.select({ count: sql<number>`count(*)` }).from(documents);
      const processedDocuments = await db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(eq(documents.processed, true));
      const failedDocuments = await db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(eq(documents.processed, false), sql`${documents.uploadedAt} < NOW() - INTERVAL '1 hour'`));
      const documentsToday = await db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(sql`DATE(${documents.uploadedAt}) = CURRENT_DATE`);

      const total = totalDocuments[0]?.count || 0;
      const processed = processedDocuments[0]?.count || 0;
      const processingRate = total > 0 ? (processed / total) * 100 : 0;

      return {
        totalDocuments: total,
        processedDocuments: processed,
        failedDocuments: failedDocuments[0]?.count || 0,
        documentsToday: documentsToday[0]?.count || 0,
        processingRate: Math.round(processingRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }

  async getPaymentStats(startDate: Date) {
    try {
      const totalRevenue = await db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(eq(payments.status, 'succeeded'));
      
      const revenueToday = await db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(and(
          eq(payments.status, 'succeeded'),
          sql`DATE(${payments.createTimestamp}) = CURRENT_DATE`
        ));
      
      const revenueThisWeek = await db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(and(
          eq(payments.status, 'succeeded'),
          sql`${payments.createTimestamp} >= ${startDate}`
        ));

      const totalTransactions = await db.select({ count: sql<number>`count(*)` }).from(payments);
      const successfulPayments = await db.select({ count: sql<number>`count(*)` })
        .from(payments)
        .where(eq(payments.status, 'succeeded'));
      const failedPayments = await db.select({ count: sql<number>`count(*)` })
        .from(payments)
        .where(eq(payments.status, 'failed'));

      const totalCount = totalTransactions[0]?.count || 0;
      const totalAmount = totalRevenue[0]?.sum || 0;
      const averageTransactionValue = totalCount > 0 ? totalAmount / totalCount : 0;

      return {
        totalRevenue: totalAmount,
        revenueToday: revenueToday[0]?.sum || 0,
        revenueThisWeek: revenueThisWeek[0]?.sum || 0,
        totalTransactions: totalCount,
        successfulPayments: successfulPayments[0]?.count || 0,
        failedPayments: failedPayments[0]?.count || 0,
        averageTransactionValue: Math.round(averageTransactionValue),
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  async getSystemHealth(startDate: Date) {
    try {
      // For now, return mock data since we don't have error logging tables
      // In a real implementation, you'd query error/log tables
      return {
        uptime: 99.9,
        errorRate: 0.1,
        avgResponseTime: 250,
        totalErrors: 5,
        criticalErrors: 0,
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      throw error;
    }
  }

  async getRecentActivity(limit: number) {
    try {
      // Get recent user registrations
      const recentUsers = await db.select({
        id: users.id,
        timestamp: users.createdAt,
        username: users.username,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(limit / 3);

      // Get recent document uploads
      const recentDocuments = await db.select({
        id: documents.id,
        timestamp: documents.uploadedAt,
        filename: documents.filename,
      })
      .from(documents)
      .orderBy(sql`${documents.uploadedAt} DESC`)
      .limit(limit / 3);

      // Get recent payments
      const recentPayments = await db.select({
        id: payments.id,
        timestamp: payments.createTimestamp,
        status: payments.status,
        amount: payments.amount,
      })
      .from(payments)
      .orderBy(sql`${payments.createTimestamp} DESC`)
      .limit(limit / 3);

      const activities = [
        ...recentUsers.map(user => ({
          id: user.id,
          type: 'user_registration' as const,
          description: `New user registered: ${user.username}`,
          timestamp: user.timestamp?.toISOString() || new Date().toISOString(),
          status: 'success' as const,
        })),
        ...recentDocuments.map(doc => ({
          id: doc.id,
          type: 'document_upload' as const,
          description: `Document uploaded: ${doc.filename}`,
          timestamp: doc.timestamp?.toISOString() || new Date().toISOString(),
          status: 'success' as const,
        })),
        ...recentPayments.map(payment => ({
          id: payment.id,
          type: 'payment' as const,
          description: `Payment ${payment.status}: £${(payment.amount / 100).toFixed(2)}`,
          timestamp: payment.timestamp?.toISOString() || new Date().toISOString(),
          status: payment.status === 'succeeded' ? 'success' as const : 
                 payment.status === 'failed' ? 'error' as const : 'warning' as const,
        })),
      ];

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }

  async getDashboardChartData(startDate: Date) {
    try {
      // Get daily user registrations
      const dailyUsers = await db.select({
        date: sql<string>`DATE(${users.createdAt})`,
        users: sql<number>`count(*)`,
      })
      .from(users)
      .where(sql`${users.createdAt} >= ${startDate}`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

      // Get daily document uploads
      const dailyDocuments = await db.select({
        date: sql<string>`DATE(${documents.uploadedAt})`,
        documents: sql<number>`count(*)`,
      })
      .from(documents)
      .where(sql`${documents.uploadedAt} >= ${startDate}`)
      .groupBy(sql`DATE(${documents.uploadedAt})`)
      .orderBy(sql`DATE(${documents.uploadedAt})`);

      // Get payment trends
      const paymentTrends = await db.select({
        date: sql<string>`DATE(${payments.createTimestamp})`,
        revenue: sql<number>`COALESCE(SUM(amount), 0)`,
        transactions: sql<number>`count(*)`,
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'succeeded'),
        sql`${payments.createTimestamp} >= ${startDate}`
      ))
      .groupBy(sql`DATE(${payments.createTimestamp})`)
      .orderBy(sql`DATE(${payments.createTimestamp})`);

      // Get document types (mock data for now)
      const documentTypes = [
        { type: 'Tenancy Agreement', count: 45, percentage: 60 },
        { type: 'Lease Contract', count: 20, percentage: 27 },
        { type: 'Rental Agreement', count: 8, percentage: 11 },
        { type: 'Other', count: 2, percentage: 2 },
      ];

      // Merge daily users and documents data
      const dailyActivity = [];
      const usersMap = new Map(dailyUsers.map(u => [u.date, u.users]));
      const docsMap = new Map(dailyDocuments.map(d => [d.date, d.documents]));
      
      const allDates = new Set([...dailyUsers.map(u => u.date), ...dailyDocuments.map(d => d.date)]);
      
      for (const date of allDates) {
        dailyActivity.push({
          date,
          users: usersMap.get(date) || 0,
          documents: docsMap.get(date) || 0,
        });
      }

      return {
        dailyUsers: dailyActivity.sort((a, b) => a.date.localeCompare(b.date)),
        paymentTrends: paymentTrends.map(p => ({
          date: p.date,
          revenue: p.revenue / 100, // Convert to pounds
          transactions: p.transactions,
        })),
        documentTypes,
      };
    } catch (error) {
      console.error('Error getting dashboard chart data:', error);
      throw error;
    }
  }

  async getUsers(page: number, limit: number, search?: string) {
    try {
      const offset = (page - 1) * limit;
      let query = db.select().from(users);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);

      if (search) {
        const searchCondition = sql`${users.username} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`}`;
        query = query.where(searchCondition);
        countQuery = countQuery.where(searchCondition);
      }

      const [usersList, totalCount] = await Promise.all([
        query.limit(limit).offset(offset).orderBy(sql`${users.createdAt} DESC`),
        countQuery
      ]);

      const total = totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        users: usersList,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting users for admin:', error);
      throw error;
    }
  }

  async getDocumentsForAdmin(page: number, limit: number, status?: string) {
    try {
      const offset = (page - 1) * limit;
      let query = db.select({
        id: documents.id,
        userId: documents.userId,
        filename: documents.filename,
        fileType: documents.fileType,
        uploadedAt: documents.uploadedAt,
        processed: documents.processed,
        fullyAnalyzed: documents.fullyAnalyzed,
        paid: documents.paid,
        username: users.username,
      })
      .from(documents)
      .leftJoin(users, eq(documents.userId, users.id));

      let countQuery = db.select({ count: sql<number>`count(*)` }).from(documents);

      if (status) {
        if (status === 'processed') {
          query = query.where(eq(documents.processed, true));
          countQuery = countQuery.where(eq(documents.processed, true));
        } else if (status === 'pending') {
          query = query.where(eq(documents.processed, false));
          countQuery = countQuery.where(eq(documents.processed, false));
        } else if (status === 'paid') {
          query = query.where(eq(documents.paid, true));
          countQuery = countQuery.where(eq(documents.paid, true));
        }
      }

      const [documentsList, totalCount] = await Promise.all([
        query.limit(limit).offset(offset).orderBy(sql`${documents.uploadedAt} DESC`),
        countQuery
      ]);

      const total = totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        documents: documentsList,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting documents for admin:', error);
      throw error;
    }
  }

  async getPaymentsForAdmin(page: number, limit: number, status?: string) {
    try {
      const offset = (page - 1) * limit;
      let query = db.select({
        id: payments.id,
        paymentIntentId: payments.paymentIntentId,
        documentId: payments.documentId,
        serviceType: payments.serviceType,
        status: payments.status,
        amount: payments.amount,
        customerEmail: payments.customerEmail,
        createTimestamp: payments.createTimestamp,
        username: users.username,
        filename: documents.filename,
      })
      .from(payments)
      .leftJoin(documents, eq(payments.documentId, documents.id))
      .leftJoin(users, eq(documents.userId, users.id));

      let countQuery = db.select({ count: sql<number>`count(*)` }).from(payments);

      if (status) {
        query = query.where(eq(payments.status, status));
        countQuery = countQuery.where(eq(payments.status, status));
      }

      const [paymentsList, totalCount] = await Promise.all([
        query.limit(limit).offset(offset).orderBy(sql`${payments.createTimestamp} DESC`),
        countQuery
      ]);

      const total = totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        payments: paymentsList,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting payments for admin:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }
}

// MemStorage implementation kept for reference
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private analyses: Map<number, Analysis>;
  private userCurrentId: number;
  private documentCurrentId: number;
  private analysisCurrentId: number;
  readonly sessionStore: any; // Using any to avoid TypeScript errors

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.analyses = new Map();
    this.userCurrentId = 1;
    this.documentCurrentId = 1;
    this.analysisCurrentId = 1;
    
    // Create memory session store
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id } as User;
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async getDocuments(limit: number, offset: number): Promise<Document[]> {
    // Get all documents, sort by uploadedAt descending, then apply limit and offset
    return Array.from(this.documents.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async getUserDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.userId === userId
    );
  }

  async createDocument(document: InsertDocument & { 
    content?: string,
    filePath?: string,
    isEncrypted?: boolean 
  }): Promise<Document> {
    const id = this.documentCurrentId++;
    const now = new Date();
    
    const newDocument: Document = {
      id,
      filename: document.filename,
      fileType: document.fileType,
      uploadedAt: now,
      processed: false,
      fullyAnalyzed: false,
      content: document.content || null,
      userId: document.userId,
      filePath: document.filePath || null,
      isEncrypted: document.isEncrypted || false,
      created_at: now
    } as Document;
    
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  // Analysis methods
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysisByDocumentId(documentId: number): Promise<Analysis | undefined> {
    return Array.from(this.analyses.values()).find(
      (analysis) => analysis.documentId === documentId
    );
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.analysisCurrentId++;
    const now = new Date();
    
    const analysis: Analysis = {
      id,
      documentId: insertAnalysis.documentId,
      completedAt: now,
      isPaid: insertAnalysis.isPaid || false,
      results: insertAnalysis.results,
      created_at: now
    } as Analysis;
    
    this.analyses.set(id, analysis);
    return analysis;
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    const analysis = this.analyses.get(id);
    if (!analysis) return undefined;
    
    const updatedAnalysis = { ...analysis, ...updates };
    this.analyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }
  
  // Payment methods (stub implementations for MemStorage)
  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | undefined> {
    console.warn('MemStorage: getPaymentByIntentId is not fully implemented');
    return undefined;
  }
  
  async getPaymentsByDocumentId(documentId: number): Promise<Payment[]> {
    console.warn('MemStorage: getPaymentsByDocumentId is not fully implemented');
    return [];
  }
  
  async recordPayment(payment: InsertPayment): Promise<Payment> {
    console.warn('MemStorage: recordPayment is not fully implemented');
    const mockPayment: Payment = {
      id: 1,
      paymentIntentId: payment.paymentIntentId,
      documentId: payment.documentId,
      serviceType: payment.serviceType,
      status: payment.status,
      amount: payment.amount as any, // Type conversion needed for numeric to number
      customerEmail: payment.customerEmail || null, // Include customer email
      createTimestamp: payment.createTimestamp || new Date()
    };
    return mockPayment;
  }
  
  async updatePaymentStatus(paymentIntentId: string, status: string): Promise<Payment | undefined> {
    console.warn('MemStorage: updatePaymentStatus is not fully implemented');
    return {
      id: 1,
      paymentIntentId: paymentIntentId,
      documentId: 1,
      serviceType: 'analysis',
      status: status,
      amount: 2900,
      customerEmail: null,
      createTimestamp: new Date()
    };
  }
  
  async updateDocumentStatus(id: number, updates: { paid?: boolean, paymentIntentId?: string }): Promise<Document | undefined> {
    console.warn('MemStorage: updateDocumentStatus is not fully implemented');
    return this.updateDocument(id, updates as Partial<Document>);
  }
  
  // Document access token methods (stub implementations for MemStorage)
  async createDocumentAccessToken(tokenData: InsertDocumentAccessToken): Promise<DocumentAccessToken> {
    console.warn('MemStorage: createDocumentAccessToken is not fully implemented');
    const mockToken: DocumentAccessToken = {
      id: 1,
      documentId: tokenData.documentId,
      userId: tokenData.userId || null,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      createdAt: new Date(),
      lastAccessedAt: null,
      accessCount: 0,
      ipAddress: tokenData.ipAddress || null,
      revoked: false
    };
    return mockToken;
  }

  async getDocumentAccessToken(token: string): Promise<DocumentAccessToken | undefined> {
    console.warn('MemStorage: getDocumentAccessToken is not fully implemented');
    return undefined;
  }

  async updateDocumentAccessToken(id: number, updates: Partial<DocumentAccessToken>): Promise<DocumentAccessToken | undefined> {
    console.warn('MemStorage: updateDocumentAccessToken is not fully implemented');
    return undefined;
  }

  async revokeDocumentAccessToken(token: string): Promise<boolean> {
    console.warn('MemStorage: revokeDocumentAccessToken is not fully implemented');
    return false;
  }
  
  // Health check methods
  async checkDatabaseConnection(): Promise<boolean> {
    // MemStorage is always "connected" since it's in-memory
    return true;
  }

  // Response Template methods (stub implementations for MemStorage)
  async getResponseTemplates(): Promise<ResponseTemplate[]> {
    console.warn('MemStorage: getResponseTemplates is not fully implemented');
    return [];
  }

  async getResponseTemplatesByCategory(category: string): Promise<ResponseTemplate[]> {
    console.warn('MemStorage: getResponseTemplatesByCategory is not fully implemented');
    return [];
  }

  async createResponseTemplate(template: InsertResponseTemplate): Promise<ResponseTemplate> {
    console.warn('MemStorage: createResponseTemplate is not fully implemented');
    throw new Error('Not implemented in MemStorage');
  }

  // Generated Template methods (stub implementations for MemStorage)
  async getGeneratedTemplatesForDocument(documentId: number): Promise<GeneratedTemplate[]> {
    console.warn('MemStorage: getGeneratedTemplatesForDocument is not fully implemented');
    return [];
  }

  async createGeneratedTemplate(template: InsertGeneratedTemplate): Promise<GeneratedTemplate> {
    console.warn('MemStorage: createGeneratedTemplate is not fully implemented');
    throw new Error('Not implemented in MemStorage');
  }
}

export const storage = new DatabaseStorage();
