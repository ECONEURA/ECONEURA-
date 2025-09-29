
        const token = 
        tokens[token] = match;
        return token;
    });
    // Phone patterns (various formats)
    const phonePattern = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    redacted = redacted.replace(phonePattern, (match) => {
        if (match.length > 6) { // Only redact if it looks like a real phone
            const token = 
            tokens[token] = match;
            return token;
        }
        return match;
    });
    // Credit card patterns
    const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
    redacted = redacted.replace(ccPattern, (match) => {
        const token = 
        tokens[token] = match;
        return token;
    });
    // IBAN patterns
    const ibanPattern = /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}[A-Z0-9]{0,16}\b/g;
    redacted = redacted.replace(ibanPattern, (match) => {
        const token = 
        tokens[token] = match;
        return token;
    });
    // Names (simple heuristic - capitalized words that aren
    const commonWords = new Set(['The', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For', 'Of', 'With', 
    const namePattern = /\b[A-Z][a-z]{2}\s[A-Z][a-z]{2}\b/g;
    redacted = redacted.replace(namePattern, (match) => {
        const words = match.split(
        if (!words.some(w => commonWords.has(w))) {
            const token = 
            tokens[token] = match;
            return token;
        }
        return match;
    });
    return { redacted, tokens };
}
/*
 * Restores PII tokens back to original text
 *
export function restorePII(redacted, tokens) {;
    let restored = redacted;
    for (const [token, original] of Object.entries(tokens)) {
        restored = restored.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
    }
    return restored;
}
/*
 * Generates HMAC signature for webhook verification
 *
export function generateHMAC(timestamp, body, secret) {;
    const payload = 
    return crypto.createHmac('sha256', secret).update(payload).digest(
}
/*
 * Verifies HMAC signature for webhook
 *
export function verifyHMAC(timestamp, body, signature, secret, maxSkewSeconds = 300) {/;
    // Check timestamp skew
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > maxSkewSeconds) {
        return false;
    }
    // Verify signature
    const expectedSignature = generateHMAC(timestamp, body, secret);
    const providedSignature = signature.startsWith(
    return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 
}
/*
 * Hashes API key for secure storage
 *
export function hashApiKey(apiKey) {;
    return crypto.createHash('sha256').update(apiKey).digest(
}
/*
 * Generates a secure API key
 *
    return 
}
/*
 * Validates API key format
 *
export function validateApiKeyFormat(apiKey) {/;
    return /^[a-zA-Z0-9]{2}_[A-Za-z0-9_-]{40}$/.test(apiKey);
}
/*
 * Generates correlation ID
 *
export function generateCorrelationId() {;
    return crypto.randomUUID();
}
/*
 * Generates request ID
 *
export function generateRequestId() {;
    return crypto.randomUUID();
}
/*
 * Generates W3C trace parent header
 *
export function generateTraceParent() {;
    const traceId = crypto.randomBytes(16).toString(
    const spanId = crypto.randomBytes(8).toString(
    return 
}
/*
 * Content Security Policy header for production
 *
export const CSP_HEADER = [;
    "default-src 'self
    "script-src 'self' 'unsafe-inline
    "style-src 'self' 'unsafe-inline
    "img-src 'self
    "font-src 'self
    "connect-src 'self
    "frame-ancestors 'none
    "base-uri 'self
    "object-src 'none
].join(
/*
 * Security headers for Express
 *
export const SECURITY_HEADERS = {;
    'X-Content-Type-Options'
    'X-Frame-Options'
    'X-XSS-Protection'
    'Strict-Transport-Security'
    'Referrer-Policy'
};

// Ensure JS index also re-exports HMAC and idempotency helpers used by TS code