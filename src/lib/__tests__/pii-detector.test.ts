import { detectPII } from "../pii-detector"
import { calculateHarmScore } from "../harm-scorer"

// Helper to get detected categories from text
function categories(text: string): string[] {
  return [...new Set(detectPII(text).map((d) => d.category))].sort()
}

function score(text: string) {
  const detections = detectPII(text)
  return detections.length > 0 ? calculateHarmScore(detections) : null
}

// ============================================================
// EMAIL
// ============================================================
describe("email detection", () => {
  test("standard email", () => {
    expect(categories("my email is test@gmail.com")).toContain("email")
  })

  test("email with dots and plus", () => {
    expect(categories("reach me at first.last+tag@company.co.uk")).toContain("email")
  })

  test("email in sentence", () => {
    expect(categories("you can contact me at hello@example.org anytime")).toContain("email")
  })

  test("no false positive on @mention", () => {
    expect(categories("follow me @johndoe on instagram")).not.toContain("email")
  })
})

// ============================================================
// PHONE
// ============================================================
describe("phone detection", () => {
  test("US format with dashes", () => {
    expect(categories("call me 123-456-7890")).toContain("phone")
  })

  test("US format with parens", () => {
    expect(categories("my number is (123) 456-7890")).toContain("phone")
  })

  test("international format +66", () => {
    expect(categories("text me +66 812345678")).toContain("phone")
  })

  test("plain 10 digits", () => {
    expect(categories("0812345678")).toContain("phone")
  })

  test("plain 8 digits", () => {
    expect(categories("my number 12345678")).toContain("phone")
  })

  test("no false positive on short numbers", () => {
    expect(categories("i have 123 apples")).not.toContain("phone")
  })
})

// ============================================================
// ADDRESS
// ============================================================
describe("address detection", () => {
  test("street address", () => {
    expect(categories("i live at 123 main street")).toContain("address")
  })

  test("avenue address", () => {
    expect(categories("456 oak avenue is my home")).toContain("address")
  })

  test("road address", () => {
    expect(categories("my house is on 789 elm road")).toContain("address")
  })

  test("ZIP code", () => {
    expect(categories("my zip is 90210")).toContain("address")
  })

  test("ZIP+4 code", () => {
    expect(categories("postal code 90210-1234")).toContain("address")
  })

  test("apartment reference", () => {
    expect(categories("apt 4B in that building")).toContain("address")
  })

  test("i live at narrative", () => {
    expect(categories("i live at the corner of 5th and broadway")).toContain("address")
  })

  test("no false positive on casual text", () => {
    expect(categories("i love pizza")).not.toContain("address")
  })
})

// ============================================================
// FULL NAME
// ============================================================
describe("full_name detection", () => {
  test("my name is first last", () => {
    expect(categories("my name is john smith")).toContain("full_name")
  })

  test("my full name is", () => {
    expect(categories("my full name is sarah jane connor")).toContain("full_name")
  })

  test("call me first last", () => {
    expect(categories("call me John Doe")).toContain("full_name")
  })

  test("no false positive on im going", () => {
    expect(categories("im going to the store")).not.toContain("full_name")
  })

  test("no false positive on im happy", () => {
    expect(categories("im really happy today")).not.toContain("full_name")
  })

  test("no false positive on i'm at", () => {
    expect(categories("i'm at the mall")).not.toContain("full_name")
  })
})

// ============================================================
// SCHOOL
// ============================================================
describe("school detection", () => {
  test("i go to X school", () => {
    expect(categories("i go to lincoln high school")).toContain("school")
  })

  test("i attend X", () => {
    expect(categories("i attend riverside middle school")).toContain("school")
  })

  test("my school is X", () => {
    expect(categories("my school is westfield academy")).toContain("school")
  })

  test("elementary school mention", () => {
    expect(categories("sunrise elementary school is nearby")).toContain("school")
  })

  test("no false positive on generic school talk", () => {
    expect(categories("school is boring today")).not.toContain("school")
  })
})

// ============================================================
// AGE / DOB
// ============================================================
describe("age_dob detection", () => {
  test("im 13 years old", () => {
    expect(categories("im 13 years old")).toContain("age_dob")
  })

  test("i'm 12", () => {
    expect(categories("i'm 12")).toContain("age_dob")
  })

  test("i am 14 yo", () => {
    expect(categories("i am 14 yo")).toContain("age_dob")
  })

  test("my age is 11", () => {
    expect(categories("my age is 11")).toContain("age_dob")
  })

  test("age: 15", () => {
    expect(categories("age: 15")).toContain("age_dob")
  })

  test("my birthday is march 5", () => {
    expect(categories("my birthday is march 5")).toContain("age_dob")
  })

  test("born on 01/15/2010", () => {
    expect(categories("born on 01/15/2010")).toContain("age_dob")
  })

  test("date format MM/DD/YYYY", () => {
    expect(categories("my dob is 03/25/2011")).toContain("age_dob")
  })

  test("turned 13", () => {
    expect(categories("i just turned 13")).toContain("age_dob")
  })

  test("turning 14", () => {
    expect(categories("turning 14 next week")).toContain("age_dob")
  })
})

// ============================================================
// LOCATION
// ============================================================
describe("location detection", () => {
  test("i'm from bangkok", () => {
    expect(categories("i'm from bangkok")).toContain("location")
  })

  test("i'm in new york", () => {
    expect(categories("i'm in new york")).toContain("location")
  })

  test("i live in chicago", () => {
    expect(categories("i live in chicago")).toContain("location")
  })

  test("my city is london", () => {
    expect(categories("my city is london")).toContain("location")
  })

  test("GPS coordinates", () => {
    expect(categories("13.7563, 100.5018")).toContain("location")
  })

  test("meet me at the park", () => {
    expect(categories("meet me at the park")).toContain("location")
  })

  test("no false positive on random text", () => {
    expect(categories("the weather is nice")).not.toContain("location")
  })
})

// ============================================================
// NARRATIVE COMBINATIONS (the main bug fix)
// ============================================================
describe("narrative combinations - multiple PII in one message", () => {
  test("name + age in one sentence", () => {
    const text = "my name is john smith and im 13 years old"
    const cats = categories(text)
    expect(cats).toContain("full_name")
    expect(cats).toContain("age_dob")
    expect(cats.length).toBeGreaterThanOrEqual(2)
  })

  test("name + address in one sentence", () => {
    const text = "my name is john smith and i live at 123 main street"
    const cats = categories(text)
    expect(cats).toContain("full_name")
    expect(cats).toContain("address")
  })

  test("name + age + address", () => {
    const text = "my name is john smith and i live at 123 main street and im 13 years old"
    const cats = categories(text)
    expect(cats).toContain("full_name")
    expect(cats).toContain("address")
    expect(cats).toContain("age_dob")
    expect(cats.length).toBeGreaterThanOrEqual(3)
  })

  test("name + email + phone", () => {
    const text = "my name is sarah jones, email sarah@test.com, phone 0891234567"
    const cats = categories(text)
    expect(cats).toContain("full_name")
    expect(cats).toContain("email")
    expect(cats).toContain("phone")
  })

  test("name + school + location", () => {
    const text = "my name is alex lee and i go to lincoln high school and i'm from bangkok"
    const cats = categories(text)
    expect(cats).toContain("full_name")
    expect(cats).toContain("school")
    expect(cats).toContain("location")
  })

  test("all PII types together", () => {
    const text = "my name is john smith, im 13, i live at 123 main street, my email is john@test.com, call me 0891234567, i go to lincoln high school, i'm from bangkok"
    const cats = categories(text)
    expect(cats).toContain("full_name")
    expect(cats).toContain("age_dob")
    expect(cats).toContain("address")
    expect(cats).toContain("email")
    expect(cats).toContain("phone")
    expect(cats).toContain("school")
    expect(cats).toContain("location")
  })
})

// ============================================================
// HARM SCORE with combinations
// ============================================================
describe("harm score escalation with combinations", () => {
  test("single category = low/medium risk", () => {
    const s = score("my name is john smith")
    expect(s).not.toBeNull()
    expect(s!.total).toBeLessThan(45)
    expect(["low", "medium"]).toContain(s!.level)
  })

  test("two categories = higher risk than single", () => {
    const single = score("my name is john smith")
    const double = score("my name is john smith and im 13 years old")
    expect(double).not.toBeNull()
    expect(single).not.toBeNull()
    expect(double!.total).toBeGreaterThan(single!.total)
  })

  test("three categories = high risk", () => {
    const s = score("my name is john smith and i live at 123 main street and im 13 years old")
    expect(s).not.toBeNull()
    expect(s!.total).toBeGreaterThanOrEqual(45)
    expect(["high", "critical"]).toContain(s!.level)
  })

  test("many categories = critical risk", () => {
    const s = score("my name is john smith, im 13, i live at 123 main street, email john@test.com, call 0891234567")
    expect(s).not.toBeNull()
    expect(s!.total).toBeGreaterThanOrEqual(70)
    expect(s!.level).toBe("critical")
  })

  test("combination bonus increases score", () => {
    const s = score("my name is john smith and im 13 years old")
    expect(s).not.toBeNull()
    // 2 categories detected = +10 combination bonus
    // full_name(20*0.7=14) + age_dob(20*0.85=17) + bonus(10) = 41
    expect(s!.total).toBeGreaterThanOrEqual(30)
  })

  test("no detections = no score", () => {
    const s = score("hello how are you doing today")
    expect(s).toBeNull()
  })

  test("safe message returns null", () => {
    expect(score("the weather is beautiful today")).toBeNull()
    expect(score("i love playing games")).toBeNull()
    expect(score("what homework do we have")).toBeNull()
  })
})

// ============================================================
// EDGE CASES
// ============================================================
describe("edge cases", () => {
  test("empty string", () => {
    expect(detectPII("")).toHaveLength(0)
  })

  test("very short text", () => {
    expect(detectPII("hi")).toHaveLength(0)
  })

  test("only spaces", () => {
    expect(detectPII("   ")).toHaveLength(0)
  })

  test("special characters only", () => {
    expect(detectPII("!@#$%^&*()")).toHaveLength(0)
  })

  test("name with period at end", () => {
    const cats = categories("my name is john smith.")
    expect(cats).toContain("full_name")
  })

  test("name with comma separation", () => {
    const cats = categories("my name is john smith, nice to meet you")
    expect(cats).toContain("full_name")
  })

  test("mixed case typing", () => {
    expect(categories("MY NAME IS JOHN SMITH")).toContain("full_name")
  })

  test("age without years old suffix", () => {
    expect(categories("im 13")).toContain("age_dob")
  })

  test("phone with dots", () => {
    expect(categories("123.456.7890")).toContain("phone")
  })

  test("multiple emails in one message", () => {
    const d = detectPII("email me at a@b.com or c@d.com")
    const emails = d.filter((x) => x.category === "email")
    expect(emails.length).toBeGreaterThanOrEqual(2)
  })

  test("does not flag normal conversation", () => {
    const safe = [
      "hey whats up",
      "wanna play fortnite later",
      "lol that was so funny",
      "did you see the new movie",
      "i have a test tomorrow",
      "brb getting food",
    ]
    for (const msg of safe) {
      expect(detectPII(msg)).toHaveLength(0)
    }
  })

  test("narrative does not leak across sentences", () => {
    // "my name is X" should NOT eat "and im 13" as part of the name
    const text = "my name is john smith and im 13 years old"
    const nameDetections = detectPII(text).filter((d) => d.category === "full_name")
    for (const d of nameDetections) {
      expect(d.match).not.toContain("13")
      expect(d.match).not.toContain("years old")
    }
  })

  test("address does not eat age", () => {
    const text = "i live at 123 main street and im 13 years old"
    const addrDetections = detectPII(text).filter((d) => d.category === "address")
    for (const d of addrDetections) {
      expect(d.match).not.toContain("13 years old")
    }
  })

  test("location does not eat other PII", () => {
    const text = "i'm from bangkok and my name is john smith"
    const locDetections = detectPII(text).filter((d) => d.category === "location")
    for (const d of locDetections) {
      expect(d.match).not.toContain("john smith")
    }
  })
})
