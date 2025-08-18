import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST, DELETE, GET } from '../../app/api/comments/[id]/vote/route';
import { GET as getComments } from '../../app/api/posts/[id]/comments/route';

// Mock dependencies
jest.mock('payload', () => ({
  getPayload: jest.fn(),
}));

jest.mock('../../hooks/voting/validateVote');
jest.mock('../../plugins/anonymous-tracking');

import { getPayload } from 'payload';
import { handleVote, removeVote, getUserVote } from '../../hooks/voting/validateVote';
import { getAnonymousId } from '../../plugins/anonymous-tracking';

const mockGetPayload = getPayload as jest.MockedFunction<typeof getPayload>;
const mockHandleVote = handleVote as jest.MockedFunction<typeof handleVote>;
const mockRemoveVote = removeVote as jest.MockedFunction<typeof removeVote>;
const mockGetUserVote = getUserVote as jest.MockedFunction<typeof getUserVote>;
const mockGetAnonymousId = getAnonymousId as jest.MockedFunction<typeof getAnonymousId>;

describe('Comment API Endpoints', () => {
  let mockPayload: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPayload = {
      find: jest.fn(),
      findByID: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockGetPayload.mockResolvedValue(mockPayload);
  });

  describe('POST /api/comments/[id]/vote', () => {
    it('should cast upvote successfully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote: 1 }),
      });

      mockGetAnonymousId.mockReturnValue('anon_123');
      mockHandleVote.mockResolvedValue({
        success: true,
        comment: { id: '123', votes: { upvotes: 1, downvotes: 0, score: 1 } },
        vote: { userId: 'anon_123', vote: 1, timestamp: new Date() },
      });

      const response = await POST(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockHandleVote).toHaveBeenCalledWith(mockPayload, {
        commentId: '123',
        userId: 'anon_123',
        vote: 1,
      });
    });

    it('should cast downvote successfully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote: -1 }),
      });

      mockGetAnonymousId.mockReturnValue('anon_123');
      mockHandleVote.mockResolvedValue({
        success: true,
        comment: { id: '123', votes: { upvotes: 0, downvotes: 1, score: -1 } },
        vote: { userId: 'anon_123', vote: -1, timestamp: new Date() },
      });

      const response = await POST(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockHandleVote).toHaveBeenCalledWith(mockPayload, {
        commentId: '123',
        userId: 'anon_123',
        vote: -1,
      });
    });

    it('should reject invalid vote values', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote: 0 }),
      });

      const response = await POST(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Vote must be either 1 or -1');
      expect(mockHandleVote).not.toHaveBeenCalled();
    });

    it('should handle missing user identification', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote: 1 }),
      });

      mockGetAnonymousId.mockReturnValue(undefined);
      (mockRequest as any).user = undefined;

      const response = await POST(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Unable to identify user');
    });

    it('should handle voting errors', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote: 1 }),
      });

      mockGetAnonymousId.mockReturnValue('anon_123');
      mockHandleVote.mockRejectedValue(new Error('Comment not found'));

      const response = await POST(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Comment not found');
    });
  });

  describe('DELETE /api/comments/[id]/vote', () => {
    it('should remove vote successfully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote', {
        method: 'DELETE',
      });

      mockGetAnonymousId.mockReturnValue('anon_123');
      mockRemoveVote.mockResolvedValue({
        success: true,
        comment: { id: '123', votes: { upvotes: 0, downvotes: 0, score: 0 } },
        removedVote: { userId: 'anon_123', vote: 1 },
      });

      const response = await DELETE(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRemoveVote).toHaveBeenCalledWith(mockPayload, '123', 'anon_123');
    });

    it('should handle remove vote errors', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote', {
        method: 'DELETE',
      });

      mockGetAnonymousId.mockReturnValue('anon_123');
      mockRemoveVote.mockRejectedValue(new Error('No vote found to remove'));

      const response = await DELETE(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No vote found to remove');
    });
  });

  describe('GET /api/comments/[id]/vote', () => {
    it('should get user vote successfully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote');

      mockGetAnonymousId.mockReturnValue('anon_123');
      mockGetUserVote.mockResolvedValue({
        vote: 1,
        timestamp: new Date('2024-01-01'),
      });

      const response = await GET(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.vote).toBe(1);
      expect(mockGetUserVote).toHaveBeenCalledWith(mockPayload, '123', 'anon_123');
    });

    it('should return null for no vote', async () => {
      const mockRequest = new NextRequest('http://localhost/api/comments/123/vote');

      mockGetAnonymousId.mockReturnValue('anon_123');
      mockGetUserVote.mockResolvedValue({
        vote: null,
      });

      const response = await GET(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.vote).toBeNull();
    });
  });

  describe('GET /api/posts/[id]/comments', () => {
    const mockComments = [
      {
        id: 'comment1',
        content: 'First comment',
        votes: { upvotes: 5, downvotes: 1, score: 4 },
        voters: [{ userId: 'user1', vote: 1 }],
        createdAt: '2024-01-01',
        isApproved: true,
      },
      {
        id: 'comment2',
        content: 'Second comment',
        votes: { upvotes: 2, downvotes: 0, score: 2 },
        voters: [],
        createdAt: '2024-01-02',
        isApproved: true,
      },
    ];

    it('should get comments with default parameters', async () => {
      const mockRequest = new NextRequest('http://localhost/api/posts/123/comments');

      mockPayload.find.mockResolvedValue({
        docs: mockComments,
        page: 1,
        limit: 10,
        totalPages: 1,
        totalDocs: 2,
        hasNextPage: false,
        hasPrevPage: false,
      });

      const response = await getComments(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toHaveLength(2);
      expect(data.pagination.page).toBe(1);
      expect(data.sort).toBe('recent');

      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'comments',
        where: {
          post: { equals: '123' },
          isApproved: { equals: true },
          parentComment: { exists: false },
        },
        sort: '-createdAt',
        page: 1,
        limit: 10,
        depth: 2,
      });
    });

    it('should get comments sorted by popularity', async () => {
      const mockRequest = new NextRequest('http://localhost/api/posts/123/comments?sort=popular');

      mockPayload.find.mockResolvedValue({
        docs: mockComments,
        page: 1,
        limit: 10,
        totalPages: 1,
        totalDocs: 2,
        hasNextPage: false,
        hasPrevPage: false,
      });

      const response = await getComments(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sort).toBe('popular');

      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'comments',
        where: {
          post: { equals: '123' },
          isApproved: { equals: true },
          parentComment: { exists: false },
        },
        sort: '-votes.score',
        page: 1,
        limit: 10,
        depth: 2,
      });
    });

    it('should get comments with pagination', async () => {
      const mockRequest = new NextRequest('http://localhost/api/posts/123/comments?page=2&limit=5');

      mockPayload.find.mockResolvedValue({
        docs: [],
        page: 2,
        limit: 5,
        totalPages: 2,
        totalDocs: 6,
        hasNextPage: false,
        hasPrevPage: true,
      });

      const response = await getComments(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);

      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'comments',
        where: {
          post: { equals: '123' },
          isApproved: { equals: true },
          parentComment: { exists: false },
        },
        sort: '-createdAt',
        page: 2,
        limit: 5,
        depth: 2,
      });
    });

    it('should enforce maximum limit', async () => {
      const mockRequest = new NextRequest('http://localhost/api/posts/123/comments?limit=100');

      mockPayload.find.mockResolvedValue({
        docs: mockComments,
        page: 1,
        limit: 50,
        totalPages: 1,
        totalDocs: 2,
        hasNextPage: false,
        hasPrevPage: false,
      });

      const response = await getComments(mockRequest, { params: { id: '123' } });

      expect(mockPayload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50, // Capped at 50
        })
      );
    });

    it('should include user votes when user is identified', async () => {
      const mockRequest = new NextRequest('http://localhost/api/posts/123/comments');
      (mockRequest as any).anonymousId = 'anon_123';

      mockPayload.find
        .mockResolvedValueOnce({
          docs: mockComments,
          page: 1,
          limit: 10,
          totalPages: 1,
          totalDocs: 2,
          hasNextPage: false,
          hasPrevPage: false,
        })
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'comment1',
              voters: [{ userId: 'anon_123', vote: 1 }],
            },
          ],
        });

      const response = await getComments(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userVotes).toHaveProperty('comment1', 1);
    });

    it('should handle API errors gracefully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/posts/123/comments');

      mockPayload.find.mockRejectedValue(new Error('Database error'));

      const response = await getComments(mockRequest, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });
  });
});