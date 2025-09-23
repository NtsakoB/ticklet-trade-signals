import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { REQUIRE_LOGIN } from "../config";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // If auth is not required (dev mode), bypass authentication
    if (!REQUIRE_LOGIN) {
      setAuthed(true);
      setLoading(false);
      return;
    }

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