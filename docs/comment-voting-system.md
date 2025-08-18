name: "Comment & Voting System for Payload CMS Articles"
description: |

## Purpose
Implement a robust comment system with upvote/downvote functionality for articles in Payload CMS, supporting both authenticated and anonymous users with comprehensive spam protection.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Build a production-ready comment system that allows visitors to comment on articles (with or without accounts) and vote on comments. The system must prevent spam while allowing legitimate engagement, integrate seamlessly with existing Payload CMS and MongoDB infrastructure, and provide APIs for the Next.js frontend to consume.

## Why
- **Business value**: Increase user engagement and community building around content
- **Integration**: Extend existing article functionality with social features
- **Problems solved**: Enable reader feedback, foster discussion, and identify popular content through voting

## What
Users can:
- Post comments on articles without creating an account
- Reply to existing comments (threaded conversations)
- Upvote/downvote comments
- View comments sorted by popularity or recency

System features:
- Spam protection via reCAPTCHA v3 and honeypot fields
- Rate limiting to prevent abuse
- Moderation queue for first-time commenters
- Anonymous user tracking via secure identifiers

### Success Criteria
- [ ] Comments can be created, read, updated, and deleted via API
- [ ] Voting system accurately tracks and prevents duplicate votes
- [ ] Spam protection blocks >95% of automated spam attempts
- [ ] API response times < 200ms for comment operations
- [ ] System handles 1000+ concurrent users without degradation

## All Needed Context

### Documentation & References (list all context needed to implement the feature)
```yaml
# MUST READ - Include these in your context window
- url: https://payloadcms.com/docs/configuration/collections
  why: Core documentation for creating Payload collections with fields, hooks, and validation
  
- url: https://payloadcms.com/docs/hooks/collections
  why: Collection hooks for validation, beforeChange, afterChange operations
  
- url: https://payloadcms.com/docs/production/preventing-abuse
  why: Built-in Payload security features including rate limiting and CSRF protection
  
- url: https://github.com/brachypelma/payload-plugin-comments
  why: Existing comment plugin to reference for patterns and structure

- url: https://github.com/GeorgeHulpoi/payload-recaptcha-v3
  why: reCAPTCHA v3 integration for Payload CMS
  
- url: https://developers.google.com/recaptcha/docs/v3
  why: Google reCAPTCHA v3 implementation guide
  
- url: https://www.mongodb.com/docs/manual/core/index-compound/
  why: MongoDB compound indexes for optimizing comment queries

- url: https://payloadcms.com/docs/authentication/overview
  why: Understanding Payload's auth system for anonymous user handling
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase
```bash
# Expected Payload CMS structure
.
├── payload.config.ts
├── collections/
│   ├── Articles.ts
│   └── Users.ts
├── server.ts
├── package.json
└── tsconfig.json
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
.
├── payload.config.ts (MODIFY: add Comments collection and plugins)
├── collections/
│   ├── Articles.ts (existing)
│   ├── Users.ts (existing)
│   └── Comments.ts (CREATE: main comment collection definition)
├── plugins/
│   ├── spam-protection/
│   │   ├── index.ts (CREATE: plugin initialization)
│   │   ├── hooks.ts (CREATE: validation hooks)
│   │   └── recaptcha.ts (CREATE: reCAPTCHA integration)
│   └── anonymous-tracking/
│       ├── index.ts (CREATE: anonymous user identifier)
│       └── middleware.ts (CREATE: cookie/fingerprint handling)
├── hooks/
│   ├── comments/
│   │   ├── beforeChange.ts (CREATE: pre-save validation)
│   │   ├── afterChange.ts (CREATE: post-save notifications)
│   │   └── beforeValidate.ts (CREATE: spam checks)
│   └── voting/
│       └── validateVote.ts (CREATE: prevent duplicate votes)
├── types/
│   └── comments.ts (CREATE: TypeScript interfaces)
└── tests/
    └── comments/
        ├── api.test.ts (CREATE: API endpoint tests)
        ├── spam.test.ts (CREATE: spam protection tests)
        └── voting.test.ts (CREATE: voting logic tests)
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Payload CMS v3 uses TypeScript config files
// Example: Collections must export CollectionConfig type
// Example: Hooks receive typed arguments based on collection

// CRITICAL: MongoDB document size limit is 16MB
// For comments with many votes, use bucketing pattern

// CRITICAL: Payload's auth system creates user sessions
// Anonymous users need special handling via custom middleware

// CRITICAL: reCAPTCHA v3 requires client-side integration
// Backend only validates tokens, frontend must generate them

// CRITICAL: Rate limiting in Payload uses Redis if configured
// Falls back to in-memory storage in development
```

## Implementation Blueprint

### Data models and structure

Create the core data models for type safety and consistency.
```typescript
// types/comments.ts
interface Comment {
  id: string
  articleId: string // Reference to article
  content: string
  authorId?: string // null for anonymous
  anonymousId?: string // Tracking anonymous users
  parentCommentId?: string // For threaded comments
  votes: {
    upvotes: number
    downvotes: number
    score: number // upvotes - downvotes
  }
  voters: Array<{
    userId: string // Can be anonymousId
    vote: 1 | -1
    timestamp: Date
  }>
  isApproved: boolean
  isSpam: boolean
  createdAt: Date
  updatedAt: Date
}

// MongoDB indexes needed:
// - { articleId: 1, createdAt: -1 } // List comments by article
// - { articleId: 1, "votes.score": -1 } // Sort by popularity
// - { "voters.userId": 1 } // Check if user voted
// - { anonymousId: 1 } // Track anonymous users
```

### list of tasks to be completed to fullfill the PRP in the order they should be completed

```yaml
Task 1: Create Comment Collection Definition
MODIFY collections/Comments.ts:
  - Define collection with all fields (content, votes, etc)
  - Add relationship field to Articles collection
  - Configure access control (public read, restricted write)
  - Add validation rules for content length

Task 2: Implement Anonymous User Tracking
CREATE plugins/anonymous-tracking/index.ts:
  - Generate secure anonymous identifiers
  - Store in httpOnly cookies
  - Implement browser fingerprinting fallback
  - Add middleware to attach ID to requests

Task 3: Add Spam Protection Plugin
CREATE plugins/spam-protection/index.ts:
  - Integrate reCAPTCHA v3 validation
  - Add honeypot field to comment forms
  - Implement rate limiting per IP/user
  - Create moderation queue for new users

Task 4: Implement Voting System Hooks
CREATE hooks/voting/validateVote.ts:
  - Check for existing vote by user
  - Use atomic MongoDB operations
  - Update vote counts efficiently
  - Handle vote changes (upvote to downvote)

Task 5: Add Comment Validation Hooks
CREATE hooks/comments/beforeValidate.ts:
  - Validate reCAPTCHA token
  - Check honeypot field is empty
  - Verify rate limits not exceeded
  - Sanitize HTML content

Task 6: Configure Comment Moderation
CREATE hooks/comments/afterChange.ts:
  - Auto-approve trusted users
  - Queue first-time comments
  - Send notification emails
  - Update article comment count

Task 7: Create API Endpoints
MODIFY payload.config.ts:
  - Add custom endpoints for voting
  - Configure CORS for frontend
  - Add response caching headers
  - Enable compression

Task 8: Write Comprehensive Tests
CREATE tests/comments/*.test.ts:
  - Test comment CRUD operations
  - Verify spam protection works
  - Test voting logic edge cases
  - Load test with concurrent users
```

### Per task pseudocode as needed added to each task
```typescript
// Task 1: Comment Collection Definition
const Comments: CollectionConfig = {
  slug: 'comments',
  fields: [
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
      index: true, // CRITICAL: Index for performance
    },
    {
      name: 'content',
      type: 'richText', // PATTERN: Use richText for formatting
      required: true,
      validate: (value) => {
        // PATTERN: Content validation
        if (!value || value.length < 10) {
          return 'Comment must be at least 10 characters'
        }
        if (value.length > 5000) {
          return 'Comment cannot exceed 5000 characters'
        }
      }
    },
    {
      name: 'votes',
      type: 'group',
      fields: [
        { name: 'upvotes', type: 'number', defaultValue: 0 },
        { name: 'downvotes', type: 'number', defaultValue: 0 },
        { name: 'score', type: 'number', defaultValue: 0 }
      ]
    },
    {
      name: 'voters',
      type: 'array',
      fields: [
        { name: 'userId', type: 'text', required: true },
        { name: 'vote', type: 'number', required: true }, // 1 or -1
        { name: 'timestamp', type: 'date', required: true }
      ],
      admin: { hidden: true } // PATTERN: Hide from admin UI
    }
  ],
  hooks: {
    beforeValidate: [spamProtectionHook],
    beforeChange: [calculateVoteScore],
    afterChange: [notifyOnNewComment]
  },
  access: {
    read: () => true, // Public read
    create: authenticatedOrAnonymous,
    update: ownCommentOnly,
    delete: adminOnly
  }
}

// Task 4: Voting Logic with Atomic Operations
async function handleVote(commentId: string, userId: string, voteType: 1 | -1) {
  // CRITICAL: Use MongoDB atomic operations to prevent race conditions
  const existingVote = await payload.find({
    collection: 'comments',
    where: {
      id: { equals: commentId },
      'voters.userId': { equals: userId }
    }
  })

  if (existingVote.docs.length > 0) {
    // PATTERN: Handle vote changes atomically
    const currentVote = existingVote.docs[0].voters.find(v => v.userId === userId)
    if (currentVote.vote === voteType) {
      throw new Error('Already voted')
    }
    
    // Change vote: remove old, add new
    await payload.update({
      collection: 'comments',
      id: commentId,
      data: {
        $inc: {
          [`votes.${voteType === 1 ? 'upvotes' : 'downvotes'}`]: 1,
          [`votes.${currentVote.vote === 1 ? 'upvotes' : 'downvotes'}`]: -1,
          'votes.score': voteType * 2 // +2 or -2 for vote change
        },
        $set: {
          'voters.$[elem].vote': voteType,
          'voters.$[elem].timestamp': new Date()
        }
      },
      arrayFilters: [{ 'elem.userId': userId }]
    })
  } else {
    // New vote
    await payload.update({
      collection: 'comments',
      id: commentId,
      data: {
        $inc: {
          [`votes.${voteType === 1 ? 'upvotes' : 'downvotes'}`]: 1,
          'votes.score': voteType
        },
        $push: {
          voters: { userId, vote: voteType, timestamp: new Date() }
        }
      }
    })
  }
}

// Task 5: Spam Protection Hook
async function spamProtectionHook({ data, req }) {
  // PATTERN: Check reCAPTCHA
  const recaptchaToken = req.headers['x-recaptcha-v3']
  if (!recaptchaToken) {
    throw new APIError('reCAPTCHA token required', 400)
  }

  const score = await verifyRecaptcha(recaptchaToken)
  if (score < 0.7) { // GOTCHA: Adjust threshold based on spam levels
    data.isSpam = true
    data.isApproved = false
  }

  // PATTERN: Check honeypot
  if (data._honeypot) { // Hidden field that bots fill
    throw new APIError('Spam detected', 400)
  }

  // PATTERN: Rate limiting
  const identifier = req.user?.id || req.anonymousId
  const recentComments = await checkRateLimit(identifier)
  if (recentComments > 10) { // 10 comments per hour
    throw new APIError('Rate limit exceeded', 429)
  }

  return data
}
```

### Integration Points
```yaml
DATABASE:
  - indexes: 
    - "db.comments.createIndex({ articleId: 1, createdAt: -1 })"
    - "db.comments.createIndex({ articleId: 1, 'votes.score': -1 })"
    - "db.comments.createIndex({ 'voters.userId': 1 })"
  
CONFIG:
  - add to: payload.config.ts
  - collections: [...existingCollections, Comments]
  - plugins: [spamProtection, anonymousTracking, recaptchaPlugin]
  
ENVIRONMENT:
  - add to: .env
  - RECAPTCHA_SECRET_KEY=your_key_here
  - RECAPTCHA_THRESHOLD=0.7
  - RATE_LIMIT_WINDOW=3600000 # 1 hour in ms
  - RATE_LIMIT_MAX_COMMENTS=10

API ENDPOINTS:
  - POST /api/comments/:id/vote
  - GET /api/articles/:id/comments?sort=popular|recent
  - GET /api/comments/:id/replies
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint         # ESLint for TypeScript
npm run type-check   # TypeScript compilation

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests each new feature/file/function use existing test patterns
```typescript
// CREATE tests/comments/voting.test.ts
describe('Comment Voting System', () => {
  it('should record upvote for authenticated user', async () => {
    const comment = await createTestComment()
    const result = await voteOnComment(comment.id, user.id, 1)
    
    expect(result.votes.upvotes).toBe(1)
    expect(result.votes.score).toBe(1)
    expect(result.voters).toHaveLength(1)
  })

  it('should prevent duplicate votes', async () => {
    const comment = await createTestComment()
    await voteOnComment(comment.id, user.id, 1)
    
    await expect(voteOnComment(comment.id, user.id, 1))
      .rejects.toThrow('Already voted')
  })

  it('should allow vote changes', async () => {
    const comment = await createTestComment()
    await voteOnComment(comment.id, user.id, 1)
    const result = await voteOnComment(comment.id, user.id, -1)
    
    expect(result.votes.upvotes).toBe(0)
    expect(result.votes.downvotes).toBe(1)
    expect(result.votes.score).toBe(-1)
  })
})

// CREATE tests/comments/spam.test.ts
describe('Spam Protection', () => {
  it('should block comments without reCAPTCHA token', async () => {
    await expect(createComment({ content: 'Test' }, { headers: {} }))
      .rejects.toThrow('reCAPTCHA token required')
  })

  it('should block comments with low reCAPTCHA score', async () => {
    mockRecaptchaScore(0.3)
    const result = await createComment({ content: 'Test' })
    
    expect(result.isSpam).toBe(true)
    expect(result.isApproved).toBe(false)
  })

  it('should detect honeypot field', async () => {
    await expect(createComment({ 
      content: 'Test',
      _honeypot: 'bot filled this' 
    })).rejects.toThrow('Spam detected')
  })
})
```

```bash
# Run and iterate until passing:
npm test tests/comments --coverage
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start Payload CMS
npm run dev

# Test comment creation
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "x-recaptcha-v3: test_token" \
  -d '{
    "article": "article_id_here",
    "content": "This is a test comment"
  }'

# Expected: {"id": "...", "content": "...", "isApproved": true}

# Test voting
curl -X POST http://localhost:3000/api/comments/comment_id/vote \
  -H "Content-Type: application/json" \
  -d '{"vote": 1}'

# Expected: {"votes": {"upvotes": 1, "downvotes": 0, "score": 1}}
```

## Final validation Checklist
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Comment creation works for anonymous users
- [ ] Voting prevents duplicates
- [ ] Spam protection blocks test spam
- [ ] API responds in <200ms
- [ ] MongoDB indexes are created
- [ ] Environment variables are documented

---

## Anti-Patterns to Avoid
- ❌ Don't store all votes in a single array (use bucketing for scale)
- ❌ Don't allow unlimited comments per user (implement rate limiting)
- ❌ Don't trust client-side validation alone
- ❌ Don't expose internal user IDs in anonymous contexts
- ❌ Don't skip atomic operations for vote updates
- ❌ Don't forget to index frequently queried fields

## Additional Resources for Frontend Implementation
- Use SWR or React Query for comment fetching and caching
- Implement optimistic updates for voting
- Add WebSocket support for real-time comment updates
- Consider virtual scrolling for long comment threads
- Implement client-side reCAPTCHA v3 integration

**PRP Confidence Score: 8.5/10**

The PRP provides comprehensive context for implementing a comment and voting system with spam protection. The score reflects high confidence in the technical approach, with points deducted for:
- Potential complexity in anonymous user tracking implementation
- Need for careful tuning of spam protection thresholds in production
- Possible performance optimizations needed for very high traffic scenarios