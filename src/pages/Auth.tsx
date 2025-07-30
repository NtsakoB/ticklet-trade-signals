import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hardcoded allowed email - modify this for your use case
  const ALLOWED_EMAIL = "me@ticklet.ai";

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const allowedEmail = ALLOWED_EMAIL;
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || data.user?.email !== allowedEmail) {
        setError("Coming soon");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setError("Coming soon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0f172a] text-white h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6 tracking-wider">Ticklet</h1>
      <form onSubmit={handleLogin} className="w-full max-w-xs">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full mb-2 p-2 bg-[#1e293b] rounded text-white outline-none"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full mb-4 p-2 bg-[#1e293b] rounded text-white outline-none"
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Enter"}
        </button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>
    </div>
  );
}