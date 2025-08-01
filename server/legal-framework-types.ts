/**
 * Enhanced Legal Framework - Type Definitions
 * This module defines the type system for the enhanced legal analysis framework
 */

// Document Types
export type DocumentType = 
  | 'residential_tenancy'
  | 'assured_shorthold_tenancy'
  | 'periodic_tenancy'
  | 'commercial_lease'
  | 'business_tenancy'
  | 'student_accommodation'
  | 'holiday_let'
  | 'agricultural_tenancy'
  | 'social_housing'
  | 'shared_ownership'
  | 'rent_to_rent'
  | 'company_let'
  | 'diplomatic_tenancy'
  | 'crown_estate'
  | 'mixed_use'
  | 'unknown'
  | 'all';

// Violation Types for categorization
export type ViolationType = 
  | 'deposit_violation'
  | 'prohibited_fees'
  | 'repair_responsibility'
  | 'notice_procedure'
  | 'access_rights'
  | 'unfair_terms'
  | 'discrimination'
  | 'safety_compliance'
  | 'insurance_requirements'
  | 'subletting_restrictions'
  | 'rent_increase_procedures'
  | 'termination_clauses'
  | 'maintenance_obligations'
  | 'utility_responsibilities'
  | 'pet_restrictions'
  | 'occupancy_limits'
  | 'property_alterations'
  | 'dispute_resolution'
  | 'data_protection'
  | 'consumer_rights'
  | 'housing_standards'
  | 'planning_compliance'
  | 'licensing_requirements'
  | 'energy_efficiency'
  | 'fire_safety'
  | 'gas_safety'
  | 'electrical_safety'
  | 'general_compliance';

// Severity Levels
export type SeverityLevel = 'critical' | 'serious' | 'moderate' | 'minor' | 'informational';

// Legal Areas for specialized analysis
export type LegalArea = 
  | 'tenant_fees_act'
  | 'housing_act_1988'
  | 'landlord_tenant_act_1985'
  | 'consumer_rights_act'
  | 'deregulation_act'
  | 'housing_health_safety'
  | 'deposit_protection'
  | 'right_to_rent'
  | 'homes_fitness_act'
  | 'renters_reform_bill'
  | 'business_tenancies_act'
  | 'agricultural_holdings_act'
  | 'housing_act_1996'
  | 'localism_act'
  | 'planning_acts'
  | 'building_regulations'
  | 'fire_safety_order'
  | 'gas_safety_regulations'
  | 'electrical_safety_standards'
  | 'energy_performance_regulations'
  | 'general_data_protection';

// Confidence Metrics
export interface ConfidenceMetrics {
  overallConfidence: number; // 0-100
  dataQuality: number; // 0-100 - quality of document content
  analysisCompleteness: number; // 0-100 - how complete the analysis is
  legalCertainty: number; // 0-100 - certainty of legal interpretations
  documentClarity: number; // 0-100 - clarity of document terms
  factorBreakdown: {
    documentCompleteness: number;
    clauseClarity: number;
    standardCompliance: number;
    legalComplexity: number;
    ambiguityLevel: number;
  };
}

// Impact Assessment
export interface ImpactAssessment {
  financialImpact: {
    immediateRisk: number; // £ amount at risk
    ongoingRisk: number; // £ monthly/annual ongoing risk
    totalExposure: number; // Total potential financial exposure
    riskCategories: {
      prohibitedFees: number;
      excessiveDeposits: number;
      unfairCharges: number;
      legalCosts: number;
      lostRights: number;
    };
  };
  legalImpact: {
    rightsAtRisk: string[];
    enforcementRisk: number; // 0-100
    litigationRisk: number; // 0-100
    regulatoryRisk: number; // 0-100
  };
  practicalImpact: {
    livingConditions: number; // 0-100 impact score
    securityOfTenure: number; // 0-100 impact score
    dayToDayLiving: number; // 0-100 impact score
    futureOptions: number; // 0-100 impact score
  };
}

// Risk Assessment
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  specificRisks: RiskItem[];
  mitigationStrategies: MitigationStrategy[];
  timeToResolve: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  professionalAdviceRecommended: boolean;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

export interface RiskItem {
  category: ViolationType;
  description: string;
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // probability * impact / 100
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  legalBasis: string;
}

export interface MitigationStrategy {
  riskCategory: ViolationType;
  strategy: string;
  effectiveness: number; // 0-100
  implementationDifficulty: 'easy' | 'medium' | 'hard' | 'professional_required';
  cost: 'free' | 'low' | 'medium' | 'high';
  timeframe: string;
  successRate: number; // 0-100
}

// Legal Violation Details
export interface LegalViolation {
  violationType: ViolationType;
  severity: SeverityLevel;
  impactScore: number; // 0-100
  legalBasis: LegalReference[];
  description: string;
  evidence: string[];
  recommendations: ViolationRecommendation[];
  financialImpact: number; // £ amount
  enforcementRisk: number; // 0-100
  timeToResolve: string;
  professionalAdviceRequired: boolean;
}

export interface LegalReference {
  act: string;
  section?: string;
  year: number;
  description: string;
  relevantText?: string;
  enforcementAuthority?: string;
  penalties?: string;
  caselaw?: CaseLawReference[];
}

export interface CaseLawReference {
  caseName: string;
  citation: string;
  year: number;
  relevantPrinciple: string;
  courtLevel: 'magistrates' | 'county' | 'high_court' | 'court_of_appeal' | 'supreme_court' | 'european';
}

export interface ViolationRecommendation {
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  legalJustification: string;
  implementationDifficulty: 'easy' | 'medium' | 'hard' | 'professional_required';
  expectedOutcome: string;
  timeframe: string;
  cost: string;
  successRate: number; // 0-100
  fallbackOptions?: string[];
}

// Analysis Context
export interface AnalysisContext {
  documentType: DocumentType;
  analysisDepth: 'basic' | 'standard' | 'comprehensive' | 'expert';
  focusAreas?: LegalArea[];
  specialConsiderations?: string[];
  tenantProfile?: TenantProfile;
  landlordProfile?: LandlordProfile;
  propertyDetails?: PropertyContext;
  analysisHistory?: PreviousAnalysis[];
  userPreferences?: AnalysisPreferences;
  requiredSpecializations?: string[];
}

export interface TenantProfile {
  type: 'individual' | 'family' | 'student' | 'professional' | 'company' | 'vulnerable_person';
  experience: 'first_time' | 'experienced' | 'very_experienced';
  protectedCharacteristics?: string[];
  specificNeeds?: string[];
  financialSituation?: 'budget_conscious' | 'standard' | 'premium';
}

export interface LandlordProfile {
  type: 'individual' | 'company' | 'council' | 'housing_association' | 'letting_agent';
  experience: 'new' | 'experienced' | 'professional';
  properties: number;
  reputation?: 'unknown' | 'good' | 'poor' | 'regulated';
}

export interface PropertyContext {
  location: string;
  propertyType: string;
  age: string;
  condition: string;
  marketSegment: 'budget' | 'standard' | 'premium' | 'luxury';
  localMarketConditions?: string;
  planningRestrictions?: string[];
  knownIssues?: string[];
}

export interface PreviousAnalysis {
  date: string;
  documentId: string;
  mainIssues: string[];
  resolutionStatus: 'unresolved' | 'partially_resolved' | 'resolved';
  followUpRequired: boolean;
}

export interface AnalysisPreferences {
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
  focusOnFinancial: boolean;
  focusOnLegal: boolean;
  focusOnPractical: boolean;
  languagePreference: 'simple' | 'detailed' | 'technical';
}

// Scoring Matrices
export interface ViolationScoringMatrix {
  violationType: ViolationType;
  baseScore: number; // Base impact score
  severityMultipliers: Record<SeverityLevel, number>;
  contextModifiers: Record<string, number>;
  maxScore: number;
  minScore: number;
}

export interface ComplianceScoring {
  totalScore: number; // 0-100
  categoryScores: Record<LegalArea, number>;
  penaltyCalculation: {
    criticalViolations: number;
    seriousViolations: number;
    moderateViolations: number;
    minorViolations: number;
    totalPenalty: number;
  };
  confidenceAdjustment: number; // Adjustment based on confidence levels
  finalScore: number; // Total score after adjustments
}

// Enhanced Insight with detailed tracking
export interface EnhancedInsight {
  title: string;
  content: string;
  type: "primary" | "accent" | "warning";
  indicators?: string[];
  rating?: {
    value: number;
    label: string;
  };
  // Enhanced properties
  violationType: ViolationType;
  severity: SeverityLevel;
  impactScore: number;
  legalBasis: LegalReference[];
  violation?: LegalViolation;
  recommendations: ViolationRecommendation[];
  confidenceScore: number;
  analysisDepth: 'surface' | 'moderate' | 'deep' | 'expert';
  contextualFactors: string[];
  crossReferences?: string[]; // References to related insights
  updateHistory?: InsightUpdate[];
}

export interface InsightUpdate {
  date: string;
  changeType: 'severity_update' | 'new_evidence' | 'legal_change' | 'resolution';
  description: string;
  updatedBy: 'system' | 'manual_review' | 'legal_update';
}

// Enhanced Recommendation with implementation details
export interface EnhancedRecommendation {
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  legalJustification: string;
  implementationDifficulty: 'easy' | 'medium' | 'hard' | 'professional_required';
  expectedOutcome: string;
  timeframe: string;
  cost: string;
  successRate: number;
  alternatives?: string[];
  consequences?: string[];
  followUpRequired: boolean;
  relatedInsights: string[];
}

// Weighted Scoring System
export interface WeightedScoringConfig {
  categoryWeights: Record<LegalArea, number>;
  severityWeights: Record<SeverityLevel, number>;
  violationTypeWeights: Record<ViolationType, number>;
  contextModifiers: Record<string, number>;
  tenantProtectionBias: number; // Bias towards tenant protection (0-100)
  conservatismFactor: number; // How conservative to be in scoring (0-100)
}

// Analysis Results with enhanced structure
export interface EnhancedAnalysisResults {
  // Core analysis (existing structure maintained for compatibility)
  propertyDetails: PropertyDetails & { confidence: string };
  financialTerms: FinancialTerms & { confidence: string };
  leasePeriod: LeasePeriod & { confidence: string };
  parties: Parties & { confidence: string };
  insights: EnhancedInsight[];
  recommendations: EnhancedRecommendation[];
  clauses?: Clause[];
  
  // Enhanced analysis components
  legalViolations: LegalViolation[];
  riskAssessment: RiskAssessment;
  impactAssessment: ImpactAssessment;
  confidenceMetrics: ConfidenceMetrics;
  complianceScoring: ComplianceScoring;
  
  // Analysis metadata
  analysisContext: AnalysisContext;
  analysisTimestamp: string;
  analysisVersion: string;
  reviewRequired: boolean;
  qualityAssurance: QualityAssuranceMetrics;
  
  // Backward compatibility
  complianceScore?: number;
  compliance?: {
    score: number;
    level: "green" | "yellow" | "red";
    summary: string;
    detailedBreakdown?: Record<string, any>;
  };
  validationPerformed?: boolean;
  ukLawVerificationPerformed?: boolean;
  doubleVerified?: boolean;
  verificationBadge?: string;
  validationNote?: string;
  score?: number;
}

export interface QualityAssuranceMetrics {
  completenessScore: number; // 0-100
  consistencyScore: number; // 0-100
  accuracyIndicators: string[];
  flaggedForReview: boolean;
  reviewReasons?: string[];
  validationChecks: Record<string, boolean>;
  analysisQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

// Import existing types for compatibility
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

export interface Clause {
  clauseNumber: string;
  title: string;
  content: string;
  startPosition: number;
  type?: string;
  issues?: string[];
}