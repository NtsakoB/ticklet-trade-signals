import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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