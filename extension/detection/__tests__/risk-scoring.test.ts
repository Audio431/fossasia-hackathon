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
});
