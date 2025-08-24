import type { CollectionAfterDeleteHook } from 'payload';

export const commentAfterDeleteHook: CollectionAfterDeleteHook = async ({ 
  doc,
  req
}) => {
  // Skip if this was triggered by our own hooks to prevent infinite loops
  if (req.context?.triggerAfterDelete === false) {
    return;
  }

  // Update comment count on the related post when comment is deleted
  await updatePostCommentCount(req, doc.post, -1);
};

async function updatePostCommentCount(req: any, postId: string, delta: number) {
  try {
    // Get current post
    const post = await req.payload.findByID({
      collection: 'posts',
      id: postId,
    });

    if (post) {
      const currentCount = post.commentCount || 0;
      const newCount = Math.max(0, currentCount + delta);

      await req.payload.update({
        collection: 'posts',
        id: postId,
        data: {
          commentCount: newCount,
        },
        context: {
          triggerAfterChange: false, // Prevent triggering hooks
        },
      });
    }
  } catch (error) {
    console.error('Error updating post comment count after deletion:', error);
    // Don't throw - this is a non-critical operation
  }
}
