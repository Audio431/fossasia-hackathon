/**
 * ML Feature Extraction System for Stranger Detection
 * Extracts 28 comprehensive features across 4 categories for ML-based stranger detection
 */

export interface StrangerFeatures {
  // Account Signals (8 features)
  accountAgeDays: number;
  followerRatio: number;        // followers / following
  verificationStatus: boolean;
  profileCompleteness: number;   // 0-1 score
  hasProfilePhoto: boolean;
  bioLength: number;
  accountType: string;          // personal/business/bot
  activityScore: number;        // posts per day

  // Social Graph (6 features)
  mutualFriends: number;
  mutualFriendsRatio: number;   // mutual / total friends
  previousInteractions: number;
  interactionFrequency: number; // messages per day
  responseTime: number;         // avg response time in seconds
  conversationDepth: number;    // messages in this conversation

  // Content Analysis (8 features)
  suspiciousLinks: number;      // URL pattern analysis
  personalInfoRequests: number; // "where do you live" etc
  pressureTactics: number;      // "send me now", "please" frequency
  inappropriateLanguage: number;
  groomingLanguage: number;     // age-inappropriate requests
  secrecyRequests: number;      // "don't tell your parents"
  giftOffers: number;           // "I'll buy you..."
  transitionSpeed: number;      // how fast conversation becomes inappropriate

  // Context Factors (6 features)
  isPublicPost: boolean;
  isDirectMessage: boolean;
  isGroupChat: boolean;
  platformType: string;
  timeOfDay: number;            // 0-23, late night = higher risk
  dayOfWeek: number;            // 0-6
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'stranger';
  timestamp: number;
}

export interface ProfileData {
  username?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
  hasProfilePhoto?: boolean;
  bio?: string;
  accountCreated?: string;
  postsCount?: number;
  isBusiness?: boolean;
}

/**
 * ML Feature Extractor Class
 * Extracts comprehensive features from social media interactions
 */
export class MLFeatureExtractor {
  private conversationHistory: Map<string, Message[]> = new Map();
  private interactionTimings: Map<string, number[]> = new Map();

  /**
   * Extract all 28 features from conversation context
   */
  extractFeatures(
    profileData: ProfileData,
    messages: Message[],
    context: {
      platform: string;
      isPublicPost: boolean;
      isDirectMessage: boolean;
      isGroupChat: boolean;
    }
  ): StrangerFeatures {
    return {
      // Account Signals (8 features)
      accountAgeDays: this.extractAccountAge(profileData),
      followerRatio: this.extractFollowerRatio(profileData),
      verificationStatus: this.extractVerificationStatus(profileData),
      profileCompleteness: this.extractProfileCompleteness(profileData),
      hasProfilePhoto: this.extractHasProfilePhoto(profileData),
      bioLength: this.extractBioLength(profileData),
      accountType: this.extractAccountType(profileData),
      activityScore: this.extractActivityScore(profileData),

      // Social Graph (6 features)
      mutualFriends: this.extractMutualFriends(profileData),
      mutualFriendsRatio: this.extractMutualFriendsRatio(profileData),
      previousInteractions: this.extractPreviousInteractions(messages),
      interactionFrequency: this.extractInteractionFrequency(messages),
      responseTime: this.extractResponseTime(messages),
      conversationDepth: this.extractConversationDepth(messages),

      // Content Analysis (8 features)
      suspiciousLinks: this.extractSuspiciousLinks(messages),
      personalInfoRequests: this.extractPersonalInfoRequests(messages),
      pressureTactics: this.extractPressureTactics(messages),
      inappropriateLanguage: this.extractInappropriateLanguage(messages),
      groomingLanguage: this.extractGroomingLanguage(messages),
      secrecyRequests: this.extractSecrecyRequests(messages),
      giftOffers: this.extractGiftOffers(messages),
      transitionSpeed: this.extractTransitionSpeed(messages),

      // Context Factors (6 features)
      isPublicPost: context.isPublicPost,
      isDirectMessage: context.isDirectMessage,
      isGroupChat: context.isGroupChat,
      platformType: context.platform,
      timeOfDay: this.extractTimeOfDay(),
      dayOfWeek: this.extractDayOfWeek(),
    };
  }

  // ===== Account Signal Features =====

  private extractAccountAge(profile: ProfileData): number {
    if (!profile.accountCreated) return 0;

    const createdDate = new Date(profile.accountCreated);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private extractFollowerRatio(profile: ProfileData): number {
    const followers = profile.followers || 0;
    const following = profile.following || 0;

    if (following === 0) return followers > 0 ? 1 : 0;
    return followers / following;
  }

  private extractVerificationStatus(profile: ProfileData): boolean {
    return profile.verified || false;
  }

  private extractProfileCompleteness(profile: ProfileData): number {
    let score = 0;
    let maxScore = 5;

    if (profile.hasProfilePhoto) score++;
    if (profile.bio && profile.bio.length > 0) score++;
    if (profile.followers && profile.followers > 0) score++;
    if (profile.accountCreated) score++;
    if (profile.postsCount && profile.postsCount > 0) score++;

    return score / maxScore;
  }

  private extractHasProfilePhoto(profile: ProfileData): boolean {
    return profile.hasProfilePhoto || false;
  }

  private extractBioLength(profile: ProfileData): number {
    return profile.bio?.length || 0;
  }

  private extractAccountType(profile: ProfileData): string {
    if (profile.isBusiness) return 'business';

    // Simple heuristic for bot detection
    const followerRatio = this.extractFollowerRatio(profile);
    if (followerRatio > 100 && profile.following && profile.following > 1000) {
      return 'bot';
    }

    return 'personal';
  }

  private extractActivityScore(profile: ProfileData): number {
    const accountAge = this.extractAccountAge(profile);
    const postsCount = profile.postsCount || 0;

    if (accountAge === 0) return 0;

    // Posts per day
    return postsCount / accountAge;
  }

  // ===== Social Graph Features =====

  private extractMutualFriends(profile: ProfileData): number {
    // This would need to be extracted from the actual social graph
    // For now, return a placeholder
    return 0;
  }

  private extractMutualFriendsRatio(profile: ProfileData): number {
    const mutual = this.extractMutualFriends(profile);
    const total = profile.followers || 1;

    return mutual / total;
  }

  private extractPreviousInteractions(messages: Message[]): number {
    return messages.filter(m => m.sender === 'stranger').length;
  }

  private extractInteractionFrequency(messages: Message[]): number {
    if (messages.length === 0) return 0;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentMessages = messages.filter(m => m.timestamp > oneDayAgo);
    return recentMessages.length;
  }

  private extractResponseTime(messages: Message[]): number {
    if (messages.length < 2) return 0;

    const responseTimes: number[] = [];

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender !== messages[i - 1].sender) {
        const diff = messages[i].timestamp - messages[i - 1].timestamp;
        responseTimes.push(diff);
      }
    }

    if (responseTimes.length === 0) return 0;

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return avgResponseTime / 1000; // Convert to seconds
  }

  private extractConversationDepth(messages: Message[]): number {
    return messages.length;
  }

  // ===== Content Analysis Features =====

  private extractSuspiciousLinks(messages: Message[]): number {
    const suspiciousPatterns = [
      /bit\.ly/i,
      /tinyurl\.com/i,
      /short\.link/i,
      /lnkd\.in/i,
      /t\.co/i,
      /discord\.gg/i,
      /telegram\.org/i,
      /whatsapp\.com/i,
      /snap\.com/i,
    ];

    let count = 0;

    for (const message of messages) {
      if (message.sender === 'stranger') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(message.text)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private extractPersonalInfoRequests(messages: Message[]): number {
    const personalInfoPatterns = [
      /where do you live/i,
      /what's your address/i,
      /what is your address/i,
      /where are you from/i,
      /what school do you go to/i,
      /what's your phone number/i,
      /what is your phone number/i,
      /send me your phone/i,
      /how old are you/i,
      /what's your age/i,
      /send me a photo/i,
      /can i see a picture/i,
      /what's your full name/i,
      /what is your real name/i,
      /where do your parents work/i,
    ];

    let count = 0;

    for (const message of messages) {
      if (message.sender === 'stranger') {
        for (const pattern of personalInfoPatterns) {
          if (pattern.test(message.text)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private extractPressureTactics(messages: Message[]): number {
    const pressurePatterns = [
      /please do it/i,
      /just do it/i,
      /come on/i,
      /don't be boring/i,
      /everyone else is doing it/i,
      /don't be a baby/i,
      /you promised/i,
      /trust me/i,
      /i promise/i,
      /send it now/i,
      /why won't you/i,
      /don't tell anyone/i,
      /this is our secret/i,
    ];

    let count = 0;

    for (const message of messages) {
      if (message.sender === 'stranger') {
        for (const pattern of pressurePatterns) {
          if (pattern.test(message.text)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private extractInappropriateLanguage(messages: Message[]): number {
    const inappropriatePatterns = [
      /\b(sex|nude|naked|porn|dirty|hot|sexy)\b/i,
      /\b(kiss|touch|rub|feel|bed|room)\b/i,
      /\b(come over|hang out|alone|private)\b/i,
    ];

    let count = 0;

    for (const message of messages) {
      if (message.sender === 'stranger') {
        for (const pattern of inappropriatePatterns) {
          if (pattern.test(message.text)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private extractGroomingLanguage(messages: Message[]): number {
    const groomingPatterns = [
      /you're (so )?mature for your age/i,
      /you're special/i,
      /you're different/i,
      /i understand you/i,
      /your parents don't understand/i,
      /you can tell me anything/i,
      /you're my favorite/i,
      /i love you more than/i,
      /don't tell your parents/i,
      /they wouldn't understand us/i,
      /you're so beautiful/i,
      /you're so handsome/i,
      /you look older than/i,
    ];

    let count = 0;

    for (const message of messages) {
      if (message.sender === 'stranger') {
        for (const pattern of groomingPatterns) {
          if (pattern.test(message.text)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private extractSecrecyRequests(messages: Message[]): number {
    const secrecyPatterns = [
      /don't tell anyone/i,
      /keep this a secret/i,
      /this is between us/i,
      /don't tell your parents/i,
      /don't tell your friends/i,
      /they wouldn't understand/i,
      /it's our secret/i,
      /promise you won't tell/i,
    ];

    let count = 0;

    for (const message of messages) {
      if (message.sender === 'stranger') {
        for (const pattern of secrecyPatterns) {
          if (pattern.test(message.text)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private extractGiftOffers(messages: Message[]): number {
    const giftPatterns = [
      /i'll buy you/i,
      /i can get you/i,
      /want me to send you/i,
      /i'll send you/i,
      /let me get you/i,
      /i can give you/i,
      /free (gift|money|cash|credit)/i,
      /check|venmo|paypal|cashapp/i,
    ];

    let count = 0;

    for (const message of messages) {
      if (message.sender === 'stranger') {
        for (const pattern of giftPatterns) {
          if (pattern.test(message.text)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private extractTransitionSpeed(messages: Message[]): number {
    if (messages.length < 3) return 0;

    // Calculate how quickly conversation becomes inappropriate
    // Lower value = faster transition = higher risk

    const firstInappropriateIndex = messages.findIndex(m => {
      const inappropriatePatterns = [
        /where do you live/i,
        /what's your phone/i,
        /send me a photo/i,
        /you're (so )?mature/i,
        /don't tell your parents/i,
      ];

      return inappropriatePatterns.some(pattern => pattern.test(m.text));
    });

    if (firstInappropriateIndex === -1) return 1; // No inappropriate content

    // Normalize: 0 (immediate inappropriate) to 1 (slow or no transition)
    const transitionPoint = firstInappropriateIndex / messages.length;
    return 1 - transitionPoint;
  }

  // ===== Context Features =====

  private extractTimeOfDay(): number {
    return new Date().getHours();
  }

  private extractDayOfWeek(): number {
    return new Date().getDay();
  }

  /**
   * Convert features to numeric array for TensorFlow.js
   */
  featuresToArray(features: StrangerFeatures): number[] {
    return [
      // Account signals (8)
      features.accountAgeDays,
      features.followerRatio,
      features.verificationStatus ? 1 : 0,
      features.profileCompleteness,
      features.hasProfilePhoto ? 1 : 0,
      features.bioLength,
      features.accountType === 'personal' ? 0 : features.accountType === 'business' ? 1 : 2,
      features.activityScore,

      // Social graph (6)
      features.mutualFriends,
      features.mutualFriendsRatio,
      features.previousInteractions,
      features.interactionFrequency,
      features.responseTime,
      features.conversationDepth,

      // Content analysis (8)
      features.suspiciousLinks,
      features.personalInfoRequests,
      features.pressureTactics,
      features.inappropriateLanguage,
      features.groomingLanguage,
      features.secrecyRequests,
      features.giftOffers,
      features.transitionSpeed,

      // Context (6)
      features.isPublicPost ? 1 : 0,
      features.isDirectMessage ? 1 : 0,
      features.isGroupChat ? 1 : 0,
      features.platformType === 'instagram' ? 0 : features.platformType === 'twitter' ? 1 : 2,
      features.timeOfDay / 24, // Normalize to 0-1
      features.dayOfWeek / 7,  // Normalize to 0-1
    ];
  }

  /**
   * Get feature names for debugging/visualization
   */
  getFeatureNames(): string[] {
    return [
      // Account signals
      'accountAgeDays',
      'followerRatio',
      'verificationStatus',
      'profileCompleteness',
      'hasProfilePhoto',
      'bioLength',
      'accountType',
      'activityScore',

      // Social graph
      'mutualFriends',
      'mutualFriendsRatio',
      'previousInteractions',
      'interactionFrequency',
      'responseTime',
      'conversationDepth',

      // Content analysis
      'suspiciousLinks',
      'personalInfoRequests',
      'pressureTactics',
      'inappropriateLanguage',
      'groomingLanguage',
      'secrecyRequests',
      'giftOffers',
      'transitionSpeed',

      // Context
      'isPublicPost',
      'isDirectMessage',
      'isGroupChat',
      'platformType',
      'timeOfDay',
      'dayOfWeek',
    ];
  }
}

// Export singleton instance
export const mlFeatureExtractor = new MLFeatureExtractor();
