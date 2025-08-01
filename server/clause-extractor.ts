import { Clause } from '@shared/schema';

/**
 * Extracts clauses from a document content
 * This helps improve analysis accuracy by breaking down the document
 * into individual clauses that can be analyzed separately
 * 
 * @param documentContent The full document content as string
 * @returns Array of Clause objects containing content and metadata
 */
export function extractClauses(documentContent: string): Clause[] {
  if (!documentContent || documentContent.trim() === '') {
    return [];
  }

  console.log("Starting clause extraction process...");
  
  // Split document into lines for processing
  const lines = documentContent.split(/\r?\n/);
  const clauses: Clause[] = [];
  
  // Regular expressions to identify potential clause headers
  const clauseHeaderRegex = /^\s*(\d+\.(?:\d+)?)\s+([A-Z][\w\s\-\–\—\&\/\(\),']+?)(?:\:|\.|\n|\r|$)/i;
  const simpleNumberedLineRegex = /^\s*(\d+\.(?:\d+)?)\s+/;
  const bulletPointRegex = /^\s*[\•\-\*]\s+/;
  
  let currentClauseNumber: string | null = null;
  let currentClauseTitle: string | null = null;
  let currentClauseContent: string[] = [];
  let isInClause = false;
  let potentialMarkers = 0;
  
  // First pass: identify potential clause markers and count them
  lines.forEach(line => {
    if (clauseHeaderRegex.test(line) || 
        simpleNumberedLineRegex.test(line) ||
        bulletPointRegex.test(line)) {
      potentialMarkers++;
    }
  });
  
  console.log(`Found ${potentialMarkers} potential clause markers`);
  
  // Second pass: extract clauses based on structure pattern
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const clauseHeaderMatch = line.match(clauseHeaderRegex);
    
    // Check if this line starts a new clause
    if (clauseHeaderMatch) {
      // If we were already in a clause, save it before starting a new one
      if (isInClause && currentClauseContent.length > 0) {
        clauses.push({
          clauseNumber: currentClauseNumber || 'unknown',
          title: currentClauseTitle || '',
          content: currentClauseContent.join(' ').trim(),
          startPosition: 0, // Will calculate position later
        });
      }
      
      // Start new clause
      currentClauseNumber = clauseHeaderMatch[1];
      currentClauseTitle = clauseHeaderMatch[2].trim();
      currentClauseContent = [line.replace(clauseHeaderRegex, '')];
      isInClause = true;
    } 
    // Check for simpler numbered lines that might be subclauses
    else if (simpleNumberedLineRegex.test(line)) {
      const match = line.match(simpleNumberedLineRegex);
      
      // If we were already in a clause, save it before starting a new one
      if (isInClause && currentClauseContent.length > 0) {
        clauses.push({
          clauseNumber: currentClauseNumber || 'unknown',
          title: currentClauseTitle || '',
          content: currentClauseContent.join(' ').trim(),
          startPosition: 0, // Will calculate position later
        });
      }
      
      // Start new clause with just a number, no specific title
      currentClauseNumber = match ? match[1] : 'unknown';
      currentClauseTitle = '';
      currentClauseContent = [line.replace(simpleNumberedLineRegex, '')];
      isInClause = true;
    }
    // Handle bullet points as subclauses within a clause
    else if (bulletPointRegex.test(line)) {
      if (!isInClause) {
        // If not in a clause, start a new one
        currentClauseNumber = 'bullet';
        currentClauseTitle = '';
        currentClauseContent = [line.replace(bulletPointRegex, '')];
        isInClause = true;
      } else {
        // If already in a clause, this is likely a subpoint
        currentClauseContent.push(line);
      }
    }
    // Not a clause header, add to current clause if we're in one
    else if (isInClause) {
      currentClauseContent.push(line);
    }
    // Text outside of any defined clause structure - create a generic clause
    else if (line.trim().length > 0) {
      // Only create a new clause if there's actual content
      currentClauseNumber = 'text';
      currentClauseTitle = '';
      currentClauseContent = [line];
      isInClause = true;
    }
    
    // Handle end of file by adding the last clause
    if (i === lines.length - 1 && isInClause && currentClauseContent.length > 0) {
      clauses.push({
        clauseNumber: currentClauseNumber || 'unknown',
        title: currentClauseTitle || '',
        content: currentClauseContent.join(' ').trim(),
        startPosition: 0, // Will calculate position later
      });
    }
  }
  
  // Third pass: Calculate start positions and clean up clause content
  let documentPosition = 0;
  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    
    // Find the position of this clause in the original document
    const pattern = (clause.title) 
      ? `${clause.clauseNumber}\\s*${clause.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
      : `${clause.clauseNumber}`;
    
    const regex = new RegExp(pattern, 'i');
    const matchPosition = documentContent.slice(documentPosition).search(regex);
    
    if (matchPosition !== -1) {
      clause.startPosition = documentPosition + matchPosition;
    } else {
      // If can't find exact position, estimate based on content
      const contentPattern = clause.content.substring(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const contentRegex = new RegExp(contentPattern, 'i');
      const contentMatch = documentContent.slice(documentPosition).search(contentRegex);
      
      if (contentMatch !== -1) {
        clause.startPosition = documentPosition + contentMatch;
      }
    }
    
    // Update document position for next search
    documentPosition = clause.startPosition + 1;
    
    // Clean up clause content
    clause.content = clause.content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
  }
  
  // Remove empty or too-short clauses
  const validClauses = clauses.filter(clause => 
    clause.content.length > 10 || (clause.title && clause.title.length > 0)
  );
  
  console.log(`Successfully extracted ${validClauses.length} clauses for individual analysis`);
  
  return validClauses;
}

/**
 * Detects the type of clause based on its content
 * Useful for specialized analysis of different clause types
 * 
 * @param content The clause content
 * @returns The detected clause type
 */
export function detectClauseType(content: string): string {
  const contentLower = content.toLowerCase();
  
  // Common clause types in UK tenancy agreements
  if (contentLower.includes('deposit') && 
     (contentLower.includes('scheme') || contentLower.includes('protection'))) {
    return 'deposit-protection';
  }
  
  if (contentLower.includes('repair') || 
     (contentLower.includes('maintenance') && contentLower.includes('responsibility'))) {
    return 'repairs-maintenance';
  }
  
  if (contentLower.includes('right to rent') || 
     (contentLower.includes('immigration') && contentLower.includes('check'))) {
    return 'right-to-rent';
  }
  
  if (contentLower.includes('fee') || 
     contentLower.includes('charge') || 
     contentLower.includes('payment')) {
    return 'fees-charges';
  }
  
  if (contentLower.includes('notice') && 
     (contentLower.includes('terminate') || contentLower.includes('end') || 
      contentLower.includes('period'))) {
    return 'notice-periods';
  }
  
  if (contentLower.includes('pet') || 
     contentLower.includes('animal')) {
    return 'pets';
  }
  
  if (contentLower.includes('subletting') || 
     contentLower.includes('sublet') || 
     contentLower.includes('assign')) {
    return 'subletting';
  }
  
  if (contentLower.includes('access') && 
     (contentLower.includes('landlord') || contentLower.includes('property'))) {
    return 'landlord-access';
  }
  
  // Default type
  return 'general';
}

// Vector analysis function removed - AI now handles all compliance scoring independently

/**
 * Gets an appropriate specialized prompt for a specific clause type
 * 
 * @param clauseType The detected clause type
 * @param content The clause content
 * @returns A specialized prompt for this type of clause
 */
export async function getPromptForClauseType(clauseType: string, content: string): Promise<string> {
  const basePrompt = `Analyze this clause from a UK tenancy agreement and identify any potential issues or unfair terms: "${content}"`;
  
  // Vector analysis removed - AI now handles all compliance scoring
  
  let prompt = '';
  
  switch (clauseType) {
    case 'deposit-protection':
      prompt = `${basePrompt}\n\nSpecifically check if it complies with deposit protection laws, including:
- Whether it specifies a government-approved deposit protection scheme
- If the deposit amount exceeds 5 weeks' rent (or 6 weeks for higher-value properties)
- Whether it mentions providing prescribed information to the tenant within 30 days
- If it includes fair terms for return of the deposit`;
      break;
      
    case 'repairs-maintenance':
      prompt = `${basePrompt}\n\nSpecifically check:
- If it unfairly shifts landlord repair responsibilities to tenants (contrary to the Landlord and Tenant Act 1985)
- Whether it adequately addresses landlord's responsibilities for maintaining the structure, exterior, utilities
- If it includes reasonable timeframes for repairs
- Whether it mentions gas safety, electrical safety, and other safety certificates`;
      break;
      
    case 'fees-charges':
      prompt = `${basePrompt}\n\nSpecifically check compliance with the Tenant Fees Act 2019:
- Are any prohibited fees mentioned (such as administration, referencing, inventory, cleaning fees)?
- Does it only include permitted payments (rent, deposit, holding deposit, utilities, default fees)?
- Are default fees reasonable and properly specified?
- Does it mention any exit fees or renewal fees (which are prohibited)?`;
      break;
      
    case 'notice-periods':
      prompt = `${basePrompt}\n\nSpecifically check:
- Does it comply with minimum notice periods (usually 2 months for Section 21 notices)?
- Are notice requirements equal/fair for both landlord and tenant?
- Does it mention Section 21 restrictions (e.g., cannot be served in first 4 months)?
- Does it correctly address fixed-term vs. periodic tenancy notice requirements?`;
      break;
      
    case 'landlord-access':
      prompt = `${basePrompt}\n\nSpecifically check:
- Does it respect the tenant's right to quiet enjoyment?
- Does it require reasonable notice (usually 24 hours) for landlord visits?
- Are access provisions limited to reasonable purposes and reasonable times?
- Does it allow for emergency access only in genuine emergencies?`;
      break;
      
    default:
      prompt = basePrompt;
      break;
  }
  
  return prompt;
}