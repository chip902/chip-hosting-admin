import type { Payload } from 'payload';
import { APIError } from 'payload';

export interface VoteData {
  commentId: string;
  userId: string; // Can be anonymousId
  vote: 1 | -1;
}

interface VoterEntry {
  userId: string;
  vote: 1 | -1;
  timestamp: string;
}

interface VoteTotals {
  upvotes: number;
  downvotes: number;
  score: number;
}

interface NormalizedVoteState {
  voters: VoterEntry[];
  totals: VoteTotals;
}

const DEFAULT_VOTE_STATE: VoteTotals = {
  upvotes: 0,
  downvotes: 0,
  score: 0,
};

function normalizeCommentVotingState(comment: unknown): NormalizedVoteState {
  if (!comment || typeof comment !== 'object') {
    return {
      voters: [],
      totals: DEFAULT_VOTE_STATE,
    };
  }

  const cloned = JSON.parse(JSON.stringify(comment ?? {}));
  const voters: VoterEntry[] = [];

  if (Array.isArray(cloned.voters)) {
    for (const entry of cloned.voters) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const userId = typeof entry.userId === 'string' ? entry.userId : undefined;
      const voteValue = entry.vote === 1 || entry.vote === -1 ? entry.vote : undefined;
      if (!userId || voteValue === undefined) {
        continue;
      }

      const rawTimestamp = typeof entry.timestamp === 'string' ? entry.timestamp : undefined;
      voters.push({
        userId,
        vote: voteValue,
        timestamp: rawTimestamp ?? new Date().toISOString(),
      });
    }
  }

  const totalsSource = cloned.votes && typeof cloned.votes === 'object' ? cloned.votes : {};
  const upvotes = typeof totalsSource.upvotes === 'number' && Number.isFinite(totalsSource.upvotes)
    ? totalsSource.upvotes
    : 0;
  const downvotes = typeof totalsSource.downvotes === 'number' && Number.isFinite(totalsSource.downvotes)
    ? totalsSource.downvotes
    : 0;
  const score = typeof totalsSource.score === 'number' && Number.isFinite(totalsSource.score)
    ? totalsSource.score
    : upvotes - downvotes;

  return {
    voters,
    totals: {
      upvotes,
      downvotes,
      score,
    },
  };
}

function recalculateScore(upvotes: number, downvotes: number): number {
  return upvotes - downvotes;
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

  const { voters, totals } = normalizeCommentVotingState(comment);
  const existingVoterIndex = voters.findIndex((voter) => voter.userId === userId);
  const updatedTotals: VoteTotals = {
    upvotes: totals.upvotes,
    downvotes: totals.downvotes,
    score: totals.score,
  };
  const updatedVoters: VoterEntry[] = [...voters];
  const timestamp = new Date().toISOString();

  if (existingVoterIndex >= 0) {
    const existingVote = voters[existingVoterIndex];

    if (existingVote.vote === vote) {
      throw new APIError('You have already cast this vote', 400);
    }

    if (existingVote.vote === 1) {
      updatedTotals.upvotes = Math.max(0, updatedTotals.upvotes - 1);
    } else {
      updatedTotals.downvotes = Math.max(0, updatedTotals.downvotes - 1);
    }

    if (vote === 1) {
      updatedTotals.upvotes += 1;
    } else {
      updatedTotals.downvotes += 1;
    }

    updatedTotals.score = recalculateScore(updatedTotals.upvotes, updatedTotals.downvotes);

    updatedVoters[existingVoterIndex] = {
      userId,
      vote,
      timestamp,
    };
  } else {
    if (vote === 1) {
      updatedTotals.upvotes += 1;
    } else {
      updatedTotals.downvotes += 1;
    }

    updatedTotals.score = recalculateScore(updatedTotals.upvotes, updatedTotals.downvotes);

    updatedVoters.push({
      userId,
      vote,
      timestamp,
    });
  }

  const updateData: Record<string, unknown> = {
    voters: updatedVoters,
    votes: updatedTotals,
  };

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
      timestamp,
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

  const { voters, totals } = normalizeCommentVotingState(comment);
  const existingVoterIndex = voters.findIndex((voter) => voter.userId === userId);

  if (existingVoterIndex < 0) {
    throw new APIError('No vote found to remove', 400);
  }

  const existingVote = voters[existingVoterIndex];
  const newVoters = voters.filter((_, index) => index !== existingVoterIndex);

  const updatedTotals: VoteTotals = {
    upvotes: existingVote.vote === 1 ? Math.max(0, totals.upvotes - 1) : totals.upvotes,
    downvotes: existingVote.vote === -1 ? Math.max(0, totals.downvotes - 1) : totals.downvotes,
    score: recalculateScore(
      existingVote.vote === 1 ? Math.max(0, totals.upvotes - 1) : totals.upvotes,
      existingVote.vote === -1 ? Math.max(0, totals.downvotes - 1) : totals.downvotes
    ),
  };

  const updateData: Record<string, unknown> = {
    voters: newVoters,
    votes: updatedTotals,
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
): Promise<{ vote: number | null; timestamp?: string }> {
  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
  });

  if (!comment) {
    throw new APIError('Comment not found', 404);
  }

  const { voters } = normalizeCommentVotingState(comment);
  const userVote = voters.find((voter) => voter.userId === userId);

  return {
    vote: userVote?.vote || null,
    timestamp: userVote?.timestamp,
  };
}