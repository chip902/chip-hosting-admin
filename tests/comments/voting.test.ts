import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { handleVote, removeVote, getUserVote } from '../../hooks/voting/validateVote';

// Mock Payload
const mockPayload = {
  findByID: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
};

// Mock comment data
const mockComment = {
  id: 'comment_123',
  post: 'post_456',
  content: 'Test comment',
  votes: {
    upvotes: 0,
    downvotes: 0,
    score: 0,
  },
  voters: [],
  isApproved: true,
  isSpam: false,
};

const mockCommentWithVote = {
  ...mockComment,
  votes: {
    upvotes: 1,
    downvotes: 0,
    score: 1,
  },
  voters: [
    {
      userId: 'user_123',
      vote: 1,
      timestamp: new Date('2024-01-01'),
    },
  ],
};

describe('Comment Voting System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleVote', () => {
    it('should record upvote for new user', async () => {
      mockPayload.findByID.mockResolvedValue(mockComment);
      mockPayload.update.mockResolvedValue({
        ...mockComment,
        votes: { upvotes: 1, downvotes: 0, score: 1 },
        voters: [{ userId: 'user_123', vote: 1, timestamp: expect.any(Date) }],
      });

      const result = await handleVote(mockPayload as any, {
        commentId: 'comment_123',
        userId: 'user_123',
        vote: 1,
      });

      expect(result.success).toBe(true);
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'comments',
        id: 'comment_123',
        data: {
          voters: [{ userId: 'user_123', vote: 1, timestamp: expect.any(Date) }],
          votes: { upvotes: 1, downvotes: 0, score: 1 },
        },
      });
    });

    it('should record downvote for new user', async () => {
      mockPayload.findByID.mockResolvedValue(mockComment);
      mockPayload.update.mockResolvedValue({
        ...mockComment,
        votes: { upvotes: 0, downvotes: 1, score: -1 },
        voters: [{ userId: 'user_123', vote: -1, timestamp: expect.any(Date) }],
      });

      const result = await handleVote(mockPayload as any, {
        commentId: 'comment_123',
        userId: 'user_123',
        vote: -1,
      });

      expect(result.success).toBe(true);
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'comments',
        id: 'comment_123',
        data: {
          voters: [{ userId: 'user_123', vote: -1, timestamp: expect.any(Date) }],
          votes: { upvotes: 0, downvotes: 1, score: -1 },
        },
      });
    });

    it('should prevent duplicate votes', async () => {
      mockPayload.findByID.mockResolvedValue(mockCommentWithVote);

      await expect(
        handleVote(mockPayload as any, {
          commentId: 'comment_123',
          userId: 'user_123',
          vote: 1,
        })
      ).rejects.toThrow('You have already cast this vote');
    });

    it('should allow vote changes (upvote to downvote)', async () => {
      mockPayload.findByID.mockResolvedValue(mockCommentWithVote);
      mockPayload.update.mockResolvedValue({
        ...mockCommentWithVote,
        votes: { upvotes: 0, downvotes: 1, score: -1 },
        voters: [{ userId: 'user_123', vote: -1, timestamp: expect.any(Date) }],
      });

      const result = await handleVote(mockPayload as any, {
        commentId: 'comment_123',
        userId: 'user_123',
        vote: -1,
      });

      expect(result.success).toBe(true);
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'comments',
        id: 'comment_123',
        data: {
          voters: [{ userId: 'user_123', vote: -1, timestamp: expect.any(Date) }],
          votes: { upvotes: 0, downvotes: 1, score: -1 },
        },
      });
    });

    it('should handle anonymous user votes', async () => {
      mockPayload.findByID.mockResolvedValue(mockComment);
      mockPayload.update.mockResolvedValue({
        ...mockComment,
        votes: { upvotes: 1, downvotes: 0, score: 1 },
      });

      const result = await handleVote(mockPayload as any, {
        commentId: 'comment_123',
        userId: 'anon_abcd1234',
        vote: 1,
      });

      expect(result.success).toBe(true);
      expect(mockPayload.update).toHaveBeenCalled();
    });

    it('should throw error for invalid vote value', async () => {
      await expect(
        handleVote(mockPayload as any, {
          commentId: 'comment_123',
          userId: 'user_123',
          vote: 0 as any,
        })
      ).rejects.toThrow('Vote must be either 1 (upvote) or -1 (downvote)');
    });

    it('should throw error for non-existent comment', async () => {
      mockPayload.findByID.mockResolvedValue(null);

      await expect(
        handleVote(mockPayload as any, {
          commentId: 'nonexistent',
          userId: 'user_123',
          vote: 1,
        })
      ).rejects.toThrow('Comment not found');
    });
  });

  describe('removeVote', () => {
    it('should remove existing vote', async () => {
      mockPayload.findByID.mockResolvedValue(mockCommentWithVote);
      mockPayload.update.mockResolvedValue({
        ...mockComment,
        voters: [],
        votes: { upvotes: 0, downvotes: 0, score: 0 },
      });

      const result = await removeVote(mockPayload as any, 'comment_123', 'user_123');

      expect(result.success).toBe(true);
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'comments',
        id: 'comment_123',
        data: {
          voters: [],
          votes: { upvotes: 0, downvotes: 0, score: 0 },
        },
      });
    });

    it('should throw error when no vote to remove', async () => {
      mockPayload.findByID.mockResolvedValue(mockComment);

      await expect(
        removeVote(mockPayload as any, 'comment_123', 'user_123')
      ).rejects.toThrow('No vote found to remove');
    });
  });

  describe('getUserVote', () => {
    it('should return user vote when exists', async () => {
      mockPayload.findByID.mockResolvedValue(mockCommentWithVote);

      const result = await getUserVote(mockPayload as any, 'comment_123', 'user_123');

      expect(result.vote).toBe(1);
      expect(result.timestamp).toEqual(new Date('2024-01-01'));
    });

    it('should return null when no vote exists', async () => {
      mockPayload.findByID.mockResolvedValue(mockComment);

      const result = await getUserVote(mockPayload as any, 'comment_123', 'user_123');

      expect(result.vote).toBeNull();
      expect(result.timestamp).toBeUndefined();
    });
  });

  describe('concurrent voting edge cases', () => {
    it('should handle race conditions gracefully', async () => {
      // Simulate concurrent votes by the same user
      mockPayload.findByID.mockResolvedValue(mockComment);
      mockPayload.update.mockResolvedValue({
        ...mockComment,
        votes: { upvotes: 1, downvotes: 0, score: 1 },
      });

      const promise1 = handleVote(mockPayload as any, {
        commentId: 'comment_123',
        userId: 'user_123',
        vote: 1,
      });

      const promise2 = handleVote(mockPayload as any, {
        commentId: 'comment_123',
        userId: 'user_123',
        vote: 1,
      });

      // Both should succeed (one will be processed first)
      const results = await Promise.allSettled([promise1, promise2]);
      
      // At least one should succeed
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });
  });
});