import OpenAI from "openai";
import { AnalysisResults } from "@shared/schema";
import { 
  UKRegion, 
  PerformanceMetrics, 
  detectUKRegion, 
  preScreenDocumentForLegalIssues,
  startPerformanceTracking,
  endPerformanceTracking
} from './uk-tenancy-laws';
import {
  selectOptimalPrompt,
  buildOptimizedPrompt,
  createParallelAnalysisPrompts,
  detectDocumentType,
  TokenOptimizer
} from './optimized-prompts';
import { getCachedAnalysis } from './intelligent-cache';
import { PerformanceDashboard } from './performance-dashboard';

/**
 * Enhanced AI Analysis Engine for RentRight-AI
 * 
 * Features:
 * - Regional UK law awareness
 * - Optimized prompt system
 * - Parallel processing capabilities  
 * - Performance monitoring
 * - Smart document chunking
 * - Token usage optimization
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnhancedAnalysisOptions {
  region?: UKRegion;
  parallelProcessing?: boolean;
  detailedAnalysis?: boolean;
  performanceTracking?: boolean;
  maxTokens?: number;
}

/**
 * Enhanced document analysis with regional awareness and performance optimization
 */
export async function analyzeDocumentEnhanced(
  documentContent: string,
  options: EnhancedAnalysisOptions = {}
): Promise<{
  results: AnalysisResults;
  performance: PerformanceMetrics;
  tokenUsage: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  fromCache: boolean;
}> {
  
  // Initialize performance tracking
  const detectedRegion = options.region || detectUKRegion(documentContent);
  const documentType = detectDocumentType(documentContent);
  let metrics = startPerformanceTracking(detectedRegion, documentType);
  
  console.log(`Starting enhanced analysis for ${detectedRegion.toUpperCase()} ${documentType}`);
  
  try {
    // Try to get cached result first
    const cachedAnalysis = await getCachedAnalysis(
      documentContent,
      detectedRegion,
      documentType,
      async () => {
        // This function will only run if cache miss
        return await performActualAnalysis(documentContent, detectedRegion, documentType, options, metrics);
      }
    );
    
    if (cachedAnalysis.fromCache) {
      const finalMetrics = endPerformanceTracking(metrics, 0, 0);
      
      // Record performance event
      PerformanceDashboard.recordPerformanceEvent(
        finalMetrics.analysisEndTime ? finalMetrics.analysisEndTime - finalMetrics.analysisStartTime : 0,
        0, // No tokens used for cached results
        detectedRegion,
        true // From cache
      );
      
      console.log(`Analysis completed from cache for ${detectedRegion.toUpperCase()} ${documentType}`);
      
      return {
        results: cachedAnalysis.results,
        performance: finalMetrics,
        tokenUsage: { promptTokens: 0, responseTokens: 0, totalTokens: 0 },
        fromCache: true
      };
    }
    
    // Cache miss - return the fresh analysis result
    return {
      ...cachedAnalysis.results as any, // This contains the full analysis result structure
      fromCache: false
    };
    // This should never be reached due to the cache logic above, but keeping as fallback
    throw new Error('Unexpected code path in enhanced analysis');
    
  } catch (error: any) {
    console.error("Enhanced analysis error:", error);
    metrics = endPerformanceTracking(metrics);
    throw new Error(`Enhanced analysis failed: ${error.message}`);
  }
}

/**
 * Performs the actual analysis when cache miss occurs
 */
async function performActualAnalysis(
  documentContent: string,
  detectedRegion: UKRegion,
  documentType: string,
  options: EnhancedAnalysisOptions,
  metrics: PerformanceMetrics
): Promise<{
  results: AnalysisResults;
  performance: PerformanceMetrics;
  tokenUsage: { promptTokens: number; responseTokens: number; totalTokens: number; };
}> {
  // Step 1: Pre-screening with regional awareness
  const preScreenResults = preScreenDocumentForLegalIssues(documentContent, detectedRegion);
  console.log(`Pre-screening found ${preScreenResults.insights.length} potential issues`);
  
  // Step 2: Choose optimal processing strategy
  if (options.parallelProcessing && documentContent.length > 5000) {
    const result = await performParallelAnalysis(documentContent, detectedRegion, documentType, metrics);
    
    // Record performance event
    PerformanceDashboard.recordPerformanceEvent(
      result.performance.analysisEndTime ? result.performance.analysisEndTime - result.performance.analysisStartTime : 0,
      result.tokenUsage.totalTokens,
      detectedRegion,
      false
    );
    
    return result;
  } else {
    const result = await performOptimizedAnalysis(documentContent, detectedRegion, documentType, options, metrics, preScreenResults.insights);
    
    // Record performance event
    PerformanceDashboard.recordPerformanceEvent(
      result.performance.analysisEndTime ? result.performance.analysisEndTime - result.performance.analysisStartTime : 0,
      result.tokenUsage.totalTokens,
      detectedRegion,
      false
    );
    
    return result;
  }
}

/**
 * Optimized single-pass analysis using efficient prompts
 */
async function performOptimizedAnalysis(
  documentContent: string,
  region: UKRegion,
  documentType: string,
  options: EnhancedAnalysisOptions,
  metrics: PerformanceMetrics,
  preScreenInsights: any[]
): Promise<{
  results: AnalysisResults;
  performance: PerformanceMetrics;
  tokenUsage: { promptTokens: number; responseTokens: number; totalTokens: number; };
}> {
  
  // Select optimal prompt template
  const template = selectOptimalPrompt(
    documentContent.length,
    region,
    documentType,
    options.detailedAnalysis
  );
  
  console.log(`Using prompt template: ${template.name} (estimated ${template.baseTokens} base tokens)`);
  
  // Build optimized prompt
  const { prompt, estimatedTokens, truncated } = buildOptimizedPrompt(
    template,
    documentContent,
    region,
    documentType,
    options.maxTokens || 8000
  );
  
  if (truncated) {
    console.log("Document truncated for token efficiency");
  }
  
  // Execute analysis with optimized prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a UK housing law expert specializing in ${region.toUpperCase()} legislation. Provide precise, legally accurate analysis in the requested JSON format.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.1, // Lower temperature for more consistent legal analysis
  });
  
  // Parse response
  const content = response.choices[0].message.content || '{}';
  let analysisResults: AnalysisResults;
  
  try {
    analysisResults = JSON.parse(content);
    
    // CRITICAL DEBUG: Log what was parsed from OpenAI
    console.log('🔍 ENHANCED-ANALYSIS DEBUG - Parsed from OpenAI:', {
      hasInsights: !!analysisResults.insights,
      insightsCount: analysisResults.insights ? analysisResults.insights.length : 0,
      resultKeys: Object.keys(analysisResults),
      firstInsight: analysisResults.insights?.[0]
    });
    
    // Enhance with pre-screening insights
    if (analysisResults.insights && preScreenInsights.length > 0) {
      analysisResults.insights = [...preScreenInsights, ...analysisResults.insights];
    } else if (preScreenInsights.length > 0) {
      // CRITICAL FIX: If no insights from AI, use pre-screening insights
      analysisResults.insights = preScreenInsights;
    } else if (!analysisResults.insights) {
      // CRITICAL FIX: Ensure insights array exists
      analysisResults.insights = [];
    }
    
    // Add regional context
    analysisResults.validationNote = `Analysis performed using ${region.toUpperCase()} housing law`;
    analysisResults.verificationBadge = `${region.toUpperCase()} Law Verified`;
    
  } catch (parseError) {
    console.error("Failed to parse analysis results:", parseError);
    throw new Error("Failed to parse AI analysis response");
  }
  
  // Finalize performance metrics
  const finalMetrics = endPerformanceTracking(
    metrics,
    response.usage?.prompt_tokens,
    response.usage?.completion_tokens
  );
  
  const tokenUsage = {
    promptTokens: response.usage?.prompt_tokens || 0,
    responseTokens: response.usage?.completion_tokens || 0,
    totalTokens: response.usage?.total_tokens || 0
  };
  
  console.log(`Analysis complete. Tokens used: ${tokenUsage.totalTokens} (estimated: ${estimatedTokens})`);
  
  // CRITICAL DEBUG: Log final results being returned
  console.log('🔍 ENHANCED-ANALYSIS DEBUG - Final results being returned:', {
    hasInsights: !!analysisResults.insights,
    insightsCount: analysisResults.insights ? analysisResults.insights.length : 0,
    allInsightTitles: analysisResults.insights?.map(i => i.title) || []
  });
  
  return {
    results: analysisResults,
    performance: finalMetrics,
    tokenUsage
  };
}

/**
 * Parallel processing for complex documents
 */
async function performParallelAnalysis(
  documentContent: string,
  region: UKRegion,
  documentType: string,
  metrics: PerformanceMetrics
): Promise<{
  results: AnalysisResults;
  performance: PerformanceMetrics;
  tokenUsage: { promptTokens: number; responseTokens: number; totalTokens: number; };
}> {
  
  console.log("Performing parallel analysis for complex document");
  
  // Create specialized prompts for parallel processing
  const prompts = createParallelAnalysisPrompts(documentContent, region);
  
  // Execute all analyses in parallel
  const [legalResponse, financialResponse, riskResponse] = await Promise.all([
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompts.legalCompliancePrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.1
    }),
    openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{ role: "user", content: prompts.financialTermsPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.1
    }),
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompts.riskAssessmentPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.1
    })
  ]);
  
  // Parse responses
  const legalResults = JSON.parse(legalResponse.choices[0].message.content || '{}');
  const financialResults = JSON.parse(financialResponse.choices[0].message.content || '{}');
  const riskResults = JSON.parse(riskResponse.choices[0].message.content || '{}');
  
  // Combine results into unified analysis
  const combinedResults: AnalysisResults = {
    propertyDetails: {
      address: financialResults.address || "Not specified",
      propertyType: "Residential",
      size: financialResults.size || "Not specified",
      confidence: "medium"
    },
    financialTerms: {
      monthlyRent: financialResults.monthlyRent || "Not specified",
      totalDeposit: financialResults.deposit || "Not specified",
      depositProtection: legalResults.depositProtection || "Not specified",
      permittedFees: financialResults.permittedFees || [],
      prohibitedFees: legalResults.prohibitedFees || [],
      confidence: "high"
    },
    leasePeriod: {
      startDate: financialResults.startDate || "Not specified",
      endDate: financialResults.endDate || "Not specified", 
      tenancyType: legalResults.tenancyType || "Assured Shorthold Tenancy",
      noticePeriod: legalResults.noticePeriod || "Not specified",
      confidence: "medium"
    },
    parties: {
      landlord: financialResults.landlord || "Not specified",
      tenant: financialResults.tenant || "Not specified",
      guarantor: financialResults.guarantor || "None specified",
      confidence: "medium"
    },
    insights: [
      ...(legalResults.insights || []),
      ...(riskResults.insights || [])
    ],
    recommendations: [
      ...(legalResults.recommendations || []),
      ...(riskResults.recommendations || [])
    ],
    complianceScore: legalResults.complianceScore || 50,
    compliance: legalResults.compliance || {
      score: 50,
      level: "yellow",
      summary: "Partial compliance analysis completed"
    },
    validationNote: `Parallel analysis for ${region.toUpperCase()} housing law`,
    verificationBadge: `${region.toUpperCase()} Parallel Verified`
  };
  
  // Calculate total token usage
  const totalTokenUsage = {
    promptTokens: (legalResponse.usage?.prompt_tokens || 0) + 
                 (financialResponse.usage?.prompt_tokens || 0) + 
                 (riskResponse.usage?.prompt_tokens || 0),
    responseTokens: (legalResponse.usage?.completion_tokens || 0) + 
                   (financialResponse.usage?.completion_tokens || 0) + 
                   (riskResponse.usage?.completion_tokens || 0),
    totalTokens: 0
  };
  totalTokenUsage.totalTokens = totalTokenUsage.promptTokens + totalTokenUsage.responseTokens;
  
  const finalMetrics = endPerformanceTracking(
    metrics,
    totalTokenUsage.promptTokens,
    totalTokenUsage.responseTokens
  );
  
  console.log(`Parallel analysis complete. Total tokens: ${totalTokenUsage.totalTokens}`);
  
  return {
    results: combinedResults,
    performance: finalMetrics,
    tokenUsage: totalTokenUsage
  };
}

/**
 * Smart document chunking with overlap and context preservation
 */
export function createSmartChunks(
  content: string,
  maxChunkSize: number = 6000,
  overlapSize: number = 500
): Array<{
  content: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  isLastChunk: boolean;
}> {
  
  const chunks = [];
  const contentLength = content.length;
  
  // Find natural breakpoints (paragraph breaks, clause numbers, etc.)
  const breakpoints = [];
  const breakPatterns = [
    /\n\s*\d+\.\s/g, // Numbered clauses
    /\n\s*[A-Z][A-Z\s]+:\s/g, // Section headers
    /\n\n/g, // Paragraph breaks
  ];
  
  breakPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      breakpoints.push(match.index);
    }
  });
  
  breakpoints.sort((a, b) => a - b);
  
  let currentPosition = 0;
  let chunkIndex = 0;
  
  while (currentPosition < contentLength) {
    let endPosition = Math.min(currentPosition + maxChunkSize, contentLength);
    
    // Find the best breakpoint within the chunk
    if (endPosition < contentLength) {
      const suitableBreakpoints = breakpoints.filter(bp => 
        bp > currentPosition + maxChunkSize * 0.7 && bp <= endPosition
      );
      
      if (suitableBreakpoints.length > 0) {
        endPosition = suitableBreakpoints[suitableBreakpoints.length - 1];
      }
    }
    
    const chunkContent = content.substring(currentPosition, endPosition);
    const isLastChunk = endPosition >= contentLength;
    
    chunks.push({
      content: chunkContent,
      chunkIndex,
      startPosition: currentPosition,
      endPosition,
      isLastChunk
    });
    
    // Move to next chunk with overlap
    currentPosition = Math.max(endPosition - overlapSize, endPosition);
    chunkIndex++;
  }
  
  return chunks;
}

/**
 * Performance monitoring and analytics
 */
export class AnalysisPerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  
  static recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 100 records to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }
  
  static getAverageAnalysisTime(region?: UKRegion): number {
    const relevantMetrics = region ? 
      this.metrics.filter(m => m.region === region) : 
      this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const totalTime = relevantMetrics.reduce((total, metric) => {
      const duration = metric.analysisEndTime ? 
        metric.analysisEndTime - metric.analysisStartTime : 0;
      return total + duration;
    }, 0);
    
    return totalTime / relevantMetrics.length;
  }
  
  static getTokenEfficiency(): {
    averagePromptTokens: number;
    averageResponseTokens: number;
    totalAnalyses: number;
  } {
    const validMetrics = this.metrics.filter(m => m.promptTokensUsed && m.responseTokensUsed);
    
    if (validMetrics.length === 0) {
      return { averagePromptTokens: 0, averageResponseTokens: 0, totalAnalyses: 0 };
    }
    
    const totalPromptTokens = validMetrics.reduce((total, m) => total + (m.promptTokensUsed || 0), 0);
    const totalResponseTokens = validMetrics.reduce((total, m) => total + (m.responseTokensUsed || 0), 0);
    
    return {
      averagePromptTokens: totalPromptTokens / validMetrics.length,
      averageResponseTokens: totalResponseTokens / validMetrics.length,
      totalAnalyses: validMetrics.length
    };
  }
  
  static getPerformanceReport(): {
    totalAnalyses: number;
    averageResponseTime: number;
    regionBreakdown: { [key in UKRegion]: number };
    documentTypeBreakdown: { [key: string]: number };
    tokenEfficiency: { averagePromptTokens: number; averageResponseTokens: number; totalAnalyses: number; };
  } {
    const regionBreakdown = {
      england: 0,
      wales: 0,
      scotland: 0,
      'northern-ireland': 0
    } as { [key in UKRegion]: number };
    
    const documentTypeBreakdown: { [key: string]: number } = {};
    
    this.metrics.forEach((metric) => {
      regionBreakdown[metric.region]++;
      documentTypeBreakdown[metric.documentType] = (documentTypeBreakdown[metric.documentType] || 0) + 1;
    });
    
    return {
      totalAnalyses: this.metrics.length,
      averageResponseTime: this.getAverageAnalysisTime(),
      regionBreakdown,
      documentTypeBreakdown,
      tokenEfficiency: this.getTokenEfficiency()
    };
  }
}