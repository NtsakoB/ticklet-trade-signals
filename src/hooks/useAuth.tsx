import { useState, useEffect, createContext, useContext } from "react";

interface AuthContextType {
  isVerified: boolean;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for verification
    const verified = localStorage.getItem("ticklet_user_verified") === "true";
    setIsVerified(verified);
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem("ticklet_user_verified");
    setIsVerified(false);
    window.location.href = "/auth";
  };

  const value = {
    isVerified,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}