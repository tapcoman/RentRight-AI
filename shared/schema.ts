import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgSchema, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
}, (table) => ({
  usernameIdx: index("idx_users_username").on(table.username),
  emailIdx: index("idx_users_email").on(table.email),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }), // Now optional
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processed: boolean("processed").default(false).notNull(),
  fullyAnalyzed: boolean("fully_analyzed").default(false).notNull(),
  content: text("content"),
  filePath: text("file_path"), // Path to encrypted file
  created_at: timestamp("created_at").defaultNow().notNull(), // For cleanup
  isEncrypted: boolean("is_encrypted").default(false).notNull(), // Flag to indicate content encryption
  paid: boolean("paid").default(false), // Whether document is paid for premium analysis
  paymentIntentId: text("payment_intent_id"), // Reference to payment intent for tracking and verification
}, (table) => ({
  userIdIdx: index("idx_documents_user_id").on(table.userId),
  uploadedAtIdx: index("idx_documents_uploaded_at").on(table.uploadedAt),
  createdAtIdx: index("idx_documents_created_at").on(table.created_at),
}));

export const insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  filename: true,
  fileType: true,
  filePath: true,
  isEncrypted: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Analysis schema
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  results: jsonb("results").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(), // For cleanup
}, (table) => ({
  documentIdIdx: index("idx_analyses_document_id").on(table.documentId),
  createdAtIdx: index("idx_analyses_created_at").on(table.created_at),
}));

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  documentId: true,
  results: true,
  isPaid: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

// Response Templates schema
export const responseTemplates = pgTable("response_templates", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // e.g., "illegal_fees", "deposit_dispute", "repairs"
  title: text("title").notNull(),
  description: text("description").notNull(),
  templateContent: text("template_content").notNull(),
  legalBasis: text("legal_basis"), // Legal grounds for the template
  severity: text("severity").notNull(), // "low", "medium", "high"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("idx_response_templates_category").on(table.category),
  isActiveIdx: index("idx_response_templates_is_active").on(table.isActive),
  categoryActiveIdx: index("idx_response_templates_category_active").on(table.category, table.isActive),
}));

export const insertResponseTemplateSchema = createInsertSchema(responseTemplates).pick({
  category: true,
  title: true,
  description: true,
  templateContent: true,
  legalBasis: true,
  severity: true,
});

export type InsertResponseTemplate = z.infer<typeof insertResponseTemplateSchema>;
export type ResponseTemplate = typeof responseTemplates.$inferSelect;

// Generated Templates schema - tracks personalized templates for documents
export const generatedTemplates = pgTable("generated_templates", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  templateId: integer("template_id").references(() => responseTemplates.id).notNull(),
  personalizedContent: text("personalized_content").notNull(),
  analysisFindings: jsonb("analysis_findings"), // Specific findings that triggered this template
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  documentIdIdx: index("idx_generated_templates_document_id").on(table.documentId),
  templateIdIdx: index("idx_generated_templates_template_id").on(table.templateId),
}));

export const insertGeneratedTemplateSchema = createInsertSchema(generatedTemplates).pick({
  documentId: true,
  templateId: true,
  personalizedContent: true,
  analysisFindings: true,
});

export type InsertGeneratedTemplate = z.infer<typeof insertGeneratedTemplateSchema>;
export type GeneratedTemplate = typeof generatedTemplates.$inferSelect;

// Define the analysis results type
export interface PropertyDetails {
  address: string;
  propertyType: string;
  size: string;
}

export interface FinancialTerms {
  monthlyRent: string;
  totalDeposit: string;
  depositProtection: string;
  permittedFees: string;
  prohibitedFees?: string;
}

export interface LeasePeriod {
  startDate: string;
  endDate: string;
  tenancyType: string;
  noticePeriod: string;
}

export interface Parties {
  landlord: string;
  tenant: string;
  guarantor: string;
  agent?: string;
}

export interface Insight {
  title: string;
  content: string;
  type: "primary" | "accent" | "warning";
  indicators?: string[];
  rating?: {
    value: number;
    label: string;
  };
}

export interface Recommendation {
  content: string;
}

export interface Compliance {
  score: number;
  level: "green" | "yellow" | "red";
  summary: string;
}

// Define Clause interface for document processing
export interface Clause {
  clauseNumber: string;
  title: string;
  content: string;
  startPosition: number;
  type?: string; // Optional - can be set by clause type detection
  issues?: string[]; // Optional - potential issues in this clause
}

export interface AnalysisResults {
  propertyDetails: PropertyDetails & { confidence: string };
  financialTerms: FinancialTerms & { confidence: string };
  leasePeriod: LeasePeriod & { confidence: string };
  parties: Parties & { confidence: string };
  insights: Insight[];
  recommendations: Recommendation[];
  clauses?: Clause[]; // Optional - extracted clauses for detailed analysis
  validationPerformed?: boolean;
  ukLawVerificationPerformed?: boolean; // Indicates if UK-specific legal verification was done
  doubleVerified?: boolean; // Indicates if two-stage verification was completed
  verificationBadge?: string; // Text for verification badge in UI
  validationNote?: string;
  complianceScore?: number; // AI-provided compliance score as a direct property
  compliance?: Compliance; // Full compliance object with score, level and summary
  score?: number; // Another possible alternative field name
}

// Session schema for user authentication
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  userIdIdx: index("idx_sessions_user_id").on(table.userId),
  tokenIdx: index("idx_sessions_token").on(table.token),
  expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
}));

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  expiresAt: true,
  ipAddress: true,
  userAgent: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Payment records for tracking payment intents and their associated service types
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentIntentId: text("payment_intent_id").notNull().unique(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  serviceType: text("service_type").notNull(), // 'analysis' or 'combined'
  status: text("status").notNull(), // 'succeeded', 'pending', 'failed'
  amount: integer("amount").notNull(),
  customerEmail: text("customer_email"), // Store customer email for communication
  createTimestamp: timestamp("create_timestamp").defaultNow().notNull(),
}, (table) => ({
  paymentIntentIdIdx: index("idx_payments_payment_intent_id").on(table.paymentIntentId),
  documentIdIdx: index("idx_payments_document_id").on(table.documentId),
}));

export const insertPaymentSchema = createInsertSchema(payments).pick({
  paymentIntentId: true,
  documentId: true, 
  serviceType: true,
  status: true,
  amount: true,
  customerEmail: true,
  createTimestamp: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Document access tokens for secure sharing
export const documentAccessTokens = pgTable("document_access_tokens", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
  accessCount: integer("access_count").default(0).notNull(),
  ipAddress: text("ip_address"),
  revoked: boolean("revoked").default(false).notNull(),
}, (table) => ({
  documentIdIdx: index("idx_document_access_tokens_document_id").on(table.documentId),
  userIdIdx: index("idx_document_access_tokens_user_id").on(table.userId),
  tokenIdx: index("idx_document_access_tokens_token").on(table.token),
  expiresAtIdx: index("idx_document_access_tokens_expires_at").on(table.expiresAt),
  revokedIdx: index("idx_document_access_tokens_revoked").on(table.revoked),
  tokenValidationIdx: index("idx_document_access_tokens_token_validation").on(table.token, table.revoked, table.expiresAt),
}));

export const insertDocumentAccessTokenSchema = createInsertSchema(documentAccessTokens).pick({
  documentId: true,
  userId: true,
  token: true,
  expiresAt: true,
  ipAddress: true,
});

export type InsertDocumentAccessToken = z.infer<typeof insertDocumentAccessTokenSchema>;
export type DocumentAccessToken = typeof documentAccessTokens.$inferSelect;



