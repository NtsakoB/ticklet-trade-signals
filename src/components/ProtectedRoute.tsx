import React from "react";
import { Navigate } from "react-router-dom";
import { REQUIRE_LOGIN } from "@/config";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!REQUIRE_LOGIN) return <>{children}</>;
  
  // For production, check localStorage for simple auth
  const isVerified = localStorage.getItem("ticklet_user_verified") === "true";
  if (!isVerified) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
}