# Comment and Voting System Setup Guide

## Overview
This guide explains how to set up and configure the comment and voting system that has been implemented for your blog. **This system is designed to work with a deployed marketing site frontend while the PayloadCMS admin runs only on localhost.**

## Architecture
- **Frontend Marketing Site**: Deployed and publicly accessible
- **PayloadCMS Admin**: Runs only on localhost (not deployed)
- **MongoDB Database**: Deployed and accessible for all data
- **Comment API**: Direct MongoDB integration bypassing PayloadCMS admin

## Features Implemented
- ✅ Anonymous and authenticated user comments
- ✅ Upvote/downvote system with duplicate prevention
- ✅ Spam protection with reCAPTCHA v3 and honeypot fields
- ✅ Rate limiting to prevent abuse
- ✅ Comment moderation queue
- ✅ Threaded comments (replies)
- ✅ Anonymous user tracking with secure identifiers
- ✅ MongoDB indexes for optimal performance
- ✅ **Direct MongoDB API endpoints for deployed frontend**

## Quick Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required variables:**
- `RECAPTCHA_SECRET_KEY` - Get from Google reCAPTCHA Console
- `RECAPTCHA_SITE_KEY` - Get from Google reCAPTCHA Console

**Optional variables (with defaults):**
- `RECAPTCHA_THRESHOLD=0.7` - Spam detection threshold (0.0-1.0)
- `RATE_LIMIT_WINDOW=3600000` - Rate limit window in milliseconds (1 hour)
- `RATE_LIMIT_MAX_COMMENTS=10` - Max comments per user per window

### 2. Install Dependencies
```bash
pnpm install axios  # For reCAPTCHA verification
```

### 3. Set Up MongoDB Indexes
```bash
pnpm run setup:indexes
```

### 4. Generate Payload Types
```bash
pnpm run generate:types
```

### 5. Start Development
```bash
pnpm run dev
```

## API Endpoints

### Comment CRUD
- `GET /api/posts/[id]/comments` - Get comments for a post
- `POST /api/comments` - **Create new comment (direct MongoDB, works with deployed frontend)**

### Voting
- `POST /api/comments/[id]/vote` - Cast or change vote
- `DELETE /api/comments/[id]/vote` - Remove vote
- `GET /api/comments/[id]/vote` - Get user's current vote

### Query Parameters for Comments
- `?page=1&limit=10` - Pagination
- `?sort=popular|recent` - Sort by popularity or recency  
- `?includeReplies=true` - Include threaded replies

## Frontend Integration

### Basic Comment Display
```javascript
// Fetch comments for a post
const response = await fetch(`/api/posts/${postId}/comments?sort=popular&limit=20`);
const { comments, pagination, userVotes } = await response.json();
```

### Voting System
```javascript
// Cast a vote
const response = await fetch(`/api/comments/${commentId}/vote`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vote: 1 }) // 1 for upvote, -1 for downvote
});
```

### Comment Creation (works with deployed frontend)
```javascript
// Create a new comment
const response = await fetch('/api/comments', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-recaptcha-v3': token // Optional reCAPTCHA token
  },
  body: JSON.stringify({
    post: postId,
    content: 'Comment text here',
    authorName: 'User Name', // For anonymous users
    parentComment: parentId, // Optional for replies
    _honeypot: '' // Always include empty honeypot field
  })
});

const result = await response.json();
// result.success: true/false
// result.comment: created comment data
// result.message: status message
```

### reCAPTCHA Integration
```javascript
// Add reCAPTCHA token to comment submission
const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'comment' });
const response = await fetch('/api/comments', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-recaptcha-v3': token 
  },
  body: JSON.stringify({
    post: postId,
    content: commentText,
    authorName: userName,
    _honeypot: ''
  })
});
```

## Admin Interface (Localhost Only)

Comments can be managed through the Payload CMS admin panel at `http://localhost:3000/cms-admin/collections/comments`:

- **Moderation**: Approve/reject comments
- **Spam Management**: View and manage spam-flagged comments  
- **User Management**: View comment history by user
- **Analytics**: Comment counts and engagement metrics

**Note**: The admin panel only runs on localhost. Comments created via the deployed frontend will appear in your local admin for moderation.

## Moderation Workflow

1. **First-time commenters**: Comments go to moderation queue
2. **Trusted users**: Comments auto-approved
3. **Spam detection**: Low reCAPTCHA scores flagged for review
4. **Rate limiting**: Prevents spam floods

## Performance Optimizations

MongoDB indexes are automatically created for:
- Comments by post (sorted by date/popularity)
- Vote lookups for duplicate prevention
- Anonymous user tracking
- Spam and moderation queries

## Security Features

- **Anonymous tracking**: Secure fingerprinting without PII
- **Rate limiting**: IP and user-based limits
- **Spam protection**: reCAPTCHA v3 + honeypot fields
- **Content sanitization**: XSS prevention
- **Vote integrity**: Atomic operations prevent race conditions

## Troubleshooting

### Common Issues

1. **Comments not appearing**: Check `isApproved` status in admin
2. **Voting not working**: Verify user identification (auth or anonymous)
3. **Spam false positives**: Adjust `RECAPTCHA_THRESHOLD` (lower = less strict)
4. **Rate limiting**: Check `RATE_LIMIT_MAX_COMMENTS` setting

### Logs
Check server logs for detailed error information:
- reCAPTCHA verification failures
- Rate limiting events  
- Spam detection results
- Database operation errors

## Customization

The comment system is highly customizable:

- **Spam thresholds**: Adjust in environment variables
- **Moderation rules**: Modify in `plugins/spam-protection/hooks.ts`
- **Vote calculations**: Custom logic in `hooks/voting/validateVote.ts`
- **Anonymous tracking**: Configure in `plugins/anonymous-tracking/`

## Production Deployment

### ✅ What's Already Deployed
- **Comment Creation API** (`POST /api/comments`) - Works with deployed frontend
- **Comment Retrieval API** (`GET /api/posts/[id]/comments`) - Works with deployed frontend  
- **Voting API** (`POST/DELETE/GET /api/comments/[id]/vote`) - Works with deployed frontend
- **MongoDB Database** - Stores all comment data
- **Spam Protection** - reCAPTCHA, rate limiting, honeypot detection

### ⚠️ Admin Panel (Localhost Only)
- PayloadCMS admin runs on `http://localhost:3000/cms-admin`
- Use for comment moderation and management
- Comments created on deployed site appear here for approval

### Production Considerations
- Set up Redis for distributed rate limiting (currently uses in-memory cache)
- Configure email notifications for new comments
- Set up monitoring for spam detection accuracy
- Regular database maintenance for vote buckets
- CDN caching for comment API responses

### Testing the Deployed System
```bash
# Test comment creation on your deployed frontend
curl -X POST https://your-deployed-site.com/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "post": "POST_ID",
    "content": "Test comment",
    "authorName": "Test User",
    "_honeypot": ""
  }'
```

For support or customization requests, refer to the codebase documentation in `/docs/`.