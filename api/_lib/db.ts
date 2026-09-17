import { neon } from '@neondatabase/serverless';

// One HTTP-driven client per invocation. Neon's serverless driver speaks
// Postgres over fetch, which is what the Edge runtime allows.
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export type Sql = ReturnType<typeof db>;
