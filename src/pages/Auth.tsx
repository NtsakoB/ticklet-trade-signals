import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ALLOWED_EMAIL } from "@/config";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already verified
    const isVerified = localStorage.getItem("ticklet_user_verified") === "true";
    if (isVerified) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check if email matches allowed email
      if (email.trim() === ALLOWED_EMAIL) {
        // Store verification in localStorage
        localStorage.setItem("ticklet_user_verified", "true");
        navigate("/dashboard");
      } else {
        // Show decoy message for incorrect email
        setError("We're working on it.");
      }
    } catch (error) {
      setError("We're working on it.");
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
          className="w-full mb-4 p-2 bg-[#1e293b] rounded text-white outline-none"
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Enter"}
        </button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>
    </div>
  );
}