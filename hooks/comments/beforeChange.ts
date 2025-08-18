import type { CollectionBeforeChangeHook } from 'payload';

export const commentBeforeChangeHook: CollectionBeforeChangeHook = async ({ 
  data, 
  req,
  operation,
  originalDoc 
}) => {
  // Recalculate vote score when votes are updated
  if (data.votes && (data.votes.upvotes !== undefined || data.votes.downvotes !== undefined)) {
    const upvotes = data.votes.upvotes ?? originalDoc?.votes?.upvotes ?? 0;
    const downvotes = data.votes.downvotes ?? originalDoc?.votes?.downvotes ?? 0;
    
    data.votes.score = upvotes - downvotes;
  }

  // Prevent manipulation of vote counts through direct API calls
  // (Only allow through voting endpoints)
  if (operation === 'update' && req.headers['x-voting-operation'] !== 'true') {
    // Reset vote data to original values to prevent tampering
    if (originalDoc?.votes) {
      data.votes = originalDoc.votes;
    }
    if (originalDoc?.voters) {
      data.voters = originalDoc.voters;
    }
  }

  return data;
};