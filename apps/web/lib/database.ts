import { createClient } from '@supabase/supabase-js'
import type { Database } from "./schema";

// Create a single supabase client for interacting with the database
export const database = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);