export interface Comment {
  id: string;
  postId: string; // Reference to post (using 'posts' instead of 'articles')
  content: any; // Rich text content
  authorId?: string; // null for anonymous
  anonymousId?: string; // Tracking anonymous users
  authorName?: string; // Display name for anonymous users
  parentCommentId?: string; // For threaded comments
  votes: {
    upvotes: number;
    downvotes: number;
    score: number; // upvotes - downvotes
  };
  voters: Array<{
    userId: string; // Can be anonymousId
    vote: 1 | -1;
    timestamp: Date;
  }>;
  isApproved: boolean;
  isSpam: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteRequest {
  commentId: string;
  userId: string; // Can be anonymousId
  vote: 1 | -1;
}

export interface AnonymousUser {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
  createdAt: Date;
}

export interface SpamCheckResult {
  isSpam: boolean;
  score?: number;
  reason?: string;
}