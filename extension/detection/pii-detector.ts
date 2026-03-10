/**
 * PII (Personal Identifiable Information) Detection Engine
 * Detects sensitive information in user-generated content
 */

export interface PIIPattern {
  type: 'location' | 'birthdate' | 'contact' | 'image' | 'address' | 'school' | 'financial' | 'identity';
  regex: RegExp[];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface DetectedPII {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  matchedText: string;
  position: {
    start: number;
    end: number;
  };
}

/**
 * Comprehensive PII detection patterns
 * Optimized for social media platforms including Instagram
 */
const PATTERNS: PIIPattern[] = [
  {
    type: 'birthdate',
    regex: [
      // MM/DD/YYYY, MM-DD-YYYY
      /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/gi,
      // DD/MM/YYYY, DD-MM-YYYY
      /\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19|20)\d{2}\b/gi,
      // YYYY/MM/DD, YYYY-MM-DD
      /\b(19|20)\d{2}[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])\b/gi,
      // Age expressions: "10 years old", "15 yo", "turning 16"
      /\b\d{1,2}\s+(years?\s+old|yo|age\s+old)\b/gi,
      /\b(turning|just\s+turned)\s+\d{1,2}\b/gi,
      // Birthday expressions: "my birthday is..."
      /\b(my\s+birthday|b-day|bday|born\s+(in|on))\s+(.){1,50}\b/gi,
      // Grade level (US school system): "in 7th grade", "6th grader"
      /\b(k|1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)\s+(grader|grade)\b/gi,
    ],
    severity: 'high',
    description: 'Birth date or age information'
  },
  {
    type: 'location',
    regex: [
      // City, State: "in Springfield, IL"
      /\bin\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?),\s*[A-Z]{2}\b/gi,
      // Street addresses: "at 123 Main St"
      /\bat\s+\d+\s+[\w\s]+(?:st|ave|avenue|street|road|rd|blvd|boulevard|lane|ln|drive|dr|court|ct|way|pl|place)\b/gi,
      // Street addresses with "is": "my address is 123 Main St"
      /\b(my\s+(address|location|home)|i\s+live)\s+(is|at)\s+\d+\s+[\w\s]+(?:st|ave|avenue|street|road|rd|blvd|boulevard|lane|ln|drive|dr|court|ct|way|pl|place)\b/gi,
      // School references: "my school is", "I go to"
      /\b(my\s+school|I\s+go\s+to|I\s+attend)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)\b/gi,
      // Location indicators: "live in", "from", "based in"
      /\b(live\s+in|from|based\s+in|located\s+in|currently\s+in)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)\b/gi,
      // GPS coordinates: "33.7490° N, 84.3880° W"
      /\b\d{1,3}\.\d+°?\s*[NS],\s*\d{1,3}\.\d+°?\s*[EW]\b/gi,
      // Landmarks: "near the", "by the"
      /\b(near|by|next\s+to|close\s+to)\s+the\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)\b/gi,
    ],
    severity: 'high',
    description: 'Location information'
  },
  {
    type: 'contact',
    regex: [
      // Phone numbers (US format): "123-456-7890", "(123) 456-7890", "123.456.7890"
      /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      // Bare 10-digit number (no separators): "1234567890"
      /\b\d{10}\b/g,
      // Obfuscated with spaces between digits: "1 2 3 4 5 6 7 8 9 0"
      /\b\d(?:\s\d){9}\b/g,
      // Phone numbers (international): "+1 234 567 8900"
      /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
      // Email addresses
      /[\w\.-]+@[\w\.-]+\.\w{2,}/gi,
      // Social media handles (cross-platform): "@username"
      /@[\w]{1,30}/g,
      // Contact info references: "my phone is", "text me at", "call me"
      /\b(my\s+(phone|number|cell|mobile)|text\s+me|call\s+me|dm\s+me)\s+(is|at)?\s*\w+/gi,
      // Discord: "username#1234"
      /\b[\w]{2,32}#\d{4}\b/g,
    ],
    severity: 'high',
    description: 'Contact information'
  },
  {
    type: 'address',
    regex: [
      // Full address: "123 Main St, Springfield, IL"
      /\d+\s+[\w\s]+(?:st|ave|avenue|street|road|rd|blvd|boulevard|lane|ln|drive|dr)[\w\s,]*[A-Z]{2}\s*\d{5}/gi,
      // ZIP codes: "12345", "12345-6789"
      /\b\d{5}(-\d{4})?\b/g,
      // Apartment numbers: "Apt 5", "Unit 12"
      /\b(apt|apartment|unit|suite|ste)\s+\d+[a-z]?\b/gi,
    ],
    severity: 'high',
    description: 'Home address'
  },
  {
    type: 'school',
    regex: [
      // School names: "Springfield High School"
      /\b([A-Z][a-z]+\s+)*(high|middle|elementary|primary|junior|senior)\s+(school|academy|institute|college)\b/gi,
      // University names: "University of Springfield"
      /\b(university|college|institute)\s+of\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?\b/gi,
      // "I go to [School]" / "I attend [School]"
      /\b(i\s+go\s+to|i\s+attend|my\s+school\s+is)\s+[A-Z][a-zA-Z\s]{2,30}\b/gi,
      // Sports teams by mascot: "the Springfield Eagles"
      /\b(?:the\s+)?[A-Z][a-z]+\s+(Eagles?|Tigers?|Bears?|Lions?|Panthers?|Warriors?|Knights?|Bulldogs?|Falcons?|Hawks?|Wolves?|Cougars?|Rams?|Wildcats?|Mustangs?|Trojans?|Spartans?|Rockets?|Hornets?|Chargers?)\b/g,
      // "I play for [Team]"
      /\bi\s+play\s+(?:on|for)\s+(?:the\s+)?[A-Z][a-zA-Z\s]{2,30}\b/gi,
    ],
    severity: 'medium',
    description: 'School or team name'
  },
  {
    type: 'financial',
    regex: [
      // SSN with dashes (XXX-XX-XXXX) — requires dashes to avoid false positives on bare numbers
      /\b(?!000|666|9\d{2})\d{3}-\d{2}-\d{4}\b/g,
      // SSN with context clue (allows spaces or dashes)
      /\b(?:ssn|social\s+security(?:\s+(?:number|#|no\.?))?)\s*[:=]?\s*(?!000|666|9\d{2})\d{3}[-\s]\d{2}[-\s]\d{4}\b/gi,
      // Visa: 4xxx-xxxx-xxxx-xxxx
      /\b4\d{3}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Mastercard: 5[1-5]xx or 2[2-7]xx
      /\b(?:5[1-5]\d{2}|2(?:2[2-9]\d|[3-6]\d{2}|7[01]\d|720))[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Amex: 3[47]xx xxxxxx xxxxx
      /\b3[47]\d{2}[-\s]\d{6}[-\s]\d{5}\b/g,
      // Discover: 6011 or 65xx
      /\b6(?:011|5\d{2})[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Generic 16-digit card with separators
      /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Credit card with context clue (bare 16-digit number)
      /\b(?:card\s+(?:number|#|no\.?)|credit\s+card|debit\s+card|cc\s*#?)\s*[:=]?\s*\d{13,19}\b/gi,
    ],
    severity: 'high',
    description: 'Financial account number'
  },
  {
    type: 'identity',
    regex: [
      // US passport with context clue
      /\b(?:passport(?:\s+(?:number|#|no\.?))?)\s*[:=]?\s*[A-Z]\d{8}\b/gi,
      // Driver's license with context clue
      /\b(?:driver'?s?\s+license(?:\s+(?:number|#|no\.?))?|dl\s*#?)\s*[:=]?\s*[A-Z0-9]{5,15}\b/gi,
      // License plate with context clue
      /\b(?:license\s+plate|plate\s+(?:number|#|no\.?))\s*[:=]?\s*[A-Z0-9]{2,8}\b/gi,
      // Standard US license plate patterns (e.g. ABC-1234, 123-ABC, AB-12345)
      /\b[A-Z]{1,3}[-\s]\d{3,4}[-\s]?[A-Z]{0,3}\b/g,
    ],
    severity: 'high',
    description: 'Government ID or license plate'
  },
];

/**
 * Platform-specific detection contexts
 */
export interface DetectionContext {
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'youtube' | 'discord' | 'generic';
  isPublic: boolean;
  isDirectMessage: boolean;
  characterLimit?: number;
  hasMedia?: boolean;
}

/**
 * Detect PII in text content
 * @param text - Text content to analyze
 * @param context - Detection context (platform, visibility, etc.)
 * @returns Array of detected PII items
 */
export function detectPII(
  text: string,
  context: DetectionContext = {
    platform: 'generic',
    isPublic: false,
    isDirectMessage: false
  }
): DetectedPII[] {
  const detected: DetectedPII[] = [];

  // Normalize text for detection
  const normalizedText = text.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters

  for (const pattern of PATTERNS) {
    for (const regex of pattern.regex) {
      let match;
      const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');

      while ((match = globalRegex.exec(normalizedText)) !== null) {
        detected.push({
          type: pattern.type,
          severity: pattern.severity,
          description: pattern.description,
          matchedText: match[0],
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
  }

  // Platform-specific adjustments
  if (context.platform === 'instagram') {
    // Instagram-specific: Check for location tags, bio mentions
    const instagramPatterns = [
      /📍\s*[\w\s]+/g, // Location emoji + text
      /\bio:\s*.{0,150}\b/gi, // Bio field
      /\b(link\s+in\s+bio|bio\s+link)\b/gi, // Link in bio references
    ];

    for (const pattern of instagramPatterns) {
      let match;
      while ((match = pattern.exec(normalizedText)) !== null) {
        detected.push({
          type: 'location',
          severity: 'medium',
          description: 'Instagram location or bio information',
          matchedText: match[0],
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
  }

  // Deduplicate detections (same position, same type)
  const deduplicated = detected.filter((item, index, self) =>
    index === self.findIndex((t) =>
      t.position.start === item.position.start &&
      t.position.end === item.position.end &&
      t.type === item.type
    )
  );

  return deduplicated;
}

/**
 * Calculate risk score based on detected PII
 * @param detectedPII - Array of detected PII items
 * @returns Risk score (0-100)
 */
export function calculatePIIRiskScore(detectedPII: DetectedPII[]): number {
  if (detectedPII.length === 0) return 0;

  let score = 0;

  for (const pii of detectedPII) {
    const severityMultiplier = pii.severity === 'high' ? 30 : pii.severity === 'medium' ? 15 : 5;
    score += severityMultiplier;
  }

  // Multiple PII items increase risk exponentially
  if (detectedPII.length > 1) {
    score *= 1 + (detectedPII.length * 0.2);
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Check if text contains high-risk PII combinations
 * @param detectedPII - Array of detected PII items
 * @returns Boolean indicating if high-risk combinations are present
 */
export function hasHighRiskCombinations(detectedPII: DetectedPII[]): boolean {
  const types = new Set(detectedPII.map(pii => pii.type));

  // High-risk combinations
  const dangerousCombos = [
    ['birthdate', 'location'],
    ['birthdate', 'school'],
    ['contact', 'location'],
    ['contact', 'school'],
    ['address', 'birthdate'],
    ['financial', 'birthdate'],
    ['financial', 'address'],
    ['identity', 'birthdate'],
    ['identity', 'location'],
  ];

  return dangerousCombos.some(combo =>
    combo.every(type => types.has(type))
  );
}

/**
 * Get human-readable summary of detected PII
 * @param detectedPII - Array of detected PII items
 * @returns Human-readable summary string
 */
export function getPIISummary(detectedPII: DetectedPII[]): string {
  if (detectedPII.length === 0) return 'No sensitive information detected';

  const typeCounts = detectedPII.reduce((acc, pii) => {
    acc[pii.type] = (acc[pii.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = Object.entries(typeCounts)
    .map(([type, count]) => {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      return `${count} ${label}${count > 1 ? 's' : ''}`;
    })
    .join(', ');

  return `Detected: ${summary}`;
}

/**
 * Mask PII in text for logging/display purposes
 * @param text - Original text
 * @param detectedPII - Detected PII items
 * @returns Text with PII masked
 */
export function maskPII(text: string, detectedPII: DetectedPII[]): string {
  let maskedText = text;

  // Sort by position (reverse order to maintain indices)
  const sortedPII = [...detectedPII].sort((a, b) => b.position.start - a.position.start);

  for (const pii of sortedPII) {
    const before = maskedText.substring(0, pii.position.start);
    const after = maskedText.substring(pii.position.end);
    const masked = '•'.repeat(pii.matchedText.length);
    maskedText = before + masked + after;
  }

  return maskedText;
}
