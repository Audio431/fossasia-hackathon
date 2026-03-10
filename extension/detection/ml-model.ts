/**
 * ML-Based Stranger Detection Model
 * Uses TensorFlow.js to predict if a conversation partner is a stranger
 * For hackathon MVP: Uses rule-based scoring that can be enhanced with pre-trained models
 */

import * as tf from '@tensorflow/tfjs';

export interface ConversationFeatures {
  // Platform & context
  isPublicPost: boolean;
  isDirectMessage: boolean;
  platformType: string;

  // Account information
  accountAgeDays: number;
  followerCount: number;
  followingCount: number;
  verifiedStatus: boolean;
  hasProfilePhoto: boolean;
  bioLength: number;

  // Interaction patterns
  messageFrequency: number; // Messages per day
  previousInteractions: number; // Total past interactions
  isGroupChat: boolean;
  hasMutualFriends: boolean;
  mutualFriendsCount: number;

  // Content analysis
  containsSuspiciousLinks: boolean;
  asksForPersonalInfo: boolean;
  pressureTactics: boolean;
  inappropriateLanguage: boolean;

  // Timing patterns
  messagesAtUnusualHours: boolean; // Late night messages
  rapidMessagePattern: boolean;
}

export interface StrangerPrediction {
  probability: number; // 0-1, where 1 = definitely stranger
  confidence: 'low' | 'medium' | 'high';
  factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendation: string;
}

/**
 * Rule-based stranger detection (MVP for hackathon)
 * Can be replaced with trained TensorFlow.js model
 */
class StrangerDetectionModel {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;

  /**
   * Initialize the ML model
   * For MVP, uses rule-based scoring
   * Can be enhanced with: this.model = await tf.loadLayersModel('model.json')
   */
  async initialize(): Promise<void> {
    try {
      // Try to load a pre-trained model if available
      // this.model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));
      // this.isModelLoaded = true;
    } catch (error) {
      console.log('Using rule-based stranger detection (ML model not loaded)');
    }
  }

  /**
   * Extract features from conversation context
   */
  extractFeatures(context: any): ConversationFeatures {
    return {
      isPublicPost: context.isPublic || false,
      isDirectMessage: context.isDirectMessage || false,
      platformType: context.platform || 'generic',

      // Default values if not available
      accountAgeDays: context.accountAgeDays || 0,
      followerCount: context.followers || 0,
      followingCount: context.following || 0,
      verifiedStatus: context.verified || false,
      hasProfilePhoto: context.hasProfilePhoto !== false,
      bioLength: context.bioLength || 0,

      messageFrequency: context.messageFrequency || 0,
      previousInteractions: context.previousInteractions || 0,
      isGroupChat: context.isGroupChat || false,
      hasMutualFriends: context.mutualFriends > 0,
      mutualFriendsCount: context.mutualFriends || 0,

      containsSuspiciousLinks: context.hasSuspiciousLinks || false,
      asksForPersonalInfo: context.asksForPersonalInfo || false,
      pressureTactics: context.pressureTactics || false,
      inappropriateLanguage: context.inappropriateLanguage || false,

      messagesAtUnusualHours: context.unusualHours || false,
      rapidMessagePattern: context.rapidMessaging || false,
    };
  }

  /**
   * Predict if conversation partner is a stranger
   * @param features - Conversation features
   * @returns Stranger prediction with probability and factors
   */
  async predict(features: ConversationFeatures): Promise<StrangerPrediction> {
    let probability = 0; // Base probability
    const factors: StrangerPrediction['factors'] = [];

    // 1. Account Age Factor
    if (features.accountAgeDays < 7) {
      const impact = 30;
      probability += impact;
      factors.push({
        factor: 'New account',
        impact,
        description: 'Account created less than a week ago'
      });
    } else if (features.accountAgeDays < 30) {
      const impact = 15;
      probability += impact;
      factors.push({
        factor: 'Recent account',
        impact,
        description: 'Account created less than a month ago'
      });
    }

    // 2. Follower/Following Ratio
    const followerRatio = features.followingCount > 0
      ? features.followerCount / features.followingCount
      : features.followerCount;

    if (features.followerCount < 10) {
      const impact = 20;
      probability += impact;
      factors.push({
        factor: 'Few followers',
        impact,
        description: 'Account has very few followers'
      });
    }

    if (features.followingCount > 1000 && features.followerCount < 100) {
      const impact = 15;
      probability += impact;
      factors.push({
        factor: 'Suspicious ratio',
        impact,
        description: 'Following many but has few followers'
      });
    }

    // 3. Mutual Friends
    if (!features.hasMutualFriends) {
      const impact = 25;
      probability += impact;
      factors.push({
        factor: 'No mutual connections',
        impact,
        description: 'You don\'t share any mutual friends'
      });
    } else if (features.mutualFriendsCount < 3) {
      const impact = 10;
      probability += impact;
      factors.push({
        factor: 'Few mutual connections',
        impact,
        description: `Only ${features.mutualFriendsCount} mutual friend(s)`
      });
    }

    // 4. Previous Interactions
    if (features.previousInteractions === 0) {
      const impact = 20;
      probability += impact;
      factors.push({
        factor: 'First interaction',
        impact,
        description: 'This is your first time talking'
      });
    } else if (features.previousInteractions < 5) {
      const impact = 10;
      probability += impact;
      factors.push({
        factor: 'Few interactions',
        impact,
        description: `Only ${features.previousInteractions} past conversation(s)`
      });
    }

    // 5. Context Factors
    if (features.isPublicPost) {
      const impact = 10;
      probability += impact;
      factors.push({
        factor: 'Public post',
        impact,
        description: 'This is a public post, not a private message'
      });
    }

    if (!features.isGroupChat && features.isDirectMessage) {
      const impact = 15;
      probability += impact;
      factors.push({
        factor: 'Private message',
        impact,
        description: 'Direct message to someone you don\'t know'
      });
    }

    // 6. Red Flags
    if (features.asksForPersonalInfo) {
      const impact = 40;
      probability += impact;
      factors.push({
        factor: 'Asks for personal info',
        impact,
        description: 'This person is asking for personal information'
      });
    }

    if (features.pressureTactics) {
      const impact = 35;
      probability += impact;
      factors.push({
        factor: 'Pressure tactics',
        impact,
        description: 'This person is using pressure or guilt'
      });
    }

    if (features.containsSuspiciousLinks) {
      const impact = 30;
      probability += impact;
      factors.push({
        factor: 'Suspicious links',
        impact,
        description: 'Sharing suspicious or unknown links'
      });
    }

    if (features.inappropriateLanguage) {
      const impact = 25;
      probability += impact;
      factors.push({
        factor: 'Inappropriate content',
        impact,
        description: 'Using inappropriate or sexual language'
      });
    }

    // 7. Profile Completeness
    if (!features.hasProfilePhoto || features.bioLength === 0) {
      const impact = 15;
      probability += impact;
      factors.push({
        factor: 'Incomplete profile',
        impact,
        description: 'Missing profile photo or bio'
      });
    }

    // 8. Timing Patterns
    if (features.messagesAtUnusualHours) {
      const impact = 10;
      probability += impact;
      factors.push({
        factor: 'Unusual timing',
        impact,
        description: 'Messaging late at night or unusual hours'
      });
    }

    if (features.rapidMessagePattern) {
      const impact = 10;
      probability += impact;
      factors.push({
        factor: 'Rapid messaging',
        impact,
        description: 'Sending many messages quickly'
      });
    }

    // Normalize probability to 0-1
    probability = Math.min(probability / 100, 1);

    // Determine confidence based on number of factors
    let confidence: 'low' | 'medium' | 'high';
    if (factors.length >= 5) {
      confidence = 'high';
    } else if (factors.length >= 3) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    // Generate recommendation
    let recommendation = '';
    if (probability > 0.7) {
      recommendation = '⛔ This person is likely a stranger. Be very careful and consider not responding.';
    } else if (probability > 0.4) {
      recommendation = '⚠️ This might be someone you don\'t know well. Be cautious about sharing personal information.';
    } else {
      recommendation = '💡 This person appears to be known, but still be careful about what you share.';
    }

    return {
      probability,
      confidence,
      factors: factors.sort((a, b) => b.impact - a.impact),
      recommendation,
    };
  }

  /**
   * Quick rule-based assessment (for real-time performance)
   */
  quickAssessment(context: Partial<ConversationFeatures>): number {
    let score = 0;

    if (context.previousInteractions === 0) score += 0.3;
    if (!context.hasMutualFriends) score += 0.3;
    if (context.accountAgeDays && context.accountAgeDays < 30) score += 0.2;
    if (context.isPublicPost) score += 0.1;
    if (context.asksForPersonalInfo) score += 0.4;

    return Math.min(score, 1);
  }
}

// Export singleton instance
export const strangerModel = new StrangerDetectionModel();

/**
 * Initialize model on extension startup
 */
export async function initializeModel(): Promise<void> {
  await strangerModel.initialize();
}

/**
 * Quick assessment function for content scripts
 */
export function assessStrangerRisk(context: any): number {
  const features = strangerModel.extractFeatures(context);
  return strangerModel.quickAssessment(features);
}
