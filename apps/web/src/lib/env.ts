const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined);

export const env = {
  supabaseUrl,
  supabaseAnonKey,
};

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
