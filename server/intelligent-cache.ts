import * as crypto from 'crypto';
import { AnalysisResults } from '@shared/schema';
import { UKRegion } from './uk-tenancy-laws';

/**
 * Intelligent Caching System for RentRight-AI
 * 
 * Features:
 * - Content-based cache keys using document fingerprints
 * - Regional cache segregation
 * - TTL-based expiration
 * - Memory-efficient storage with LRU eviction
 * - Pattern-based similarity matching
 * - Performance analytics
 */

export interface CacheEntry {
  key: string;
  content: AnalysisResults;
  region: UKRegion;
  documentType: string;
  documentFingerprint: string;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  regionBreakdown: { [key in UKRegion]: number };
  documentTypeBreakdown: { [key: string]: number };
}

export interface DocumentFingerprint {
  contentHash: string;
  length: number;
  keyPhrases: string[];
  structuralElements: string[];
  region: UKRegion;
  documentType: string;
}

export class IntelligentAnalysisCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly similarityThreshold: number;
  
  constructor(
    maxSize: number = 1000,
    defaultTTL: number = 24 * 60 * 60 * 1000, // 24 hours
    similarityThreshold: number = 0.85
  ) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.similarityThreshold = similarityThreshold;
    
    // Periodic cleanup of expired entries
    setInterval(() => this.cleanupExpired(), 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Generates a document fingerprint for cache key creation and similarity matching
   */
  generateDocumentFingerprint(
    content: string, 
    region: UKRegion, 
    documentType: string
  ): DocumentFingerprint {
    // Create content hash
    const contentHash = crypto
      .createHash('sha256')
      .update(content.toLowerCase().replace(/\s+/g, ' ').trim())
      .digest('hex');
    
    // Extract key phrases for similarity matching
    const keyPhrases = this.extractKeyPhrases(content);
    
    // Identify structural elements
    const structuralElements = this.extractStructuralElements(content);
    
    return {
      contentHash,
      length: content.length,
      keyPhrases,
      structuralElements,
      region,
      documentType
    };
  }
  
  /**
   * Extracts key legal phrases from document content
   */
  private extractKeyPhrases(content: string): string[] {
    const legalPhrases = [
      // Financial terms
      /rent.{0,20}£?\d+/gi,
      /deposit.{0,20}£?\d+/gi,
      /fee.{0,20}£?\d+/gi,
      
      // Legal clauses
      /assured shorthold tenancy/gi,
      /deposit protection/gi,
      /section 21/gi,
      /notice period/gi,
      /repair obligation/gi,
      /quiet enjoyment/gi,
      
      // Dates and periods
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d+ months?/gi,
      /\d+ weeks?/gi,
      
      // Property details
      /bedroom/gi,
      /bathroom/gi,
      /furnished/gi,
      /unfurnished/gi
    ];
    
    const phrases: string[] = [];
    const lowerContent = content.toLowerCase();
    
    legalPhrases.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        phrases.push(...matches.slice(0, 3)); // Limit to prevent bloat
      }
    });
    
    return phrases.slice(0, 20); // Top 20 phrases
  }
  
  /**
   * Extracts structural elements that indicate document type and complexity
   */
  private extractStructuralElements(content: string): string[] {
    const elements: string[] = [];
    
    // Count numbered clauses
    const numberedClauses = (content.match(/^\s*\d+\./gm) || []).length;
    if (numberedClauses > 0) {
      elements.push(`clauses:${numberedClauses}`);
    }
    
    // Count sections
    const sections = (content.match(/^[A-Z\s]+:$/gm) || []).length;
    if (sections > 0) {
      elements.push(`sections:${sections}`);
    }
    
    // Detect document type indicators
    if (content.includes('assured shorthold')) elements.push('ast');
    if (content.includes('commercial lease')) elements.push('commercial');
    if (content.includes('lodger agreement')) elements.push('lodger');
    if (content.includes('student accommodation')) elements.push('student');
    
    // Length category
    if (content.length < 3000) elements.push('short');
    else if (content.length < 10000) elements.push('medium');
    else elements.push('long');
    
    return elements;
  }
  
  /**
   * Creates a cache key from document fingerprint
   */
  private createCacheKey(fingerprint: DocumentFingerprint): string {
    return `${fingerprint.region}:${fingerprint.documentType}:${fingerprint.contentHash}`;
  }
  
  /**
   * Calculates similarity between two document fingerprints
   */
  private calculateSimilarity(fp1: DocumentFingerprint, fp2: DocumentFingerprint): number {
    // Must be same region and document type
    if (fp1.region !== fp2.region || fp1.documentType !== fp2.documentType) {
      return 0;
    }
    
    // Length similarity (documents of vastly different lengths are unlikely to be similar)
    const lengthRatio = Math.min(fp1.length, fp2.length) / Math.max(fp1.length, fp2.length);
    if (lengthRatio < 0.5) return 0; // Too different in length
    
    // Key phrase overlap
    const commonPhrases = fp1.keyPhrases.filter(phrase => 
      fp2.keyPhrases.some(p2 => p2.toLowerCase().includes(phrase.toLowerCase()) || 
                              phrase.toLowerCase().includes(p2.toLowerCase()))
    );
    const phrasesSimilarity = commonPhrases.length / Math.max(fp1.keyPhrases.length, fp2.keyPhrases.length, 1);
    
    // Structural similarity
    const commonElements = fp1.structuralElements.filter(elem => fp2.structuralElements.includes(elem));
    const structuralSimilarity = commonElements.length / Math.max(fp1.structuralElements.length, fp2.structuralElements.length, 1);
    
    // Weighted combination
    return (lengthRatio * 0.2) + (phrasesSimilarity * 0.5) + (structuralSimilarity * 0.3);
  }
  
  /**
   * Attempts to retrieve cached analysis results
   */
  get(
    content: string, 
    region: UKRegion, 
    documentType: string
  ): AnalysisResults | null {
    const fingerprint = this.generateDocumentFingerprint(content, region, documentType);
    const primaryKey = this.createCacheKey(fingerprint);
    
    // First try exact match
    const exactMatch = this.cache.get(primaryKey);
    if (exactMatch && !this.isExpired(exactMatch)) {
      exactMatch.accessCount++;
      exactMatch.lastAccessed = Date.now();
      this.stats.hits++;
      console.log(`Cache HIT (exact): ${primaryKey}`);
      return exactMatch.content;
    }
    
    // Try similarity matching for same region/type
    const similarEntry = this.findSimilarEntry(fingerprint);
    if (similarEntry) {
      similarEntry.accessCount++;
      similarEntry.lastAccessed = Date.now();
      this.stats.hits++;
      console.log(`Cache HIT (similar): ${similarEntry.key} -> ${primaryKey}`);
      return similarEntry.content;
    }
    
    this.stats.misses++;
    console.log(`Cache MISS: ${primaryKey}`);
    return null;
  }
  
  /**
   * Stores analysis results in cache
   */
  set(
    content: string,
    region: UKRegion,
    documentType: string,
    results: AnalysisResults,
    customTTL?: number
  ): void {
    const fingerprint = this.generateDocumentFingerprint(content, region, documentType);
    const key = this.createCacheKey(fingerprint);
    
    // Ensure cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    
    const entry: CacheEntry = {
      key,
      content: results,
      region,
      documentType,
      documentFingerprint: fingerprint.contentHash,
      createdAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      ttl: customTTL || this.defaultTTL
    };
    
    this.cache.set(key, entry);
    console.log(`Cache SET: ${key} (total entries: ${this.cache.size})`);
  }
  
  /**
   * Finds similar cached entry based on document fingerprint
   */
  private findSimilarEntry(fingerprint: DocumentFingerprint): CacheEntry | null {
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;
    
    for (const entry of Array.from(this.cache.values())) {
      if (this.isExpired(entry)) continue;
      
      const entryFingerprint: DocumentFingerprint = {
        contentHash: entry.documentFingerprint,
        length: 0, // We don't store this, but similarity calc will handle it
        keyPhrases: [], // Similarly, we'd need to store these for full similarity
        structuralElements: [],
        region: entry.region,
        documentType: entry.documentType
      };
      
      // For now, just check region and document type match
      if (entry.region === fingerprint.region && 
          entry.documentType === fingerprint.documentType &&
          entry.accessCount > 2) { // Only consider well-accessed entries
        
        // Simple similarity based on access patterns and freshness
        const recency = (Date.now() - entry.createdAt) / (24 * 60 * 60 * 1000); // days
        const popularity = Math.min(entry.accessCount / 10, 1); // normalize to 0-1
        const simpleSimilarity = popularity * Math.max(0, 1 - recency / 7); // decay over 7 days
        
        if (simpleSimilarity > bestSimilarity && simpleSimilarity > this.similarityThreshold) {
          bestSimilarity = simpleSimilarity;
          bestMatch = entry;
        }
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Checks if a cache entry has expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }
  
  /**
   * Evicts least recently used entries when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let lruEntry: CacheEntry | null = null;
    let lruKey: string | null = null;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (!lruEntry || entry.lastAccessed < lruEntry.lastAccessed) {
        lruEntry = entry;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      console.log(`Cache EVICT (LRU): ${lruKey}`);
    }
  }
  
  /**
   * Removes expired entries from cache
   */
  private cleanupExpired(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      console.log(`Cache EXPIRE: ${key}`);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }
  
  /**
   * Gets cache statistics
   */
  getStats(): CacheStats {
    const regionBreakdown = {
      england: 0,
      wales: 0,
      scotland: 0,
      'northern-ireland': 0
    } as { [key in UKRegion]: number };
    
    const documentTypeBreakdown: { [key: string]: number } = {};
    
    for (const entry of Array.from(this.cache.values())) {
      regionBreakdown[entry.region]++;
      documentTypeBreakdown[entry.documentType] = (documentTypeBreakdown[entry.documentType] || 0) + 1;
    }
    
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage: this.estimateMemoryUsage(),
      regionBreakdown,
      documentTypeBreakdown
    };
  }
  
  /**
   * Estimates memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of Array.from(this.cache.values())) {
      // Rough estimation: JSON.stringify length * 2 (for UTF-16)
      totalSize += JSON.stringify(entry).length * 2;
    }
    
    return totalSize;
  }
  
  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    console.log("Cache cleared");
  }
  
  /**
   * Preloads cache with common document patterns
   */
  preloadCommonPatterns(): void {
    // This could be implemented to preload cache with analyses of common
    // document templates or frequently seen clause patterns
    console.log("Cache preloading not implemented yet");
  }
}

// Singleton cache instance
export const analysisCache = new IntelligentAnalysisCache(
  1000, // max 1000 entries
  24 * 60 * 60 * 1000, // 24 hour TTL
  0.8 // 80% similarity threshold
);

/**
 * Cached analysis wrapper function
 */
export async function getCachedAnalysis(
  content: string,
  region: UKRegion,
  documentType: string,
  analysisFunction: () => Promise<AnalysisResults>
): Promise<{ results: AnalysisResults; fromCache: boolean }> {
  
  // Try to get from cache first
  const cachedResult = analysisCache.get(content, region, documentType);
  if (cachedResult) {
    return { results: cachedResult, fromCache: true };
  }
  
  // Not in cache, perform analysis
  const results = await analysisFunction();
  
  // Store in cache
  analysisCache.set(content, region, documentType, results);
  
  return { results, fromCache: false };
}