import type { CollectionBeforeValidateHook } from 'payload';
import { sanitizeContent } from '../../plugins/spam-protection';

export const commentBeforeValidateHook: CollectionBeforeValidateHook = async ({ 
  data, 
  req,
  operation 
}) => {
  // Only process on create and update
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  // Sanitize content to prevent XSS
  if (data.content) {
    data.content = sanitizeContent(data.content);
  }

  // Set anonymous ID if user is not authenticated
  if (!data.author && !data.anonymousId) {
    data.anonymousId = (req as any).anonymousId;
  }

  // If user is authenticated but no author is set, set it
  if (req.user && !data.author) {
    data.author = req.user.id;
  }

  // Ensure vote counts are initialized
  if (!data.votes) {
    data.votes = {
      upvotes: 0,
      downvotes: 0,
      score: 0,
    };
  }

  // Initialize voters array
  if (!data.voters) {
    data.voters = [];
  }

  return data;
};