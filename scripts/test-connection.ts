import { getPayload } from '../lib/payload-client.js';

async function testConnection() {
  try {
    console.log('Testing Payload CMS client and MongoDB connection...');
    
    // This will initialize the Payload client and test the MongoDB connection
    const payload = await getPayload();
    
    // Test a simple query to verify the connection is working
    const users = await payload.find({
      collection: 'users',
      limit: 1,
    });
    
    console.log('✅ Success! Payload CMS and MongoDB are connected.');
    console.log(`Found ${users.totalDocs} user(s) in the database.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing connection:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
