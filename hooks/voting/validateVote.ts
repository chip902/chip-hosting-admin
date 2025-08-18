import type { Payload } from 'payload';
import { APIError } from 'payload';

export interface VoteData {
  commentId: string;
  userId: string; // Can be anonymousId
  vote: 1 | -1;
}

export async function handleVote(
  payload: Payload,
  { commentId, userId, vote }: VoteData
): Promise<any> {
  // Validate vote value
  if (vote !== 1 && vote !== -1) {
    throw new APIError('Vote must be either 1 (upvote) or -1 (downvote)', 400);
  }

  // Get the comment to check existing votes
  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
  });

  if (!comment) {
    throw new APIError('Comment not found', 404);
  }

  // Check if user has already voted
  const existingVoterIndex = comment.voters?.findIndex(
    (voter: any) => voter.userId === userId
  ) ?? -1;

  let updateData: any = {};

  if (existingVoterIndex >= 0) {
    // User has already voted
    const existingVote = comment.voters[existingVoterIndex];

    if (existingVote.vote === vote) {
      throw new APIError('You have already cast this vote', 400);
    }

    // Change vote: remove old vote, add new vote
    const oldVote = existingVote.vote;
    const newVoters = [...comment.voters];
    newVoters[existingVoterIndex] = {
      userId,
      vote,
      timestamp: new Date(),
    };

    // Calculate new vote counts
    const upvoteDiff = vote === 1 ? 1 : 0;
    const downvoteDiff = vote === -1 ? 1 : 0;
    const oldUpvoteDiff = oldVote === 1 ? -1 : 0;
    const oldDownvoteDiff = oldVote === -1 ? -1 : 0;

    updateData = {
      voters: newVoters,
      votes: {
        upvotes: (comment.votes?.upvotes || 0) + upvoteDiff + oldUpvoteDiff,
        downvotes: (comment.votes?.downvotes || 0) + downvoteDiff + oldDownvoteDiff,
        score: (comment.votes?.score || 0) + (vote * 2), // Change is vote * 2 (e.g., -1 to +1 = +2)
      },
    };
  } else {
    // New vote
    const newVoters = [...(comment.voters || []), {
      userId,
      vote,
      timestamp: new Date(),
    }];

    updateData = {
      voters: newVoters,
      votes: {
        upvotes: (comment.votes?.upvotes || 0) + (vote === 1 ? 1 : 0),
        downvotes: (comment.votes?.downvotes || 0) + (vote === -1 ? 1 : 0),
        score: (comment.votes?.score || 0) + vote,
      },
    };
  }

  // Update the comment with new vote data
  const updatedComment = await payload.update({
    collection: 'comments',
    id: commentId,
    data: updateData,
  });

  return {
    success: true,
    comment: updatedComment,
    vote: {
      userId,
      vote,
      timestamp: new Date(),
    },
  };
}

// Remove a vote (for undo functionality)
export async function removeVote(
  payload: Payload,
  commentId: string,
  userId: string
): Promise<any> {
  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
  });

  if (!comment) {
    throw new APIError('Comment not found', 404);
  }

  const existingVoterIndex = comment.voters?.findIndex(
    (voter: any) => voter.userId === userId
  ) ?? -1;

  if (existingVoterIndex < 0) {
    throw new APIError('No vote found to remove', 400);
  }

  const existingVote = comment.voters[existingVoterIndex];
  const newVoters = comment.voters.filter((_: any, index: number) => index !== existingVoterIndex);

  const updateData = {
    voters: newVoters,
    votes: {
      upvotes: (comment.votes?.upvotes || 0) - (existingVote.vote === 1 ? 1 : 0),
      downvotes: (comment.votes?.downvotes || 0) - (existingVote.vote === -1 ? 1 : 0),
      score: (comment.votes?.score || 0) - existingVote.vote,
    },
  };

  const updatedComment = await payload.update({
    collection: 'comments',
    id: commentId,
    data: updateData,
  });

  return {
    success: true,
    comment: updatedComment,
    removedVote: existingVote,
  };
}

// Get user's vote on a comment
export async function getUserVote(
  payload: Payload,
  commentId: string,
  userId: string
): Promise<{ vote: number | null; timestamp?: Date }> {
  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
  });

  if (!comment) {
    throw new APIError('Comment not found', 404);
  }

  const userVote = comment.voters?.find(
    (voter: any) => voter.userId === userId
  );

  return {
    vote: userVote?.vote || null,
    timestamp: userVote?.timestamp,
  };
}