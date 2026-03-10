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
      // "my address is..." or "I live at..." - limit capture length
      /\b(?:my\s+address\s+is|i\s+live\s+at|i\s+live\s+on|i\s+live\s+in|my\s+house\s+is)\s+([\w]+(?:\s+[\w]+){1,6})(?=\s+and\b|\s+i\b|\s*[.,!?]|\s*$)/gi,
    ],
    confidence: 0.85,
  },
  {
    category: "full_name",
    patterns: [
      // "my name is X Y" - limit to 2-4 words to avoid eating the rest of the sentence
      /\bmy\s+(?:full\s+)?name\s+is\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){1,3})(?=\s+and\b|\s+i\b|\s*[.,!?]|\s*$)/gi,
      // Fallback: "my name is X Y" without lookahead but capped at 2-3 words
      /\bmy\s+(?:full\s+)?name\s+is\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,}){1,2})\b/gi,
      // "call me X Y"
      /\b(?:call\s+me|they\s+call\s+me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/gi,
      // "i'm X Y" but NOT followed by prepositions/common words
      /\bi'?m\s+(?!at\b|in\b|on\b|from\b|near\b|here\b|there\b|the\b|a\b|not\b|so\b|very\b|just\b|going\b|doing\b|looking\b|trying\b|coming\b|getting\b|feeling\b|really\b|also\b|ok\b|okay\b|good\b|fine\b|bad\b|happy\b|sad\b|sure\b|like\b|about\b)([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,}){1,2})\b/gi,
    ],
    confidence: 0.7,
  },
  {
    category: "school",
    patterns: [
      // "I go to X school", "I attend X"
      /\b(?:i\s+(?:go\s+to|attend|study\s+at|am\s+at|am\s+from))\s+([\w\s]+(?:school|academy|college|university|high|middle|elementary|prep|institute))\b/gi,
      // "my school is X"
      /\bmy\s+school\s+(?:is|name\s+is)\s+([\w]+(?:\s+[\w]+){0,4})\b/gi,
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
      // "I'm at/in/near/from X" - limit capture to avoid eating rest of sentence
      /\bi'?\s*a?m\s+(?:at|in|near|from|located\s+in)\s+([\w]+(?:\s+[\w]+){0,4})(?=\s+and\b|\s+i\b|\s*[.,!?]|\s*$)/gi,
      /\bi'?\s*a?m\s+(?:at|in|near|from|located\s+in)\s+([\w]+(?:\s+[\w]+){0,3})\b/gi,
      // "my location/address is X"
      /\bmy\s+(?:location|city|town|area|neighborhood)\s+is\s+([\w]+(?:\s+[\w]+){0,3})\b/gi,
      // "I live in/at/on/near X"
      /\b(?:i\s+)?live\s+(?:at|in|on|near)\s+([\w]+(?:\s+[\w]+){0,4})(?=\s+and\b|\s+i\b|\s*[.,!?]|\s*$)/gi,
      // GPS coordinates
      /-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}/g,
      // "come to X", "meet me at X"
      /\b(?:come\s+to|meet\s+(?:me\s+)?at|pick\s+me\s+up\s+at)\s+([\w]+(?:\s+[\w]+){0,4})\b/gi,
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
