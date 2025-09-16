import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }, // allow-list only
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (data?.session) window.location.replace("/");
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-center text-3xl font-semibold mb-4">Ticklet</h1>

        {!sent ? (
          <form onSubmit={sendCode} className="space-y-3">
            <p className="text-sm text-slate-300">Enter your allowed email.</p>
            <input
              className="w-full bg-slate-800 rounded px-3 py-3 outline-none focus:ring-2 focus:ring-blue-600"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
            <button className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded py-3 text-white font-medium" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send code"}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <p className="text-xs text-slate-400">Only pre-approved emails can sign in.</p>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-sm text-slate-300">We sent a 6-digit code to <b>{email}</b>.</p>
            <input
              className="w-full bg-slate-800 rounded px-3 py-3 tracking-widest text-center text-lg"
              inputMode="numeric" pattern="[0-9]*" maxLength={10}
              placeholder="123456"
              value={code}
              onChange={(e)=>setCode(e.target.value)}
              required
            />
            <button className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded py-3 text-white font-medium" type="submit" disabled={busy || code.trim().length < 6}>
              {busy ? "Verifying…" : "Verify & enter"}
            </button>
            <button
              type="button"
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 rounded py-3 text-white"
              onClick={async ()=>{
                setBusy(true); setError(null);
                const { error } = await supabase.auth.signInWithOtp({
                  email,
                  options: { shouldCreateUser: false },
                });
                setBusy(false);
                if (error) setError(error.message);
              }}
              disabled={busy}
            >
              Resend code
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="w-full text-slate-300 underline mt-1" type="button" onClick={()=>{ setSent(false); setCode(""); }}>
              Use a different email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}