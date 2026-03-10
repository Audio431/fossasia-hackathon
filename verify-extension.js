/**
 * Run this in the Chrome DevTools Console on any webpage to verify
 * the Privacy Shadow extension is working
 */

console.log('=== Privacy Shadow Extension Verification ===');

// 1. Check if content script loaded
console.log('\n1. Checking content script status...');
console.log('Window location:', window.location.href);

// 2. Test PII detection directly
console.log('\n2. Testing PII detection patterns...');

const testCases = [
    { text: 'My birthday is 05/12/2012', expected: 'birthdate' },
    { text: 'I am 13 years old', expected: 'birthdate' },
    { text: 'Call me at 123-456-7890', expected: 'contact' },
    { text: 'Email me at test@example.com', expected: 'contact' },
    { text: 'I live in Springfield, IL', expected: 'location' },
    { text: 'My school is Springfield High', expected: 'school' },
];

// Test detection patterns
const patterns = {
    birthdate: /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/gi,
    age: /\b\d{1,2}\s+(years?\s+old|yo)\b/gi,
    phone: /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    email: /[\w\.-]+@[\w\.-]+\.\w{2,}/gi,
    location: /\bin\s+[A-Z][a-z]+,\s*[A-Z]{2}\b/gi,
};

console.log('\nTest Results:');
testCases.forEach(({ text, expected }) => {
    let detected = false;

    if (expected === 'birthdate') {
        detected = patterns.birthdate.test(text) || patterns.age.test(text);
    } else if (expected === 'contact') {
        detected = patterns.phone.test(text) || patterns.email.test(text);
    } else if (expected === 'location') {
        detected = patterns.location.test(text);
    }

    console.log(`  ${detected ? '✅' : '❌'} "${text}" -> ${expected}`);
});

// 3. Check if we can communicate with background script
console.log('\n3. Testing extension communication...');
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('   ✅ Chrome extension API available');

    chrome.runtime.sendMessage(
        { type: 'DETECT_PII', text: 'My birthday is 05/12/2012' },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error('   ❌ Extension error:', chrome.runtime.lastError.message);
            } else {
                console.log('   ✅ Extension response:', response);

                if (response && response.detected && response.detected.length > 0) {
                    console.log('   ✅ PII Detection working!');
                    response.detected.forEach(pii => {
                        console.log(`      - Detected: ${pii.description} (${pii.type})`);
                    });
                } else {
                    console.log('   ⚠️  No PII detected (should have detected birthdate)');
                }

                if (response && response.risk) {
                    console.log('   Risk Score:', response.risk.score);
                    console.log('   Risk Level:', response.risk.level);
                }
            }
        }
    );
} else {
    console.log('   ❌ Chrome extension API not available');
    console.log('   This is expected on regular web pages without the extension loaded');
}

// 4. Check for content script indicators
console.log('\n4. Checking for content script indicators...');
const hasPrivacyShadow = document.querySelector('[data-privacy-shadow]') ||
                          window.hasOwnProperty('privacyShadowLoaded');
console.log(`   ${hasPrivacyShadow ? '✅' : '⚠️'} Privacy Shadow markers ${hasPrivacyShadow ? 'found' : 'not found'}`);

// 5. List all forms on the page
console.log('\n5. Form monitoring check...');
const forms = document.querySelectorAll('form');
console.log(`   Found ${forms.length} form(s) on this page`);
forms.forEach((form, index) => {
    console.log(`   Form ${index + 1}:`, form.id || form.className || 'unnamed');
    console.log(`      - Action: ${form.action || 'none'}`);
    console.log(`      - Method: ${form.method}`);
    const inputs = form.querySelectorAll('input, textarea');
    console.log(`      - Inputs: ${inputs.length}`);
});

// 6. List input fields that might contain PII
console.log('\n6. Input field analysis...');
const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
console.log(`   Found ${allInputs.length} text input(s)`);
allInputs.forEach((input, index) => {
    const placeholder = input.placeholder || 'no placeholder';
    const name = input.name || input.id || 'unnamed';
    console.log(`   Input ${index + 1}: "${name}" - placeholder: "${placeholder}"`);
});

// 7. Check for Instagram-specific elements
if (window.location.hostname.includes('instagram.com')) {
    console.log('\n7. Instagram-specific checks...');
    const commentBoxes = document.querySelectorAll('textarea[placeholder*="comment" i], textarea[placeholder*="Comment" i]');
    console.log(`   Comment boxes: ${commentBoxes.length}`);

    const messageBoxes = document.querySelectorAll('textarea[placeholder*="message" i], div[role="textbox"]');
    console.log(`   Message boxes: ${messageBoxes.length}`);

    const bioElements = document.querySelectorAll('header section ul li span');
    console.log(`   Bio elements: ${bioElements.length}`);
}

console.log('\n=== Verification Complete ===');
console.log('\nNext steps:');
console.log('1. If extension API is not available, install/enable the extension');
console.log('2. Try typing in a form field with PII (e.g., "05/12/2012")');
console.log('3. Check the extension popup for alerts');
console.log('4. Check Chrome DevTools Console for "Privacy Shadow" logs');
