import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  // For demo purposes, temporarily bypass auth
  if (import.meta.env.MODE === 'development') {
    return children;
  }

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) { setAuthed(!!data.session); setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => { subscription.unsubscribe(); cancelled = true; };
  }, []);

  if (loading) return null; // or a spinner
  return authed ? children : <Navigate to="/auth" replace />;
}