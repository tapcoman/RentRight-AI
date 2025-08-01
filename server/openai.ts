import OpenAI from "openai";
import { Document, Analysis, AnalysisResults } from "@shared/schema";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logoPngBase64 } from "./logo";
import { 
  analyzeDocumentEnhanced, 
  EnhancedAnalysisOptions,
  AnalysisPerformanceMonitor,
  createSmartChunks
} from "./enhanced-analysis";
import { 
  UKRegion, 
  detectUKRegion, 
  preScreenDocumentForLegalIssues, 
  checkUKTenancyCompliance,
  preScreenWithRecentCaseLaw,
  getLegalPrecedentSummary 
} from "./uk-tenancy-laws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the OpenAI client only once for the entire file
// using the newest model "gpt-4o" released May 13, 2024, optimized for legal analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minutes timeout for API calls
  maxRetries: 3, // Enhanced retry mechanism
});

// Enhanced error handling with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  
  throw lastError!;
};

// Enhanced helper function to wait for a run to complete with improved error handling
async function waitForRunCompletion(threadId: string, runId: string, maxRetries = 30) {
  let retries = 0;
  console.log(`Waiting for run completion: threadId=${threadId}, runId=${runId}`);

  while (retries < maxRetries) {
    try {
      console.log(`Checking run status (attempt ${retries + 1}/${maxRetries})...`);
      
      // Use enhanced retry mechanism for API calls
      const run = await withRetry(async () => {
        return await openai.beta.threads.runs.retrieve(threadId, runId);
      }, 3, 1000);
      
      console.log(`Current run status: ${run.status}`);

      if (run.status === "completed") {
        console.log("Run completed successfully");
        return run;
      }

      if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
        const errorDetails = {
          status: run.status,
          error: run.last_error,
          threadId,
          runId,
          timestamp: new Date().toISOString()
        };
        console.error(`Run failed with status: ${run.status}`, errorDetails);
        throw new Error(`Run failed with status: ${run.status}. ${run.last_error?.message || "Unknown error"}`);
      }

      if (run.status === "requires_action") {
        console.log("Run requires action - attempting to handle...");
        // Handle required actions here if needed
        if (run.required_action?.type === "submit_tool_outputs") {
          console.log("Tool outputs required - submitting empty response to continue");
          await withRetry(async () => {
            return await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
              tool_outputs: []
            });
          }, 3, 1000);
        }
      }

      // If still in progress, wait before checking again
      // Enhanced exponential backoff with jitter
      const baseDelay = 1000 * Math.pow(1.5, retries);
      const jitter = Math.random() * 1000; // Add random jitter to prevent thundering herd
      const delayTime = Math.min(baseDelay + jitter, 20000); // Cap at 20 seconds
      
      console.log(`Waiting ${Math.round(delayTime)}ms before next check...`);
      await delay(delayTime);
      retries++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error checking run status (attempt ${retries + 1}):`, {
        error: errorMessage,
        threadId,
        runId,
        timestamp: new Date().toISOString()
      });
      
      // Enhanced error handling with different strategies for different error types
      if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
        console.log('Rate limit detected, using extended backoff...');
        await delay(10000); // Wait 10 seconds for rate limits
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        console.log('Network/timeout error detected, using moderate backoff...');
        await delay(5000); // Wait 5 seconds for network issues
      } else {
        await delay(3000); // Standard backoff for other errors
      }
      
      retries++;
      
      // If we've had too many errors, throw with enhanced error context
      if (retries >= maxRetries) {
        throw new Error(`Failed to check run status after ${maxRetries} attempts. Last error: ${errorMessage}. ThreadId: ${threadId}, RunId: ${runId}`);
      }
    }
  }

  const timeoutError = `Timed out waiting for run to complete after ${maxRetries} attempts (${Math.round(maxRetries * 1.5)}+ minutes). ThreadId: ${threadId}, RunId: ${runId}`;
  console.error(timeoutError);
  throw new Error(timeoutError);
}

// Function to generate a comprehensive tenancy agreement rewrite using OpenAI
export async function generateTenancyAgreementRewrite(documentContent: string, analysisResults?: any): Promise<string> {
  // Validate document content
  if (!documentContent || documentContent.trim() === '') {
    throw new Error("No document content available for rewrite");
  }

  try {
    console.log("Starting tenancy agreement rewrite generation with OpenAI...");

    // Split document into manageable chunks if needed
    const documentChunks = chunkDocumentContent(documentContent, 12000);
    let fullContent = documentContent;

    // If document needed to be chunked, we need a preliminary analysis
    if (documentChunks.length > 1) {
      console.log(`Document too large (${documentContent.length} chars). Using chunked processing approach.`);

      // Create a thread for analyzing the document in chunks
      const thread = await openai.beta.threads.create();

      // Process chunks sequentially, sending each one to OpenAI
      for (let i = 0; i < documentChunks.length; i++) {
        const isFirstChunk = i === 0;
        const isLastChunk = i === documentChunks.length - 1;

        let messagePrefix = isFirstChunk 
          ? "I'm sending you a UK residential tenancy agreement in multiple parts. Please read it carefully to understand its structure and content before I ask you to rewrite it. This is PART 1:" 
          : `This is PART ${i + 1} of the tenancy agreement:`;

        let messageSuffix = isLastChunk
          ? "\n\nNow that you've seen the entire agreement, I want you to prepare to rewrite it. Don't rewrite it yet, just acknowledge that you understand the document structure."
          : "\n\nPlease continue reading the next part.";

        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: `${messagePrefix}\n\n${documentChunks[i]}${messageSuffix}`
        });
      }

      // Run the assistant to process the whole document in memory
      const initialRun = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: process.env.OPENAI_ASSISTANT_ID as string,
        instructions: "Read and understand this tenancy agreement without outputting the full text yet."
      });

      // Wait for processing to complete using the correct runId
      await waitForRunCompletion(thread.id, initialRun.id);

      // Create the recommendations section if analysis results are available
      let recommendationsSection = "";
      if (analysisResults?.recommendations && analysisResults.recommendations.length > 0) {
        recommendationsSection = `

SPECIFIC RECOMMENDATIONS FROM ANALYSIS:
Based on the detailed analysis of this lease agreement, please specifically address these recommendations:

${analysisResults.recommendations.map((rec: any, index: number) => 
  `${index + 1}. ${rec.content || rec.recommendation || rec}`
).join('\n')}

These recommendations should be directly implemented in the rewritten agreement to address the specific issues identified.`;
      }

      // Now instruct the model to rewrite the agreement with all parts in mind
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Now that you've read the entire agreement, please rewrite it to be maximally tenant-protective while remaining legally valid. Transform this into a comprehensive document that prioritises tenant rights and welfare within the full scope of UK housing law:
${recommendationsSection}

CRITICAL TENANT-PROTECTIVE REQUIREMENTS:

**Legal Compliance & Tenant Rights:**
- Apply ALL mandatory tenant protections under Housing Act 1988, Landlord and Tenant Act 1985, Consumer Rights Act 2015, and Tenant Fees Act 2019
- Include explicit Right to Rent compliance statements protecting tenant privacy
- Add mandatory deposit protection scheme details with full tenant rights explanation
- Include statutory periodic tenancy provisions favouring tenant security
- Incorporate Homes (Fitness for Human Habitation) Act 2018 landlord obligations

**Address Specific Analysis Findings:**
- Prioritize implementing the specific recommendations listed above
- Focus on fixing the exact issues identified in the analysis
- Ensure every recommendation is directly addressed in the rewritten clauses
- Add protective language specifically targeting the identified concerns

**Tenant-Favourable Terms:**
- Set minimum 2-month break clause for tenant (if break clause exists)
- Limit landlord break clause to 6-month minimum notice
- Include "quiet enjoyment" guarantees with 24-48 hour minimum notice for landlord visits
- Add explicit tenant right to request repairs with mandatory landlord response timeframes
- Include protection against retaliatory eviction under Deregulation Act 2015
- Guarantee tenant right to make minor alterations with reasonable consent
- Include explicit subletting rights where legally permissible

**Financial Protections:**
- Cap any permitted charges at legal minimums under Tenant Fees Act 2019
- Include rent review protections limiting increases to annual maximum
- Add explicit utility bill responsibility clarifications favouring tenant
- Include cleaning/maintenance cost protections at end of tenancy
- Guarantee return of deposit within statutory timeframes with interest where applicable

**Clarity & Fairness:**
- Remove ANY potentially unfair contract terms under Consumer Rights Act 2015
- Translate all legal jargon into clear, understandable English
- Add explanatory notes for tenant benefit throughout document
- Include tenant rights summary section referencing Citizens Advice and Shelter resources
- Ensure all clauses pass the "fairness test" under consumer protection law

**Document Structure:**
- Use proper legal formatting with numbered clauses
- Include comprehensive definitions section explaining all terms
- Add tenant rights appendix with contact information for housing advice services
- Format with # for main sections, ## for subsections
- Include specific reference to relevant legislation in each protective clause

Transform this agreement to give tenants maximum legal protection while ensuring landlords can still operate within the law. Every clause should be scrutinised to favour tenant welfare where legally possible, with special attention to the specific recommendations identified in the analysis.`
      });

      // Run the assistant again to generate the rewrite
      const rewriteRun = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: process.env.OPENAI_ASSISTANT_ID as string,
        instructions: "Generate a complete, professional rewrite of the tenancy agreement based on all the parts you've read."
      });

      // Wait for completion
      await waitForRunCompletion(thread.id, rewriteRun.id);

      // Get the rewritten content
      const messages = await openai.beta.threads.messages.list(thread.id, {
        order: "desc",
        limit: 1
      });

      const assistantMessage = messages.data.find(msg => msg.role === "assistant");
      if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== "text") {
        throw new Error("Failed to get valid rewrite response from assistant");
      }

      return assistantMessage.content[0].text.value;
    } else {
      // For documents within token limits, use our specialized assistant model
      console.log("Using specialized UK tenancy law assistant for lease rewrite");
      
      // Create a thread for the assistant
      const thread = await openai.beta.threads.create();

      // Create the recommendations section if analysis results are available
      let recommendationsSection = "";
      if (analysisResults?.recommendations && analysisResults.recommendations.length > 0) {
        recommendationsSection = `

SPECIFIC RECOMMENDATIONS FROM ANALYSIS:
Based on the detailed analysis of this lease agreement, please specifically address these recommendations:

${analysisResults.recommendations.map((rec: any, index: number) => 
  `${index + 1}. ${rec.content || rec.recommendation || rec}`
).join('\n')}

These recommendations should be directly implemented in the rewritten agreement to address the specific issues identified.`;
      }

      // Send the document to the assistant
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Please rewrite this UK residential tenancy agreement to be maximally tenant-protective while remaining legally valid. Transform this into a comprehensive document that prioritises tenant rights and welfare within the full scope of UK housing law:

${documentContent}
${recommendationsSection}

CRITICAL TENANT-PROTECTIVE REQUIREMENTS:

**Legal Compliance & Tenant Rights:**
- Apply ALL mandatory tenant protections under Housing Act 1988, Landlord and Tenant Act 1985, Consumer Rights Act 2015, and Tenant Fees Act 2019
- Include explicit Right to Rent compliance statements protecting tenant privacy
- Add mandatory deposit protection scheme details with full tenant rights explanation
- Include statutory periodic tenancy provisions favouring tenant security
- Incorporate Homes (Fitness for Human Habitation) Act 2018 landlord obligations

**Address Specific Analysis Findings:**
- Prioritize implementing the specific recommendations listed above
- Focus on fixing the exact issues identified in the analysis
- Ensure every recommendation is directly addressed in the rewritten clauses
- Add protective language specifically targeting the identified concerns

**Tenant-Favourable Terms:**
- Set minimum 2-month break clause for tenant (if break clause exists)
- Limit landlord break clause to 6-month minimum notice
- Include "quiet enjoyment" guarantees with 24-48 hour minimum notice for landlord visits
- Add explicit tenant right to request repairs with mandatory landlord response timeframes
- Include protection against retaliatory eviction under Deregulation Act 2015
- Guarantee tenant right to make minor alterations with reasonable consent
- Include explicit subletting rights where legally permissible

**Financial Protections:**
- Cap any permitted charges at legal minimums under Tenant Fees Act 2019
- Include rent review protections limiting increases to annual maximum
- Add explicit utility bill responsibility clarifications favouring tenant
- Include cleaning/maintenance cost protections at end of tenancy
- Guarantee return of deposit within statutory timeframes with interest where applicable

**Clarity & Fairness:**
- Remove ANY potentially unfair contract terms under Consumer Rights Act 2015
- Translate all legal jargon into clear, understandable English
- Add explanatory notes for tenant benefit throughout document
- Include tenant rights summary section referencing Citizens Advice and Shelter resources
- Ensure all clauses pass the "fairness test" under consumer protection law

**Document Structure:**
- Use proper legal formatting with numbered clauses
- Include comprehensive definitions section explaining all terms
- Add tenant rights appendix with contact information for housing advice services
- Format with # for main sections, ## for subsections
- Include specific reference to relevant legislation in each protective clause

Transform this agreement to give tenants maximum legal protection while ensuring landlords can still operate within the law. Every clause should be scrutinised to favour tenant welfare where legally possible, with special attention to the specific recommendations identified in the analysis.`
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: process.env.OPENAI_ASSISTANT_ID as string,
        instructions: "Generate a complete, professional rewrite of this tenancy agreement that is tenant-friendly and legally compliant with UK housing law."
      });

      // Wait for completion
      await waitForRunCompletion(thread.id, run.id);

      // Get the rewritten content
      const messages = await openai.beta.threads.messages.list(thread.id, {
        order: "desc",
        limit: 1
      });

      const assistantMessage = messages.data.find(msg => msg.role === "assistant");
      if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== "text") {
        throw new Error("Failed to get valid rewrite response from assistant");
      }

      console.log("Successfully received tenancy agreement rewrite response from specialized assistant");
      return assistantMessage.content[0].text.value;
    }
  } catch (error: any) {
    console.error("Error generating tenancy agreement rewrite:", error);
    throw new Error(`Failed to generate tenancy agreement rewrite: ${error.message}`);
  }
}

// Now let's fix the generate rewrite feature

// Enhanced helper function to chunk large documents for optimized API processing with GPT-4o
function chunkDocumentContent(text: string, maxChunkLength: number = 18000): string[] {
  // If text is already within size limits, return as-is
  if (text.length <= maxChunkLength) {
    return [text];
  }

  console.log(`Document length ${text.length} exceeds maximum chunk size. Using intelligent chunking optimized for GPT-4o legal analysis.`);

  const chunks: string[] = [];
  let currentPosition = 0;
  
  // Enhanced token estimation for GPT-4o (more accurate than simple character count)
  const estimateTokens = (str: string) => Math.ceil(str.length / 3.2); // GPT-4o averages ~3.2 chars per token
  
  // Improved natural breakpoint detection optimized for legal documents
  const findOptimalBreakpoint = (text: string, start: number, maxEnd: number) => {
    const priorities = [
      /\n\n\s*\d+\./g,         // Numbered clauses (highest priority for legal docs)
      /\n\n[A-Z][^\n]{0,80}:/g, // Section headers
      /\n\n\s*\([a-z]\)/g,     // Sub-clauses like (a), (b), (c)
      /\n\n/g,                 // Double line breaks (paragraph boundaries)
      /(?<=\.)\s+(?=[A-Z])/g, // Sentence boundaries
      /\n/g,                  // Single line breaks
      /, /g                   // Comma breaks (lowest priority)
    ];
    
    const searchText = text.slice(start, maxEnd);
    
    for (const pattern of priorities) {
      pattern.lastIndex = 0; // Reset regex
      const matches = [...searchText.matchAll(pattern)];
      if (matches.length > 0) {
        // Find the match closest to the ideal position (70% through the chunk for legal docs)
        const idealPosition = searchText.length * 0.7;
        const bestMatch = matches.reduce((best, current) => {
          const currentDist = Math.abs(current.index! - idealPosition);
          const bestDist = Math.abs(best.index! - idealPosition);
          return currentDist < bestDist ? current : best;
        });
        return start + bestMatch.index! + bestMatch[0].length;
      }
    }
    return maxEnd; // Fallback to hard break
  };

  // Enhanced chunking with token optimization for legal analysis
  while (currentPosition < text.length) {
    // Calculate dynamic chunk size based on content density and token estimation
    const remainingText = text.slice(currentPosition);
    const sampleText = remainingText.slice(0, Math.min(1000, remainingText.length));
    const tokenDensity = estimateTokens(sampleText) / sampleText.length;
    
    // Adjust chunk size based on token density (legal docs tend to be token-dense)
    const adjustedChunkLength = tokenDensity > 0.35 ? maxChunkLength * 0.85 : maxChunkLength;
    
    // Determine end position for current chunk
    let endPosition = Math.min(currentPosition + adjustedChunkLength, text.length);

    // If we're not at the end of the text, find optimal breakpoint
    if (endPosition < text.length) {
      // Expanded search range for better breakpoint detection
      const searchStart = Math.max(currentPosition + adjustedChunkLength * 0.6, currentPosition);
      const searchEnd = Math.min(currentPosition + adjustedChunkLength * 1.15, text.length);
      
      endPosition = findOptimalBreakpoint(text, searchStart, searchEnd);
      
      // Ensure we don't create tiny chunks (minimum 30% of target size)
      if (endPosition - currentPosition < adjustedChunkLength * 0.3) {
        endPosition = Math.min(currentPosition + adjustedChunkLength, text.length);
      }
    }

    // Extract the chunk
    const chunk = text.substring(currentPosition, endPosition).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    currentPosition = endPosition;
  }

  const totalTokensEstimate = chunks.reduce((sum, chunk) => sum + estimateTokens(chunk), 0);
  console.log(`Split document into ${chunks.length} optimized chunks:`, {
    chunkCount: chunks.length,
    averageChunkLength: Math.round(chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length),
    estimatedTotalTokens: totalTokensEstimate,
    chunkSizes: chunks.map(chunk => ({ chars: chunk.length, tokens: estimateTokens(chunk) }))
  });

  // Add enhanced context to each chunk for better legal analysis
  return chunks.map((chunk, index) => {
    if (chunks.length > 1) {
      const contextHeader = `[LEGAL DOCUMENT ANALYSIS - PART ${index + 1} OF ${chunks.length}]\n` +
                            `[Estimated tokens: ~${estimateTokens(chunk)}]\n` +
                            `[Chunk context: This is section ${index + 1} of a UK tenancy agreement requiring comprehensive legal analysis]\n\n`;
      return contextHeader + chunk;
    }
    return chunk;
  });
}

export async function analyzeDocumentWithOpenAI(
  documentContent: string, 
  options: { 
    region?: UKRegion; 
    useEnhancedAnalysis?: boolean;
    parallelProcessing?: boolean;
    detailedAnalysis?: boolean;
  } = {}
): Promise<AnalysisResults> {
  // Validate document content
  if (!documentContent || documentContent.trim() === '') {
    throw new Error("No document content available for analysis");
  }

  // Use enhanced analysis if requested (default for better performance)
  if (options.useEnhancedAnalysis !== false) {
    console.log("Using enhanced AI analysis with regional awareness");
    
    const enhancedOptions: EnhancedAnalysisOptions = {
      region: options.region,
      parallelProcessing: options.parallelProcessing || documentContent.length > 10000,
      detailedAnalysis: options.detailedAnalysis || false,
      performanceTracking: true,
      maxTokens: 8000
    };
    
    const { results, performance, tokenUsage } = await analyzeDocumentEnhanced(
      documentContent, 
      enhancedOptions
    );
    
    // Record performance metrics
    AnalysisPerformanceMonitor.recordMetrics(performance);
    
    console.log(`Enhanced analysis completed in ${performance.analysisEndTime ? 
      performance.analysisEndTime - performance.analysisStartTime : 0}ms using ${tokenUsage.totalTokens} tokens`);
    
    return results;
  }
  
  // Legacy analysis fallback
  console.log("Using legacy AI analysis");

  // Overall timeout for the entire analysis process (15 minutes)
  const timeout = 15 * 60 * 1000; // 15 minutes in milliseconds
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Document analysis timed out after 15 minutes')), timeout);
  });

  try {
    console.log("Starting OpenAI document analysis...");
    
    // Get the Assistant ID from environment variables
    const assistantId = process.env.OPENAI_ASSISTANT_ID;

    if (!assistantId) {
      throw new Error("OpenAI Assistant ID is not configured. Please set the OPENAI_ASSISTANT_ID environment variable.");
    }

    console.log(`Using OpenAI Assistant ID: ${assistantId}`);

    // Split document into manageable chunks to avoid token limits
    const documentChunks = chunkDocumentContent(documentContent);
    console.log(`Document split into ${documentChunks.length} chunks for processing`);

    // Step 1: Create a thread
    console.log("Creating new OpenAI thread...");
    const thread = await openai.beta.threads.create();

    // Step 2: Add message(s) to the thread with the document content
    if (documentChunks.length === 1) {
      // Single chunk - normal processing
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Please analyse this UK residential tenancy agreement according to current UK housing laws (2024-2025) and professional standards. Focus on tenant rights, deposit protection, property considerations, and identifying any potentially unfair clauses or terms. Use plain English that is accessible to the average tenant or landlord:

${documentContent}

## CRITICAL 2024-2025 LEGAL FRAMEWORK
Your analysis MUST consider these recent and pending legislative changes:

**RENTERS (REFORM) BILL 2024-2025:**
- Abolition of Section 21 'no-fault' evictions (pending implementation)
- Enhanced grounds for possession under Section 8
- Mandatory landlord registration and property portal requirements
- Strengthened tenant rights to request property improvements
- New decent homes standards for private rentals
- Enhanced penalties for discriminatory practices

**UPDATED DEPOSIT PROTECTION (2024-2025):**
- Deposit cap remains at 5 weeks' rent (Tenant Fees Act 2019)
- Enhanced dispute resolution procedures through approved schemes
- Stricter penalties for non-compliance (up to 3x deposit amount)
- New requirements for deposit transfer between tenancies

**RIGHT TO RENT UPDATES (2024-2025):**
- Digital right to rent checks now mandatory for new tenancies
- Enhanced penalties for landlords (up to £3,000 per tenant)
- New shared accommodation rules
- Updated acceptable document list

**CONSUMER RIGHTS ACT INTERPRETATIONS (2024-2025):**
- Expanded definition of unfair contract terms
- Stronger protection against penalty clauses
- Enhanced transparency requirements for terms and conditions
- New consumer dispute resolution pathways

**HOUSING ACT 2004 AMENDMENTS (2024-2025):**
- Updated Housing Health and Safety Rating System (HHSRS)
- Enhanced selective licensing requirements
- Stricter enforcement powers for local authorities
- New energy efficiency standards (EPC rating C minimum by 2028)

## RECENT CASE LAW AND TRIBUNAL DECISIONS (2024-2025)
**KEY BINDING PRECEDENTS:**
- **Switaj v McClenaghan [2024] EWCA Civ 1457**: Tenant Fees Act does not apply retrospectively to pre-2019 payments
- **London Tribunal June 2024**: Early termination fees and re-letting costs are prohibited payments (£2,252 penalty awarded)
- **Housing 35 Plus Ltd v Nottingham City Council (Upper Tribunal 2024)**: Strict HMO licensing enforcement, £15,000+ penalties for non-compliance
- **Shah Rent Repayment Case (Upper Tribunal 2024)**: Rent repayment orders upheld for unlicensed HMO operators
- **Accent Housing v Howe Properties [2024] EWCA Civ**: Service charge "proportionate part" allows flexibility but must be reasonable
- **Hajan v London Borough of Brent [2024] EWCA Civ 1260**: Possession claims can be amended to add absolute grounds

**2024 ENFORCEMENT TRENDS:**
- Zero tolerance for prohibited payments under Tenant Fees Act 2019
- HMO licensing enforcement intensified with significant financial penalties
- Deposit protection strictly enforced (1-3x deposit penalties for non-compliance)
- Early termination clauses under increased scrutiny
- Service charge disputes require detailed lease analysis for "fair proportion" calculations

Provide your analysis in JSON format with these sections:
- propertyDetails (address, propertyType, size, confidence)
- financialTerms (monthlyRent, totalDeposit, depositProtection, permittedFees, prohibitedFees, confidence)
- leasePeriod (startDate, endDate, tenancyType, noticePeriod, confidence)
- parties (landlord, tenant, guarantor, agent, confidence)
- insights (array of objects with title, content, type, indicators/rating)
- recommendations (array of objects with content)
- complianceScore (0-100 based on legal compliance)
- compliance (object with score, level, summary, and riskFactors array)

In your insights, include analysis related to: property standards, management best practices, condition assessment, health & safety compliance, fair dealing considerations, and compliance with 2024-2025 legislative requirements. Use language that is accessible to the average tenant or landlord, avoiding legal jargon where possible. If you identify any concerning clauses, also suggest alternative wording that would be fairer for both parties.`
      });
    } else {
      // Multiple chunks - we need to process them in sequence
      // First chunk with initial instructions
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `I'm going to send you a UK residential tenancy agreement in multiple parts due to its length. This is PART 1 OF ${documentChunks.length}. Please read all parts before providing your complete analysis.

${documentChunks[0]}

Wait for all ${documentChunks.length} parts before analyzing. Just acknowledge receipt of this part.`
      });

      // Middle chunks
      for (let i = 1; i < documentChunks.length - 1; i++) {
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: `This is PART ${i + 1} OF ${documentChunks.length} of the tenancy agreement:

${documentChunks[i]}

Please continue reading. Wait for all parts before analyzing.`
        });
      }

      // Final chunk with analysis instructions
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `This is the FINAL PART ${documentChunks.length} OF ${documentChunks.length} of the tenancy agreement:

${documentChunks[documentChunks.length - 1]}

Now that you have the complete document, please analyse this UK residential tenancy agreement according to current UK housing laws (2024-2025) and professional standards. Focus on tenant rights, deposit protection, property considerations, and identifying any potentially unfair clauses or terms. Use plain English that is accessible to the average tenant or landlord.

## CRITICAL 2024-2025 LEGAL FRAMEWORK
Your analysis MUST consider these recent and pending legislative changes:

**RENTERS (REFORM) BILL 2024-2025:**
- Abolition of Section 21 'no-fault' evictions (pending implementation)
- Enhanced grounds for possession under Section 8
- Mandatory landlord registration and property portal requirements
- Strengthened tenant rights to request property improvements
- New decent homes standards for private rentals
- Enhanced penalties for discriminatory practices

**UPDATED DEPOSIT PROTECTION (2024-2025):**
- Deposit cap remains at 5 weeks' rent (Tenant Fees Act 2019)
- Enhanced dispute resolution procedures through approved schemes
- Stricter penalties for non-compliance (up to 3x deposit amount)
- New requirements for deposit transfer between tenancies

**RIGHT TO RENT UPDATES (2024-2025):**
- Digital right to rent checks now mandatory for new tenancies
- Enhanced penalties for landlords (up to £3,000 per tenant)
- New shared accommodation rules
- Updated acceptable document list

**CONSUMER RIGHTS ACT INTERPRETATIONS (2024-2025):**
- Expanded definition of unfair contract terms
- Stronger protection against penalty clauses
- Enhanced transparency requirements for terms and conditions
- New consumer dispute resolution pathways

**HOUSING ACT 2004 AMENDMENTS (2024-2025):**
- Updated Housing Health and Safety Rating System (HHSRS)
- Enhanced selective licensing requirements
- Stricter enforcement powers for local authorities
- New energy efficiency standards (EPC rating C minimum by 2028)

## RECENT CASE LAW AND TRIBUNAL DECISIONS (2024-2025)
**KEY BINDING PRECEDENTS:**
- **Switaj v McClenaghan [2024] EWCA Civ 1457**: Tenant Fees Act does not apply retrospectively to pre-2019 payments
- **London Tribunal June 2024**: Early termination fees and re-letting costs are prohibited payments (£2,252 penalty awarded)
- **Housing 35 Plus Ltd v Nottingham City Council (Upper Tribunal 2024)**: Strict HMO licensing enforcement, £15,000+ penalties for non-compliance
- **Shah Rent Repayment Case (Upper Tribunal 2024)**: Rent repayment orders upheld for unlicensed HMO operators
- **Accent Housing v Howe Properties [2024] EWCA Civ**: Service charge "proportionate part" allows flexibility but must be reasonable
- **Hajan v London Borough of Brent [2024] EWCA Civ 1260**: Possession claims can be amended to add absolute grounds

**2024 ENFORCEMENT TRENDS:**
- Zero tolerance for prohibited payments under Tenant Fees Act 2019
- HMO licensing enforcement intensified with significant financial penalties
- Deposit protection strictly enforced (1-3x deposit penalties for non-compliance)
- Early termination clauses under increased scrutiny
- Service charge disputes require detailed lease analysis for "fair proportion" calculations

Provide your analysis in JSON format with these sections:
- propertyDetails (address, propertyType, size, confidence)
- financialTerms (monthlyRent, totalDeposit, depositProtection, permittedFees, prohibitedFees, confidence)
- leasePeriod (startDate, endDate, tenancyType, noticePeriod, confidence)
- parties (landlord, tenant, guarantor, agent, confidence)
- insights (array of objects with title, content, type, indicators/rating)
- recommendations (array of objects with content)
- complianceScore (a number from 0-100 representing overall compliance with UK housing laws)
- compliance (an object with score, level ["green", "yellow", or "red"], summary, and riskFactors array)

In your insights, include analysis related to: property standards, management best practices, condition assessment, health & safety compliance, fair dealing considerations, and compliance with 2024-2025 legislative requirements. Use language that is accessible to the average tenant or landlord, avoiding legal jargon where possible. If you identify any concerning clauses, also suggest alternative wording that would be fairer for both parties.`
      });
    }

    // Step 3: Run the assistant on the thread with enhanced configuration and retry logic
    const run = await withRetry(async () => {
      return await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
        model: "gpt-4o", // Explicitly specify latest GPT-4o model
        temperature: 0.1, // Low temperature for consistent legal analysis
        max_prompt_tokens: 50000, // Optimize token usage for legal analysis
        max_completion_tokens: 10000, // Allow comprehensive analysis output
        instructions: `Perform a rigorous, in-depth analysis of this UK tenancy agreement according to current UK housing laws (2024-2025). Include ALL relevant legislation, especially the Housing Act 1988, Tenant Fees Act 2019, Consumer Rights Act 2015, Landlord and Tenant Act 1985, Renters (Reform) Bill 2024-2025, Housing Act 2004 amendments, and updated Right to Rent requirements. Write in plain English suitable for the general public.

      ## CRITICAL: TENANT PROTECTION EMPHASIS

      You must adopt a HYPER-VIGILANT, tenant-protective stance when analyzing this agreement. Your primary responsibility is to identify ALL potentially problematic clauses, even if they might be borderline acceptable. When in doubt, ALWAYS flag issues rather than giving landlords the benefit of the doubt.

      ## ISSUE CLASSIFICATION & SCORING SYSTEM

      For each issue detected, assign it to one of these categories:

      1. SERIOUS LEGAL VIOLATIONS (Heavily impacts Legal Protection Score)
         - Rules/regulations that can be changed unilaterally by the landlord (Consumer Rights Act violation)
         - Clauses placing excessive liability on tenants for landlord responsibilities
         - Prohibited fees under Tenant Fees Act 2019
         - Unfair deposit requirements (above 5-week limit, lack of protection scheme)
         - Terms waiving statutory tenant rights
         - Discriminatory clauses
         - Penalty clauses that are disproportionate

      2. MODERATE LEGAL CONCERNS (Moderately impacts Legal Protection Score)
         - Vague or ambiguous clauses that could be interpreted against tenant interests
         - Minor restrictions on tenant rights that may be legally permissible but potentially unfair
         - Landlord access clauses with minimal notice periods (but above the 24-hour minimum)
         - Terms that are technically legal but diverge from best practices

      3. MINOR ISSUES (Slightly impacts Legal Protection Score)
         - Standard terms that are acceptable but could be improved for clarity
         - Terms that meet legal minimums but fall short of ideal tenant protection
         - Clauses that lack detail but aren't inherently harmful

      ## ANALYSIS FRAMEWORK & SCORING SYSTEM

      If ANY pre-detected issues are noted at the beginning of the document, these MUST be included in your analysis with "warning" severity and detailed explanations of why they violate specific laws.

      For each clause or section:
      1. Identify if it complies with all relevant UK housing laws
      2. Specifically cite which law applies (e.g., "violates Section 11 of Landlord and Tenant Act 1985")
      3. Explain why it's unfair or non-compliant in plain language
      4. Assign a clear severity level based on this standard:
         - SERIOUS VIOLATIONS: Use "warning" type (these heavily impact the Legal Protection Score)
         - MODERATE CONCERNS: Use "accent" type (these moderately impact the Legal Protection Score)
         - MINOR ISSUES: Use "primary" type (these slightly impact the Legal Protection Score)
      5. Where possible, include a numerical "rating" object with values between 0-100:
         - 0-40: Poor protection (Serious legal concerns)
         - 41-60: Fair protection (Some legal concerns)
         - 61-80: Good protection (Minor legal concerns)
         - 81-100: Excellent protection (Fully compliant)

      ## EXAMPLE UNFAIR TERMS (These should ALWAYS be flagged)

      - "The landlord may change the rules at any time with immediate effect"
      - "The tenant is responsible for all repairs including structural repairs"
      - "The tenant must pay for professional cleaning at the end of tenancy"
      - "The landlord may enter the property at any time"
      - "The tenant cannot withhold rent for any reason"

      ## ASSESSMENT VISUALIZATION SYSTEM

      The analysis must NEVER minimize serious issues. Apply these strict guidelines for assessing legal compliance:

      - SERIOUS ISSUES: Identify any direct violations of UK housing laws, unfair terms, or highly imbalanced clauses
      - MODERATE ISSUES: Flag clauses that may be legally compliant but potentially problematic or unclear
      - LEGAL PROTECTION SCORING: Each insight should contribute to an overall assessment of tenant protection level
      
      ## COMPLIANCE SCORING REQUIREMENTS

      You MUST include a numerical compliance score (0-100) in your analysis that reflects how well this agreement complies with UK housing laws:
      
      - Calculate the complianceScore based on the severity and quantity of issues found
      - Include a "compliance" object with: score (0-100), level ("green", "yellow", or "red"), and summary text
      - Use these score ranges:
        * 0-40: "red" level (Serious legal concerns)
        * 41-74: "yellow" level (Some legal concerns)
        * 75-100: "green" level (Good compliance)
      - For each serious legal violation, subtract 15-25 points from the starting score of 100
      - For each moderate concern, subtract 5-15 points
      - For each minor issue, subtract 1-5 points

      ## IMPORTANCE OF THOROUGHNESS

      This is a PAID premium analysis (£15) that tenants rely on for legal protection. Be extremely thorough - better to flag too many potential issues than to miss critical legal violations that could harm tenants.
      
      ## ENHANCED VALUE DELIVERY (£15 PREMIUM SERVICE)
      
      Your analysis must justify the premium price by providing:
      - Comprehensive legal risk assessment with confidence intervals
      - Specific statutory references for each issue identified
      - Practical recommendations with implementation priority
      - Plain English explanations of complex legal concepts
      - Alternative clause wording suggestions for problematic terms
      - Proactive identification of potential future legal risks
      - Clear action plan with timelines for addressing issues

      Format your response as a JSON object with this exact structure. This will be used in a paid report (£15) so provide SUBSTANTIAL VALUE with comprehensive insights:

      {
        "propertyDetails": {
          "address": "Full property address",
          "propertyType": "Type of property (e.g., flat, house)",
          "size": "Size description (bedrooms, bathrooms)",
          "confidence": "High Confidence"
        },
        "financialTerms": {
          "monthlyRent": "£X",
          "totalDeposit": "£X",
          "depositProtection": "Scheme mentioned or Not specified",
          "permittedFees": "List of permitted fees under Tenant Fees Act",
          "prohibitedFees": "Any prohibited fees identified",
          "confidence": "Medium Confidence"
        },
        "leasePeriod": {
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD or Periodic",
          "tenancyType": "AST, Periodic, etc.",
          "noticePeriod": "Notice period for tenant and landlord",
          "confidence": "High Confidence"
        },
        "parties": {
          "landlord": "Landlord name",
          "tenant": "Tenant name",
          "guarantor": "Guarantor name or 'Not specified'",
          "agent": "Agent name or 'Not specified'",
          "confidence": "Medium Confidence"
        },
        "insights": [
          {
            "title": "Deposit Protection Compliance (2024-2025)",
            "content": "The deposit of £X is properly protected through the [Scheme Name] as required by the Housing Act 2004 and complies with the 5-week cap under the Tenant Fees Act 2019. The agreement clearly states the deposit will be registered within 30 days and provides details on the dispute resolution process. Enhanced penalties for non-compliance (up to 3x deposit amount) under 2024 regulations are properly addressed.",
            "type": "primary",
            "rating": {
              "value": 90,
              "label": "Excellent Protection",
              "confidenceInterval": "88-92",
              "riskLevel": "low"
            },
            "legalReferences": ["Housing Act 2004 s.213", "Tenant Fees Act 2019 s.1", "Deposit Protection Regulations 2024"],
            "tenantRightsImpact": "high_protection"
          },
          {
            "title": "Tenant Fees Assessment (Enhanced 2024-2025)",
            "content": "The agreement largely complies with the Tenant Fees Act 2019, with permitted charges limited to rent, deposit, and reasonable default fees. However, clause 8.3 mentions a £50 fee for contract amendments which may violate the Act's prohibited payments provisions (penalty up to £5,000 under 2024 enforcement). This should be removed or replaced with wording that only allows reasonable costs actually incurred. Digital payment processing requirements under 2024 regulations should also be addressed.",
            "type": "accent",
            "rating": {
              "value": 65,
              "label": "Good Protection",
              "confidenceInterval": "60-70",
              "riskLevel": "moderate"
            },
            "indicators": ["Default Fees", "Permitted Payments", "Prohibited Charges", "Digital Payment Compliance"],
            "legalReferences": ["Tenant Fees Act 2019 s.1-3", "Consumer Rights Act 2015 s.62", "Payment Services Regulations 2024"],
            "tenantRightsImpact": "moderate_protection",
            "scoringWeight": 15
          },
          {
            "title": "Repair Responsibilities Distribution (Critical 2024-2025)",
            "content": "CRITICAL LEGAL VIOLATION: Clause 12.4 makes the tenant responsible for 'all repairs including structural and exterior repairs' which directly violates Section 11 of the Landlord and Tenant Act 1985. This clause is legally unenforceable as it attempts to transfer the landlord's statutory repair obligations to the tenant. Under 2024-2025 enforcement, this could result in unlimited compensation claims and enhanced penalties. The new Decent Homes Standards (2024) explicitly prohibit such clauses. This presents a significant legal risk to the tenant and should be challenged immediately.",
            "type": "warning",
            "rating": {
              "value": 15,
              "label": "Critical Legal Risk",
              "confidenceInterval": "10-20",
              "riskLevel": "critical"
            },
            "indicators": ["Tenant Repair Obligation", "Landlord Response Timeline", "Statutory Compliance", "Decent Homes Standards"],
            "legalReferences": ["Landlord & Tenant Act 1985 s.11", "Decent Homes Standards 2024", "Consumer Rights Act 2015 s.62"],
            "tenantRightsImpact": "severe_violation",
            "scoringWeight": 35,
            "immediateAction": true
          },
          {
            "title": "Break Clause and Exit Terms",
            "content": "The break clause at month 6 is standard and allows either party to terminate with 2 months' notice. The surrender terms are reasonable and do not impose excessive penalties. However, the wording could be clearer regarding the exact process for activating the break clause.",
            "type": "primary",
            "rating": {
              "value": 85,
              "label": "Good Protection"
            },
            "indicators": ["Notice Period", "Early Termination Fees", "Surrender Terms"]
          },
          {
            "title": "Right to Quiet Enjoyment",
            "content": "MODERATE CONCERN: While the agreement acknowledges the tenant's right to quiet enjoyment, clause 14.2 allows landlord access with only 12 hours' notice instead of the 24 hours typically required. This falls short of best practices and could potentially interfere with tenant privacy rights. The clause should be amended to provide at least 24 hours' written notice.",
            "type": "accent",
            "rating": {
              "value": 55,
              "label": "Fair Protection"
            },
            "indicators": ["Landlord Access", "Notice Requirements", "Usage Restrictions"]
          },
          {
            "title": "Rent Increase Mechanisms",
            "content": "The rent review provisions are clear and fair, allowing increases only once per year with proper notice. The mechanism for calculating increases is transparent and tied to the Consumer Price Index, which provides good predictability for tenants.",
            "type": "primary",
            "rating": {
              "value": 88,
              "label": "Excellent Protection"
            },
            "indicators": ["Increase Frequency", "Increase Caps", "Notice Requirements"]
          },
          {
            "title": "Unfair Contract Terms Assessment",
            "content": "SERIOUS LEGAL VIOLATION: Clause 16 contains multiple unfair terms under the Consumer Rights Act 2015, including provisions that: 1) Allow the landlord to vary terms unilaterally without notice, 2) Impose disproportionate penalties for minor breaches, and 3) Prevent tenants from withholding rent even for legitimate reasons. These terms create a significant imbalance between parties and would likely be unenforceable in court.",
            "type": "warning",
            "rating": {
              "value": 20,
              "label": "Poor Protection"
            },
            "indicators": ["Disproportionate Penalties", "Unreasonable Restrictions", "Imbalanced Obligations"]
          },
          {
            "title": "Subletting and Assignment Rights",
            "content": "The prohibition on subletting without consent is standard, but the absolute ban on assignment may be overly restrictive. The clause should ideally state that consent for assignment will not be unreasonably withheld. This is a minor issue as such restrictions are common in residential tenancies.",
            "type": "accent",
            "rating": {
              "value": 60,
              "label": "Fair Protection"
            },
            "indicators": ["Absolute Prohibition", "Reasonable Consent", "Assignment Conditions"]
          }
        ],
        "recommendations": [
          {
            "content": "IMMEDIATE ACTION: Request immediate removal of clause 12.4 which illegally transfers the landlord's repair obligations to you. Cite Section 11 of the Landlord and Tenant Act 1985 and Decent Homes Standards 2024.",
            "priority": "critical",
            "timeline": "before_signing",
            "legalBasis": "Landlord & Tenant Act 1985 s.11, Decent Homes Standards 2024"
          },
          {
            "content": "HIGH PRIORITY: Ask for clause 16 to be rewritten to remove the unfair terms that violate the Consumer Rights Act 2015, particularly regarding unilateral changes and disproportionate penalties. Under 2024-2025 enforcement, these could result in unlimited damages.",
            "priority": "high",
            "timeline": "within_7_days",
            "legalBasis": "Consumer Rights Act 2015 s.62-63"
          },
          {
            "content": "MODERATE PRIORITY: Negotiate for the landlord access notice period to be increased from 12 to 24 hours in clause 14.2, which is the standard minimum in the UK and required under enhanced tenant privacy rights (2024).",
            "priority": "moderate",
            "timeline": "during_negotiation",
            "legalBasis": "Quiet Enjoyment Rights, Privacy Regulations 2024"
          },
          {
            "content": "HIGH PRIORITY: Request removal of the £50 amendment fee mentioned in clause 8.3 as this likely violates the Tenant Fees Act 2019. Enhanced penalties of up to £5,000 apply under 2024 enforcement.",
            "priority": "high",
            "timeline": "before_signing",
            "legalBasis": "Tenant Fees Act 2019 s.1"
          },
          {
            "content": "Ask for clarification on the exact process for activating the break clause, including the format of notice required (e.g., written, email) and compliance with digital notice requirements under 2024 regulations.",
            "priority": "moderate",
            "timeline": "during_negotiation",
            "legalBasis": "Digital Communications Act 2024"
          },
          {
            "content": "Consider negotiating for a clause stating that consent for assignment will not be unreasonably withheld, though this is a lower priority than the serious legal issues above.",
            "priority": "low",
            "timeline": "optional",
            "legalBasis": "Landlord & Tenant Act 1988"
          }
        ],
        "complianceScore": 45,
        "compliance": {
          "score": 45,
          "level": "orange",
          "summary": "This agreement has significant legal compliance issues that require immediate attention. Critical violations include illegal repair obligation transfers and prohibited fees that could result in substantial penalties under 2024-2025 enforcement. Several clauses violate current UK housing laws and tenant protection standards.",
          "riskFactors": [
            "Critical: Illegal repair obligations (Landlord & Tenant Act 1985 violation)",
            "High: Prohibited fees under Tenant Fees Act 2019",
            "High: Unfair contract terms violating Consumer Rights Act 2015",
            "Moderate: Substandard landlord access provisions",
            "Moderate: Missing 2024-2025 legislative compliance updates"
          ],
          "confidenceLevel": "high",
          "recommendedActions": [
            "Priority 1: Remove illegal repair obligations (immediate - before signing)",
            "Priority 2: Eliminate prohibited fees (within 7 days)",
            "Priority 3: Rewrite unfair contract terms (within 14 days)",
            "Priority 4: Update access notice periods (during negotiation)",
            "Priority 5: Add 2024-2025 legislative compliance clauses (before final agreement)"
          ],
          "legalRiskAssessment": {
            "immediateRisks": ["Unenforceable repair clauses", "Penalty fee violations"],
            "mediumTermRisks": ["Consumer rights violations", "Privacy right breaches"],
            "longTermRisks": ["Regulatory non-compliance", "Enhanced penalty exposure"]
          },
          "scoringBreakdown": {
            "criticalViolations": 2,
            "seriousConcerns": 3,
            "moderateIssues": 2,
            "minorGaps": 1,
            "totalDeductions": 55,
            "finalScore": 45
          }
        }
      }

      IMPORTANT: 
      1. Provide at least 8 comprehensive insights covering different aspects of the agreement
      2. Make each insight detailed but explain legislation in simple, accessible language
      3. Be thorough in your analysis but avoid legal jargon where possible
      4. Provide at least 6 actionable recommendations written in plain English
      5. Include ONLY insights that are relevant to this specific agreement, not generic ones
      6. For problematic clauses, suggest clearer, fairer alternative wording
      7. Use UK English spelling (e.g., "analyse" not "analyze")`
      });
    }, 3, 2000);
    
    console.log(`Analysis run started successfully: ${run.id}`);

    // Step 4: Wait for the run to complete (with enhanced timeout and progress tracking)
    console.log(`Starting run completion wait with timeout protection...`);
    const analysisPromise = (async () => {
      // Wait for run to complete
      console.log(`Waiting for OpenAI run to complete (ID: ${run.id})...`);
      const completedRun = await waitForRunCompletion(thread.id, run.id);
      console.log(`Run ${run.id} completed successfully`);

      // Step 5: Retrieve messages after completion with enhanced retry
      console.log(`Retrieving messages from thread ${thread.id}...`);
      const messages = await withRetry(async () => {
        return await openai.beta.threads.messages.list(thread.id, {
          order: "desc", // Get most recent messages first
          limit: 1 // Just get the latest message
        });
      }, 3, 1500);

      // Extract the assistant's response
      const assistantMessage = messages.data.find(msg => msg.role === "assistant");
      if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== "text") {
        throw new Error("Failed to get valid response from assistant");
      }

      const content = assistantMessage.content[0].text.value;
      console.log(`Retrieved response from OpenAI assistant (${content.length} characters)`);

      // Parse the content as JSON 
      // Find the JSON part of the response (in case the assistant adds other text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Failed to extract JSON from assistant response");
        console.error("Response content:", content.substring(0, 500) + "...");
        throw new Error("Failed to extract JSON from assistant response");
      }

      const jsonContent = jsonMatch[0];
      console.log(`Extracted JSON content (${jsonContent.length} characters)`);
      
      try {
        const analysisResults: AnalysisResults = JSON.parse(jsonContent);
        console.log(`Successfully parsed analysis results from OpenAI`);
        return analysisResults;
      } catch (error: unknown) {
        const parseError = error instanceof Error ? error : new Error(String(error));
        console.error("JSON parsing error:", parseError);
        console.error("JSON content (first 500 chars):", jsonContent.substring(0, 500));
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
    })();

    // Race between the analysis and the timeout
    const analysisResults = await Promise.race([analysisPromise, timeoutPromise]);
    console.log(`Analysis completed within timeout period`);
    
    return analysisResults;
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorContext = {
      error: errorMessage,
      documentLength: documentContent.length,
      timestamp: new Date().toISOString(),
      elapsedTime: Math.round((Date.now() - analysisStartTime) / 1000)
    };
    
    console.error("OpenAI analysis error:", errorContext);
    
    // Enhanced error categorization and messaging
    if (errorMessage.includes('timeout')) {
      throw new Error(`Document analysis timed out after ${errorContext.elapsedTime} seconds. This may be due to document complexity or API performance issues. Please try again or contact support if the problem persists.`);
    } else if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
      throw new Error(`OpenAI API rate limit exceeded. Please wait a moment and try again. If this persists, contact support.`);
    } else if (errorMessage.includes('token') || errorMessage.includes('length')) {
      throw new Error(`Document is too large or complex for analysis. Consider breaking it into smaller sections or contact support for assistance with large documents.`);
    } else if (errorMessage.includes('JSON')) {
      throw new Error(`Analysis completed but the response format was invalid. This is a temporary issue - please try again. If it persists, contact support.`);
    } else {
      throw new Error(`Failed to analyze document: ${errorMessage}. Please try again or contact support if the problem continues.`);
    }
  }
}

/**
 * DEPRECATED: Secondary validation has been removed per user request.
 * This function is no longer used in the analysis pipeline.
 * 
 * Previously performed secondary analysis to validate the primary analysis results.
 */
/* DISABLED - Secondary validation removed per user request
export async function validateAnalysisWithSecondaryAI(initialAnalysis: AnalysisResults, documentContent: string): Promise<AnalysisResults> {
  // Validate inputs
  if (!initialAnalysis) {
    throw new Error("No initial analysis provided for validation");
  }

  if (!documentContent || documentContent.trim() === '') {
    throw new Error("No document content available for validation");
  }
  
  // Overall timeout for the secondary validation (8 minutes)
  const timeout = 8 * 60 * 1000; // 8 minutes in milliseconds
  const timeoutPromise = new Promise<AnalysisResults>((resolve) => {
    setTimeout(() => {
      console.warn("Secondary validation timed out after 8 minutes, returning original analysis");
      resolve({
        ...initialAnalysis,
        validationNote: "Secondary validation timed out after 8 minutes. Using original analysis only."
      });
    }, timeout);
  });

  // Maximum number of retries for OpenAI API calls
  const MAX_RETRIES = 3;
  let attempt = 0;
  let lastError: Error | null = null;

  // Create a promise for the validation process with retries
  const validationPromise = async () => {
    while (attempt < MAX_RETRIES) {
      try {
        console.log(`Starting specialized UK law secondary validation (attempt ${attempt + 1})...`);

        // Create a simpler version of the initial analysis to reduce token usage and ensure compatibility
        const simplifiedAnalysis = {
          propertyDetails: initialAnalysis.propertyDetails,
          financialTerms: initialAnalysis.financialTerms,
          leasePeriod: initialAnalysis.leasePeriod,
          parties: initialAnalysis.parties,
          insights: initialAnalysis.insights?.map(insight => ({
            title: insight.title,
            content: insight.content,
            type: insight.type
          })),
          recommendations: initialAnalysis.recommendations,
          complianceScore: initialAnalysis.complianceScore,
          compliance: initialAnalysis.compliance
        };

        // Step 1: First perform detailed UK housing law assessment using GPT-4o
        // This specifically focuses on UK legal compliance rather than general analysis
        const ukLawResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are an expert UK housing solicitor specializing in tenancy agreement analysis. 
Your task is to conduct a thorough legal compliance assessment of a tenancy agreement based on UK law.

FOCUS EXCLUSIVELY ON THESE UK HOUSING LAWS:
1. Housing Act 1988 (as amended) - Tenancy types, notice periods, and grounds for possession
2. Tenant Fees Act 2019 - Prohibited fees, deposit caps (5 weeks' rent limit)
3. Housing Act 2004 - Deposit protection schemes, HMO licensing
4. Landlord and Tenant Act 1985 - Landlord repair responsibilities, fitness for human habitation
5. Consumer Rights Act 2015 - Unfair contract terms in tenancy agreements
6. Deregulation Act 2015 - Revenge eviction protection, section 21 requirements
7. Homes (Fitness for Human Habitation) Act 2018 - Property standards
8. Electrical Safety Standards 2020 - Safety inspections and certificates
9. Gas Safety Regulations 1998 - Annual gas safety checks
10. Right to Rent provisions under Immigration Act 2014
11. Renters (Reform) Bill - If implemented, assess compliance with new provisions

YOUR OUTPUT MUST BE VALID JSON that follows the structure below with no text outside this structure:

{
  "uk_housing_law_assessment": {
    "primary_legal_issues": [
      {
        "issue": "string",
        "law_reference": "string",
        "explanation": "string",
        "severity": "high" | "medium" | "low"
      }
    ],
    "deposit_protection_compliance": {
      "compliant": true | false,
      "explanation": "string"
    },
    "prohibited_fees_compliance": {
      "compliant": true | false,
      "explanation": "string"
    },
    "landlord_repair_responsibilities": {
      "compliant": true | false,
      "explanation": "string"
    },
    "notice_periods": {
      "compliant": true | false,
      "explanation": "string"
    },
    "unfair_terms_assessment": {
      "problematic_terms_found": true | false,
      "details": ["string"]
    },
    "overall_compliance_score": 0-100,
    "compliance_level": "green" | "yellow" | "red",
    "compliance_summary": "string",
    "missed_legal_issues": ["string"],
    "additional_recommendations": ["string"]
  }
}`
            },
            {
              role: "user",
              content: `Conduct a UK housing law compliance assessment of this residential tenancy agreement:

DOCUMENT EXCERPT (Key sections):
${(() => {
  // More intelligent document truncation focusing on legal sections
  // For large documents, extract sections most relevant to legal compliance
  if (documentContent.length > 12000) {
    const beginning = documentContent.substring(0, 3000);
    
    // Target key legal sections in UK tenancy agreements
    const legalKeywordPatterns = [
      /deposit.{0,100}(protection|scheme|TDS|DPS|mydeposits)/i,
      /security.{0,30}deposit/i,
      /tenant fee|prohibited.{0,30}(fee|payment|charge)/i,
      /landlord.{0,50}(obligation|responsible).{0,100}repair/i,
      /notice period|notice to quit|section 21|grounds for possession/i,
      /rent.{0,30}(arrears|increase|review)/i,
      /right.{0,5}to.{0,5}rent/i,
      /electrical.{0,20}safety|gas.{0,20}safety/i,
      /fit(ness)?.{0,20}(for)?.{0,20}human habitation/i,
      /unfair.{0,20}terms/i,
      /break.{0,10}clause/i
    ];
    
    let legalSections = '';
    let matchCount = 0;
    
    // Get paragraphs containing important legal provisions
    const paragraphs = documentContent.split(/\n\s*\n/); // Split by empty lines
    for (const para of paragraphs) {
      if (legalKeywordPatterns.some(pattern => pattern.test(para)) && matchCount < 10) {
        legalSections += para + "\n\n";
        matchCount++;
      }
    }
    
    // Get the ending part which often contains signatures and special conditions
    const ending = documentContent.substring(documentContent.length - 2000);
    
    return `${beginning}\n\n...\n\n[KEY LEGAL SECTIONS IDENTIFIED]\n\n${legalSections}\n\n...\n\n${ending}`;
  } else {
    // If document is smaller, include more of it with simple truncation
    return documentContent.substring(0, 11000) + (documentContent.length > 11000 ? '... [Document truncated due to length]' : '');
  }
})()}

EXISTING ANALYSIS FINDINGS:
${JSON.stringify({
  complianceScore: initialAnalysis.complianceScore || initialAnalysis.compliance?.score || "Not specified",
  issues: initialAnalysis.insights
    .filter(insight => insight.type === "warning")
    .map(insight => insight.title)
    .join(", ")
}, null, 2)}

CONDUCT A THOROUGH LEGAL ASSESSMENT FOCUSING ON:
1. Strict compliance with UK housing laws (including 2024-2025 updates)
2. Identifying any legally problematic clauses that violate statutory rights
3. Assessing deposit protection compliance (including recent High Court 2024 precedents) 
4. Checking for prohibited fees under Tenant Fees Act 2019 (including 2024 tribunal decisions on early termination fees)
5. Verifying landlord repair obligations under Landlord and Tenant Act 1985
6. Evaluating notice periods and termination provisions (consider Renters' Rights Bill 2024)
7. Identifying unfair terms under Consumer Rights Act 2015
8. Checking HMO licensing compliance (following 2024 enforcement trends with £15,000+ penalties)
9. Verifying service charge allocation methods (following Accent Housing 2024 Court of Appeal guidance)
10. Determining an accurate overall compliance score incorporating 2024 case law developments

ONLY RESPOND WITH VALID JSON. DO NOT include any text outside the JSON structure.`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });

        // Extract the UK law assessment response
        const ukLawContent = ukLawResponse.choices[0].message.content || '{}';
        
        let ukLawAssessment: any;
        try {
          ukLawAssessment = JSON.parse(ukLawContent);
          console.log("Successfully parsed UK law assessment response");
        } catch (error) {
          console.error("Failed to parse UK law assessment:", error);
          throw new Error("Failed to parse UK housing law assessment response");
        }

        // Step 2: Now perform the secondary validation with the legal assessment included
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a UK legal expert specialized in tenancy agreement analysis with a dual verification role. Your task is to:
1. Analyze the provided tenancy agreement
2. Review the initial AI analysis of the agreement
3. Evaluate the specialized UK housing law assessment
4. Produce a final verified analysis that reconciles all findings

VERY IMPORTANT: Your output MUST be valid JSON that follows the structure below. DO NOT include explanations, analysis, or text outside of the JSON structure. The JSON must be parseable with JSON.parse() and contain only valid property names and values.

{
  "propertyDetails": {
    "address": "string",
    "propertyType": "string",
    "size": "string",
    "confidence": "string"
  },
  "financialTerms": {
    "monthlyRent": "string",
    "totalDeposit": "string",
    "depositProtection": "string",
    "permittedFees": "string",
    "prohibitedFees": "string",
    "confidence": "string"
  },
  "leasePeriod": {
    "startDate": "string",
    "endDate": "string",
    "tenancyType": "string",
    "noticePeriod": "string",
    "confidence": "string"
  },
  "parties": {
    "landlord": "string",
    "tenant": "string",
    "guarantor": "string",
    "agent": "string",
    "confidence": "string"
  },
  "insights": [
    {
      "title": "string",
      "content": "string",
      "type": "string"
    }
  ],
  "recommendations": [
    {
      "content": "string"
    }
  ],
  "complianceScore": 0-100,
  "compliance": {
    "score": 0-100,
    "level": "green" | "yellow" | "red",
    "summary": "string"
  },
  "validationComment": "string"
}`
            },
            {
              role: "user",
              content: `Review and provide a final verified analysis of this UK residential tenancy agreement:

INITIAL AI ANALYSIS:
${JSON.stringify(simplifiedAnalysis, null, 2)}

UK HOUSING LAW ASSESSMENT:
${ukLawContent}

DOCUMENT EXCERPT (Key sections):
${(() => {
  // More intelligent document truncation
  // For large documents, extract beginning, key clauses, and ending
  if (documentContent.length > 10000) {
    const beginning = documentContent.substring(0, 3000);
    
    // Try to identify sections about deposits, termination, repairs, fees
    // by looking for these keywords in the document
    const keywordPatterns = [
      /deposit/i, /protection/i, /scheme/i,
      /terminat(e|ion)/i, /end the tenancy/i, /break clause/i,
      /repair/i, /maintenance/i, /damage/i,
      /fee/i, /charge/i, /payment/i,
      /rent/i, /arrears/i, /increase/i
    ];
    
    let keyMatches = '';
    let matchCount = 0;
    
    // Get paragraphs that contain important keywords
    const paragraphs = documentContent.split(/\n\s*\n/); // Split by empty lines
    for (const para of paragraphs) {
      if (keywordPatterns.some(pattern => pattern.test(para)) && matchCount < 7) {
        keyMatches += para + "\n\n";
        matchCount++;
      }
    }
    
    // Get the ending part
    const ending = documentContent.substring(documentContent.length - 2000);
    
    return `${beginning}\n\n...\n\n[KEY SECTIONS IDENTIFIED]\n\n${keyMatches}\n\n...\n\n${ending}`;
  } else {
    // If document is smaller, include more of it with simple truncation
    return documentContent.substring(0, 9000) + (documentContent.length > 9000 ? '... [Document truncated due to length]' : '');
  }
})()}

YOUR TASK:
1. Create a final verified analysis reconciling the initial AI analysis and UK housing law assessment
2. Ensure EVERY serious legal compliance issue is identified 
3. Update the compliance score to accurately reflect UK legal compliance
4. Add any missed insights or recommendations from the UK housing law assessment
5. Ensure the compliance level (green/yellow/red) is accurate based on UK law
6. Set the correct compliance level:
   - "green" (75-100): Legally compliant and generally fair
   - "yellow" (41-74): Some legal compliance concerns or unfair terms
   - "red" (0-40): Significant legal compliance issues

ONLY RESPOND WITH VALID JSON. DO NOT include any text outside the JSON structure.`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });

        // Extract the validation response
        const validationContent = response.choices[0].message.content || '{}';
        
        // Try to parse the JSON with safety checks
        let validatedResults: any;
        try {
          validatedResults = JSON.parse(validationContent);
          
          // Verify the parsed object has the expected structure
          if (!validatedResults.propertyDetails || !validatedResults.insights || !Array.isArray(validatedResults.insights)) {
            throw new Error("Parsed JSON is missing required structure");
          }
          
          // Verify compliance score and level exist
          if (validatedResults.compliance === undefined || validatedResults.compliance.score === undefined || 
              validatedResults.compliance.level === undefined) {
            throw new Error("Parsed JSON is missing compliance information");
          }
          
          // Add validation metadata to track double verification was performed
          validatedResults.validationNote = "Analysis includes double verification: initial AI + specialized UK housing law assessment";
          validatedResults.doubleVerified = true;
          
          // Add verification badge text
          validatedResults.verificationBadge = "Double AI-Verified";
          
        } catch (error: unknown) {
          const jsonError = error;
          console.error("JSON parsing error:", jsonError);
          
          // If we're on the last retry, return the original with a warning
          if (attempt === MAX_RETRIES - 1) {
            return {
              ...initialAnalysis,
              validationNote: "Secondary validation failed due to JSON parsing issues. Using original analysis only."
            };
          }
          
          // Otherwise, try again
          attempt++;
          lastError = jsonError as Error;
          continue;
        }
        
        // Merge the validated results with the initial analysis
        const enhancedAnalysis = mergeAnalysisResults(initialAnalysis, validatedResults);
        
        // CRITICAL DEBUG: Log insights after merge
        console.log('🔍 CRITICAL DEBUG - After mergeAnalysisResults:', {
          hasInsights: !!enhancedAnalysis.insights,
          insightsCount: enhancedAnalysis.insights ? enhancedAnalysis.insights.length : 0,
          initialInsightsCount: initialAnalysis.insights ? initialAnalysis.insights.length : 0,
          validatedInsightsCount: validatedResults.insights ? validatedResults.insights.length : 0,
          firstInsight: enhancedAnalysis.insights?.[0]
        });
        
        // Add any critical legal issues from the UK Law Assessment
        if (ukLawAssessment?.uk_housing_law_assessment?.primary_legal_issues) {
          // Extract high severity issues from the legal assessment
          const criticalLegalIssues = ukLawAssessment.uk_housing_law_assessment.primary_legal_issues
            .filter((issue: any) => issue.severity === "high")
            .map((issue: any) => ({
              title: `UK Law Issue: ${issue.issue}`,
              content: `${issue.explanation} (Reference: ${issue.law_reference})`,
              type: "warning",
              indicators: ["Legal Non-Compliance", issue.law_reference]
            }));
          
          if (criticalLegalIssues.length > 0) {
            // Add these issues to the insights if not already present
            // CRITICAL FIX: Ensure enhancedAnalysis.insights exists before processing
            if (!enhancedAnalysis.insights || !Array.isArray(enhancedAnalysis.insights)) {
              enhancedAnalysis.insights = [];
            }
            
            const existingTitles = new Set(enhancedAnalysis.insights.map((i: any) => i.title.toLowerCase()));
            const newCriticalIssues = criticalLegalIssues.filter((issue: any) => 
              !existingTitles.has(issue.title.toLowerCase())
            );
            
            enhancedAnalysis.insights = [...enhancedAnalysis.insights, ...newCriticalIssues];
            
            console.log(`Added ${newCriticalIssues.length} critical legal issues from UK law assessment`);
          }
        }
        
        console.log("Secondary validation with UK housing law assessment completed successfully");
        
        // CRITICAL DEBUG: Log final insights before return
        console.log('🔍 CRITICAL DEBUG - Final enhancedAnalysis before return:', {
          hasInsights: !!enhancedAnalysis.insights,
          insightsCount: enhancedAnalysis.insights ? enhancedAnalysis.insights.length : 0,
          firstInsight: enhancedAnalysis.insights?.[0],
          allInsightTitles: enhancedAnalysis.insights?.map(i => i.title) || []
        });
        
        // We have our results, no need to wait for the timeout
        return enhancedAnalysis;
        
      } catch (error: any) {
        console.error(`Secondary validation error (attempt ${attempt + 1}):`, error);
        lastError = error as Error;
        
        // If this was the last retry, return the original analysis with a note
        if (attempt === MAX_RETRIES - 1) {
          return {
            ...initialAnalysis,
            validationNote: `Secondary validation failed after ${MAX_RETRIES} attempts: ${error.message}. Using original analysis only.`
          };
        }
        
        // Otherwise, wait a bit before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        attempt++;
      }
    }
  
    // This should only be reached if all retries failed
    return {
      ...initialAnalysis,
      validationNote: `Secondary validation failed after ${MAX_RETRIES} attempts: ${lastError?.message}. Using original analysis only.`
    };
  };

  // Race between the validation process and the timeout
  try {
    console.log("Starting secondary validation with timeout protection...");
    return await Promise.race([validationPromise(), timeoutPromise]);
  } catch (error) {
    console.error("Secondary validation failed with error:", error);
    return {
      ...initialAnalysis,
      validationNote: `Secondary validation failed with error: ${error instanceof Error ? error.message : String(error)}. Using original analysis only.`
    };
  }
}
*/

/**
 * Helper function to merge the initial analysis with the validated/enhanced analysis
 * Prioritizing more severe findings and additional insights
 */
function mergeAnalysisResults(initial: AnalysisResults, validated: AnalysisResults): AnalysisResults {
  // Create a new merged result, prioritizing the specialized assistant's findings
  const merged: AnalysisResults = { ...initial };
  
  // Add validation metadata
  merged.validationPerformed = true;
  merged.validationNote = "Analysis verified by specialized UK tenancy assistant with secondary validation.";
  
  // PRIORITIZE ASSISTANT RESULTS - Only use validation if assistant data is missing or has very low confidence
  
  // Only use validated property details if assistant didn't provide any or has explicitly low confidence
  if (!initial.propertyDetails || initial.propertyDetails.confidence === "Low Confidence") {
    if (validated.propertyDetails && validated.propertyDetails.confidence !== "Low Confidence") {
      merged.propertyDetails = validated.propertyDetails;
    }
  }
  
  // Same approach for financial terms - assistant takes priority
  if (!initial.financialTerms || initial.financialTerms.confidence === "Low Confidence") {
    if (validated.financialTerms && validated.financialTerms.confidence !== "Low Confidence") {
      merged.financialTerms = validated.financialTerms;
    }
  }
  
  // Same for lease period - assistant takes priority
  if (!initial.leasePeriod || initial.leasePeriod.confidence === "Low Confidence") {
    if (validated.leasePeriod && validated.leasePeriod.confidence !== "Low Confidence") {
      merged.leasePeriod = validated.leasePeriod;
    }
  }
  
  // Same for parties - assistant takes priority
  if (!initial.parties || initial.parties.confidence === "Low Confidence") {
    if (validated.parties && validated.parties.confidence !== "Low Confidence") {
      merged.parties = validated.parties;
    }
  }
  
  // For insights, PRIORITIZE ASSISTANT FINDINGS and only add validation insights that are genuinely new
  // CRITICAL FIX: Ensure initial.insights exists before processing
  if (!initial.insights || !Array.isArray(initial.insights)) {
    initial.insights = [];
  }
  
  if (validated.insights && Array.isArray(validated.insights)) {
    const existingTitles = new Set(initial.insights.map(insight => insight.title.toLowerCase()));
    
    // Only add validation insights that are completely new (not found by assistant)
    const genuinelyNewInsights = validated.insights.filter(insight => 
      !existingTitles.has(insight.title.toLowerCase())
    );
    
    // Add these new insights but mark them as secondary validation findings
    const markedNewInsights = genuinelyNewInsights.map(insight => ({
      ...insight,
      content: `${insight.content} [Secondary validation finding]`
    }));
    
    // Combine: Assistant insights first, then validation-only insights
    merged.insights = [...initial.insights, ...markedNewInsights];
    
    // NEVER downgrade assistant findings - only enhance if validation finds something more severe
    merged.insights = merged.insights.map(insight => {
      const matchingValidated = validated.insights.find(v => 
        v.title.toLowerCase() === insight.title.toLowerCase()
      );
      
      if (matchingValidated) {
        // Only upgrade severity if validation found something more concerning
        if (matchingValidated.type === "warning" && insight.type !== "warning") {
          return {
            ...insight,
            type: "warning",
            content: `${insight.content} [Validation confirmed as concerning]`
          };
        }
        // NEVER downgrade ratings - assistant knows best about UK tenancy law
        // Only use validation rating if assistant didn't provide one
        if (matchingValidated.rating && !insight.rating) {
          return {
            ...insight,
            rating: matchingValidated.rating
          };
        }
      }
      return insight;
    });
  }
  
  // For recommendations, add any new ones from validation
  // CRITICAL FIX: Ensure initial.recommendations exists before processing
  if (!initial.recommendations || !Array.isArray(initial.recommendations)) {
    initial.recommendations = [];
  }
  
  if (validated.recommendations && Array.isArray(validated.recommendations)) {
    const existingRecommendations = new Set(
      initial.recommendations.map(rec => rec.content.toLowerCase())
    );
    
    const newRecommendations = validated.recommendations.filter(rec => 
      !existingRecommendations.has(rec.content.toLowerCase())
    );
    
    merged.recommendations = [...initial.recommendations, ...newRecommendations];
  }
  
  // PRIORITIZE ASSISTANT'S COMPLIANCE ASSESSMENT - The specialized assistant knows UK tenancy law best
  if (initial.compliance && initial.compliance.score !== undefined) {
    // Keep the assistant's compliance assessment as primary
    merged.compliance = initial.compliance;
    merged.complianceScore = initial.complianceScore || initial.compliance.score;
    
    // Add validation note if scores differ significantly
    if (validated.compliance && validated.compliance.score !== undefined) {
      const scoreDiff = Math.abs(initial.compliance.score - validated.compliance.score);
      if (scoreDiff > 10) {
        merged.validationNote += ` Note: Secondary validation suggested compliance score of ${validated.compliance.score}, but specialist assistant assessment of ${initial.compliance.score} is preferred for UK tenancy law.`;
      }
    }
  } else if (validated.compliance) {
    // Only use validation compliance if assistant didn't provide one
    merged.compliance = validated.compliance;
    merged.complianceScore = validated.complianceScore || validated.compliance.score;
    merged.validationNote += " Compliance assessment provided by secondary validation as primary specialist analysis was incomplete.";
  } else if (validated.complianceScore !== undefined) {
    // Fallback: create compliance object from validation score only if nothing else available
    merged.complianceScore = validated.complianceScore;
    
    let level = 'green';
    let summary = 'This agreement appears to comply with UK housing laws.';
    
    if (validated.complianceScore < 41) {
      level = 'red';
      summary = 'This agreement has significant issues with UK housing law compliance.';
    } else if (validated.complianceScore < 75) {
      level = 'yellow';
      summary = 'This agreement has some potential compliance concerns with UK housing laws.';
    }
    
    const complianceLevel = (level === 'green' || level === 'yellow' || level === 'red') 
      ? level 
      : 'yellow';
      
    merged.compliance = {
      score: validated.complianceScore,
      level: complianceLevel,
      summary
    };
    merged.validationNote += " Compliance assessment created from secondary validation score.";
  }
  
  return merged;
}

export async function generatePdfReport(document: Document, analysis: Analysis): Promise<Buffer> {
  // Create class to handle PDF generation with better page management
  class PDFGenerator {
    pdfDoc: any;
    font: any;
    boldFont: any;
    width: number = 595; // Default A4 width
    height: number = 842; // Default A4 height
    safeMargin: number = 80; // Minimum safe margin at bottom of page
    pageIndex: number = 0;
    analysisResults: AnalysisResults;

    constructor(analysisResults: AnalysisResults) {
      this.analysisResults = analysisResults;
    }

    async initialize(): Promise<void> {
      // Create PDF and load fonts
      this.pdfDoc = await PDFDocument.create();
      this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
      this.boldFont = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Add first page to set dimensions
      const firstPage = this.pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = firstPage.getSize();
      this.width = width;
      this.height = height;

      // Remove first page - we'll add proper pages as needed
      this.pdfDoc.removePage(0);
    }

    addPage(): any {
      const page = this.pdfDoc.addPage([this.width, this.height]);
      this.pageIndex++;
      return page;
    }

    // Helper method to check if content will fit on current page
    willContentFit(page: any, currentY: number, contentHeight: number): boolean {
      return currentY - contentHeight > this.safeMargin; 
    }

    // Add footer to all pages
    addFootersToAllPages(): void {
      const footerText = "This report is for informational purposes only and does not constitute legal advice.";
      const footerGenerator = "Generated by UK Tenancy Agreement Analyzer";

      const allPages = this.pdfDoc.getPages();
      allPages.forEach((page: any) => {
        // Add page number
        const pageNumber = `Page ${allPages.indexOf(page) + 1} of ${allPages.length}`;
        page.drawText(pageNumber, {
          x: this.width - 100,
          y: 70,
          size: 9,
          font: this.font,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Add disclaimer footer
        page.drawText(footerText, {
          x: this.width / 2 - this.font.widthOfTextAtSize(footerText, 8) / 2,
          y: 50,
          size: 8,
          font: this.font,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Add generator info
        page.drawText(footerGenerator, {
          x: this.width / 2 - 100,
          y: 30,
          size: 10,
          font: this.font,
          color: rgb(0.29, 0.34, 0.41), // #4A5568
        });
      });
    }

    // Cover page generation
    generateCoverPage(documentName: string, analysisDate: string | number | Date): void {
      const page = this.addPage();

      // Draw header
      page.drawText("UK Tenancy Agreement", {
        x: this.width / 2 - 150,
        y: this.height - 150,
        size: 24,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });

      page.drawText("ANALYSIS REPORT", {
        x: this.width / 2 - 100,
        y: this.height - 190,
        size: 24,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });

      // Add a horizontal divider
      page.drawLine({
        start: { x: this.width / 2 - 100, y: this.height - 220 },
        end: { x: this.width / 2 + 100, y: this.height - 220 },
        thickness: 2,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });

      // Document details
      page.drawText(`Document: ${documentName}`, {
        x: this.width / 2 - 150,
        y: this.height - 270,
        size: 14,
        font: this.boldFont,
      });

      // Convert to date and format properly for display
      const formattedDate = new Date(analysisDate).toLocaleString();
      page.drawText(`Analysis Date: ${formattedDate}`, {
        x: this.width / 2 - 150,
        y: this.height - 300,
        size: 14,
        font: this.boldFont,
      });

      // Add report description
      page.drawText("PREMIUM ANALYSIS INCLUDES:", {
        x: this.width / 2 - 120,
        y: this.height - 370,
        size: 16,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51) // #2C5282
      });

      // Key features list
      const features = [
        "• Comprehensive Lease Term Analysis",
        "• Legal Compliance Evaluation",
        "• Tenant Risk Assessment",
        "• Detailed Property & Financial Details",
        "• Actionable Tenant Recommendations",
        "• Expert Legal Insights",
        "• Suggested Lease Rewrites Available (£10)"
      ];

      features.forEach((feature, index) => {
        page.drawText(feature, {
          x: this.width / 2 - 150,
          y: this.height - 410 - (index * 30),
          size: 14,
          font: this.font
        });
      });
    }

    // Property and financial details page
    generatePropertyAndFinancialPage(documentName: string): void {
      const page = this.addPage();
      let currentY = this.height - 50; // Start position

      // Page title
      page.drawText("PROPERTY & FINANCIAL DETAILS", {
        x: 50,
        y: currentY,
        size: 18,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });
      currentY -= 30;

      // Document reference
      page.drawText(`Document: ${documentName}`, {
        x: 50,
        y: currentY,
        size: 10,
        font: this.font,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= 20;

      // Draw divider line 
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: this.width - 50, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 30;

      // Property Details section
      page.drawText("Property Details", {
        x: 50,
        y: currentY,
        size: 16,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });

      page.drawText(`Confidence: ${this.analysisResults.propertyDetails.confidence}`, {
        x: this.width - 200,
        y: currentY,
        size: 10,
        font: this.font,
        color: rgb(0.29, 0.34, 0.41), // #4A5568
      });
      currentY -= 30;

      // Property details with better spacing
      page.drawText("Address:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      // Handle multi-line address with proper wrapping
      const addressText = sanitizeText(this.analysisResults.propertyDetails.address);
      const addressLines = splitTextIntoLines(
        addressText, 
        this.font, 12, this.width - 250
      );

      // Write address lines
      addressLines.forEach((line, index) => {
        page.drawText(line, {
          x: 150,
          y: currentY - (index * 20),
          size: 12,
          font: this.font,
        });
      });
      currentY -= (addressLines.length * 20 + 20);

      // Property type
      page.drawText("Property Type:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      page.drawText(sanitizeText(this.analysisResults.propertyDetails.propertyType) || "Not specified", {
        x: 170,
        y: currentY,
        size: 12,
        font: this.font,
      });
      currentY -= 20;

      // Size
      page.drawText("Size:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      page.drawText(sanitizeText(this.analysisResults.propertyDetails.size) || "Not specified", {
        x: 150,
        y: currentY,
        size: 12,
        font: this.font,
      });
      currentY -= 30;

      // Section divider
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: this.width - 50, y: currentY },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });
      currentY -= 30;

      // Financial Terms section
      const financialTerms = this.analysisResults.financialTerms;

      // Header for financial section
      page.drawText("Financial Terms", {
        x: 50,
        y: currentY,
        size: 16,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });

      page.drawText(`Confidence: ${sanitizeText(financialTerms.confidence)}`, {
        x: this.width - 200,
        y: currentY,
        size: 10,
        font: this.font,
        color: rgb(0.29, 0.34, 0.41), // #4A5568
      });
      currentY -= 30;

      // Financial terms with better spacing
      // Monthly Rent
      page.drawText("Monthly Rent:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      page.drawText(sanitizeText(financialTerms.monthlyRent) || "Not specified", {
        x: 180,
        y: currentY,
        size: 12,
        font: this.font,
      });
      currentY -= 20;

      // Total Deposit
      page.drawText("Total Deposit:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      page.drawText(sanitizeText(financialTerms.totalDeposit) || "Not specified", {
        x: 180,
        y: currentY,
        size: 12,
        font: this.font,
      });
      currentY -= 20;

      // Deposit Protection
      page.drawText("Deposit Protection:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      page.drawText(sanitizeText(financialTerms.depositProtection) || "Not specified", {
        x: 180,
        y: currentY,
        size: 12,
        font: this.font,
      });
      currentY -= 30;

      // Permitted Fees header
      page.drawText("Permitted Fees:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });
      currentY -= 20;

      // Permitted Fees content
      const permittedFeesText = sanitizeText(financialTerms.permittedFees) || "Not specified";
      const permittedFeesLines = splitTextIntoLines(
        permittedFeesText, 
        this.font, 11, this.width - 150
      );

      // Check if we need a new page for permitted fees
      if (!this.willContentFit(page, currentY, permittedFeesLines.length * 16 + 40)) {
        // Create new page and initialize position
        const newPage = this.addPage();
        currentY = this.height - 80;

        // Add page title
        newPage.drawText("FINANCIAL DETAILS (CONTINUED)", {
          x: 50,
          y: this.height - 50,
          size: 18,
          font: this.boldFont,
          color: rgb(0.17, 0.32, 0.51),
        });

        // Add permitted fees header again
        newPage.drawText("Permitted Fees:", {
          x: 70,
          y: currentY,
          size: 12,
          font: this.boldFont,
        });
        currentY -= 20;

        // Write permitted fees on new page
        permittedFeesLines.forEach((line, index) => {
          newPage.drawText(line, {
            x: 90,
            y: currentY - (index * 16),
            size: 11,
            font: this.font,
          });
        });
        currentY -= (permittedFeesLines.length * 16 + 20);

        // Add prohibited fees on the same new page
        if (financialTerms.prohibitedFees) {
          newPage.drawText("Prohibited Fees:", {
            x: 70,
            y: currentY,
            size: 12,
            font: this.boldFont,
          });
          currentY -= 20;

          const prohibitedFeesText = sanitizeText(financialTerms.prohibitedFees);
          const prohibitedFeesLines = splitTextIntoLines(
            prohibitedFeesText, 
            this.font, 11, this.width - 150
          );

          prohibitedFeesLines.forEach((line, index) => {
            newPage.drawText(line, {
              x: 90,
              y: currentY - (index * 16),
              size: 11,
              font: this.font,
            });
          });
          currentY -= (prohibitedFeesLines.length * 16 + 20);
        }
      } else {
        // Enough room on current page for permitted fees
        permittedFeesLines.forEach((line, index) => {
          page.drawText(line, {
            x: 90,
            y: currentY - (index * 16),
            size: 11,
            font: this.font,
          });
        });
        currentY -= (permittedFeesLines.length * 16 + 20);

        // Check if we have room for prohibited fees
        if (financialTerms.prohibitedFees) {
          const prohibitedFeesText = sanitizeText(financialTerms.prohibitedFees);
          const prohibitedFeesLines = splitTextIntoLines(
            prohibitedFeesText, 
            this.font, 11, this.width - 150
          );

          // Check if prohibited fees will fit
          if (!this.willContentFit(page, currentY, prohibitedFeesLines.length * 16 + 40)) {
            // Create new page for prohibited fees
            const newPage = this.addPage();
            currentY = this.height - 80;

            // Add page title
            newPage.drawText("FINANCIAL DETAILS (CONTINUED)", {
              x: 50,
              y: this.height - 50,
              size: 18,
              font: this.boldFont,
              color: rgb(0.17, 0.32, 0.51),
            });

            // Add prohibited fees header
            newPage.drawText("Prohibited Fees:", {
              x: 70,
              y: currentY,
              size: 12,
              font: this.boldFont,
            });
            currentY -= 20;

            // Write prohibited fees
            prohibitedFeesLines.forEach((line, index) => {
              newPage.drawText(line, {
                x: 90,
                y: currentY - (index * 16),
                size: 11,
                font: this.font,
              });
            });
            currentY -= (prohibitedFeesLines.length * 16 + 20);
          } else {
            // Enough room on current page for prohibited fees
            page.drawText("Prohibited Fees:", {
              x: 70,
              y: currentY,
              size: 12,
              font: this.boldFont,
            });
            currentY -= 20;

            prohibitedFeesLines.forEach((line, index) => {
              page.drawText(line, {
                x: 90, 
                y: currentY - (index * 16),
                size: 11,
                font: this.font,
              });
            });
            currentY -= (prohibitedFeesLines.length * 16 + 20);
          }
        }
      }
    }

    // Lease period and parties page
    generateLeaseAndPartiesPage(documentName: string): void {
      let currentPage = this.addPage(); 
      let currentY = this.height - 50;

      // Page title
      currentPage.drawText("LEASE PERIOD & PARTIES", {
        x: 50,
        y: currentY,
        size: 18,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });
      currentY -= 30;

      // Document reference
      currentPage.drawText(`Document: ${documentName}`, {
        x: 50,
        y: currentY,
        size: 10,
        font: this.font,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= 20;

      // Draw divider line
      currentPage.drawLine({
        start: { x: 50, y: currentY },
        end: { x: this.width - 50, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 30;

      // Lease Period section
      const leasePeriod = this.analysisResults.leasePeriod;

      currentPage.drawText("Tenancy Period", {
        x: 50,
        y: currentY,
        size: 16,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });

      currentPage.drawText(`Confidence: ${sanitizeText(leasePeriod.confidence)}`, {
        x: this.width - 200,
        y: currentY,
        size: 10,
        font: this.font,
        color: rgb(0.29, 0.34, 0.41), // #4A5568
      });
      currentY -= 30;

      // Lease period details
      // Start Date
      currentPage.drawText("Start Date:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      currentPage.drawText(sanitizeText(leasePeriod.startDate) || "Not specified", {
        x: 180,
        y: currentY,
        size: 12,
        font: this.font,
      });
      currentY -= 20;

      // End Date
      currentPage.drawText("End Date:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      currentPage.drawText(sanitizeText(leasePeriod.endDate) || "Not specified", {
        x: 180,
        y: currentY,
        size: 12, 
        font: this.font,
      });
      currentY -= 20;

      // Tenancy Type
      currentPage.drawText("Tenancy Type:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      currentPage.drawText(sanitizeText(leasePeriod.tenancyType) || "Not specified", {
        x: 180,
        y: currentY,
        size: 12,
        font: this.font,
      });
      currentY -= 30;

      // Notice Period section
      currentPage.drawText("Notice Period:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });
      currentY -= 20;

      // Multi-line notice period
      const noticePeriodText = sanitizeText(leasePeriod.noticePeriod) || "Not specified";
      const noticePeriodLines = splitTextIntoLines(
        noticePeriodText, 
        this.font, 11, this.width - 150
      );

      noticePeriodLines.forEach((line, index) => {
        currentPage.drawText(line, {
          x: 90,
          y: currentY - (index * 16),
          size: 11,
          font: this.font,
        });
      });
      currentY -= (noticePeriodLines.length * 16 + 30);

      // Draw divider before parties section
      currentPage.drawLine({
        start: { x: 50, y: currentY },
        end: { x: this.width - 50, y: currentY },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });
      currentY -= 30;

      // Parties section
      const parties = this.analysisResults.parties;

      // Check if we need a new page for parties section
      if (!this.willContentFit(currentPage, currentY, 200)) { // Estimate height needed
        // Create new page for parties
        currentPage = this.addPage();
        currentY = this.height - 80;

        // Add page title
        currentPage.drawText("PARTIES", {
          x: 50,
          y: this.height - 50,
          size: 18,
          font: this.boldFont,
          color: rgb(0.17, 0.32, 0.51),
        });
      }

      // Parties section header
      currentPage.drawText("Parties", {
        x: 50,
        y: currentY,
        size: 16,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });

      currentPage.drawText(`Confidence: ${sanitizeText(parties.confidence)}`, {
        x: this.width - 200,
        y: currentY,
        size: 10,
        font: this.font,
        color: rgb(0.29, 0.34, 0.41), // #4A5568
      });
      currentY -= 30;

      // Landlord
      currentPage.drawText("Landlord:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      // Multi-line landlord info
      const landlordText = sanitizeText(parties.landlord);
      const landlordLines = splitTextIntoLines(
        landlordText, 
        this.font, 11, this.width - 180
      );

      landlordLines.forEach((line, index) => {
        currentPage.drawText(line, {
          x: 150,
          y: currentY - (index * 16),
          size: 11,
          font: this.font,
        });
      });
      currentY -= (landlordLines.length * 16 + 20);

      // Tenant
      currentPage.drawText("Tenant:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      // Multi-line tenant info
      const tenantText = sanitizeText(parties.tenant);
      const tenantLines = splitTextIntoLines(
        tenantText, 
        this.font, 11, this.width - 180
      );

      tenantLines.forEach((line, index) => {
        currentPage.drawText(line, {
          x: 150,
          y: currentY - (index * 16),
          size: 11,
          font: this.font,
        });
      });
      currentY -= (tenantLines.length * 16 + 20);

      // Check if we need a new page for guarantor and agent
      if (!this.willContentFit(currentPage, currentY, 80)) {
        // Create new page
        currentPage = this.addPage();
        currentY = this.height - 80;

        // Add page title
        currentPage.drawText("PARTIES (CONTINUED)", {
          x: 50,
          y: this.height - 50,
          size: 18,
          font: this.boldFont,
          color: rgb(0.17, 0.32, 0.51),
        });
      }

      // Guarantor
      currentPage.drawText("Guarantor:", {
        x: 70,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      const guarantorText = sanitizeText(parties.guarantor) || "Not specified";
      const guarantorLines = splitTextIntoLines(
        guarantorText, 
        this.font, 11, this.width - 180
      );

      guarantorLines.forEach((line, index) => {
        currentPage.drawText(line, {
          x: 150,
          y: currentY - (index * 16),
          size: 11,
          font: this.font,
        });
      });
      currentY -= (guarantorLines.length * 16 + 20);

      // Agent (if present)
      if (parties.agent) {
        currentPage.drawText("Agent:", {
          x: 70,
          y: currentY,
          size: 12,
          font: this.boldFont,
        });

        const agentText = sanitizeText(parties.agent);
        const agentLines = splitTextIntoLines(
          agentText, 
          this.font, 11, this.width - 180
        );

        agentLines.forEach((line, index) => {
          currentPage.drawText(line, {
            x: 150,
            y: currentY - (index * 16),
            size: 11,
            font: this.font,
          });
        });
        currentY -= (agentLines.length * 16 + 20);
      }
    }

    // Generate evaluation page with advanced assessment
    generateEvaluationPage(): void {
      let currentPage = this.addPage();
      let currentY = this.height - 50;

      // Page title
      currentPage.drawText("PREMIUM REPORT", {
        x: this.width / 2 - 100,
        y: currentY,
        size: 24,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });
      currentY -= 40;

      currentPage.drawText("UK Tenancy Agreement Insights & Recommendations", {
        x: this.width / 2 - 200,
        y: currentY,
        size: 14,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });
      currentY -= 50;

      // Assessment header
      currentPage.drawText("LEASE ASSESSMENT", {
        x: 50,
        y: currentY,
        size: 16,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51), // #2C5282
      });
      currentY -= 30;

      // Advanced assessment visualization based on analysis results

      // Calculate the high and medium risk counts
      const warningInsights = this.analysisResults.insights.filter(i => i.type === 'warning').length;

      // Expanded list of serious liability and legal compliance issues for better detection
      const seriousIssueTerms = [
        // Liability issues
        'all injuries regardless of cause', 
        'tenant liable for all damage', 
        'responsible for all repairs', 
        'disclaims all liability',
        'tenant responsible for structural',
        'unlimited liability',
        'liable regardless of fault',
        'all costs regardless of cause',

        // Legal compliance issues
        'does not comply with',
        'contrary to tenant fees act',
        'violates housing act',
        'illegal clause',
        'prohibited fee',
        'unlawful term',
        'not compliant with',
        'breach of tenant rights',
        'unenforceable clause',
        'deposit not protected',
        'non-compliance with deposit protection',

        // Unfair terms
        'tenant waives all rights',
        'tenant cannot claim',
        'no compensation',
        'cannot withhold rent',
        'unreasonable penalty',
        'disproportionate fee',
        'excessive charge',
        'unfair burden'
      ];

      // More comprehensive filtering for risk-related insights
      const riskInsights = this.analysisResults.insights.filter(i => 
        // Title-based filtering with broader criteria
        i.title.toLowerCase().includes('risk') || 
        i.title.toLowerCase().includes('tenant') || 
        i.title.toLowerCase().includes('obligation') ||
        i.title.toLowerCase().includes('unfair') ||
        i.title.toLowerCase().includes('liability') ||
        i.title.toLowerCase().includes('responsib') ||
        i.title.toLowerCase().includes('repair') ||
        i.title.toLowerCase().includes('injury') ||
        i.title.toLowerCase().includes('damage') ||
        i.title.toLowerCase().includes('penalty') ||
        i.title.toLowerCase().includes('clause') ||
        i.title.toLowerCase().includes('breach') ||
        i.title.toLowerCase().includes('default') ||

        // Content-based filtering for serious issues
        i.content.toLowerCase().includes('non-compliant with uk law') ||
        i.content.toLowerCase().includes('illegal clause') ||
        i.content.toLowerCase().includes('violates tenant rights') ||
        i.content.toLowerCase().includes('unfair term') ||
        i.content.toLowerCase().includes('disproportionate liability') ||
        i.content.toLowerCase().includes('excessive fee') ||
        i.content.toLowerCase().includes('prohibited payment') ||
        i.content.toLowerCase().includes('unreasonable responsibility') ||
        i.content.toLowerCase().includes('unenforceable') ||
        i.content.toLowerCase().includes('void clause')
      );

      const highRiskCount = riskInsights.filter(i => i.type === 'warning').length;
      const mediumRiskCount = riskInsights.filter(i => i.type === 'accent').length;

      // Check for serious issues
      const hasSeriousIssue = this.analysisResults.insights.some(insight => 
        seriousIssueTerms.some(term => 
          insight.content.toLowerCase().includes(term.toLowerCase())
        ) || 
        // Also check if any insight is explicitly labeled as a legal issue
        (insight.type === 'warning' && 
         (insight.content.toLowerCase().includes('illegal') || 
          insight.content.toLowerCase().includes('unlawful') ||
          insight.content.toLowerCase().includes('non-compliant') ||
          insight.content.toLowerCase().includes('violates law') ||
          insight.content.toLowerCase().includes('breach of law')
         )
        )
      );

      // Calculate metrics for advanced assessment
      const totalIssueCount = warningInsights + mediumRiskCount;
      const seriousIssuePercentage = Math.min(100, Math.round((highRiskCount / 5) * 100));
      const moderateIssuePercentage = Math.min(100, Math.round((mediumRiskCount / 10) * 100));

      // Legal Protection Score (1-100)
      let legalProtectionScore = 100;
      if (hasSeriousIssue) legalProtectionScore -= 20;
      legalProtectionScore -= (highRiskCount * 15);
      legalProtectionScore -= (mediumRiskCount * 5);
      legalProtectionScore = Math.max(10, Math.min(100, legalProtectionScore));

      // Lease Balance Categories
      let category = '';
      let categoryDescription = '';

      if (legalProtectionScore >= 85) {
        category = 'Tenant-Friendly';
        categoryDescription = 'This lease contains standard terms with clear protections for tenants.';
      } else if (legalProtectionScore >= 70) {
        category = 'Balanced Standard';
        categoryDescription = 'A typical UK lease with standard terms and appropriate tenant protections.';
      } else if (legalProtectionScore >= 50) {
        category = 'Attention Required';
        categoryDescription = 'Some clauses need attention and may require clarification before signing.';
      } else {
        category = 'Legal Review Recommended';
        categoryDescription = 'Consider having this lease reviewed by a professional before signing.';
      }

      // Draw a nice border box for the assessment
      // Draw the box fill first
      currentPage.drawRectangle({
        x: 60,
        y: currentY - 150,
        width: this.width - 120,
        height: 150,
        color: rgb(0.98, 0.98, 1) // Very light blue background
      });

      // Then draw the border as a separate rectangle with no fill
      currentPage.drawRectangle({
        x: 60,
        y: currentY - 150,
        width: this.width - 120,
        height: 150,
        borderColor: rgb(0.17, 0.32, 0.51), // Light blue border
        borderWidth: 1,
      });

      // Draw category assessment
      currentPage.drawText("Lease Category:", {
        x: 80,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      // Determine category color
      const categoryColor = legalProtectionScore >= 85 ? rgb(0.28, 0.73, 0.47) : // Green for Tenant-Friendly
                          legalProtectionScore >= 70 ? rgb(0.26, 0.60, 0.88) : // Blue for Balanced
                          legalProtectionScore >= 50 ? rgb(0.92, 0.79, 0.29) : // Yellow for Attention Required
                          rgb(0.96, 0.40, 0.40); // Red for Legal Review

      currentPage.drawText(category, {
        x: 190,
        y: currentY,
        size: 12,
        font: this.boldFont,
        color: categoryColor
      });
      currentY -= 20;

      // Draw category description
      currentPage.drawText(categoryDescription, {
        x: 80,
        y: currentY,
        size: 10,
        font: this.font,
      });
      currentY -= 30;

      // Draw Legal Protection Score
      currentPage.drawText("Legal Protection Score:", {
        x: 80,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });

      // Score color
      const scoreColor = legalProtectionScore >= 80 ? rgb(0.28, 0.73, 0.47) : // Green
                       legalProtectionScore >= 60 ? rgb(0.26, 0.60, 0.88) : // Blue
                       legalProtectionScore >= 40 ? rgb(0.92, 0.79, 0.29) : // Yellow
                       rgb(0.96, 0.40, 0.40); // Red

      currentPage.drawText(`${legalProtectionScore}/100`, {
        x: 230,
        y: currentY,
        size: 12,
        font: this.boldFont,
        color: scoreColor
      });
      currentY -= 15;

      // Score bar background
      currentPage.drawRectangle({
        x: 80,
        y: currentY - 5,
        width: 400,
        height: 10,
        color: rgb(0.9, 0.9, 0.9)
      });

      // Score bar fill
      currentPage.drawRectangle({
        x: 80,
        y: currentY - 5,
        width: 4 * legalProtectionScore,
        height: 10,
        color: scoreColor
      });
      currentY -= 30;

      // Issue metrics section
      currentPage.drawText("Issues Detected:", {
        x: 80,
        y: currentY,
        size: 12,
        font: this.boldFont,
      });
      currentY -= 20;

      // Serious Issues
      currentPage.drawText("Serious Issues:", {
        x: 100,
        y: currentY,
        size: 10,
        font: this.font,
      });

      currentPage.drawText(`${highRiskCount} found`, {
        x: 185,
        y: currentY,
        size: 10,
        font: this.boldFont,
        color: rgb(0.96, 0.40, 0.40) // Red for serious issues
      });

      // Serious issues bar background
      currentPage.drawRectangle({
        x: 270,
        y: currentY - 2,
        width: 100,
        height: 6,
        color: rgb(0.9, 0.9, 0.9)
      });

      // Serious issues bar fill
      currentPage.drawRectangle({
        x: 270,
        y: currentY - 2,
        width: seriousIssuePercentage,
        height: 6,
        color: rgb(0.96, 0.40, 0.40) // Red for serious issues
      });
      currentY -= 20;

      // Moderate Issues
      currentPage.drawText("Moderate Issues:", {
        x: 100,
        y: currentY,
        size: 10,
        font: this.font,
      });

      currentPage.drawText(`${mediumRiskCount} found`, {
        x: 185,
        y: currentY,
        size: 10,
        font: this.boldFont,
        color: rgb(0.22, 0.70, 0.67) // #38B2AC teal for moderate issues (accent)
      });

      // Moderate issues bar background
      currentPage.drawRectangle({
        x: 270,
        y: currentY - 2,
        width: 100,
        height: 6,
        color: rgb(0.9, 0.9, 0.9)
      });

      // Moderate issues bar fill
      currentPage.drawRectangle({
        x: 270,
        y: currentY - 2,
        width: moderateIssuePercentage,
        height: 6,
        color: rgb(0.22, 0.70, 0.67) // #38B2AC teal for moderate issues (accent)
      });
      currentY -= 30;

      // Add divider
      currentPage.drawLine({
        start: { x: 50, y: currentY },
        end: { x: this.width - 50, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 40;

      // Report contents section
      currentPage.drawText("Report Contents:", {
        x: 70,
        y: currentY,
        size: 14,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51),
      });
      currentY -= 30;

      const contents = [
        "1. Property & Financial Details",
        "2. Lease Period & Parties",
        "3. Agreement Evaluation",
        "4. Detailed Insights Analysis",
        "5. Expert Recommendations"
      ];

      contents.forEach((content, index) => {
        currentPage.drawText(content, {
          x: 90,
          y: currentY - (index * 25),
          size: 12,
          font: this.font,
        });
      });
      currentY -= (contents.length * 25 + 40);

      // Process all recommendations on this page
      const recommendations = this.analysisResults.recommendations;
      if (recommendations && recommendations.length > 0) {
        currentPage.drawText("TENANT RECOMMENDATIONS", {
          x: 50,
          y: currentY,
          size: 16,
          font: this.boldFont,
          color: rgb(0.17, 0.32, 0.51),
        });
        currentY -= 30;

        // Process each recommendation
        recommendations.forEach((recommendation, index) => {
          // Check if we need a new page
          if (!this.willContentFit(currentPage, currentY, 60)) {
            currentPage = this.addPage();
            currentY = this.height - 80;

            currentPage.drawText("RECOMMENDATIONS (CONTINUED)", {
              x: 50,
              y: this.height - 50,
              size: 18,
              font: this.boldFont,
              color: rgb(0.17, 0.32, 0.51),
            });
          }

          // Format the recommendation
          const recText = sanitizeText(recommendation.content);
          const recLines = splitTextIntoLines(
            recText,
            this.font, 11, this.width - 130
          );

          // Draw recommendation number with accent color
          currentPage.drawText(`${index + 1}.`, {
            x: 70,
            y: currentY,
            size: 12,
            font: this.boldFont,
            color: rgb(0.28, 0.73, 0.47) // #48BB78
          });

          // Draw recommendation content
          recLines.forEach((line, lineIndex) => {
            currentPage.drawText(line, {
              x: 95,
              y: currentY - (lineIndex * 16),
              size: 11,
              font: this.font,
            });
          });

          currentY -= (recLines.length * 16 + 20);
        });
      }
    }

    // Generate insights pages
    generateInsightsPages(documentName: string): void {
      let currentPage = this.addPage();
      let currentY = this.height - 50;

      // Page title
      currentPage.drawText("TENANCY AGREEMENT INSIGHTS", {
        x: 50,
        y: currentY,
        size: 18,
        font: this.boldFont,
        color: rgb(0.17, 0.32, 0.51),
      });
      currentY -= 30;

      // Document reference
      currentPage.drawText(`Document: ${documentName}`, {
        x: 50,
        y: this.height - 20,
        size: 8,
        font: this.font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Process each insight - sort by type: first warnings, then accent, then primary
      let insights = this.analysisResults.insights;
      
      if (insights && insights.length > 0) {
        // Sort insights by type - warning (serious) first, accent (moderate) second, primary (informational) last
        const sortedInsights = [
          ...insights.filter(i => i.type === 'warning'),
          ...insights.filter(i => i.type === 'accent'),
          ...insights.filter(i => i.type === 'primary')
        ];
        
        sortedInsights.forEach((insight, index) => {
          // Check if we need a new page
          if (!this.willContentFit(currentPage, currentY, 150)) {
            const newPage = this.addPage();
            currentY = this.height - 80;

            // Add page header
            newPage.drawText("TENANCY AGREEMENT INSIGHTS (CONTINUED)", {
              x: 50,
              y: this.height - 50,
              size: 18,
              font: this.boldFont,
              color: rgb(0.17, 0.32, 0.51),
            });

            // Add document reference
            newPage.drawText(`Document: ${documentName}`, {
              x: 50,
              y: this.height - 20,
              size: 8,
              font: this.font,
              color: rgb(0.5, 0.5, 0.5),
            });

            currentPage = newPage;
          }

          // Determine color based on insight type
          const titleColor = insight.type === 'primary' ? rgb(0.17, 0.32, 0.51) : // #2C5282
                           insight.type === 'accent' ? rgb(0.22, 0.70, 0.67) : // #38B2AC
                           rgb(0.96, 0.40, 0.40); // #F56565 red for warning/serious issues

          // Draw insight title
          const insightTitle = `${index + 1}. ${sanitizeText(insight.title)}`;
          currentPage.drawText(insightTitle, {
            x: 70,
            y: currentY,
            size: 12,
            font: this.boldFont,
            color: titleColor
          });
          currentY -= 20;

          // Draw insight content with expanded description for shorter insights
          let contentText = sanitizeText(insight.content);
          
          // For insights with short content, add explanatory text similar to UI
          if (contentText.length < 120) {
            if (insight.type === 'warning') {
              contentText += " This issue requires careful attention as it may significantly impact your legal rights and obligations under UK tenancy laws. Consider seeking clarification or adjustments before signing the agreement.";
            } else if (insight.type === 'accent') {
              contentText += " While not as severe as other issues, this may impact your tenancy experience and should be reviewed carefully. Consider discussing this with your landlord to reach a more balanced agreement.";
            } else if (insight.type === 'primary') {
              contentText += " This information is provided to help you understand standard lease terms and what to expect from your tenancy. Being familiar with these details will help you have a better renting experience.";
            }
          }
          
          const contentLines = splitTextIntoLines(
            contentText,
            this.font, 11, this.width - 150
          );

          // Check if content needs a new page
          if (!this.willContentFit(currentPage, currentY, contentLines.length * 16 + 60)) {
            const newPage = this.addPage();
            currentY = this.height - 80;

            // Add page header
            newPage.drawText("TENANCY AGREEMENT INSIGHTS (CONTINUED)", {
              x: 50,
              y: this.height - 50,
              size: 18,
              font: this.boldFont,
              color: rgb(0.17, 0.32, 0.51),
            });

            // Add document reference
            newPage.drawText(`Document: ${documentName}`, {
              x: 50,
              y: this.height - 20,
              size: 8,
              font: this.font,
              color: rgb(0.5, 0.5, 0.5),
            });

            // Repeat the insight title on new page
            newPage.drawText(insightTitle, {
              x: 70,
              y: currentY,
              size: 12,
              font: this.boldFont,
              color: titleColor
            });
            currentY -= 20;

            currentPage = newPage;
          }

          // Draw content lines
          contentLines.forEach((line, lineIndex) => {
            currentPage.drawText(line, {
              x: 90,
              y: currentY - (lineIndex * 16),
              size: 11,
              font: this.font,
            });
          });
          currentY -= (contentLines.length * 16 + 20);

          // Add indicators if present
          if (insight.indicators && insight.indicators.length > 0) {
            // Check if indicators will fit
            if (!this.willContentFit(currentPage, currentY, insight.indicators.length * 16 + 40)) {
              const newPage = this.addPage();
              currentY = this.height - 80;

              // Add page header
              newPage.drawText("TENANCY AGREEMENT INSIGHTS (CONTINUED)", {
                x: 50,
                y: this.height - 50,
                size: 18,
                font: this.boldFont,
                color: rgb(0.17, 0.32, 0.51),
              });

              currentPage = newPage;
            }

            // Use appropriate label based on insight type
            const labelText = insight.type === 'warning' ? "Problem Areas:" : 
                             insight.type === 'accent' ? "Note:" : "Details:";
            
            currentPage.drawText(labelText, {
              x: 90,
              y: currentY,
              size: 10,
              font: this.boldFont,
            });
            currentY -= 15;

            // Draw indicators
            insight.indicators.forEach((indicator, indicatorIndex) => {
              const indicatorText = sanitizeText(indicator);
              currentPage.drawText(`• ${indicatorText}`, {
                x: 110,
                y: currentY - (indicatorIndex * 15),
                size: 10,
                font: this.font,
              });
            });
            currentY -= (insight.indicators.length * 15 + 15);
          }

          // Add rating if present
          if (insight.rating) {
            const ratingLabel = `Rating: ${sanitizeText(insight.rating.label)} (${insight.rating.value}%)`;
            currentPage.drawText(ratingLabel, {
              x: 90,
              y: currentY,
              size: 10,
              font: this.boldFont,
              color: titleColor
            });
            currentY -= 30;
          } else {
            // Add spacing between insights
            currentY -= 20;
          }

          // Add divider between insights
          if (index < sortedInsights.length - 1) {
            currentPage.drawLine({
              start: { x: 70, y: currentY },
              end: { x: this.width - 70, y: currentY },
              thickness: 0.5,
              color: rgb(0.9, 0.9, 0.9),
            });
            currentY -= 20;
          }
        });
      }
    }

    // Generate the complete PDF
    async generatePDF(): Promise<Buffer> {
      await this.initialize();

      // Variables from the outer scope need to be captured
      const documentFilename = document.filename;
      const analysisDate = analysis.completedAt;

      // Generate cover page
      this.generateCoverPage(documentFilename, analysisDate);

      // Generate property and financial details page
      this.generatePropertyAndFinancialPage(documentFilename);

      // Generate lease period and parties page
      this.generateLeaseAndPartiesPage(documentFilename);

      // Generate evaluation page with advanced assessment
      this.generateEvaluationPage();

      // Generate insights pages
      this.generateInsightsPages(documentFilename);

      // Add footers to all pages
      this.addFootersToAllPages();

      // Serialize the PDF document to bytes
      const pdfBytes = await this.pdfDoc.save();
      return Buffer.from(pdfBytes);
    }
  }

  let analysisResults: AnalysisResults;

  try {
    // Parse the analysis results
    if (typeof analysis.results === 'string') {
      analysisResults = JSON.parse(analysis.results);
    } else {
      analysisResults = analysis.results as unknown as AnalysisResults;
    }

    // Sanitize all text fields
    // This is now handled within the PDFGenerator class methods

  } catch (error) {
    console.error("Error parsing analysis results:", error);
    // If parsing or sanitization fails, use the original results
    analysisResults = analysis.results as unknown as AnalysisResults;
  }

  // Create a new PDF generator and generate the complete PDF
  const pdfGenerator = new PDFGenerator(analysisResults);
  return await pdfGenerator.generatePDF();
}

// Sanitize text to handle special characters that can't be encoded by WinAnsi
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    // Handle null, undefined, or non-string values safely
    return text ? String(text) : '';
  }

  // Replace Unicode hyphens with standard ASCII hyphen
  return text
    .replace(/[\u2010-\u2015]/g, '-') // Replace various Unicode hyphens with standard hyphen
    .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes with straight quotes
    .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes with straight quotes
    .replace(/…/g, '...') // Replace ellipsis with three dots
    .replace(/[^\x00-\x7F]/g, c => {
      // Replace any other non-ASCII characters with closest ASCII equivalent or remove if no equivalent
      // console.log(`Replacing non-ASCII character: ${c} (${c.charCodeAt(0)})`);
      return ' ';
    });
}

function splitTextIntoLines(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  // Handle null or undefined text
  if (!text) {
    return [''];
  }

  try {
    // Sanitize the text before splitting
    const sanitizedText = sanitizeText(text);

    // Handle explicit line breaks in the text first
    if (sanitizedText.includes('\n')) {
      const paragraphs = sanitizedText.split('\n');
      const allLines: string[] = [];

      // Process each paragraph separately
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          const paragraphLines = splitTextIntoLines(paragraph, font, fontSize, maxWidth);
          allLines.push(...paragraphLines);
        } else {
          // Add an empty line for blank paragraphs to preserve spacing
          allLines.push('');
        }
      }

      return allLines;
    }

    // Split by words, handling edge cases with extra spaces
    const words = sanitizedText.split(' ').filter(word => word.length > 0);

    // Handle empty text
    if (words.length === 0) {
      return [''];
    }

    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Check if the current word by itself exceeds maximum width
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        // If we have content in the current line, add it first
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }

        // Need to split this long word character by character
        let partialWord = '';

        for (let j = 0; j < word.length; j++) {
          const char = word[j];
          const testWord = partialWord + char;

          if (font.widthOfTextAtSize(testWord, fontSize) <= maxWidth) {
            partialWord = testWord;
          } else {
            // Add hyphen if we're breaking in the middle of the word
            if (j < word.length - 1 && partialWord.length > 0) {
              lines.push(partialWord + '-');
            } else {
              lines.push(partialWord);
            }
            partialWord = char;
          }
        }

        // Add the remaining partial word as the start of the next line
        if (partialWord) {
          currentLine = partialWord;
        }

        continue;
      }

      // For normal words, check if it fits on current line
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth <= maxWidth) {
        // Word fits on this line
        currentLine = testLine;
      } else {
        // Word doesn't fit, start a new line
        lines.push(currentLine);
        currentLine = word;
      }
    }

    // Don't forget the last line
    if (currentLine) {
      lines.push(currentLine);
    }

    // Ensure we always return at least one line
    return lines.length > 0 ? lines : [''];
  } catch (error) {
    console.error("Error in splitTextIntoLines:", error);
    // Return a safe fallback value
    return [sanitizeText(String(text || ''))];
  }
}

/**
 * Get performance analytics for the analysis system
 */
export function getAnalysisPerformanceReport() {
  return AnalysisPerformanceMonitor.getPerformanceReport();
}

/**
 * Enhanced chunking with smart document processing
 */
export function enhanceDocumentChunking(text: string, maxChunkLength: number = 12000): string[] {
  // Use enhanced smart chunking
  const smartChunks = createSmartChunks(text, maxChunkLength, 500);
  return smartChunks.map(chunk => chunk.content);
}