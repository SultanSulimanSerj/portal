import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/database/schemas/*.schema.ts',
  out: './src/database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;