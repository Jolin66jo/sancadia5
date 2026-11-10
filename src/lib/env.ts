function optionalValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const env = {
  supabaseUrl: optionalValue(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: optionalValue(import.meta.env.VITE_SUPABASE_ANON_KEY),
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
