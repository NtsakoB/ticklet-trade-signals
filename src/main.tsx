import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import ErrorBoundary from './ErrorBoundary'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </AuthProvider>
);
