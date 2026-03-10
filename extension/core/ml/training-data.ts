/**
 * Demo Training Data Generator
 * Generates synthetic training data for ML model demonstration
 * Shows realistic stranger vs non-stranger patterns
 */

export interface TrainingExample {
  features: number[];
  label: number; // 0 = known, 1 = stranger
  scenario: string;
}

export class TrainingDataGenerator {
  /**
   * Generate comprehensive training data for demo
   */
  generateTrainingData(): TrainingExample[] {
    const data: TrainingExample[] = [];

    // Safe conversations (known contacts)
    data.push(...this.generateKnownContacts(50));

    // Dangerous conversations (strangers)
    data.push(...this.generateStrangerScenarios(50));

    return data;
  }

  /**
   * Generate known contact examples
   */
  private generateKnownContacts(count: number): TrainingExample[] {
    const examples: TrainingExample[] = [];
    const scenarios = [
      'classmate_chat',
      'family_member',
      'close_friend',
      'teacher_communication',
      'coach_message',
      'club_member',
      'neighbor',
      'teammate'
    ];

    for (let i = 0; i < count; i++) {
      const scenario = scenarios[i % scenarios.length];
      examples.push({
        features: this.generateKnownFeatures(scenario),
        label: 0,
        scenario
      });
    }

    return examples;
  }

  /**
   * Generate stranger examples
   */
  private generateStrangerScenarios(count: number): TrainingExample[] {
    const examples: TrainingExample[] = [];
    const scenarios = [
      'grooming_attempt',
      'personal_info_harvesting',
      'predatory_behavior',
      'inappropriate_content',
      'secrecy_coercion',
      'gift_offering',
      'rapid_escalation',
      'fake_profile'
    ];

    for (let i = 0; i < count; i++) {
      const scenario = scenarios[i % scenarios.length];
      examples.push({
        features: this.generateStrangerFeatures(scenario),
        label: 1,
        scenario
      });
    }

    return examples;
  }

  /**
   * Generate features for known contacts
   */
  private generateKnownFeatures(scenario: string): number[] {
    // Features: [accountAge, followerRatio, verified, profileComplete, hasPhoto, bioLength, accountType, activity,
    //          mutualFriends, mutualRatio, previousInteractions, interactionFreq, responseTime, conversationDepth,
    //          suspiciousLinks, personalInfo, pressure, inappropriate, grooming, secrecy, gifts, transition,
    //          isPublic, isDM, isGroup, platform, timeOfDay, dayOfWeek]

    return [
      this.randomInRange(180, 730),      // accountAge: 6 months to 2 years
      this.randomInRange(0.5, 3),        // followerRatio: balanced
      1,                                // verified: usually verified
      this.randomInRange(0.7, 1),        // profileComplete: mostly complete
      1,                                // hasProfilePhoto: yes
      this.randomInRange(50, 200),       // bioLength: substantial bio
      0,                                // accountType: personal
      this.randomInRange(1, 5),          // activityScore: active

      this.randomInRange(10, 100),       // mutualFriends: many mutual
      this.randomInRange(0.3, 0.8),      // mutualRatio: high ratio
      this.randomInRange(20, 200),       // previousInteractions: many
      this.randomInRange(2, 10),         // interactionFreq: regular
      this.randomInRange(60, 600),       // responseTime: normal
      this.randomInRange(5, 50),         // conversationDepth: established

      0,                                // suspiciousLinks: none
      0,                                // personalInfoRequests: none
      0,                                // pressureTactics: none
      0,                                // inappropriateLanguage: none
      0,                                // groomingLanguage: none
      0,                                // secrecyRequests: none
      0,                                // giftOffers: none
      this.randomInRange(0, 0.1),       // transitionSpeed: no escalation

      0,                                // isPublicPost: no
      1,                                // isDirectMessage: yes
      0,                                // isGroupChat: no
      0,                                // platform: instagram
      this.randomInRange(0, 1),          // timeOfDay: any
      this.randomInRange(0, 1)           // dayOfWeek: any
    ];
  }

  /**
   * Generate features for strangers
   */
  private generateStrangerFeatures(scenario: string): number[] {
    const strangerProfiles = {
      'grooming_attempt': () => [
        this.randomInRange(1, 14),         // new account
        this.randomInRange(0, 0.1),        // few followers
        0,                                 // not verified
        this.randomInRange(0, 0.4),        // incomplete profile
        this.randomInRange(0, 0.5),        // maybe no photo
        this.randomInRange(0, 20),         // short or no bio
        this.randomInRange(0, 0.3),        // maybe bot
        this.randomInRange(0, 1),          // low activity

        0,                                 // no mutual friends
        0,                                 // no mutual ratio
        this.randomInRange(0, 3),          // few interactions
        this.randomInRange(0, 1),          // low frequency
        0,                                 // no response time yet
        this.randomInRange(1, 10),         // shallow conversation

        0,                                 // no suspicious links yet
        this.randomInRange(1, 3),          // personal info requests
        this.randomInRange(1, 3),          // pressure tactics
        this.randomInRange(0, 1),          // maybe inappropriate
        this.randomInRange(2, 5),          // grooming language
        this.randomInRange(1, 3),          // secrecy requests
        this.randomInRange(0, 1),          // maybe gifts
        this.randomInRange(0.6, 1),        // fast escalation

        0, 1, 0, 0, // context: DM
        this.randomInRange(0.7, 1),        // late night
        this.randomInRange(0, 1)           // any day
      ],
      'personal_info_harvesting': () => [
        this.randomInRange(1, 30),
        this.randomInRange(0, 0.2),
        0,
        this.randomInRange(0.2, 0.5),
        this.randomInRange(0, 0.6),
        this.randomInRange(0, 30),
        0,
        this.randomInRange(0.5, 2),

        0,
        0,
        this.randomInRange(0, 5),
        this.randomInRange(0, 2),
        0,
        this.randomInRange(1, 8),

        this.randomInRange(1, 3),          // suspicious links
        this.randomInRange(3, 6),          // many personal info requests
        this.randomInRange(0, 1),          // some pressure
        0,
        0,
        0,
        0,
        this.randomInRange(0.3, 0.7),

        0, 1, 0, 0,
        this.randomInRange(0, 1),
        this.randomInRange(0, 1)
      ],
      'predatory_behavior': () => [
        this.randomInRange(1, 7),          // very new
        this.randomInRange(0, 0.05),
        0,
        this.randomInRange(0, 0.3),
        0,                                 // no photo
        this.randomInRange(0, 10),
        this.randomInRange(0.2, 0.4),      // bot-like
        this.randomInRange(0, 0.5),

        0,
        0,
        this.randomInRange(0, 2),
        this.randomInRange(0, 1),
        0,
        this.randomInRange(1, 5),

        0,
        this.randomInRange(2, 4),
        this.randomInRange(2, 4),          // high pressure
        this.randomInRange(1, 3),          // inappropriate
        this.randomInRange(3, 6),          // grooming
        this.randomInRange(2, 4),          // secrecy
        this.randomInRange(0, 1),          // gifts
        this.randomInRange(0.8, 1),        // very fast escalation

        0, 1, 0, 0,
        this.randomInRange(0.8, 1),        // very late
        this.randomInRange(0, 1)
      ],
      'inappropriate_content': () => [
        this.randomInRange(3, 21),
        this.randomInRange(0.01, 0.2),
        0,
        this.randomInRange(0.3, 0.6),
        this.randomInRange(0, 0.5),
        this.randomInRange(10, 40),
        0,
        this.randomInRange(1, 3),

        this.randomInRange(0, 2),
        this.randomInRange(0, 0.1),
        this.randomInRange(0, 3),
        this.randomInRange(0, 1),
        0,
        this.randomInRange(2, 6),

        this.randomInRange(0, 2),
        this.randomInRange(0, 1),
        0,
        this.randomInRange(3, 7),          // high inappropriate
        this.randomInRange(0, 1),
        0,
        0,
        this.randomInRange(0.4, 0.8),

        0, 1, 0, 0,
        this.randomInRange(0.5, 1),
        this.randomInRange(0, 1)
      ],
      'secrecy_coercion': () => [
        this.randomInRange(2, 14),
        this.randomInRange(0, 0.15),
        0,
        this.randomInRange(0.2, 0.5),
        this.randomInRange(0, 0.5),
        this.randomInRange(5, 25),
        0,
        this.randomInRange(0.5, 2),

        this.randomInRange(0, 1),
        this.randomInRange(0, 0.05),
        this.randomInRange(0, 2),
        this.randomInRange(0, 1),
        0,
        this.randomInRange(2, 8),

        0,
        this.randomInRange(0, 2),
        this.randomInRange(1, 3),
        0,
        0,
        this.randomInRange(3, 6),          // high secrecy
        0,
        this.randomInRange(0.5, 0.9),

        0, 1, 0, 0,
        this.randomInRange(0.7, 1),
        this.randomInRange(0, 1)
      ],
      'gift_offering': () => [
        this.randomInRange(5, 30),
        this.randomInRange(0.01, 0.3),
        this.randomInRange(0, 0.3),        // maybe verified
        this.randomInRange(0.4, 0.7),
        1,
        this.randomInRange(20, 80),
        0,
        this.randomInRange(1, 4),

        0,
        0,
        this.randomInRange(0, 4),
        this.randomInRange(0, 2),
        0,
        this.randomInRange(3, 10),

        this.randomInRange(0, 1),
        this.randomInRange(1, 3),
        this.randomInRange(1, 3),
        0,
        0,
        0,
        this.randomInRange(2, 5),          // gift offerings
        this.randomInRange(0.3, 0.7),

        0, 1, 0, 0,
        this.randomInRange(0.3, 0.8),
        this.randomInRange(0, 1)
      ],
      'rapid_escalation': () => [
        this.randomInRange(1, 10),
        this.randomInRange(0, 0.1),
        0,
        this.randomInRange(0.2, 0.5),
        this.randomInRange(0, 0.5),
        this.randomInRange(0, 20),
        0,
        this.randomInRange(0, 1),

        0,
        0,
        this.randomInRange(0, 2),
        this.randomInRange(2, 8),          // high frequency (rapid)
        0,
        this.randomInRange(3, 12),

        0,
        this.randomInRange(1, 3),
        this.randomInRange(1, 3),
        this.randomInRange(0, 2),
        this.randomInRange(1, 4),
        this.randomInRange(0, 1),
        0,
        this.randomInRange(0.8, 1),        // very rapid escalation

        0, 1, 0, 0,
        this.randomInRange(0.6, 1),
        this.randomInRange(0, 1)
      ],
      'fake_profile': () => [
        this.randomInRange(1, 5),          // very new
        this.randomInRange(0, 0.05),       // very low
        0,
        this.randomInRange(0, 0.2),        // very incomplete
        0,                                 // no photo
        0,                                 // no bio
        this.randomInRange(0.5, 1),        // bot
        this.randomInRange(0, 0.3),

        0,
        0,
        0,
        0,
        0,
        this.randomInRange(0, 3),

        this.randomInRange(2, 5),          // suspicious links
        this.randomInRange(2, 5),
        this.randomInRange(1, 3),
        this.randomInRange(0, 2),
        this.randomInRange(1, 3),
        this.randomInRange(1, 3),
        this.randomInRange(0, 1),
        this.randomInRange(0.6, 1),

        0, 1, 0, 0,
        this.randomInRange(0.8, 1),
        this.randomInRange(0, 1)
      ]
    };

    return strangerProfiles[scenario as keyof typeof strangerProfiles]();
  }

  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Get feature names for visualization
   */
  getFeatureNames(): string[] {
    return [
      'Account Age',
      'Follower Ratio',
      'Verified',
      'Profile Completeness',
      'Has Profile Photo',
      'Bio Length',
      'Account Type',
      'Activity Score',
      'Mutual Friends',
      'Mutual Friends Ratio',
      'Previous Interactions',
      'Interaction Frequency',
      'Response Time',
      'Conversation Depth',
      'Suspicious Links',
      'Personal Info Requests',
      'Pressure Tactics',
      'Inappropriate Language',
      'Grooming Language',
      'Secrecy Requests',
      'Gift Offers',
      'Transition Speed',
      'Is Public Post',
      'Is Direct Message',
      'Is Group Chat',
      'Platform Type',
      'Time of Day',
      'Day of Week'
    ];
  }

  /**
   * Get scenario descriptions for education
   */
  getScenarioDescriptions(): Record<string, string> {
    return {
      'classmate_chat': 'Chatting with a classmate about homework',
      'family_member': 'Conversation with family member',
      'close_friend': 'Talking with best friend',
      'teacher_communication': 'Student-teacher communication',
      'coach_message': 'Sports coach communication',
      'club_member': 'Club member coordination',
      'neighbor': 'Neighbor conversation',
      'teammate': 'Sports teammate chat',
      'grooming_attempt': 'Predator using "mature for age" language',
      'personal_info_harvesting': 'Collecting personal information',
      'predatory_behavior': 'Explicit predatory behavior',
      'inappropriate_content': 'Sharing inappropriate content',
      'secrecy_coercion': 'Asking child to keep secrets',
      'gift_offering': 'Offering gifts to gain trust',
      'rapid_escalation': 'Fast escalation to inappropriate topics',
      'fake_profile': 'Bot or fake account'
    };
  }
}

export const trainingDataGenerator = new TrainingDataGenerator();
