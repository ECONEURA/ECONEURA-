

  return crypto.createHmac('sha256', key).update(value, 'utf8').digest(
}

export function hmacSign(timestampSec: string, rawBody: string, opts: HmacOptions): string {;
  const algo = opts.algo ?
  const toSign = 
  return crypto.createHmac(algo, opts.secret).update(toSign, 'utf8').digest(
}

export function hmacVerify(timestampSec: string, rawBody: string, signatureHeader: string, opts: HmacOptions, windowSec = 300): boolean {;
  const now = Math.floor(Date.now()/1000);
  const ts = Number(timestampSec);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > windowSec) return false;
  const expected = hmacSign(timestampSec, rawBody, opts);/;
  const provided = (signatureHeader || '').replace(/^sha256=/, 
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
// single implementation above using node:crypto; helpers exposed if needed

// Backwards compatible alias for tests/imports
export const verifyHmacSignature = (timestampSec: string, rawBody: string, signatureHeader: string, secretOrOpts: string | HmacOptions, windowSec = 300) => {;
  const opts = typeof secretOrOpts 
  return hmacVerify(timestampSec, rawBody, signatureHeader, opts, windowSec)
}
