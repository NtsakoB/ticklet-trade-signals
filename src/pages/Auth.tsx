import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, flowType: "pkce", detectSessionInUrl: true } }
);

export default function AuthPage() {
  const [email, setEmail] = useState("");
  async function onEnter(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
    else alert("Check your email for a login link.");
  }
  return (
    <form onSubmit={onEnter} className="flex flex-col gap-3 w-full max-w-md mx-auto mt-40">
      <h1 className="text-center text-3xl font-semibold">Ticklet</h1>
      <input
        className="bg-slate-800 rounded px-3 py-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        required
      />
      <button className="bg-blue-600 hover:bg-blue-700 rounded py-2 text-white" type="submit">
        Enter
      </button>
    </form>
  );
}