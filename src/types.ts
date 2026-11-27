export type UserRole = 'business' | 'creator';

export interface DemographicSegment {
  range: string;
  percent: number;
}

export interface CountrySegment {
  country: string;
  percent: number;
}

export interface AuthenticityReport {
  riskLevel: 'VERIFIED_SAFE' | 'MODERATE_CAUTION' | 'HIGH_RISK_SUSPICIOUS';
  credibilityScore: number; // 0-100
  fakeFollowersEstimatePct: number;
  engagementAnomaly: 'Normal' | 'Mild Discrepancy' | 'Severe Discrepancy';
  botPatternCount: number;
  growthCurveType: 'Organic Continuous' | 'Gradual Viral' | 'Abrupt Bot Spike';
  commentAuthenticityScore: number; // 0-100
  auditFlags: string[];
  scanDate: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  channelUrl: string;
  platform: 'YouTube' | 'Instagram' | 'TikTok' | 'Multi-platform';
  niche: 'Tech & Gadgets' | 'Beauty & Skincare' | 'Fitness & Health' | 'Finance & Crypto' | 'Gaming & Hardware' | 'Food & Cooking' | 'Travel & Lifestyle';
  subNiches: string[];
  bio: string;
  subscribers: number;
  avgViews: number;
  engagementRate: number; // e.g. 3.8
  rates: {
    dedicatedVideo: number;
    integrated60s: number;
    shortsReels: number;
  };
  demographics: {
    topCountries: CountrySegment[];
    ageDistribution: DemographicSegment[];
    genderRatio: { male: number; female: number };
  };
  authenticityReport: AuthenticityReport;
  pastDealsCompleted: number;
  avgDealerRating: number;
  sampleVideos: {
    title: string;
    views: string;
    uploadDate: string;
    duration: string;
  }[];
}

export interface BusinessDealerProfile {
  id: string;
  companyName: string;
  tagline: string;
  industry: string;
  website: string;
  brandValues: string[];
  targetDemographics: {
    ageRange: string;
    primaryRegion: string;
  };
  defaultBudget: number;
  avatar: string;
  description: string;
}

export interface ProductCampaign {
  id: string;
  dealerId: string;
  dealerName: string;
  productName: string;
  productTagline: string;
  productCategory: string;
  productImage?: string;
  description: string;
  targetAudience: string;
  deliverableNeeded: 'Dedicated YouTube Video' | '60s Integrated Sponsor' | 'Shorts / Reels' | 'Multi-Deliverable Package';
  budget: number;
  deadline: string;
  keyTalkingPoints: string[];
  status: 'Active' | 'Draft' | 'Completed';
  createdAt: string;
}

export interface ContractTerms {
  deliverableDescription: string;
  exclusivityDays: number;
  disclosureRequirement: string; // e.g., "Must clearly include #ad and verbal FTC disclosure in first 30s"
  approvalWindowDays: number;
  revisionsIncluded: number;
  usageRights: string;
  cancellationPolicy: string;
}

export interface DeliverableVerification {
  status: 'UNVERIFIED' | 'VERIFIED' | 'PARTIAL_WARNING' | 'FAILED';
  summary: string;
  videoId?: string;
  title?: string;
  channelTitle?: string;
  channelHandle?: string;
  channelMatch?: boolean | null;
  disclosureFound?: boolean;
  privacyStatus?: string;
  durationFormatted?: string;
  views?: number;
  likes?: number;
  verifiedAt?: string;
  checks?: {
    key: string;
    label: string;
    passed: boolean;
    severity: 'pass' | 'warning' | 'fail';
    detail: string;
  }[];
}

export interface EscrowAuditEvent {
  id: string;
  action: string;
  actor: string;
  role: UserRole | 'escrow_vault';
  timestamp: string;
  detail: string;
  txHash?: string;
}

export interface DealContract {
  id: string;
  campaignId: string;
  campaignTitle: string;
  dealerId: string;
  dealerName: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  deliverable: string;
  feeAmount: number;
  platformFeePct?: number;
  escrowStatus:
    | 'DRAFT'
    | 'SIGNED_BY_DEALER_PENDING_CREATOR'
    | 'ESCROW_FUNDED_ACTIVE'
    | 'DELIVERABLE_SUBMITTED'
    | 'APPROVED_PAYOUT_RELEASED'
    | 'DISPUTED'
    | 'REFUNDED_TO_DEALER';
  terms: ContractTerms;
  dealerSignature?: {
    signed: boolean;
    signatoryName: string;
    signedAt: string;
    digitalHash: string;
  };
  creatorSignature?: {
    signed: boolean;
    signatoryName: string;
    signedAt: string;
    digitalHash: string;
  };
  submissionProof?: {
    url: string;
    submittedAt: string;
    notes?: string;
  };
  verification?: DeliverableVerification;
  revisionsUsed?: number;
  revisionFeedback?: string;
  dispute?: {
    reason: string;
    raisedByRole: UserRole;
    raisedAt: string;
  };
  resolutionNote?: string;
  escrowReceiptHash?: string;
  auditEvents?: EscrowAuditEvent[];
  milestones: {
    title: string;
    status: 'Pending' | 'Completed' | 'In Review' | 'Revision Requested' | 'Disputed' | 'Refunded';
    timestamp?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageLog {
  id: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface ConnectionLog {
  id: string;
  dealerId: string;
  dealerName: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  campaignId?: string;
  campaignTitle?: string;
  contractId?: string;
  status: 'Connected' | 'Contract Sent' | 'In Progress' | 'Completed';
  createdAt: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: MessageLog[];
}

export interface TrendingTopic {
  id: string;
  topic: string;
  niche: string;
  growthPercentage: string;
  searchVolume: string;
  competition: 'Low' | 'Medium' | 'High';
  creatorAngle: string;
  commercialSponsorDemand: 'Very High' | 'High' | 'Emerging';
  keyKeywords: string[];
}

export interface RecommendationBreakdown {
  overallScore: number; // 0-100
  nicheMatch: { score: number; max: 35; reason: string };
  engagementHealth: { score: number; max: 25; reason: string };
  budgetFit: { score: number; max: 20; reason: string };
  audienceOverlap: { score: number; max: 15; reason: string };
  dealerReputation: { score: number; max: 5; reason: string };
  fraudPenaltyApplied: boolean;
  penaltyReason?: string;
  verdict: 'Top Recommended Match' | 'Strong Fit' | 'Moderate Fit' | 'High Risk Warning';
}
