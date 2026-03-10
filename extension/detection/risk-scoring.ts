/**
 * Risk Scoring System
 * Calculates risk levels based on detected PII, stranger probability, and context
 */

import { DetectedPII, calculatePIIRiskScore, hasHighRiskCombinations } from './pii-detector';

export interface DetectionContext {
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'youtube' | 'discord' | 'generic';
  isPublic: boolean;
  isDirectMessage: boolean;
  hasMedia: boolean;
  characterLimit?: number;
  website?: string;
  url?: string;
}

export interface RiskAssessment {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  shouldAlertKid: boolean;
  shouldAlertParent: boolean;
  recommendations: string[];
  timestamp: number;
}

/**
 * Platform trust scores (lower = higher risk for kids)
 */
const PLATFORM_TRUST_SCORES: Record<string, number> = {
  'instagram': 0.5, // High risk — public posts, large user base including strangers
  'twitter': 0.4,   // Higher risk — very public by default
  'facebook': 0.6,  // Moderate — some privacy controls
  'tiktok': 0.3,    // Highest risk — dominant platform for predatory contact with minors
  'youtube': 0.5,   // Moderate — public comments, DM capability
  'discord': 0.3,   // Highest risk — anonymous servers, known for grooming targeting minors
  'generic': 0.5,   // Default moderate risk
};

/**
 * Calculate comprehensive risk assessment
 * @param piiDetected - Array of detected PII items
 * @param strangerProbability - ML model's stranger probability (0-1)
 * @param context - Detection context
 * @returns Risk assessment with recommendations
 */
export function calculateRisk(
  piiDetected: DetectedPII[],
  strangerProbability: number,
  context: DetectionContext
): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // 1. Base score from PII
  const piiScore = calculatePIIRiskScore(piiDetected);
  score += piiScore;

  // Add reasons and type-specific recommendations for each PII type
  const TYPE_RECOMMENDATIONS: Record<string, string> = {
    name:       '👤 Never share your full name with people you meet online',
    routine:    '🕐 Don\'t tell strangers when you\'re home alone or your daily schedule',
    birthdate:  '🎂 Avoid sharing your birthday or exact age online',
    location:   '📍 Don\'t share your current location or address',
    contact:    '📞 Only share your contact info with people you already know in real life',
    address:    '🏠 Your home address should stay private — never share it online',
    school:     '🏫 Avoid naming your school in public posts',
    financial:  '💳 Never share financial information online',
    identity:   '🪪 Government ID numbers should never be shared online',
  };
  const seenTypes = new Set<string>();
  for (const pii of piiDetected) {
    if (!reasons.includes(pii.description)) reasons.push(pii.description);
    if (!seenTypes.has(pii.type) && TYPE_RECOMMENDATIONS[pii.type]) {
      recommendations.push(TYPE_RECOMMENDATIONS[pii.type]);
      seenTypes.add(pii.type);
    }
  }

  // 2. Stranger probability multiplier
  if (strangerProbability > 0.7) {
    score *= 1.5;
    reasons.push('Likely talking to someone you don\'t know');
    recommendations.push('Consider whether you really know this person');
  } else if (strangerProbability > 0.4) {
    score *= 1.2;
    reasons.push('Possibly talking to someone you don\'t know well');
  }

  // 3. Context multipliers
  if (context.isPublic) {
    score *= 1.4;
    reasons.push('Public post (visible to everyone)');
    recommendations.push('Switch to private message or friends-only');
  }

  if (context.isDirectMessage && strangerProbability > 0.6) {
    score *= 1.3;
    reasons.push('Private message to stranger');
    recommendations.push('Be careful sharing personal info in DMs');
  }

  if (context.hasMedia) {
    score *= 1.1;
    reasons.push('Sharing media (photo/video)');
    recommendations.push('Check photos for location data or school logos');
  }

  // 4. Platform-specific adjustments
  const platformScore = PLATFORM_TRUST_SCORES[context.platform] || PLATFORM_TRUST_SCORES['generic'];
  score *= (2 - platformScore); // Lower platform trust = higher risk

  // 5. High-risk combinations
  if (hasHighRiskCombinations(piiDetected)) {
    score *= 1.5;
    reasons.push('Multiple types of personal information together');
    recommendations.push('Share information separately, not all at once');
  }

  // 6. Cap score at 100
  score = Math.min(Math.round(score), 100);

  // 7. Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 80) {
    level = 'critical';
    recommendations.push('❌ STOP - Don\'t share this information');
    recommendations.push('Talk to a parent or trusted adult first');
  } else if (score >= 50) {
    level = 'high';
    recommendations.push('⚠️ High risk - Consider not sharing');
    recommendations.push('Remove some personal information');
  } else if (score >= 25) {
    level = 'medium';
    recommendations.push('⚠️ Medium risk - Be careful');
    recommendations.push('Share less information if possible');
  } else {
    level = 'low';
    if (score > 0) {
      recommendations.push('💡 Low risk - Still be mindful');
    }
  }

  // 8. Determine who to alert
  const shouldAlertKid = score >= 25;
  const shouldAlertParent = score >= 50 || context.isPublic;

  return {
    score,
    level,
    reasons,
    shouldAlertKid,
    shouldAlertParent,
    recommendations,
    timestamp: Date.now(),
  };
}

/**
 * Get emoji for risk level
 */
export function getRiskEmoji(level: RiskAssessment['level']): string {
  switch (level) {
    case 'critical': return '🛑';
    case 'high': return '⚠️';
    case 'medium': return '🔶';
    case 'low': return '💡';
    default: return '❓';
  }
}

/**
 * Get color class for risk level
 */
export function getRiskColor(level: RiskAssessment['level']): string {
  switch (level) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
}

/**
 * Get alert message for kid based on risk level
 */
export function getKidAlertMessage(risk: RiskAssessment): string {
  switch (risk.level) {
    case 'critical':
      return '⛔ STOP! This could be dangerous. This information can be seen by strangers and could last forever on the internet.';
    case 'high':
      return '⚠️ Wait! This is risky. Think about whether you really want to share this with people you don\'t know.';
    case 'medium':
      return '🔶 Be careful! This information might be seen by people you don\'t know. Are you sure you want to share it?';
    case 'low':
      return '💡 Just a heads up - you\'re sharing some personal information. Make sure you\'re comfortable with that.';
    default:
      return 'Are you sure you want to share this?';
  }
}

/**
 * Get parent alert message
 */
export function getParentAlertMessage(risk: RiskAssessment, website: string): string {
  const site = website || 'a website';
  const time = new Date(risk.timestamp).toLocaleTimeString();

  return `[${time}] Privacy Shadow Alert: Your child attempted to share sensitive information on ${site}. Risk Level: ${risk.level.toUpperCase()} (${risk.score}/100).`;
}

/**
 * Check if risk should be blocked (prevented from sharing)
 */
export function shouldBlock(risk: RiskAssessment): boolean {
  // Critical and high risk should be blocked
  // Medium risk should warn but allow
  return risk.level === 'critical' || risk.level === 'high';
}

/**
 * Generate risk report for parent dashboard
 */
export function generateRiskReport(risk: RiskAssessment): {
  summary: string;
  details: string;
  actionable: string[];
} {
  return {
    summary: `${getRiskEmoji(risk.level)} ${risk.level.toUpperCase()} Risk (${risk.score}/100)`,
    details: risk.reasons.map(r => `• ${r}`).join('\n'),
    actionable: risk.recommendations,
  };
}

/**
 * Calculate trend in risk scores over time
 */
export function calculateRiskTrend(recentScores: number[]): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
} {
  if (recentScores.length < 2) {
    return { direction: 'stable', percentage: 0 };
  }

  const old = recentScores[0];
  const latest = recentScores[recentScores.length - 1];
  const change = ((latest - old) / old) * 100;

  if (Math.abs(change) < 10) {
    return { direction: 'stable', percentage: Math.round(change) };
  }

  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.round(Math.abs(change)),
  };
}
