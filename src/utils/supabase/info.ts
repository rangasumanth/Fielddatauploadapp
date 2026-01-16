const rawProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const fallbackAnonKey =
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.SUPABASE_ANON_KEY as string | undefined);
const fallbackUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  (import.meta.env.SUPABASE_URL as string | undefined);

const resolveProjectIdFromUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (!hostname.endsWith('.supabase.co')) return undefined;
    return hostname.replace('.supabase.co', '');
  } catch {
    return undefined;
  }
};

const projectId = rawProjectId || (fallbackUrl ? resolveProjectIdFromUrl(fallbackUrl) : undefined);
const publicAnonKey = rawAnonKey || fallbackAnonKey;
const supabaseUrl =
  fallbackUrl || (projectId ? `https://${projectId}.supabase.co` : undefined);
const functionName =
  (import.meta.env.VITE_SUPABASE_FUNCTION_NAME as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_FUNCTION_NAME as string | undefined) ||
  'server';
const functionsBase = supabaseUrl ? `${supabaseUrl}/functions/v1/${functionName}` : undefined;
const functionsRoutePrefix = '';

if (!supabaseUrl || !publicAnonKey) {
  console.warn(
    'Missing Supabase config. Provide VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID plus an anon key.'
  );
}

export { projectId, publicAnonKey, supabaseUrl, functionsBase, functionsRoutePrefix };
