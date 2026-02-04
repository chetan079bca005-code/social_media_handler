import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) {
    return;
  }

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  await mongoose.connect(config.databaseUrl, {
    serverSelectionTimeoutMS: 10000,
  });

  isConnected = true;

  const dbName = mongoose.connection.name || 'unknown';
  console.log(`✅ MongoDB connected (db: ${dbName})`);
}

export async function disconnectMongo(): Promise<void> {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
  console.log('🛑 MongoDB disconnected');
}
