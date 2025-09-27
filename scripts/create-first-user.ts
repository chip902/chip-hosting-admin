import { getPayload } from 'payload';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createFirstUser() {
  try {
    console.log('Initializing Payload...');
    
    // Import the config
    const config = await import('../payload.config.js');
    
    // Initialize Payload
    const payload = await getPayload({
      config: config.default
    });

    console.log('Checking for existing users...');
    
    // Check if any users exist
    const existingUsers = await payload.find({
      collection: 'users',
      limit: 1,
    });

    if (existingUsers.docs.length > 0) {
      console.log('Users already exist in the database.');
      console.log('First user email:', existingUsers.docs[0].email);
      process.exit(0);
    }

    console.log('No users found. Creating first admin user...');

    // Create the first user
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@chiphostingadmin.com',
        password: 'AdminPassword123!', // Change this immediately after first login!
      },
    });

    console.log('First admin user created successfully!');
    console.log('Email:', user.email);
    console.log('ID:', user.id);
    console.log('\nIMPORTANT: Please change the password immediately after logging in!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating first user:', error);
    process.exit(1);
  }
}

createFirstUser();