// Non-secret runtime envs injected by backend /env.js
const w: any = (window as any);
export const SUPABASE_URL = w.__ENV__?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = w.__ENV__?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const BACKEND_URL = w.__ENV__?.BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";