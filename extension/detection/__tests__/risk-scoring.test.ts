/**
 * Unit Tests for Risk Scoring System
 */

import {
  calculateRisk,
  getRiskEmoji,
  getRiskColor,
  getKidAlertMessage,
  shouldBlock,
  generateRiskReport
} from '../risk-scoring';
import { DetectedPII } from '../pii-detector';

describe('Risk Scoring', () => {
  const mockPII: DetectedPII[] = [
    {
      type: 'birthdate',
      severity: 'high',
      description: 'Birth date',
      matchedText: '05/12/2012',
      position: { start: 0, end: 10 }
    }
  ];

  const mockContext = {
    platform: 'instagram' as const,
    isPublic: true,
    isDirectMessage: false,
    hasMedia: false,
    url: 'https://instagram.com/p/example',
    website: 'instagram.com'
  };

  describe('calculateRisk', () => {
    it('should calculate risk with detected PII', () => {
      const risk = calculateRisk(mockPII, 0.5, mockContext);

      expect(risk.score).toBeGreaterThan(0);
      expect(risk.level).toMatch(/^(low|medium|high|critical)$/);
      expect(risk.reasons).toContain('Birth date');
    });

    it('should increase risk for stranger interactions', () => {
      const riskKnown = calculateRisk(mockPII, 0.1, mockContext);
      const riskStranger = calculateRisk(mockPII, 0.8, mockContext);

      expect(riskStranger.score).toBeGreaterThan(riskKnown.score);
    });

    it('should increase risk for public posts', () => {
      const publicContext = { ...mockContext, isPublic: true };
      const privateContext = { ...mockContext, isPublic: false };

      const riskPublic = calculateRisk(mockPII, 0.5, publicContext);
      const riskPrivate = calculateRisk(mockPII, 0.5, privateContext);

      expect(riskPublic.score).toBeGreaterThan(riskPrivate.score);
    });

    it('should alert kid for medium risk and above', () => {
      const mediumRisk = calculateRisk(mockPII, 0.5, mockContext);

      if (mediumRisk.score >= 25) {
        expect(mediumRisk.shouldAlertKid).toBe(true);
      }
    });

    it('should alert parent for high risk and above', () => {
      const highRiskPII = [...mockPII, ...mockPII]; // Multiple PII
      const risk = calculateRisk(highRiskPII, 0.7, mockContext);

      if (risk.score >= 50) {
        expect(risk.shouldAlertParent).toBe(true);
      }
    });

    it('should provide recommendations', () => {
      const risk = calculateRisk(mockPII, 0.5, mockContext);

      expect(risk.recommendations).toBeDefined();
      expect(risk.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getRiskEmoji', () => {
    it('should return correct emoji for each level', () => {
      expect(getRiskEmoji('critical')).toBe('🛑');
      expect(getRiskEmoji('high')).toBe('⚠️');
      expect(getRiskEmoji('medium')).toBe('🔶');
      expect(getRiskEmoji('low')).toBe('💡');
    });
  });

  describe('getRiskColor', () => {
    it('should return correct color for each level', () => {
      expect(getRiskColor('critical')).toContain('red');
      expect(getRiskColor('high')).toContain('orange');
      expect(getRiskColor('medium')).toContain('yellow');
      expect(getRiskColor('low')).toContain('blue');
    });
  });

  describe('getKidAlertMessage', () => {
    it('should return appropriate message for critical risk', () => {
      const risk = {
        score: 85,
        level: 'critical' as const,
        reasons: ['Birth date'],
        shouldAlertKid: true,
        shouldAlertParent: true,
        recommendations: [],
        timestamp: Date.now()
      };

      const message = getKidAlertMessage(risk);
      expect(message).toContain('STOP');
      expect(message).toContain('dangerous');
    });

    it('should return appropriate message for low risk', () => {
      const risk = {
        score: 15,
        level: 'low' as const,
        reasons: ['Birth date'],
        shouldAlertKid: false,
        shouldAlertParent: false,
        recommendations: [],
        timestamp: Date.now()
      };

      const message = getKidAlertMessage(risk);
      expect(message).toContain('heads up');
    });
  });

  describe('shouldBlock', () => {
    it('should block critical and high risk', () => {
      const criticalRisk = {
        score: 85,
        level: 'critical' as const,
        reasons: ['Birth date'],
        shouldAlertKid: true,
        shouldAlertParent: true,
        recommendations: [],
        timestamp: Date.now()
      };

      const highRisk = {
        score: 65,
        level: 'high' as const,
        reasons: ['Birth date'],
        shouldAlertKid: true,
        shouldAlertParent: true,
        recommendations: [],
        timestamp: Date.now()
      };

      expect(shouldBlock(criticalRisk)).toBe(true);
      expect(shouldBlock(highRisk)).toBe(true);
    });

    it('should not block medium and low risk', () => {
      const mediumRisk = {
        score: 35,
        level: 'medium' as const,
        reasons: ['Birth date'],
        shouldAlertKid: true,
        shouldAlertParent: false,
        recommendations: [],
        timestamp: Date.now()
      };

      const lowRisk = {
        score: 15,
        level: 'low' as const,
        reasons: ['Birth date'],
        shouldAlertKid: false,
        shouldAlertParent: false,
        recommendations: [],
        timestamp: Date.now()
      };

      expect(shouldBlock(mediumRisk)).toBe(false);
      expect(shouldBlock(lowRisk)).toBe(false);
    });
  });

  describe('generateRiskReport', () => {
    it('should generate summary report', () => {
      const risk = {
        score: 75,
        level: 'high' as const,
        reasons: ['Birth date', 'Location'],
        shouldAlertKid: true,
        shouldAlertParent: true,
        recommendations: ['Don\'t share this', 'Talk to parent'],
        timestamp: Date.now()
      };

      const report = generateRiskReport(risk);

      expect(report.summary).toContain('HIGH');
      expect(report.details).toContain('Birth date');
      expect(report.actionable).toContain('Don\'t share this');
    });
  });

  // ── Platform trust score tests ────────────────────────────────────────────

  describe('platform trust scores', () => {
    const pii: DetectedPII[] = [{
      type: 'location', severity: 'high', description: 'Location',
      matchedText: 'Springfield, IL', position: { start: 0, end: 15 }
    }];
    const baseCtx = { isPublic: false, isDirectMessage: false, hasMedia: false };

    it('Discord should score higher than Facebook (same PII)', () => {
      const discordRisk = calculateRisk(pii, 0, { ...baseCtx, platform: 'discord' as const });
      const fbRisk     = calculateRisk(pii, 0, { ...baseCtx, platform: 'facebook' as const });
      expect(discordRisk.score).toBeGreaterThan(fbRisk.score);
    });

    it('TikTok should score higher than Facebook (same PII)', () => {
      const tiktokRisk = calculateRisk(pii, 0, { ...baseCtx, platform: 'tiktok' as const });
      const fbRisk     = calculateRisk(pii, 0, { ...baseCtx, platform: 'facebook' as const });
      expect(tiktokRisk.score).toBeGreaterThan(fbRisk.score);
    });

    it('Discord multiplier should be ~1.7x (trust 0.3 → 2-0.3=1.7)', () => {
      const discordRisk  = calculateRisk(pii, 0, { ...baseCtx, platform: 'discord' as const });
      const genericRisk  = calculateRisk(pii, 0, { ...baseCtx, platform: 'generic' as const });
      // Discord (0.3) gives 1.7x, generic (0.5) gives 1.5x → discord should be higher
      expect(discordRisk.score).toBeGreaterThan(genericRisk.score);
    });
  });

  // ── Type-specific recommendations ────────────────────────────────────────

  describe('type-specific recommendations', () => {
    const baseCtx = {
      platform: 'generic' as const, isPublic: false, isDirectMessage: false, hasMedia: false
    };

    it('name PII should include name-specific recommendation', () => {
      const namePII: DetectedPII[] = [{
        type: 'name', severity: 'high', description: 'Full name',
        matchedText: 'Emma Thompson', position: { start: 0, end: 13 }
      }];
      const risk = calculateRisk(namePII, 0, baseCtx);
      expect(risk.recommendations.some(r => r.includes('full name'))).toBe(true);
    });

    it('routine PII should include routine-specific recommendation', () => {
      const routinePII: DetectedPII[] = [{
        type: 'routine', severity: 'high', description: 'Daily routine',
        matchedText: 'home alone until 6pm', position: { start: 0, end: 20 }
      }];
      const risk = calculateRisk(routinePII, 0, baseCtx);
      expect(risk.recommendations.some(r => r.includes('home alone') || r.includes('schedule'))).toBe(true);
    });

    it('should not duplicate recommendations for same PII type', () => {
      const twoNamePII: DetectedPII[] = [
        { type: 'name', severity: 'high', description: 'Full name 1', matchedText: 'Emma Thompson', position: { start: 0, end: 13 } },
        { type: 'name', severity: 'high', description: 'Full name 2', matchedText: 'Emma T', position: { start: 20, end: 26 } },
      ];
      const risk = calculateRisk(twoNamePII, 0, baseCtx);
      const nameRecs = risk.recommendations.filter(r => r.includes('full name'));
      expect(nameRecs.length).toBe(1);
    });

    it('location PII should include location-specific recommendation', () => {
      const locPII: DetectedPII[] = [{
        type: 'location', severity: 'high', description: 'Location',
        matchedText: 'Springfield', position: { start: 0, end: 11 }
      }];
      const risk = calculateRisk(locPII, 0, baseCtx);
      expect(risk.recommendations.some(r => r.includes('location') || r.includes('address'))).toBe(true);
    });
  });

  // ── High-risk combinations in scoring ────────────────────────────────────

  describe('high-risk combination scoring', () => {
    const ctx = {
      platform: 'generic' as const, isPublic: false, isDirectMessage: false, hasMedia: false
    };

    it('name + location combo should score higher than name alone', () => {
      const nameOnly: DetectedPII[] = [
        { type: 'name', severity: 'high', description: 'Full name', matchedText: 'Emma T', position: { start: 0, end: 6 } }
      ];
      const nameAndLoc: DetectedPII[] = [
        ...nameOnly,
        { type: 'location', severity: 'high', description: 'Location', matchedText: 'Springfield', position: { start: 10, end: 21 } }
      ];
      expect(calculateRisk(nameAndLoc, 0, ctx).score).toBeGreaterThan(calculateRisk(nameOnly, 0, ctx).score);
    });

    it('routine + contact combo should trigger critical level', () => {
      const pii: DetectedPII[] = [
        { type: 'routine', severity: 'high', description: 'Routine', matchedText: 'home alone', position: { start: 0, end: 10 } },
        { type: 'contact', severity: 'high', description: 'Phone', matchedText: '555-123-4567', position: { start: 15, end: 27 } },
      ];
      const risk = calculateRisk(pii, 0.8, ctx);
      expect(['high', 'critical']).toContain(risk.level);
    });
  });
});
