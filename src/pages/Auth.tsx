import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already authenticated
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (session) return <Navigate to="/" replace />;
  
  async function onEnter(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setIsLoading(false);
    if (error) return alert(error.message);
    alert("Magic link sent. Check your email.");
  }
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form onSubmit={onEnter} className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-center text-3xl font-semibold mb-4">Ticklet</h1>
        <p className="text-sm text-slate-300 mb-4 text-center">Enter your email to receive a one-click sign-in link.</p>
        <input
          className="w-full bg-slate-800 rounded px-3 py-3 outline-none focus:ring-2 focus:ring-blue-600"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <button
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded py-3 text-white font-medium"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Sending…" : "Enter"}
        </button>
      </form>
    </main>
  );
}