import crypto from 'crypto';
import type { Plugin } from 'payload';

export const anonymousTrackingPlugin = (): Plugin => {
  return (config) => {
    const existingOnInit = config.onInit;

    return {
      ...config,
      // Add middleware to attach anonymous ID to requests
      onInit: async (payload) => {
        const expressApp = (payload as any).express;

        expressApp?.use((req, res, next) => {
          // Skip if user is authenticated
          if (req.user) {
            next();
            return;
          }

          // Check for existing anonymous ID in cookies
          let anonymousId = req.cookies?.anonymousId;

          if (!anonymousId) {
            // Generate new anonymous ID
            anonymousId = generateAnonymousId(req);

            // Set cookie with anonymous ID
            res.cookie('anonymousId', anonymousId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            });
          }

          // Attach to request for use in hooks
          (req as any).anonymousId = anonymousId;

          next();
        });

        await existingOnInit?.(payload);
      },
    };
  };
};

// Generate a secure anonymous identifier
function generateAnonymousId(req: any): string {
  // Combine multiple factors for better uniqueness
  const factors = [
    req.ip || req.connection?.remoteAddress || 'unknown-ip',
    req.headers['user-agent'] || 'unknown-agent',
    req.headers['accept-language'] || 'unknown-lang',
    Date.now().toString(),
    Math.random().toString(36),
  ];

  // Create hash from combined factors
  const hash = crypto
    .createHash('sha256')
    .update(factors.join('-'))
    .digest('hex');

  // Return first 16 characters for manageable ID
  return `anon_${hash.substring(0, 16)}`;
}

// Helper function to get anonymous ID from request
export function getAnonymousId(req: any): string | undefined {
  return req.anonymousId || req.cookies?.anonymousId;
}