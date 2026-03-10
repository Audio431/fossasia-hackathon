/**
 * ML-Based Stranger Detection Model
 * Uses TensorFlow.js with hybrid approach (ML + Rule-based) for stranger detection
 * Comprehensive 28-feature system for accurate risk assessment
 */

import * as tf from '@tensorflow/tfjs';
import { StrangerFeatures, mlFeatureExtractor } from './ml-features';
import { trainingDataGenerator } from './training-data-generator';

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
  confidenceScore: number; // 0-1
  factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendation: string;
  mlProbability?: number; // ML model prediction
  ruleProbability?: number; // Rule-based prediction
}

/**
 * Hybrid ML + Rule-based Stranger Detection Model
 * Combines TensorFlow.js neural network with rule-based scoring
 */
class StrangerDetectionModel {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;
  private readonly FEATURE_COUNT = 28; // 28 comprehensive features

  /**
   * Initialize the ML model
   * Tries to load pre-trained model, falls back to creating demo model
   */
  async initialize(): Promise<void> {
    try {
      // Try to load a pre-trained model if available
      // this.model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));
      // this.isModelLoaded = true;

      // For hackathon demo, create and train a demo model
      await this.createDemoModel();
      this.isModelLoaded = true;

      // Train the model with synthetic data
      await this.trainDemoModel();

      console.log('Privacy Shadow: ML model initialized and trained successfully');
    } catch (error) {
      console.log('Privacy Shadow: ML model not loaded, using rule-based detection', error);
    }
  }

  /**
   * Create a demo neural network model for hackathon
   * Simple architecture that can be trained with demo data
   */
  private async createDemoModel(): Promise<void> {
    this.model = tf.sequential();

    // Input layer (28 features)
    this.model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [this.FEATURE_COUNT],
      kernelInitializer: 'leCunNormal'
    }));

    // Hidden layer 1
    this.model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelInitializer: 'leCunNormal'
    }));

    // Dropout for regularization
    this.model.add(tf.layers.dropout({
      rate: 0.3
    }));

    // Hidden layer 2
    this.model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      kernelInitializer: 'leCunNormal'
    }));

    // Output layer (stranger probability 0-1)
    this.model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      kernelInitializer: 'leCunNormal'
    }));

    // Compile model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    console.log('Privacy Shadow: Demo ML model created');
  }

  /**
   * Train demo model with comprehensive sample data
   * Uses TrainingDataGenerator for realistic stranger/non-stranger patterns
   */
  async trainDemoModel(): Promise<void> {
    if (!this.model) return;

    console.log('Privacy Shadow: Starting model training with comprehensive dataset...');

    // Generate comprehensive training data using our data generator
    const trainingData = trainingDataGenerator.generateTrainingData();
    console.log(`Privacy Shadow: Generated ${trainingData.length} training samples`);

    const features: number[][] = [];
    const labels: number[][] = [];

    // Convert training data to tensors
    trainingData.forEach((example) => {
      features.push(example.features);
      labels.push([example.label]);
    });

    // Convert to tensors
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    console.log('Privacy Shadow: Training model...');

    // Train model with more epochs for better accuracy
    const history = await this.model.fit(xs, ys, {
      epochs: 100,
      batchSize: 16,
      shuffle: true,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
            console.log(`Privacy Shadow: Training epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4)}`);
          }
        }
      }
    });

    const finalAccuracy = history.history.acc[history.history.acc.length - 1];
    const finalLoss = history.history.loss[history.history.loss.length - 1];

    console.log(`Privacy Shadow: Demo model training complete - Accuracy: ${(finalAccuracy * 100).toFixed(1)}%, Loss: ${finalLoss.toFixed(4)}`);

    // Clean up tensors
    xs.dispose();
    ys.dispose();
  }

  /**
   * Extract features from conversation context (backward compatible)
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
   * Predict if conversation partner is a stranger using hybrid approach
   * @param features - StrangerFeatures (28 features) or ConversationFeatures
   * @returns Stranger prediction with probability, confidence, and factors
   */
  async predict(features: StrangerFeatures | ConversationFeatures): Promise<StrangerPrediction> {
    // Convert ConversationFeatures to StrangerFeatures if needed
    let strangerFeatures: StrangerFeatures;
    if ('followerRatio' in features) {
      strangerFeatures = features as StrangerFeatures;
    } else {
      strangerFeatures = this.convertToMLFeatures(features as ConversationFeatures);
    }

    // ML Model Prediction (if available)
    let mlProbability = 0.5; // Default neutral
    if (this.model && this.isModelLoaded) {
      try {
        mlProbability = await this.mlPredict(strangerFeatures);
      } catch (error) {
        console.error('Privacy Shadow: ML prediction failed, using rule-based', error);
      }
    }

    // Rule-based Prediction
    const ruleProbability = await this.ruleBasedPredict(strangerFeatures);

    // Hybrid Ensemble: Weighted combination (70% ML, 30% rules for demo)
    // In production with trained model, would be more ML-weighted
    const ensembleProbability = (mlProbability * 0.7) + (ruleProbability * 0.3);

    // Calculate confidence based on agreement between ML and rules
    const agreement = 1 - Math.abs(mlProbability - ruleProbability);
    const confidenceScore = agreement;

    // Extract top risk factors
    const factors = this.extractTopRiskFactors(strangerFeatures);

    // Generate recommendation
    const recommendation = this.generateRecommendation(strangerFeatures, ensembleProbability);

    // Determine confidence level
    let confidence: 'low' | 'medium' | 'high';
    if (confidenceScore > 0.7) {
      confidence = 'high';
    } else if (confidenceScore > 0.4) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      probability: ensembleProbability,
      confidence,
      confidenceScore,
      factors: factors.sort((a, b) => b.impact - a.impact).slice(0, 10),
      recommendation,
      mlProbability,
      ruleProbability,
    };
  }

  /**
   * ML-based prediction using TensorFlow.js
   */
  private async mlPredict(features: StrangerFeatures): Promise<number> {
    if (!this.model) return 0.5;

    const featureArray = mlFeatureExtractor.featuresToArray(features);
    const inputTensor = tf.tensor2d([featureArray]);

    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const probability = (await prediction.data())[0];

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    return probability;
  }

  /**
   * Rule-based prediction (fallback and ensemble component)
   */
  private async ruleBasedPredict(features: StrangerFeatures): Promise<number> {
    let score = 0;
    const factors: StrangerPrediction['factors'] = [];

    // 1. Account Age Factor
    if (features.accountAgeDays < 7) {
      score += 30;
      factors.push({ factor: 'New account', impact: 30, description: 'Account created less than a week ago' });
    } else if (features.accountAgeDays < 30) {
      score += 15;
      factors.push({ factor: 'Recent account', impact: 15, description: 'Account created less than a month ago' });
    }

    // 2. Follower Ratio
    if (features.followerRatio < 0.1) {
      score += 20;
      factors.push({ factor: 'Few followers', impact: 20, description: 'Very low follower-to-following ratio' });
    } else if (features.followerRatio > 100) {
      score += 15;
      factors.push({ factor: 'Suspicious ratio', impact: 15, description: 'Following many, few followers' });
    }

    // 3. Mutual Friends
    if (features.mutualFriends === 0) {
      score += 25;
      factors.push({ factor: 'No mutual connections', impact: 25, description: 'No mutual friends' });
    } else if (features.mutualFriends < 3) {
      score += 10;
      factors.push({ factor: 'Few mutual connections', impact: 10, description: `${features.mutualFriends} mutual friend(s)` });
    }

    // 4. Previous Interactions
    if (features.previousInteractions === 0) {
      score += 20;
      factors.push({ factor: 'First interaction', impact: 20, description: 'First time talking' });
    } else if (features.previousInteractions < 5) {
      score += 10;
      factors.push({ factor: 'Few interactions', impact: 10, description: `${features.previousInteractions} past conversation(s)` });
    }

    // 5. Context Factors
    if (features.isPublicPost) {
      score += 10;
      factors.push({ factor: 'Public post', impact: 10, description: 'Public post, not private message' });
    }

    if (features.isDirectMessage && !features.isGroupChat) {
      score += 15;
      factors.push({ factor: 'Private message', impact: 15, description: 'Direct message to stranger' });
    }

    // 6. Content Red Flags
    if (features.personalInfoRequests > 0) {
      score += Math.min(features.personalInfoRequests * 20, 40);
      factors.push({ factor: 'Asks for personal info', impact: Math.min(features.personalInfoRequests * 20, 40), description: `${features.personalInfoRequests} personal info request(s)` });
    }

    if (features.pressureTactics > 0) {
      score += Math.min(features.pressureTactics * 15, 35);
      factors.push({ factor: 'Pressure tactics', impact: Math.min(features.pressureTactics * 15, 35), description: `${features.pressureTactics} pressure tactic(s)` });
    }

    if (features.suspiciousLinks > 0) {
      score += Math.min(features.suspiciousLinks * 15, 30);
      factors.push({ factor: 'Suspicious links', impact: Math.min(features.suspiciousLinks * 15, 30), description: `${features.suspiciousLinks} suspicious link(s)` });
    }

    if (features.groomingLanguage > 0) {
      score += Math.min(features.groomingLanguage * 25, 50);
      factors.push({ factor: 'Grooming language', impact: Math.min(features.groomingLanguage * 25, 50), description: `${features.groomingLanguage} grooming pattern(s)` });
    }

    if (features.inappropriateLanguage > 0) {
      score += Math.min(features.inappropriateLanguage * 10, 25);
      factors.push({ factor: 'Inappropriate content', impact: Math.min(features.inappropriateLanguage * 10, 25), description: `${features.inappropriateLanguage} inappropriate message(s)` });
    }

    // 7. Profile Completeness
    if (!features.hasProfilePhoto || features.bioLength === 0) {
      score += 15;
      factors.push({ factor: 'Incomplete profile', impact: 15, description: 'Missing profile photo or bio' });
    }

    // 8. Timing Patterns
    if (features.timeOfDay >= 22 || features.timeOfDay <= 6) {
      score += 10;
      factors.push({ factor: 'Late night messaging', impact: 10, description: 'Messaging during late night hours' });
    }

    // Normalize to 0-1
    return Math.min(score / 100, 1);
  }

  /**
   * Extract top risk factors from features
   */
  private extractTopRiskFactors(features: StrangerFeatures): StrangerPrediction['factors'] {
    const factors: StrangerPrediction['factors'] = [];

    if (features.accountAgeDays < 30) {
      factors.push({ factor: 'New account', impact: 30 - features.accountAgeDays, description: `Account created ${features.accountAgeDays} days ago` });
    }

    if (features.mutualFriends === 0) {
      factors.push({ factor: 'No mutual connections', impact: 25, description: 'No mutual friends' });
    }

    if (features.personalInfoRequests > 0) {
      factors.push({ factor: 'Personal info requests', impact: features.personalInfoRequests * 20, description: `${features.personalInfoRequests} request(s)` });
    }

    if (features.groomingLanguage > 0) {
      factors.push({ factor: 'Grooming patterns', impact: features.groomingLanguage * 25, description: `${features.groomingLanguage} pattern(s)` });
    }

    if (features.transitionSpeed > 0.7) {
      factors.push({ factor: 'Fast escalation', impact: Math.round(features.transitionSpeed * 20), description: 'Conversation escalated quickly' });
    }

    return factors;
  }

  /**
   * Generate recommendation based on features and probability
   */
  private generateRecommendation(features: StrangerFeatures, probability: number): string {
    if (probability > 0.7) {
      if (features.groomingLanguage > 0 || features.personalInfoRequests > 0) {
        return '⛔ DANGER: This person shows strong signs of being a stranger with harmful intent. STOP engaging immediately.';
      }
      return '⛔ This person is likely a stranger. Be very careful and consider not responding.';
    } else if (probability > 0.4) {
      return '⚠️ This might be someone you don\'t know well. Be cautious about sharing personal information.';
    } else if (probability > 0.2) {
      return '💡 This person appears to be known, but still be careful about what you share.';
    } else {
      return '✅ This person appears to be someone you know. Continue with normal caution.';
    }
  }

  /**
   * Convert ConversationFeatures to StrangerFeatures (backward compatibility)
   */
  private convertToMLFeatures(old: ConversationFeatures): StrangerFeatures {
    return {
      accountAgeDays: old.accountAgeDays,
      followerRatio: old.followingCount > 0 ? old.followerCount / old.followingCount : old.followerCount,
      verificationStatus: old.verifiedStatus,
      profileCompleteness: (old.hasProfilePhoto ? 1 : 0) + (old.bioLength > 0 ? 1 : 0) + (old.verifiedStatus ? 1 : 0) / 3,
      hasProfilePhoto: old.hasProfilePhoto,
      bioLength: old.bioLength,
      accountType: 'personal',
      activityScore: old.messageFrequency,

      mutualFriends: old.mutualFriendsCount,
      mutualFriendsRatio: old.mutualFriendsCount / (old.followerCount || 1),
      previousInteractions: old.previousInteractions,
      interactionFrequency: old.messageFrequency,
      responseTime: 0,
      conversationDepth: old.previousInteractions,

      suspiciousLinks: old.containsSuspiciousLinks ? 1 : 0,
      personalInfoRequests: old.asksForPersonalInfo ? 1 : 0,
      pressureTactics: old.pressureTactics ? 1 : 0,
      inappropriateLanguage: old.inappropriateLanguage ? 1 : 0,
      groomingLanguage: 0,
      secrecyRequests: 0,
      giftOffers: 0,
      transitionSpeed: 0,

      isPublicPost: old.isPublicPost,
      isDirectMessage: old.isDirectMessage,
      isGroupChat: old.isGroupChat,
      platformType: old.platformType,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
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

  /**
   * Get model performance metrics
   */
  getModelInfo() {
    return {
      isModelLoaded: this.isModelLoaded,
      hasModel: this.model !== null,
      featureCount: this.FEATURE_COUNT,
      approach: this.isModelLoaded ? 'hybrid' : 'rule-based',
    };
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

/**
 * Full ML prediction function (new API)
 */
export async function predictStranger(features: StrangerFeatures | ConversationFeatures): Promise<StrangerPrediction> {
  return await strangerModel.predict(features);
}
