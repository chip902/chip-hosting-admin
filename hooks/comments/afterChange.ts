import type { CollectionAfterChangeHook } from "payload";

export const commentAfterChangeHook: CollectionAfterChangeHook = async ({ doc, req, operation, previousDoc }) => {
	// Skip if this was triggered by our own hooks to prevent infinite loops
	if (req.context?.triggerAfterChange === false) {
		return;
	}

	// Handle new comment creation
	if (operation === "create") {
		// Update comment count on the related post
		await updatePostCommentCount(req, doc.post, 1);

		// Send notifications for new comments (if approved)
		if (doc.isApproved) {
			await sendNewCommentNotifications(req, doc);
		}
	}

	// Handle comment approval/disapproval
	if (operation === "update" && previousDoc) {
		const wasApproved = previousDoc.isApproved;
		const isApproved = doc.isApproved;

		if (!wasApproved && isApproved) {
			// Comment was just approved
			await sendNewCommentNotifications(req, doc);
		}
	}

	// Note: Delete operations are handled in afterDelete hook
};

async function updatePostCommentCount(req: any, postId: string, delta: number) {
	try {
		// Get current post
		const post = await req.payload.findByID({
			collection: "posts",
			id: postId,
		});

		if (post) {
			const currentCount = post.commentCount || 0;
			const newCount = Math.max(0, currentCount + delta);

			await req.payload.update({
				collection: "posts",
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
		console.error("Error updating post comment count:", error);
		// Don't throw - this is a non-critical operation
	}
}

async function sendNewCommentNotifications(req: any, comment: any) {
	try {
		// In a real application, you would:
		// 1. Send email notifications to post author
		// 2. Send notifications to users who have commented on the same post
		// 3. Send push notifications if enabled
		// 4. Create activity log entries

		console.log(`New comment notification: Comment ${comment.id} on post ${comment.post}`);

		// Example: Basic email notification logic
		// const post = await req.payload.findByID({
		//   collection: 'posts',
		//   id: comment.post,
		// });

		// if (post && post.author) {
		//   const author = await req.payload.findByID({
		//     collection: 'users',
		//     id: post.author,
		//   });

		//   if (author && author.email) {
		//     // Send email notification
		//     await sendEmailNotification({
		//       to: author.email,
		//       subject: `New comment on "${post.title}"`,
		//       template: 'new-comment',
		//       data: { post, comment },
		//     });
		//   }
		// }
	} catch (error) {
		console.error("Error sending comment notifications:", error);
		// Don't throw - this is a non-critical operation
	}
}
