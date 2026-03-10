import type { PIICategory, PIIDetection } from "./types"

interface PatternRule {
  category: PIICategory
  patterns: RegExp[]
  confidence: number
}

const PII_RULES: PatternRule[] = [
  {
    category: "email",
    patterns: [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g],
    confidence: 0.95,
  },
  {
    category: "phone",
    patterns: [
      // US format: (123) 456-7890, 123-456-7890, 123.456.7890
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      // International: +66 812345678, +1 234 567 8901
      /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
      // Plain long digit sequences (8+ digits likely a phone)
      /\b\d{8,15}\b/g,
    ],
    confidence: 0.9,
  },
  {
    category: "address",
    patterns: [
      // Street addresses: 123 Main Street, 456 Oak Ave
      /\d{1,5}\s+[\w\s]{1,30}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|place|pl|circle|cir|highway|hwy)\b/gi,
      // ZIP/postal codes
      /\b\d{5}(?:-\d{4})?\b/g,
      // Apartment/unit references
      /\b(?:apt|apartment|suite|unit|#)\s*\d+\w?\b/gi,
      // "my address is..." or "I live at..."
      /\b(?:my\s+address\s+is|i\s+live\s+at|i\s+live\s+on|i\s+live\s+in|my\s+house\s+is)\s+(.{5,60})/gi,
    ],
    confidence: 0.85,
  },
  {
    category: "full_name",
    patterns: [
      // "my name is X", "I'm X", "I am X", "call me X"
      /\b(?:my\s+(?:full\s+)?name\s+is|i'?\s*a?m|call\s+me|they\s+call\s+me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      // "my name is X" with lowercase (kids don't always capitalize)
      /\bmy\s+(?:full\s+)?name\s+is\s+(\w+(?:\s+\w+)+)/gi,
      // "i'm john smith" lowercase
      /\bi'?m\s+([a-z]+\s+[a-z]+)\b/gi,
    ],
    confidence: 0.7,
  },
  {
    category: "school",
    patterns: [
      // "I go to X school", "I attend X"
      /\b(?:i\s+(?:go\s+to|attend|study\s+at|am\s+at|am\s+from))\s+([\w\s]+(?:school|academy|college|university|high|middle|elementary|prep|institute))\b/gi,
      // "my school is X"
      /\bmy\s+school\s+(?:is|name\s+is)\s+([\w\s]+)/gi,
      // Just mentioning school names with common suffixes
      /\b[\w\s]{2,25}(?:elementary|middle|high)\s+school\b/gi,
      /\b[\w\s]{2,25}(?:academy|preparatory|prep school)\b/gi,
    ],
    confidence: 0.8,
  },
  {
    category: "age_dob",
    patterns: [
      // "I'm 12", "I am 14 years old", "im 13 yo"
      /\bi'?\s*a?m\s+(\d{1,2})\s*(?:years?\s*old|yo|y\/o|yrs?)?\b/gi,
      // "my age is 12", "age: 13"
      /\b(?:my\s+)?age\s*(?:is|:)\s*(\d{1,2})\b/gi,
      // "my birthday is..."
      /\bmy\s+(?:birthday|bday|birth\s*date|dob)\s+(?:is\s+)?([\w\s,/.-]+)/gi,
      // "born on/in..."
      /\bborn\s+(?:on|in)\s+([\w\s,/.-]+)/gi,
      // Date patterns: MM/DD/YYYY, DD-MM-YYYY
      /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,
      // "turned 13", "turning 14"
      /\b(?:turned|turning|just\s+turned)\s+(\d{1,2})\b/gi,
    ],
    confidence: 0.85,
  },
  {
    category: "location",
    patterns: [
      // "I'm at/in/near/from X"
      /\bi'?\s*a?m\s+(?:at|in|near|from|located\s+in)\s+([\w\s,]+)/gi,
      // "my location/address is X"
      /\bmy\s+(?:location|city|town|area|neighborhood)\s+is\s+([\w\s,]+)/gi,
      // "I live in/at/on/near X"
      /\b(?:i\s+)?live\s+(?:at|in|on|near)\s+([\w\s,]+)/gi,
      // GPS coordinates
      /-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}/g,
      // "come to X", "meet me at X"
      /\b(?:come\s+to|meet\s+(?:me\s+)?at|pick\s+me\s+up\s+at)\s+([\w\s,]+)/gi,
    ],
    confidence: 0.7,
  },
]

export function detectPII(text: string): PIIDetection[] {
  const detections: PIIDetection[] = []

  for (const rule of PII_RULES) {
    for (const pattern of rule.patterns) {
      const regex = new RegExp(pattern.source, pattern.flags)
      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        detections.push({
          category: rule.category,
          match: match[0],
          confidence: rule.confidence,
          position: {
            start: match.index,
            end: match.index + match[0].length,
          },
        })
      }
    }
  }

  return deduplicateDetections(detections)
}

function deduplicateDetections(detections: PIIDetection[]): PIIDetection[] {
  const sorted = [...detections].sort(
    (a, b) => b.confidence - a.confidence
  )
  const result: PIIDetection[] = []

  for (const detection of sorted) {
    const overlaps = result.some(
      (existing) =>
        detection.position.start < existing.position.end &&
        detection.position.end > existing.position.start &&
        detection.category === existing.category
    )
    if (!overlaps) {
      result.push(detection)
    }
  }

  return result
}
