// Supabase yapılandırılmış mı? Anahtarlar yoksa uygulama "demo modunda"
// (localStorage) çalışmaya devam eder.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
