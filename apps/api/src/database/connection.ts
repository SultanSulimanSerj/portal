import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schemas';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// For query
const queryClient = postgres(connectionString, { 
  max: 20,
  // Enable RLS context setting
  onnotice: () => {},
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;