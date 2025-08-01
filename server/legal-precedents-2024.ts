/**
 * UK Housing Law Legal Precedents Database 2024-2025
 * Comprehensive collection of recent case law, tribunal decisions, and legal precedents
 * affecting residential tenancy agreements and housing law
 */

export interface LegalCase {
  case_name: string;
  citation: string;
  court: string;
  date: string;
  summary: string;
  legal_principle: string;
  relevance_to_tenancy: string;
  key_findings: string[];
  implications_for_landlords: string[];
  implications_for_tenants: string[];
  related_legislation: string[];
}

export interface LegalPrecedent {
  area_of_law: string;
  precedent_type: "statutory" | "case_law" | "tribunal_decision" | "ombudsman_ruling";
  authority_level: "supreme_court" | "court_of_appeal" | "high_court" | "upper_tribunal" | "first_tier_tribunal" | "county_court";
  binding_status: "binding" | "persuasive" | "guidance";
  last_updated: string;
  cases: LegalCase[];
}

/**
 * 2024-2025 Legal Precedents Database
 */
export const LEGAL_PRECEDENTS_2024: LegalPrecedent[] = [
  {
    area_of_law: "Tenant Fees Act 2019",
    precedent_type: "case_law",
    authority_level: "court_of_appeal",
    binding_status: "binding",
    last_updated: "2024-12-01",
    cases: [
      {
        case_name: "Switaj v McClenaghan",
        citation: "[2024] EWCA Civ 1457",
        court: "Court of Appeal",
        date: "2024-11-15",
        summary: "Court of Appeal clarified the interpretation of the Tenant Fees Act 2019 regarding retrospective application and Section 21 notice validity.",
        legal_principle: "The Tenant Fees Act 2019 does not have retrospective application to payments made before the Act came into force.",
        relevance_to_tenancy: "Affects validity of Section 21 notices where prohibited payments were made before TFA enforcement",
        key_findings: [
          "Payments made before TFA came into force are not subject to its restrictions",
          "Section 21 notices remain valid where pre-TFA payments were made",
          "TFA does not have retrospective application to pre-existing arrangements"
        ],
        implications_for_landlords: [
          "Section 21 notices served after TFA remain valid if prohibited payments were made before TFA",
          "Landlords cannot rely on pre-TFA payment arrangements for new tenancies after June 2019"
        ],
        implications_for_tenants: [
          "Tenants cannot challenge Section 21 notices based on pre-TFA prohibited payments",
          "TFA protections only apply to payments demanded after the Act came into force"
        ],
        related_legislation: [
          "Tenant Fees Act 2019",
          "Housing Act 1988 Section 21"
        ]
      },
      {
        case_name: "London Tribunal Case (Winkworth Shoreditch)",
        citation: "First-tier Tribunal (Property Chamber) June 2024",
        court: "First-tier Tribunal (Property Chamber)",
        date: "2024-06-15",
        summary: "Tribunal ruled that charging early-exiting tenant for lost rent and agency fees constitutes prohibited payment under TFA.",
        legal_principle: "Loss of letting fees and reduced rent from new tenancy cannot be recovered from departing tenant as this constitutes double recovery.",
        relevance_to_tenancy: "Defines scope of prohibited payments for early termination scenarios",
        key_findings: [
          "Charging tenants for landlord's loss of letting fees is prohibited",
          "Tenants not liable for reduced rent charged to new incoming tenants",
          "Early termination fees that benefit landlord are prohibited payments"
        ],
        implications_for_landlords: [
          "Cannot charge departing tenants for re-letting costs or lost rental income",
          "Must absorb costs of early termination and re-letting",
          "Risk £2,252+ penalties for prohibited early termination charges"
        ],
        implications_for_tenants: [
          "Protected from early termination penalties beyond legitimate costs",
          "Can claim back prohibited early termination fees through tribunal",
          "Stronger position in early termination negotiations"
        ],
        related_legislation: [
          "Tenant Fees Act 2019",
          "Consumer Rights Act 2015"
        ]
      }
    ]
  },
  {
    area_of_law: "HMO Licensing and Management",
    precedent_type: "case_law",
    authority_level: "upper_tribunal",
    binding_status: "binding",
    last_updated: "2024-11-01",
    cases: [
      {
        case_name: "Housing 35 Plus Ltd v Nottingham City Council",
        citation: "Upper Tribunal (Lands Chamber) 2024",
        court: "Upper Tribunal (Lands Chamber)",
        date: "2024-10-30",
        summary: "Upper Tribunal clarified HMO licensing requirements for co-operative societies and member management structures.",
        legal_principle: "HMO licensing requirements apply unless all management decisions are genuinely made by members at general meetings.",
        relevance_to_tenancy: "Affects classification of properties as HMOs requiring licensing",
        key_findings: [
          "Co-operative society rules must ensure all management decisions made by members",
          "Properties become HMOs subject to licensing if management criteria not met",
          "£15,000 penalties upheld for managing unlicensed HMOs"
        ],
        implications_for_landlords: [
          "Must verify HMO licensing requirements for co-operative arrangements",
          "Risk significant penalties for operating unlicensed HMOs",
          "Need clear member management structures to avoid HMO classification"
        ],
        implications_for_tenants: [
          "Greater protection in properties that should be licensed as HMOs",
          "Can challenge unlicensed HMO operations",
          "Potential rent repayment order claims against unlicensed HMO operators"
        ],
        related_legislation: [
          "Housing Act 2004",
          "Housing and Planning Act 2016"
        ]
      },
      {
        case_name: "Shah Rent Repayment Case",
        citation: "Upper Tribunal 2024",
        court: "Upper Tribunal",
        date: "2024-09-20",
        summary: "Upper Tribunal upheld rent repayment order against landlord of unlicensed HMO.",
        legal_principle: "Rent repayment orders are enforceable against landlords operating unlicensed HMOs.",
        relevance_to_tenancy: "Strengthens tenant rights to recover rent from unlicensed HMO operators",
        key_findings: [
          "Mr Shah confirmed as landlord of unlicensed HMO",
          "Rent repayment order upheld by Upper Tribunal",
          "Tenants entitled to recover rent paid for unlicensed accommodation"
        ],
        implications_for_landlords: [
          "Must ensure proper HMO licensing to avoid rent repayment liability",
          "Risk losing rental income through rent repayment orders",
          "Upper Tribunal will uphold rent repayment orders for licensing breaches"
        ],
        implications_for_tenants: [
          "Can recover rent paid to unlicensed HMO operators",
          "Strong precedent for rent repayment order applications",
          "Enhanced protection against unlicensed accommodation providers"
        ],
        related_legislation: [
          "Housing and Planning Act 2016",
          "Housing Act 2004"
        ]
      }
    ]
  },
  {
    area_of_law: "Service Charges and Management Fees",
    precedent_type: "case_law",
    authority_level: "court_of_appeal",
    binding_status: "binding",
    last_updated: "2024-10-15",
    cases: [
      {
        case_name: "Accent Housing v Howe Properties",
        citation: "[2024] EWCA Civ (Court of Appeal)",
        court: "Court of Appeal",
        date: "2024-10-10",
        summary: "Court of Appeal ruled on interpretation of service charge provisions and management fee allocation methods.",
        legal_principle: "'Proportionate part' and 'fair proportion' allow flexibility in service charge allocation beyond strict mathematical proportionality.",
        relevance_to_tenancy: "Affects how service charges and management fees can be allocated in residential leases",
        key_findings: [
          "Flat management fee of £300 per flat not necessarily excessive",
          "Service charge provisions allow flexibility in allocation methods",
          "Upper Tribunal misinterpreted lease service charge provisions"
        ],
        implications_for_landlords: [
          "Greater flexibility in structuring service charge allocations",
          "Flat management fees may be permissible if lease terms allow",
          "Must ensure lease terms properly authorize charging methodology"
        ],
        implications_for_tenants: [
          "May face varied service charge allocation methods",
          "Should scrutinize lease terms regarding service charge calculation",
          "Can still challenge excessive or unreasonable management fees"
        ],
        related_legislation: [
          "Landlord and Tenant Act 1985",
          "Commonhold and Leasehold Reform Act 2002"
        ]
      }
    ]
  },
  {
    area_of_law: "Deposit Protection",
    precedent_type: "case_law",
    authority_level: "high_court",
    binding_status: "binding",
    last_updated: "2024-08-15",
    cases: [
      {
        case_name: "High Court Deposit Protection Case",
        citation: "High Court March 2024",
        court: "High Court",
        date: "2024-03-15",
        summary: "High Court dismissed tenant's claim regarding deposit protection compliance and statutory prescribed information.",
        legal_principle: "Landlords must strictly comply with deposit protection requirements and provide prescribed information within statutory timeframes.",
        relevance_to_tenancy: "Reinforces strict compliance requirements for deposit protection",
        key_findings: [
          "Tenant's claim for deposit protection non-compliance dismissed",
          "Prescribed information requirements strictly enforced",
          "Landlord had complied with statutory obligations"
        ],
        implications_for_landlords: [
          "Must ensure full compliance with deposit protection rules",
          "Prescribed information must be provided within 30 days",
          "Risk penalties of 1-3x deposit amount for non-compliance"
        ],
        implications_for_tenants: [
          "Strong statutory protections for deposit protection",
          "Can claim penalties for landlord non-compliance",
          "Must evidence non-compliance to succeed in claims"
        ],
        related_legislation: [
          "Housing Act 2004",
          "Deregulation Act 2015"
        ]
      }
    ]
  },
  {
    area_of_law: "Section 21 Notices and Possession",
    precedent_type: "case_law",
    authority_level: "court_of_appeal",
    binding_status: "binding",
    last_updated: "2024-11-30",
    cases: [
      {
        case_name: "Hajan v London Borough of Brent; Kerr v Poplar Housing",
        citation: "[2024] EWCA Civ 1260",
        court: "Court of Appeal",
        date: "2024-11-25",
        summary: "Court of Appeal clarified procedure for amending possession claims to add absolute grounds during proceedings.",
        legal_principle: "Amendment of possession claim to add absolute ground is permissible under proper procedural rules.",
        relevance_to_tenancy: "Affects possession proceedings and landlord's ability to amend claims",
        key_findings: [
          "Possession claims can be amended to add absolute grounds",
          "Proper procedure must be followed for claim amendments",
          "Serious anti-social behaviour grounds can be added to existing claims"
        ],
        implications_for_landlords: [
          "Can amend possession claims to strengthen grounds during proceedings",
          "Must follow proper procedural rules for amendments",
          "Additional grounds may be available during proceedings"
        ],
        implications_for_tenants: [
          "May face additional possession grounds during proceedings",
          "Can challenge procedural compliance of claim amendments",
          "Need legal advice when landlords amend possession claims"
        ],
        related_legislation: [
          "Housing Act 1988",
          "Civil Procedure Rules"
        ]
      }
    ]
  },
  {
    area_of_law: "Property Classification and SDLT",
    precedent_type: "case_law",
    authority_level: "upper_tribunal",
    binding_status: "binding",
    last_updated: "2024-10-01",
    cases: [
      {
        case_name: "Mudan v HMRC",
        citation: "Upper Tribunal (Tax and Chancery Chamber) 1 October 2024",
        court: "Upper Tribunal (Tax and Chancery Chamber)",
        date: "2024-10-01",
        summary: "Upper Tribunal ruled on property classification as 'residential' for SDLT purposes despite repair requirements.",
        legal_principle: "A property's suitability as a dwelling depends on fundamental characteristics, not habitability due to repair needs.",
        relevance_to_tenancy: "Affects property classification and potential rental arrangements",
        key_findings: [
          "Property remains 'residential' despite need for repairs",
          "Fundamental characteristics determine dwelling classification",
          "Habitability due to repairs doesn't change property classification"
        ],
        implications_for_landlords: [
          "Property classification unaffected by repair requirements",
          "Must still meet habitability standards for rental",
          "SDLT implications remain based on fundamental property characteristics"
        ],
        implications_for_tenants: [
          "Protection under residential tenancy laws regardless of repair needs",
          "Right to habitable accommodation despite property classification",
          "Can demand repairs to meet habitability standards"
        ],
        related_legislation: [
          "Stamp Duty Land Tax Act",
          "Housing Health and Safety Rating System"
        ]
      }
    ]
  }
];

/**
 * Search legal precedents by area of law
 */
export function searchPrecedentsByArea(area: string): LegalCase[] {
  const precedent = LEGAL_PRECEDENTS_2024.find(p => 
    p.area_of_law.toLowerCase().includes(area.toLowerCase())
  );
  return precedent?.cases || [];
}

/**
 * Get all binding precedents from Court of Appeal and above
 */
export function getBindingPrecedents(): LegalCase[] {
  return LEGAL_PRECEDENTS_2024
    .filter(p => p.binding_status === "binding" && 
                 ["supreme_court", "court_of_appeal", "high_court"].includes(p.authority_level))
    .flatMap(p => p.cases);
}

/**
 * Get recent tribunal decisions (First-tier and Upper Tribunal)
 */
export function getTribunalDecisions(): LegalCase[] {
  return LEGAL_PRECEDENTS_2024
    .filter(p => ["upper_tribunal", "first_tier_tribunal"].includes(p.authority_level))
    .flatMap(p => p.cases);
}

/**
 * Find relevant cases by legislation
 */
export function findCasesByLegislation(legislation: string): LegalCase[] {
  const results: LegalCase[] = [];
  
  LEGAL_PRECEDENTS_2024.forEach(precedent => {
    precedent.cases.forEach(case_item => {
      if (case_item.related_legislation.some(law => 
        law.toLowerCase().includes(legislation.toLowerCase())
      )) {
        results.push(case_item);
      }
    });
  });
  
  return results;
}

/**
 * Generate legal citation format
 */
export function formatLegalCitation(case_item: LegalCase): string {
  return `${case_item.case_name} ${case_item.citation} (${case_item.court}, ${case_item.date})`;
}

/**
 * Get cases relevant to specific tenancy issues
 */
export function getCasesForTenancyIssue(issue: string): LegalCase[] {
  const results: LegalCase[] = [];
  
  LEGAL_PRECEDENTS_2024.forEach(precedent => {
    precedent.cases.forEach(case_item => {
      if (case_item.relevance_to_tenancy.toLowerCase().includes(issue.toLowerCase()) ||
          case_item.summary.toLowerCase().includes(issue.toLowerCase()) ||
          case_item.legal_principle.toLowerCase().includes(issue.toLowerCase())) {
        results.push(case_item);
      }
    });
  });
  
  return results;
}

/**
 * Export for integration with existing legal analysis
 */
export const RECENT_LEGAL_DEVELOPMENTS = {
  TENANT_FEES_ACT_2019: {
    recent_cases: searchPrecedentsByArea("Tenant Fees Act"),
    key_developments: [
      "No retrospective application to pre-TFA payments (Switaj v McClenaghan 2024)",
      "Early termination fees constitute prohibited payments (London Tribunal June 2024)",
      "Double recovery of letting fees prohibited"
    ]
  },
  HMO_LICENSING: {
    recent_cases: searchPrecedentsByArea("HMO Licensing"),
    key_developments: [
      "Stricter enforcement of licensing requirements (Housing 35 Plus Ltd 2024)",
      "Rent repayment orders upheld for unlicensed HMOs (Shah case 2024)",
      "Co-operative management structures scrutinized"
    ]
  },
  DEPOSIT_PROTECTION: {
    recent_cases: searchPrecedentsByArea("Deposit Protection"),
    key_developments: [
      "Strict compliance with prescribed information requirements",
      "Penalties of 1-3x deposit amount for non-compliance",
      "Six-year limitation period considerations"
    ]
  },
  SERVICE_CHARGES: {
    recent_cases: searchPrecedentsByArea("Service Charges"),
    key_developments: [
      "Flexible interpretation of 'proportionate part' allocation (Accent Housing 2024)",
      "Flat management fees may be permissible under lease terms",
      "Lease wording critical for service charge recovery"
    ]
  }
};