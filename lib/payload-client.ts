import { getPayload as getPayloadInstance } from 'payload';
import config from '@/payload.config.mjs';
import mongoose from 'mongoose';

// This ensures we're using the correct config file
console.log('Using config file:', import.meta.url);

type CachedPayload = {
  client: Awaited<ReturnType<typeof getPayloadInstance>> | null;
  promise: Promise<Awaited<ReturnType<typeof getPayloadInstance>>> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var payload: CachedPayload | undefined;
  // eslint-disable-next-line no-var
  var mongoose: any;
}

let cached = global.payload;

if (!cached) {
  cached = global.payload = { client: null, promise: null };
}

// Ensure the MongoDB connection is established
export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('Using existing MongoDB connection');
    return;
  }

  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not defined in environment variables');
  }

  const opts: mongoose.ConnectOptions = {
    bufferCommands: false,
    dbName: 'chip-hosting-admin',
    retryWrites: true,
    w: 'majority' as const
  };

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URI, opts);
    console.log('MongoDB connected successfully');
  } catch (e: any) {
    console.error('MongoDB connection error:', e);
    throw new Error(`MongoDB connection error: ${e.message}`);
  }
};

export const getPayload = async (): Promise<Awaited<ReturnType<typeof getPayloadInstance>>> => {
  try {
    await connectDB();

    if (cached?.client) {
      return cached.client;
    }

    if (!cached?.promise) {
      cached = cached || { client: null, promise: null };
      
      cached.promise = (async () => {
        try {
          console.log('Initializing Payload CMS client...');
          // Initialize with just the config object
          const payload = await getPayloadInstance({ config });
          console.log('Payload CMS client initialized successfully');
          return payload;
        } catch (e: any) {
          console.error('Error initializing Payload:', e);
          throw new Error(`Failed to initialize Payload: ${e.message}`);
        }
      })();
    }

    try {
      if (!cached.promise) {
        throw new Error('Failed to initialize Payload: Promise is null');
      }
      
      const client = await cached.promise;
      cached.client = client;
      return client;
    } catch (e) {
      // Reset the cache if initialization fails
      if (cached) {
        cached.promise = null;
        cached.client = null;
      }
      throw e;
    }
  } catch (error: any) {
    console.error('Error in getPayload:', error);
    throw new Error(`Failed to get Payload instance: ${error.message}`);
  }
};
