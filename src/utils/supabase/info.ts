const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!projectId || !publicAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_PROJECT_ID or VITE_SUPABASE_ANON_KEY. Check your environment variables.'
  );
}

export { projectId, publicAnonKey };
