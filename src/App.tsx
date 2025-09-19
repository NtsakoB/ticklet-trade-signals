import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import Index from "@/pages/Index";
import Chat from "@/pages/Chat";
import ChatHistory from "@/pages/ChatHistory";
import Settings from "@/pages/Settings";
import Backtest from "@/pages/Backtest";
import Paper from "@/pages/Paper";
import AuthPage from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import { StrategyProvider } from "@/hooks/useStrategy";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function App() {
  return (
    <ChatProvider>
      <StrategyProvider>
        <BrowserRouter>
          <Routes>
            {/* Primary dashboard */}
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Index /></RequireAuth>} />
            {/* Health probe (debug-only) */}
            <Route path="/__health" element={<div>OK</div>} />
            {/* Other protected routes */}
            <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="/chat/history" element={<RequireAuth><ChatHistory /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/backtest" element={<RequireAuth><Backtest /></RequireAuth>} />
            <Route path="/paper" element={<RequireAuth><Paper /></RequireAuth>} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* SPA fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <ChatWidget />
      </StrategyProvider>
    </ChatProvider>
  );
}