import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";
import Backtest from "@/pages/Backtest";
import Paper from "@/pages/Paper";
import AuthPage from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/backtest" element={<RequireAuth><Backtest /></RequireAuth>} />
        <Route path="/paper" element={<RequireAuth><Paper /></RequireAuth>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}