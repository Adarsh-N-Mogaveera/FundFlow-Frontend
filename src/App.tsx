import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Index from "./pages/Index";
import ExpensesPage from "./pages/Expenses";
import BudgetPage from "./pages/Budget";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Helper Route Guard Component to lock paths down from unauthorized sessions
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <AppNav />
      {children}
    </>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Route: Redirect logged in users directly onto home dashboard panels */}
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />} />

      {/* Secured Shell Paths protected by our route guards */}
      <Route path="/" element={<ProtectedLayout><Index /></ProtectedLayout>} />
      <Route path="/expenses" element={<ProtectedLayout><ExpensesPage /></ProtectedLayout>} />
      <Route path="/budget" element={<ProtectedLayout><BudgetPage /></ProtectedLayout>} />

      {/* Catch All Fallback route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;