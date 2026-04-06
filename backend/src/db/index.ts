import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.js';

export const db = drizzle(process.env.DATABASE_URL!, { schema, mode: 'default' });

export type Database = typeof db;
