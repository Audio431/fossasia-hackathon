/**
 * Instagram Stranger Monitor
 * Real-time stranger detection for Instagram DMs and comments
 * Monitors conversations and alerts users to potential stranger danger
 */

import type { PlasmoCSConfig } from "plasmo";
import { strangerModel, StrangerPrediction } from "../detection/ml-model";
import { StrangerFeatures, mlFeatureExtractor } from "../detection/ml-features";
import { render } from "react-dom";
import StrangerAlert from "../components/StrangerAlert";

export const config: PlasmoCSConfig = {
  matches: ["*://*.instagram.com/*"],
  run_at: "document_idle"
};

console.log('Privacy Shadow: Instagram Stranger Monitor active');

interface InstagramMessage {
  id: string;
  text: string;
  sender: 'user' | 'stranger';
  timestamp: number;
}

interface InstagramProfile {
  username: string;
  fullName?: string;
  followers?: number;
  following?: number;
  isVerified?: boolean;
  hasProfilePhoto?: boolean;
  bio?: string;
  isBusiness?: boolean;
  postsCount?: number;
  accountCreated?: string;
}

class InstagramStrangerMonitor {
  private detector: typeof strangerModel;
  private conversationHistory: Map<string, InstagramMessage[]> = new Map();
  private analyzedThreads: Set<string> = new Set();
  private acknowledgedThreads: Set<string> = new Set();
  private alertContainer: HTMLDivElement | null = null;
  private currentThreadId: string | null = null;

  constructor() {
    this.detector = strangerModel;
    // Load acknowledged threads from localStorage
    this.loadAcknowledgedThreads();
  }

  /**
   * Initialize the Instagram stranger monitor
   */
  async initialize(): Promise<void> {
    console.log('Privacy Shadow: Initializing Instagram stranger monitor');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize ML model
    await this.detector.initialize();

    // Start monitoring
    this.monitorDMs();
    this.monitorComments();

    console.log('Privacy Shadow: Instagram stranger monitor ready');
  }

  /**
   * Load acknowledged threads from localStorage
   */
  private loadAcknowledgedThreads(): void {
    try {
      const stored = localStorage.getItem('privacy-shadow-acknowledged-threads');
      if (stored) {
        const threads = JSON.parse(stored) as string[];
        this.acknowledgedThreads = new Set(threads);
        console.log('Privacy Shadow: Loaded acknowledged threads', threads.length);
      }
    } catch (error) {
      console.error('Privacy Shadow: Error loading acknowledged threads', error);
    }
  }

  /**
   * Save acknowledged threads to localStorage
   */
  private saveAcknowledgedThreads(): void {
    try {
      const threads = Array.from(this.acknowledgedThreads);
      localStorage.setItem('privacy-shadow-acknowledged-threads', JSON.stringify(threads));
    } catch (error) {
      console.error('Privacy Shadow: Error saving acknowledged threads', error);
    }
  }

  /**
   * Mark thread as acknowledged (user clicked "I Know This Person")
   */
  private markThreadAsAcknowledged(threadId: string): void {
    this.acknowledgedThreads.add(threadId);
    this.saveAcknowledgedThreads();
    console.log('Privacy Shadow: Thread marked as acknowledged', threadId);
  }

  /**
   * Check if thread has been acknowledged
   */
  private isThreadAcknowledged(threadId: string): boolean {
    return this.acknowledgedThreads.has(threadId);
  }

  /**
   * Monitor Instagram DM conversations
   */
  monitorDMs(): void {
    console.log('Privacy Shadow: Monitoring Instagram DMs');

    // Instagram DM URL pattern
    if (window.location.pathname.startsWith('/direct/t/')) {
      this.analyzeCurrentDMThread();
    }

    // Observe navigation changes
    const observer = new MutationObserver(() => {
      if (window.location.pathname.startsWith('/direct/t/')) {
        this.analyzeCurrentDMThread();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Monitor for new messages
    this.observeNewMessages();
  }

  /**
   * Monitor Instagram comments
   */
  monitorComments(): void {
    console.log('Privacy Shadow: Monitoring Instagram comments');

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if it's a comment
            if (element.classList.contains('comment') ||
                element.querySelector('.comment') !== null) {
              this.analyzeComment(element);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Analyze the current DM thread
   */
  private async analyzeCurrentDMThread(): Promise<void> {
    console.log('Privacy Shadow: Analyzing DM thread');

    try {
      // Get thread ID from URL
      const threadIdMatch = window.location.pathname.match(/\/direct\/t\/([^\/]+)/);
      if (!threadIdMatch) return;

      const threadId = threadIdMatch[1];

      // Store current thread ID
      this.currentThreadId = threadId;

      // Don't re-analyze the same thread (unless it's a new message)
      if (this.analyzedThreads.has(threadId)) return;

      // Don't show alert if user already acknowledged the risk
      if (this.isThreadAcknowledged(threadId)) {
        console.log('Privacy Shadow: Thread already acknowledged by user', threadId);
        this.analyzedThreads.add(threadId);
        return;
      }

      // Extract profile and messages from Instagram DOM
      const profile = await this.extractInstagramProfile();
      const messages = await this.extractMessages();

      if (!profile || messages.length === 0) return;

      // Analyze for stranger risk
      const strangerScore = await this.analyzeStrangerRisk(profile, messages);

      console.log('Privacy Shadow: Stranger risk analysis complete', strangerScore);

      // Show alert if high risk
      if (strangerScore.probability > 0.4) {
        this.showStrangerAlert(strangerScore, profile, messages);
      }

      // Mark as analyzed
      this.analyzedThreads.add(threadId);

    } catch (error) {
      console.error('Privacy Shadow: Error analyzing DM thread', error);
    }
  }

  /**
   * Extract Instagram profile from DOM
   */
  private async extractInstagramProfile(): Promise<InstagramProfile | null> {
    try {
      // Instagram profile selectors (may need updates as Instagram changes DOM)
      const usernameSelector = 'header span.x78zum5';
      const usernameElement = document.querySelector(usernameSelector);

      if (!usernameElement) return null;

      const username = usernameElement.textContent?.trim() || '';

      // Try to extract additional profile information
      const bioSelector = 'div.x9f619';
      const bioElement = document.querySelector(bioSelector);

      // Follower/following counts (if visible)
      const statsSelector = 'a.xcklkx';
      const statsElements = document.querySelectorAll(statsSelector);

      let followers: number | undefined;
      let following: number | undefined;

      statsElements.forEach((el, index) => {
        const text = el.textContent?.trim() || '';
        const num = this.parseInstagramNumber(text);
        if (index === 0) followers = num;
        if (index === 1) following = num;
      });

      // Check if verified
      const verifiedBadge = document.querySelector('svg[aria-label="Verified"]');
      const isVerified = verifiedBadge !== null;

      // Check for profile photo
      const profilePhotoSelector = 'img.x5y1t29';
      const profilePhoto = document.querySelector(profilePhotoSelector);
      const hasProfilePhoto = profilePhoto !== null;

      return {
        username,
        followers,
        following,
        isVerified,
        hasProfilePhoto,
        bio: bioElement?.textContent?.trim() || '',
        isBusiness: false,
        postsCount: 0,
      };

    } catch (error) {
      console.error('Privacy Shadow: Error extracting Instagram profile', error);
      return null;
    }
  }

  /**
   * Extract messages from current DM thread
   */
  private async extractMessages(): Promise<InstagramMessage[]> {
    const messages: InstagramMessage[] = [];

    try {
      // Instagram message selectors
      const messageSelectors = '.x9f619, .x1lliihq';

      const messageElements = document.querySelectorAll(messageSelectors);

      messageElements.forEach((el, index) => {
        const text = el.textContent?.trim() || '';
        if (text.length === 0) return;

        // Determine if sent by user or stranger
        // Instagram puts sent messages in different containers
        const isSentByUser = el.closest('.x1fc4z47') !== null;

        messages.push({
          id: `msg-${index}`,
          text,
          sender: isSentByUser ? 'user' : 'stranger',
          timestamp: Date.now() - (index * 60000), // Approximate timestamps
        });
      });

    } catch (error) {
      console.error('Privacy Shadow: Error extracting messages', error);
    }

    return messages;
  }

  /**
   * Parse Instagram number format (e.g., "1.2K", "345")
   */
  private parseInstagramNumber(text: string): number {
    if (!text) return 0;

    // Remove commas and spaces
    const cleaned = text.replace(/[, ]/g, '');

    // Handle K, M, B suffixes
    const suffix = cleaned.slice(-1).toUpperCase();
    const base = parseFloat(cleaned.slice(0, -1));

    if (suffix === 'K') return Math.round(base * 1000);
    if (suffix === 'M') return Math.round(base * 1000000);
    if (suffix === 'B') return Math.round(base * 1000000000);

    return parseInt(cleaned) || 0;
  }

  /**
   * Analyze stranger risk using ML model
   */
  private async analyzeStrangerRisk(
    profile: InstagramProfile,
    messages: InstagramMessage[]
  ): Promise<StrangerPrediction> {
    // Extract ML features from profile and messages
    const features: StrangerFeatures = {
      accountAgeDays: 0, // Instagram doesn't show account age in DOM
      followerRatio: profile.following && profile.following > 0
        ? (profile.followers || 0) / profile.following
        : (profile.followers || 0),
      verificationStatus: profile.isVerified || false,
      profileCompleteness: this.calculateProfileCompleteness(profile),
      hasProfilePhoto: profile.hasProfilePhoto || false,
      bioLength: profile.bio?.length || 0,
      accountType: profile.isBusiness ? 'business' : 'personal',
      activityScore: 0, // Would need to calculate from posts

      mutualFriends: 0, // Not visible in Instagram DOM
      mutualFriendsRatio: 0,
      previousInteractions: messages.filter(m => m.sender === 'stranger').length,
      interactionFrequency: this.calculateInteractionFrequency(messages),
      responseTime: 0,
      conversationDepth: messages.length,

      suspiciousLinks: this.countSuspiciousLinks(messages),
      personalInfoRequests: this.countPersonalInfoRequests(messages),
      pressureTactics: this.countPressureTactics(messages),
      inappropriateLanguage: this.countInappropriateLanguage(messages),
      groomingLanguage: this.countGroomingLanguage(messages),
      secrecyRequests: this.countSecrecyRequests(messages),
      giftOffers: this.countGiftOffers(messages),
      transitionSpeed: this.calculateTransitionSpeed(messages),

      isPublicPost: false,
      isDirectMessage: true,
      isGroupChat: false,
      platformType: 'instagram',
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    };

    // Get prediction from ML model
    return await this.detector.predict(features);
  }

  /**
   * Helper methods for feature extraction
   */
  private calculateProfileCompleteness(profile: InstagramProfile): number {
    let score = 0;
    if (profile.hasProfilePhoto) score++;
    if (profile.bio && profile.bio.length > 0) score++;
    if (profile.isVerified) score++;
    return score / 3;
  }

  private calculateInteractionFrequency(messages: InstagramMessage[]): number {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    return messages.filter(m => m.timestamp > oneDayAgo).length;
  }

  private countSuspiciousLinks(messages: InstagramMessage[]): number {
    const patterns = [
      /bit\.ly/i, /tinyurl\.com/i, /discord\.gg/i, /telegram\.org/i
    ];
    return messages.filter(m =>
      m.sender === 'stranger' && patterns.some(p => p.test(m.text))
    ).length;
  }

  private countPersonalInfoRequests(messages: InstagramMessage[]): number {
    const patterns = [
      /where do you live/i, /what's your address/i, /where are you from/i,
      /what school/i, /phone number/i, /how old are you/i
    ];
    return messages.filter(m =>
      m.sender === 'stranger' && patterns.some(p => p.test(m.text))
    ).length;
  }

  private countPressureTactics(messages: InstagramMessage[]): number {
    const patterns = [
      /please do it/i, /just do it/i, /don't be boring/i, /trust me/i
    ];
    return messages.filter(m =>
      m.sender === 'stranger' && patterns.some(p => p.test(m.text))
    ).length;
  }

  private countInappropriateLanguage(messages: InstagramMessage[]): number {
    const patterns = [/\b(sex|nude|hot|sexy)\b/i];
    return messages.filter(m =>
      m.sender === 'stranger' && patterns.some(p => p.test(m.text))
    ).length;
  }

  private countGroomingLanguage(messages: InstagramMessage[]): number {
    const patterns = [
      /you're (so )?mature for your age/i, /you're special/i,
      /your parents don't understand/i, /it's our secret/i
    ];
    return messages.filter(m =>
      m.sender === 'stranger' && patterns.some(p => p.test(m.text))
    ).length;
  }

  private countSecrecyRequests(messages: InstagramMessage[]): number {
    const patterns = [
      /don't tell anyone/i, /keep this a secret/i, /don't tell your parents/i
    ];
    return messages.filter(m =>
      m.sender === 'stranger' && patterns.some(p => p.test(m.text))
    ).length;
  }

  private countGiftOffers(messages: InstagramMessage[]): number {
    const patterns = [/i'll buy you/i, /i can get you/i, /venmo|paypal/i];
    return messages.filter(m =>
      m.sender === 'stranger' && patterns.some(p => p.test(m.text))
    ).length;
  }

  private calculateTransitionSpeed(messages: InstagramMessage[]): number {
    if (messages.length < 3) return 0;

    const firstInappropriateIndex = messages.findIndex(m => {
      const patterns = [
        /where do you live/i, /what's your phone/i,
        /you're (so )?mature/i, /don't tell your parents/i
      ];
      return patterns.some(p => p.test(m.text));
    });

    if (firstInappropriateIndex === -1) return 1;

    return 1 - (firstInappropriateIndex / messages.length);
  }

  /**
   * Show stranger alert to user
   */
  private showStrangerAlert(
    prediction: StrangerPrediction,
    profile: InstagramProfile,
    messages: InstagramMessage[]
  ): void {
    // Create container for alert
    if (!this.alertContainer) {
      this.alertContainer = document.createElement('div');
      this.alertContainer.id = 'privacy-shadow-alert-container';
      document.body.appendChild(this.alertContainer);
    }

    // Convert messages to StrangerFeatures format
    const features: StrangerFeatures = {
      accountAgeDays: 0,
      followerRatio: profile.following && profile.following > 0
        ? (profile.followers || 0) / profile.following
        : (profile.followers || 0),
      verificationStatus: profile.isVerified || false,
      profileCompleteness: this.calculateProfileCompleteness(profile),
      hasProfilePhoto: profile.hasProfilePhoto || false,
      bioLength: profile.bio?.length || 0,
      accountType: 'personal',
      activityScore: 0,
      mutualFriends: 0,
      mutualFriendsRatio: 0,
      previousInteractions: messages.filter(m => m.sender === 'stranger').length,
      interactionFrequency: this.calculateInteractionFrequency(messages),
      responseTime: 0,
      conversationDepth: messages.length,
      suspiciousLinks: this.countSuspiciousLinks(messages),
      personalInfoRequests: this.countPersonalInfoRequests(messages),
      pressureTactics: this.countPressureTactics(messages),
      inappropriateLanguage: this.countInappropriateLanguage(messages),
      groomingLanguage: this.countGroomingLanguage(messages),
      secrecyRequests: this.countSecrecyRequests(messages),
      giftOffers: this.countGiftOffers(messages),
      transitionSpeed: this.calculateTransitionSpeed(messages),
      isPublicPost: false,
      isDirectMessage: true,
      isGroupChat: false,
      platformType: 'instagram',
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    };

    // Get current thread ID
    const threadId = this.currentThreadId;

    // Render alert
    render(
      <StrangerAlert
        prediction={prediction}
        features={features}
        onBlock={() => {
          console.log('Privacy Shadow: User clicked block');
          if (threadId) {
            this.markThreadAsAcknowledged(threadId);
          }
          this.alertContainer?.remove();
        }}
        onContinue={() => {
          console.log('Privacy Shadow: User clicked continue (I Know This Person)');
          if (threadId) {
            this.markThreadAsAcknowledged(threadId);
          }
          this.alertContainer?.remove();
        }}
        onLearnMore={() => {
          console.log('Privacy Shadow: User clicked learn more');
          window.open('https://privacy-shadow.dev/learn', '_blank');
        }}
      />,
      this.alertContainer
    );

    console.log('Privacy Shadow: Stranger alert displayed');
  }

  /**
   * Analyze individual comments
   */
  private analyzeComment(commentElement: Element): void {
    const commentText = commentElement.textContent?.trim() || '';
    if (commentText.length === 0) return;

    // Check for suspicious patterns in comments
    const suspiciousPatterns = [
      /where do you live/i, /what's your address/i, /dm me/i,
      /check my bio/i, /link in bio/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern =>
      pattern.test(commentText)
    );

    if (isSuspicious) {
      console.log('Privacy Shadow: Suspicious comment detected', commentText);
      // Could show a smaller warning for comments
    }
  }

  /**
   * Observe new messages being added
   */
  private observeNewMessages(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if it's a new message
            if (element.classList.contains('x9f619') ||
                element.querySelector('.x9f619') !== null) {
              // Get current thread ID and remove from analyzed threads to allow re-analysis
              const threadIdMatch = window.location.pathname.match(/\/direct\/t\/([^\/]+)/);
              if (threadIdMatch) {
                const threadId = threadIdMatch[1];
                this.analyzedThreads.delete(threadId);
                console.log('Privacy Shadow: New message detected, re-analyzing thread', threadId);
                this.analyzeCurrentDMThread();
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the monitor
const instagramMonitor = new InstagramStrangerMonitor();

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    instagramMonitor.initialize();
  });
} else {
  instagramMonitor.initialize();
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_INSTAGRAM_DM') {
    instagramMonitor.analyzeCurrentDMThread();
    sendResponse({ status: 'analyzing' });
  }

  return true;
});
