
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StrategyProvider } from "@/hooks/useStrategy";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Chart from "./pages/Chart";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Ai from "./pages/Ai";
import Performance from "./pages/Performance";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StrategyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/chart" element={<ProtectedRoute><Chart /></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute><Ai /></ProtectedRoute>} />
              <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              {/* Auth route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StrategyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
