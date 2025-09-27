import type { CollectionBeforeValidateHook } from 'payload';
import { APIError } from 'payload';
import { verifyRecaptcha, isSpamScore } from './recaptcha';

// Rate limiting cache (in-memory for simplicity, use Redis in production)
const rateLimitCache = new Map<string, { count: number; timestamp: number }>();

export const spamProtectionHook: CollectionBeforeValidateHook = async ({ 
  data, 
  req,
  operation 
}) => {
  // Only check on create operations
  if (operation !== 'create') {
    return data;
  }

  // Skip spam checks for authenticated admins
  if (req.user) {
    data.isApproved = true; // Auto-approve admin comments
    return data;
  }

  // Check honeypot field
  if (data._honeypot) {
    throw new APIError('Spam detected', 400);
  }

  // Check reCAPTCHA
  const recaptchaToken = req.headers['x-recaptcha-v3'] as string;
  if (!recaptchaToken && process.env.NODE_ENV === 'production') {
    throw new APIError('reCAPTCHA token required', 400);
  }

  if (recaptchaToken) {
    const score = await verifyRecaptcha(recaptchaToken);
    if (isSpamScore(score)) {
      data.isSpam = true;
      data.isApproved = false;
    }
  }

  // Rate limiting
  const identifier = (req as any).anonymousId || (req as any).ip || 'unknown';
  const isRateLimited = checkRateLimit(identifier);
  
  if (isRateLimited) {
    throw new APIError('Rate limit exceeded. Please try again later.', 429);
  }

  // Store IP and user agent for security
  const forwardedForHeader = req.headers['x-forwarded-for'];
  const forwardedFor = typeof forwardedForHeader === 'string'
    ? forwardedForHeader.split(',')[0].trim()
    : Array.isArray(forwardedForHeader)
      ? forwardedForHeader[0]
      : undefined;

  const realIpHeader = req.headers['x-real-ip'];
  const realIp = typeof realIpHeader === 'string'
    ? realIpHeader
    : Array.isArray(realIpHeader)
      ? realIpHeader[0]
      : undefined;

  data.ipAddress = (req as any).ip || forwardedFor || realIp;
  data.userAgent = req.headers['user-agent'];

  // First-time commenters need approval (unless already marked as spam)
  if (!data.isSpam) {
    const isFirstTime = await checkFirstTimeCommenter(identifier, req);
    if (isFirstTime) {
      data.isApproved = false; // Queue for moderation
    } else {
      data.isApproved = true; // Auto-approve returning commenters
    }
  }

  return data;
};

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || '3600000'); // 1 hour
  const maxComments = parseInt(process.env.RATE_LIMIT_MAX_COMMENTS || '10');

  // Clean up old entries
  for (const [key, value] of rateLimitCache.entries()) {
    if (now - value.timestamp > windowMs) {
      rateLimitCache.delete(key);
    }
  }

  const userLimit = rateLimitCache.get(identifier);
  
  if (!userLimit) {
    rateLimitCache.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (now - userLimit.timestamp > windowMs) {
    // Reset window
    rateLimitCache.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (userLimit.count >= maxComments) {
    return true; // Rate limited
  }

  // Increment count
  userLimit.count++;
  rateLimitCache.set(identifier, userLimit);
  return false;
}

async function checkFirstTimeCommenter(identifier: string, req: any): Promise<boolean> {
  try {
    // Check if this identifier has any approved comments
    const existingComments = await req.payload.find({
      collection: 'comments',
      where: {
        and: [
          {
            or: [
              { anonymousId: { equals: identifier } },
              { ipAddress: { equals: req.ip } },
            ],
          },
          { isApproved: { equals: true } },
        ],
      },
      limit: 1,
    });

    return existingComments.totalDocs === 0;
  } catch (error) {
    console.error('Error checking first-time commenter:', error);
    return true; // Err on the side of caution
  }
}