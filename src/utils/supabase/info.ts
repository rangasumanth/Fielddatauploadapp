const rawProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const fallbackAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const fallbackUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined);

const resolveProjectId = (): string | undefined => {
  if (rawProjectId) return rawProjectId;
  if (!fallbackUrl) return undefined;
  try {
    const parsed = new URL(fallbackUrl);
    const hostname = parsed.hostname;
    if (!hostname.endsWith('.supabase.co')) return undefined;
    return hostname.replace('.supabase.co', '');
  } catch {
    return undefined;
  }
};

const projectId = resolveProjectId();
const publicAnonKey = rawAnonKey || fallbackAnonKey;

if (!projectId || !publicAnonKey) {
  console.warn(
    'Missing Supabase config. Provide VITE_SUPABASE_PROJECT_ID/VITE_SUPABASE_ANON_KEY or SUPABASE URL/anon key env vars.'
  );
}

export { projectId, publicAnonKey };
