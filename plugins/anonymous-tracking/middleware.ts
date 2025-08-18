import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface FingerprintData {
  userAgent?: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  ip?: string;
  dnt?: string;
  connection?: string;
}

// Enhanced fingerprinting for more reliable anonymous user tracking
export function createFingerprint(req: Request): string {
  const fingerprintData: FingerprintData = {
    userAgent: req.headers['user-agent'],
    acceptLanguage: req.headers['accept-language'],
    acceptEncoding: req.headers['accept-encoding'],
    ip: req.ip || req.connection?.remoteAddress,
    dnt: req.headers['dnt'] as string,
    connection: req.headers['connection'],
  };

  // Create a stable hash from the fingerprint data
  const fingerprintString = Object.entries(fingerprintData)
    .filter(([_, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistency
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

  return crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex')
    .substring(0, 16);
}

// Middleware to validate and refresh anonymous IDs
export function anonymousTrackingMiddleware(
  req: Request & { anonymousId?: string },
  res: Response,
  next: NextFunction
): void {
  // Skip for authenticated users
  if ((req as any).user) {
    next();
    return;
  }

  const cookieId = req.cookies?.anonymousId;
  const fingerprint = createFingerprint(req);
  
  // If no cookie, create new ID based on fingerprint
  if (!cookieId) {
    const newId = `anon_${fingerprint}_${Date.now().toString(36)}`;
    req.anonymousId = newId;
    
    res.cookie('anonymousId', newId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
  } else {
    // Validate existing cookie (basic check)
    if (cookieId.startsWith('anon_') && cookieId.length > 20) {
      req.anonymousId = cookieId;
    } else {
      // Invalid cookie, generate new one
      const newId = `anon_${fingerprint}_${Date.now().toString(36)}`;
      req.anonymousId = newId;
      
      res.cookie('anonymousId', newId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });
    }
  }

  next();
}