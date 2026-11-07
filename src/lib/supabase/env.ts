export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False until .env.local (or Vercel env vars) are filled in. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
