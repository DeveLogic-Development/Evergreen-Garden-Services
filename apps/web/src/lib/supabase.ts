import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(
  env.supabaseUrl ?? 'http://localhost:54321',
  env.supabaseAnonKey ?? 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
