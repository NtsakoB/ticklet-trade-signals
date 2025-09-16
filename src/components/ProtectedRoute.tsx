import React from "react";
import { Navigate } from "react-router-dom";
import { REQUIRE_LOGIN } from "@/config";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  if (!REQUIRE_LOGIN) return <>{children}</>;
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  
  if (!session) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
}