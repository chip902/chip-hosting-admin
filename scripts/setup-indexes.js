// MongoDB Index Setup Script for Comment System
// Run this script to create optimal indexes for the comment voting system

const { MongoClient } = require('mongodb');

const DB_NAME = 'chip-hosting-admin';
const MONGODB_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017';

async function setupIndexes() {
  console.log('Setting up MongoDB indexes for comment system...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const commentsCollection = db.collection('comments');
    
    // Index for finding comments by post (most common query)
    await commentsCollection.createIndex(
      { post: 1, createdAt: -1 },
      { 
        name: 'post_createdAt_idx',
        background: true 
      }
    );
    console.log('✓ Created index: post + createdAt');
    
    // Index for finding comments by post sorted by popularity
    await commentsCollection.createIndex(
      { post: 1, 'votes.score': -1 },
      { 
        name: 'post_votes_score_idx',
        background: true 
      }
    );
    console.log('✓ Created index: post + votes.score');
    
    // Index for finding approved comments by post
    await commentsCollection.createIndex(
      { post: 1, isApproved: 1, createdAt: -1 },
      { 
        name: 'post_approved_createdAt_idx',
        background: true 
      }
    );
    console.log('✓ Created index: post + isApproved + createdAt');
    
    // Index for checking user votes (to prevent duplicates)
    await commentsCollection.createIndex(
      { 'voters.userId': 1 },
      { 
        name: 'voters_userId_idx',
        background: true 
      }
    );
    console.log('✓ Created index: voters.userId');
    
    // Index for anonymous user tracking
    await commentsCollection.createIndex(
      { anonymousId: 1 },
      { 
        name: 'anonymousId_idx',
        background: true,
        sparse: true // Only index documents that have this field
      }
    );
    console.log('✓ Created index: anonymousId');
    
    // Index for finding comments by parent (threaded comments)
    await commentsCollection.createIndex(
      { parentComment: 1, createdAt: 1 },
      { 
        name: 'parentComment_createdAt_idx',
        background: true,
        sparse: true // Only index documents that have parent comments
      }
    );
    console.log('✓ Created index: parentComment + createdAt');
    
    // Index for spam detection queries
    await commentsCollection.createIndex(
      { isSpam: 1, createdAt: -1 },
      { 
        name: 'spam_createdAt_idx',
        background: true 
      }
    );
    console.log('✓ Created index: isSpam + createdAt');
    
    // Index for IP-based rate limiting
    await commentsCollection.createIndex(
      { ipAddress: 1, createdAt: -1 },
      { 
        name: 'ipAddress_createdAt_idx',
        background: true,
        sparse: true
      }
    );
    console.log('✓ Created index: ipAddress + createdAt');
    
    // Compound index for moderation queries
    await commentsCollection.createIndex(
      { isApproved: 1, isSpam: 1, createdAt: -1 },
      { 
        name: 'moderation_idx',
        background: true 
      }
    );
    console.log('✓ Created index: moderation (isApproved + isSpam + createdAt)');
    
    // Update posts collection to add index for commentCount
    const postsCollection = db.collection('posts');
    await postsCollection.createIndex(
      { commentCount: -1 },
      { 
        name: 'commentCount_idx',
        background: true 
      }
    );
    console.log('✓ Created index: posts.commentCount');
    
    console.log('\n🎉 All indexes created successfully!');
    console.log('\nCreated indexes:');
    
    const indexes = await commentsCollection.indexes();
    indexes.forEach(index => {
      if (index.name !== '_id_') {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      }
    });
    
  } catch (error) {
    console.error('Error setting up indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the setup
if (require.main === module) {
  setupIndexes().catch(console.error);
}

module.exports = { setupIndexes };