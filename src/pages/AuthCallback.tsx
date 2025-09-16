import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, flowType: "pkce", detectSessionInUrl: true } }
);

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) console.error(error);
        window.location.replace("/");
      });
  }, []);
  return <p className="mt-40 text-center">Finishing sign-in…</p>;
}