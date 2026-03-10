/**
 * PII (Personal Identifiable Information) Detection Engine
 * Detects sensitive information in user-generated content
 */

export interface PIIPattern {
  type: 'location' | 'birthdate' | 'contact' | 'image' | 'address' | 'school' | 'financial' | 'identity' | 'name' | 'routine';
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
  // ── Full name sharing ─────────────────────────────────────────────────────
  {
    type: 'name',
    regex: [
      // "my name is Emma Thompson" / "I'm called Sarah Jones"
      /\b(?:my\s+(?:full\s+)?name\s+is|i(?:'m|\s+am)\s+called|call\s+me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/gi,
      // "I'm Emma Thompson" — first + last, both capitalised
      /\bi(?:'m|\s+am)\s+([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/gi,
      // Introductions: "Hi, I'm Emma Thompson"
      /\b(?:hi|hello|hey)[\s,!]+(?:i(?:'m|\s+am)|my\s+name\s+is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/gi,
    ],
    severity: 'high',
    description: 'Full name',
  },

  // ── Birth date / age ──────────────────────────────────────────────────────
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
      // Birthday expressions
      /\b(my\s+birthday|b-day|bday|born\s+(in|on))\s+(.){1,50}\b/gi,
      // Grade level: "in 7th grade", "6th grader"
      /\b(k|1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)\s+(grader|grade)\b/gi,
      // Age + gender combos: "14f", "13m", "16f here", "I'm a 13 year old girl"
      /\b\d{1,2}\s*[fFmM]\b(?:\s+here)?/g,
      /\bi(?:'m|\s+am)\s+a\s+\d{1,2}[- ]year[- ]old\s+(?:girl|boy|kid|teen|female|male)\b/gi,
      // "im 14" — abbreviated age claim common in chats
      /\bim\s+\d{1,2}\b/gi,
    ],
    severity: 'high',
    description: 'Birth date or age information',
  },

  // ── Location ──────────────────────────────────────────────────────────────
  {
    type: 'location',
    regex: [
      // City, State: "in Springfield, IL"
      /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*[A-Z]{2}\b/gi,
      // Street addresses: "at 123 Main St"
      /\bat\s+\d+\s+[\w\s]+(?:st|ave|avenue|street|road|rd|blvd|boulevard|lane|ln|drive|dr|court|ct|way|pl|place)\b/gi,
      // School references: "I go to", "I attend"
      /\b(my\s+school|I\s+go\s+to|I\s+attend)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
      // Location indicators with longer minimum city name to reduce FP
      /\b(live\s+in|currently\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
      /\b(from|based\s+in|located\s+in)\s+([A-Z][a-z]{3,}(?:\s+[A-Z][a-z]+)?)\b/gi,
      // GPS coordinates: "33.7490° N, 84.3880° W"
      /\b\d{1,3}\.\d+°?\s*[NS],\s*\d{1,3}\.\d+°?\s*[EW]\b/gi,
      // Real-time presence: "I'm at the mall", "just got to Central Park"
      /\bi(?:'m|\s+am)\s+(?:at|inside)\s+(?:the\s+)?([A-Za-z][a-zA-Z\s]{2,30})\b/gi,
      /\b(?:just\s+(?:got|arrived|got\s+to)|heading\s+to)\s+(?:the\s+)?([A-Z][a-zA-Z\s]{2,25})\b/gi,
      /\b(?:meet\s+me\s+(?:at|in|by)|i'll\s+be\s+at)\s+(?:the\s+)?([A-Z][a-zA-Z\s]{2,30})\b/gi,
    ],
    severity: 'high',
    description: 'Location information',
  },

  // ── Contact information ───────────────────────────────────────────────────
  {
    type: 'contact',
    regex: [
      // Phone numbers (US format): "123-456-7890", "(123) 456-7890", "123.456.7890"
      /\b(?:\(\d{3}\)|\d{3})[-.]\d{3}[-.]\d{4}\b|\b\d{3}\s\d{3}\s\d{4}\b/g,
      // Spaced-out digits: "1 2 3 4 5 6 7 8 9 0" — only with phone context words to reduce FP
      /\b(?:my\s+(?:number|phone|cell|mobile)\s+is\s+)?\d(?:\s+\d){9}\b/gi,
      // Phone numbers (international): "+1 234 567 8900"
      /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
      // Email addresses
      /[\w.\-]+@[\w.\-]+\.\w{2,}/gi,
      // Context-required @handle: "my snap is @xxx", "add me @xxx"
      /\b(?:my\s+(?:snap(?:chat)?|ig|insta(?:gram)?|tiktok|twitter|discord|telegram|kik|handle|tag|username)\s+is|add\s+me|follow\s+me\s+at|reach\s+me\s+at|find\s+me\s+at|dm\s+me\s+at)\s+@?[\w.]{2,30}\b/gi,
      // "my snapchat is xxx" / "my discord is xxx" — without @
      /\b(?:my\s+(?:snap(?:chat)?|ig|insta(?:gram)?|tiktok|twitter|discord|telegram|kik)\s+(?:is|=|:))\s*[\w.]{2,30}\b/gi,
      // Discord tag with context: "my discord is username#1234"
      /\b(?:my\s+discord(?:\s+tag)?\s+(?:is|=|:))\s*[\w]{2,32}#\d{4}\b/gi,
      // Contact info references: "my phone is", "text me at", "call me at"
      /\b(?:my\s+(?:phone|number|cell|mobile)|text\s+me\s+at|call\s+me(?:\s+at)?|reach\s+me\s+at)\s*(?:is\s+|:?\s*)?[\d\s()\-+.]{7,}/gi,
      // Context-gated bare 10-digit: phone context word before bare number
      /\b(?:my\s+(?:number|phone|cell)|call\s+me|text\s+me)\s*[:=]?\s*\d{10}\b/gi,
      // Parent/family contact: "my mom's number is", "dad's email is"
      /\b(?:my\s+(?:mom(?:'s)?|dad(?:'s)?|parent(?:'s)?|guardian(?:'s)?)\s+(?:number|phone|email|cell)\s+is)\s+[\w\s@.+\-()]{5,}/gi,
    ],
    severity: 'high',
    description: 'Contact information',
  },

  // ── Daily routine / vulnerability indicators ──────────────────────────────
  {
    type: 'routine',
    regex: [
      // "home alone until 6pm" / "home by myself" / "parents aren't home"
      /\b(?:home\s+alone|by\s+myself\s+(?:at\s+home|until|till)|no\s+one\s+(?:is\s+)?home|parents?\s+(?:aren'?t|not)\s+home|left\s+alone\s+at\s+home)\b/gi,
      // Daily schedule: "I get home at 3", "I get out of school at 2:30"
      /\b(?:i\s+get\s+home\s+at|i\s+get\s+out\s+(?:of\s+school\s+)?at|i\s+walk\s+home\s+at|i\s+leave\s+school\s+at)\s+\d/gi,
      // "I walk alone to school" / "I walk home alone"
      /\bi\s+walk\s+(?:alone\s+(?:to\s+school|home)|(?:to\s+school|home)\s+alone)\b/gi,
      // "I take the bus at 7am"
      /\b(?:i\s+(?:take|catch|ride)\s+the\s+bus\s+at)\s+\d/gi,
      // "no one home until [time]"
      /\b(?:no\s+one\s+(?:is\s+)?home|home\s+alone)\s+until\s+\d/gi,
      // "I'll be alone at" / "I'll be home alone"
      /\bi(?:'ll|\s+will)\s+be\s+(?:home\s+)?alone\b/gi,
    ],
    severity: 'high',
    description: 'Daily routine or vulnerability indicator',
  },

  // ── Physical address ──────────────────────────────────────────────────────
  {
    type: 'address',
    regex: [
      // Full address: "123 Main St, Springfield, IL"
      /\d+\s+[\w\s]+(?:st|ave|avenue|street|road|rd|blvd|boulevard|lane|ln|drive|dr)[\w\s,]*[A-Z]{2}\s*\d{5}/gi,
      // ZIP codes: require context word — bare 5-digit numbers have too many false positives
      /\b(?:zip(?:\s+code)?|postal\s+code)\s*[:=]?\s*\d{5}(-\d{4})?\b/gi,
      /\b[A-Z]{2}\s+\d{5}\b/g,
      // Apartment numbers: "Apt 5", "Unit 12"
      /\b(apt|apartment|unit|suite|ste)\s+\d+[a-z]?\b/gi,
    ],
    severity: 'high',
    description: 'Home address',
  },

  // ── School / team name ────────────────────────────────────────────────────
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
    description: 'School or team name',
  },

  // ── Financial account numbers ─────────────────────────────────────────────
  {
    type: 'financial',
    regex: [
      // SSN with dashes (XXX-XX-XXXX) — requires dashes to avoid FP on bare numbers
      /\b(?!000|666|9\d{2})\d{3}-\d{2}-\d{4}\b/g,
      // SSN with explicit context clue
      /\b(?:ssn|social\s+security(?:\s+(?:number|#|no\.?))?)\s*[:=]?\s*(?!000|666|9\d{2})\d{3}[-\s]\d{2}[-\s]\d{4}\b/gi,
      // Visa: 4xxx-xxxx-xxxx-xxxx
      /\b4\d{3}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Mastercard: 5[1-5]xx or 2[2-7]xx
      /\b(?:5[1-5]\d{2}|2(?:2[2-9]\d|[3-6]\d{2}|7[01]\d|720))[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Amex: 3[47]xx xxxxxx xxxxx
      /\b3[47]\d{2}[-\s]\d{6}[-\s]\d{5}\b/g,
      // Discover: 6011 or 65xx
      /\b6(?:011|5\d{2})[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Generic 16-digit card with separators (requires dashes/spaces to avoid FP)
      /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
      // Credit card with explicit context clue
      /\b(?:card\s+(?:number|#|no\.?)|credit\s+card|debit\s+card|cc\s*#?)\s*[:=]?\s*\d{13,19}\b/gi,
    ],
    severity: 'high',
    description: 'Financial account number',
  },

  // ── Government identity documents ─────────────────────────────────────────
  {
    type: 'identity',
    regex: [
      // US passport — requires context clue
      /\b(?:passport(?:\s+(?:number|#|no\.?))?)\s*[:=]?\s*[A-Z]\d{8}\b/gi,
      // Driver's license — requires context clue
      /\b(?:driver'?s?\s+license(?:\s+(?:number|#|no\.?))?|dl\s*#?)\s*[:=]?\s*[A-Z0-9]{5,15}\b/gi,
      // License plate — requires explicit context (removed bare plate pattern to reduce FP)
      /\b(?:(?:my\s+)?(?:license\s+plate|plate\s+(?:number|#|no\.?)|car\s+plate)\s*[:=]?\s*)[A-Z0-9]{2,8}\b/gi,
    ],
    severity: 'high',
    description: 'Government ID or license plate',
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
    // name and routine are especially dangerous for kids — bump their weight
    const typeBonus = (pii.type === 'name' || pii.type === 'routine') ? 10 : 0;
    score += severityMultiplier + typeBonus;
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

  // High-risk combinations (any two of these pairs together = elevated risk)
  const dangerousCombos = [
    // Original combos
    ['birthdate', 'location'],
    ['birthdate', 'school'],
    ['contact', 'location'],
    ['contact', 'school'],
    ['address', 'birthdate'],
    ['financial', 'birthdate'],
    ['financial', 'address'],
    ['identity', 'birthdate'],
    ['identity', 'location'],
    // New combos involving name, routine
    ['name', 'location'],
    ['name', 'contact'],
    ['name', 'school'],
    ['name', 'birthdate'],
    ['routine', 'contact'],
    ['routine', 'location'],
    ['routine', 'name'],
    ['identity', 'contact'],
    ['identity', 'address'],
    ['birthdate', 'contact'],
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
