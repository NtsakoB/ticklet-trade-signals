import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import ErrorBoundary from './ErrorBoundary'
import { QueryClientProvider } from "@tanstack/react-query"
import queryClient from "./lib/queryClient"

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </AuthProvider>
);
