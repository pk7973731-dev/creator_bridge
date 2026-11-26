import { CreatorProfile, ProductCampaign, RecommendationBreakdown } from '../types';

/**
 * Multi-Factor Creator Recommendation Algorithm
 * Transparently scores creators based on 5 weighted pillars:
 * 1. Niche & Sub-category Semantic Match (35%)
 * 2. Engagement Authenticity & Community Health (25%)
 * 3. Budget & Rate Compatibility (20%)
 * 4. Audience Demographic & Regional Overlap (15%)
 * 5. Track Record & Dealer Trust Score (5%)
 * 
 * Includes an automated Fraud Detection Penalty (-35%) for bot-inflated profiles.
 */
export function calculateCreatorRecommendation(
  creator: CreatorProfile,
  campaign: ProductCampaign
): RecommendationBreakdown {
  // 1. Niche Match (Max 35 points)
  let nicheScore = 0;
  let nicheReason = '';
  const campaignCat = campaign.productCategory.toLowerCase();
  const creatorNiche = creator.niche.toLowerCase();

  const isExactNiche = 
    (campaignCat.includes('tech') && creatorNiche.includes('tech')) ||
    (campaignCat.includes('beauty') && creatorNiche.includes('beauty')) ||
    (campaignCat.includes('fitness') && creatorNiche.includes('fitness')) ||
    (campaignCat.includes('finance') && creatorNiche.includes('finance')) ||
    (campaignCat.includes('gaming') && creatorNiche.includes('gaming'));

  const isAdjacentNiche = 
    (campaignCat.includes('tech') && creatorNiche.includes('gaming')) ||
    (campaignCat.includes('tech') && creatorNiche.includes('finance')) ||
    (campaignCat.includes('fitness') && creatorNiche.includes('tech')) ||
    (campaignCat.includes('beauty') && creatorNiche.includes('fitness'));

  if (isExactNiche) {
    nicheScore = 35;
    nicheReason = `Direct 1:1 Category alignment (${creator.niche}) with high sub-niche topical authority.`;
  } else if (isAdjacentNiche) {
    nicheScore = 24;
    nicheReason = `Adjacent audience overlap between ${campaign.productCategory} and ${creator.niche}.`;
  } else {
    nicheScore = 8;
    nicheReason = `Cross-industry audience with limited organic category overlap.`;
  }

  // 2. Engagement Authenticity & Health (Max 25 points)
  let engScore = 0;
  let engReason = '';
  const rate = creator.engagementRate;
  const credibility = creator.authenticityReport.credibilityScore;

  if (rate >= 3.0 && rate <= 7.0 && credibility >= 90) {
    engScore = 25;
    engReason = `Prime viral benchmark: ${rate}% engagement with exceptional ${credibility}/100 audience credibility.`;
  } else if (rate >= 1.8 && credibility >= 80) {
    engScore = 20;
    engReason = `Healthy sustained engagement (${rate}%) with verified authentic human comments.`;
  } else if (rate < 1.0) {
    engScore = 6;
    engReason = `Low engagement anomaly (${rate}%), indicating stale or disengaged subscribers.`;
  } else {
    engScore = 14;
    engReason = `Moderate engagement (${rate}%) with acceptable interaction density.`;
  }

  // 3. Budget & Rate Compatibility (Max 20 points)
  let budgetScore = 0;
  let budgetReason = '';
  
  let requiredRate = creator.rates.integrated60s;
  if (campaign.deliverableNeeded === 'Dedicated YouTube Video') {
    requiredRate = creator.rates.dedicatedVideo;
  } else if (campaign.deliverableNeeded === 'Shorts / Reels') {
    requiredRate = creator.rates.shortsReels;
  }

  const budgetRatio = campaign.budget / Math.max(requiredRate, 1);

  if (budgetRatio >= 1.0) {
    budgetScore = 20;
    budgetReason = `Campaign budget (₹${campaign.budget.toLocaleString()}) fully covers creator rate (₹${requiredRate.toLocaleString()}).`;
  } else if (budgetRatio >= 0.85) {
    budgetScore = 16;
    budgetReason = `Budget is within standard 15% negotiation margin of creator standard fee (₹${requiredRate.toLocaleString()}).`;
  } else if (budgetRatio >= 0.65) {
    budgetScore = 10;
    budgetReason = `Budget is moderately below creator's typical quote (₹${requiredRate.toLocaleString()}).`;
  } else {
    budgetScore = 4;
    budgetReason = `Significant budget gap (₹${campaign.budget.toLocaleString()} vs ₹${requiredRate.toLocaleString()} rate).`;
  }

  // 4. Audience Demographic & Regional Overlap (Max 15 points)
  let audienceScore = 0;
  let audienceReason = '';
  const topCountry = creator.demographics.topCountries[0]?.country || 'Global';
  const topCountryPct = creator.demographics.topCountries[0]?.percent || 50;
  const youngAdultPct = (creator.demographics.ageDistribution.find(a => a.range === '25-34')?.percent || 0) +
                       (creator.demographics.ageDistribution.find(a => a.range === '18-24')?.percent || 0);

  if (youngAdultPct >= 65 && topCountry.includes('United States')) {
    audienceScore = 15;
    audienceReason = `High-purchasing demographic concentration (${youngAdultPct}% aged 18-34) in target regions.`;
  } else if (youngAdultPct >= 50) {
    audienceScore = 12;
    audienceReason = `Solid demographic match with ${topCountryPct}% concentrated in ${topCountry}.`;
  } else {
    audienceScore = 7;
    audienceReason = `Diverse international spread; lower density in primary commercial tier-1 markets.`;
  }

  // 5. Track Record & Dealer Trust (Max 5 points)
  let dealerScore = 0;
  let dealerReason = '';
  if (creator.avgDealerRating >= 4.8 && creator.pastDealsCompleted >= 15) {
    dealerScore = 5;
    dealerReason = `Veteran partner: ${creator.pastDealsCompleted} completed brand deals with a ${creator.avgDealerRating}/5.0 satisfaction record.`;
  } else if (creator.avgDealerRating >= 4.5) {
    dealerScore = 4;
    dealerReason = `Proven reliability: ${creator.pastDealsCompleted} completed campaigns with positive dealer feedback.`;
  } else {
    dealerScore = 2;
    dealerReason = `Emerging dealer history or limited previous on-platform escrow completions.`;
  }

  // Fraud Penalty
  let totalScore = nicheScore + engScore + budgetScore + audienceScore + dealerScore;
  let fraudPenaltyApplied = false;
  let penaltyReason = undefined;

  if (creator.authenticityReport.riskLevel === 'HIGH_RISK_SUSPICIOUS') {
    fraudPenaltyApplied = true;
    const penaltyPoints = 35;
    totalScore = Math.max(12, totalScore - penaltyPoints);
    penaltyReason = `Severe Risk Alert: Automated fraud scanner detected ${creator.authenticityReport.botPatternCount} bot patterns and ${creator.authenticityReport.fakeFollowersEstimatePct}% fake follower ratio.`;
  } else if (creator.authenticityReport.riskLevel === 'MODERATE_CAUTION') {
    fraudPenaltyApplied = true;
    totalScore = Math.max(30, totalScore - 12);
    penaltyReason = `Caution Notice: Minor engagement discrepancy flagged in recent follower burst.`;
  }

  let verdict: RecommendationBreakdown['verdict'] = 'Moderate Fit';
  if (fraudPenaltyApplied && creator.authenticityReport.riskLevel === 'HIGH_RISK_SUSPICIOUS') {
    verdict = 'High Risk Warning';
  } else if (totalScore >= 88) {
    verdict = 'Top Recommended Match';
  } else if (totalScore >= 72) {
    verdict = 'Strong Fit';
  }

  return {
    overallScore: Math.min(100, Math.round(totalScore)),
    nicheMatch: { score: nicheScore, max: 35, reason: nicheReason },
    engagementHealth: { score: engScore, max: 25, reason: engReason },
    budgetFit: { score: budgetScore, max: 20, reason: budgetReason },
    audienceOverlap: { score: audienceScore, max: 15, reason: audienceReason },
    dealerReputation: { score: dealerScore, max: 5, reason: dealerReason },
    fraudPenaltyApplied,
    penaltyReason,
    verdict,
  };
}
