import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Index from "./pages/Index";
import ExpensesPage from "./pages/Expenses";
import BudgetPage from "./pages/Budget";
import InvestmentsPage from "./pages/Investments";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth() as any;
  const isAuthenticated =
    auth?.isAuthenticated ??
    Boolean(auth?.token || localStorage.getItem("spend_app_token"));

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const auth = useAuth() as any;
  const isAuthenticated =
    auth?.isAuthenticated ??
    Boolean(auth?.token || localStorage.getItem("spend_app_token"));

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      {/* Top sticky user header with integrated navigation items */}
      <Header />

      <Routes>
        {/* Auth Route: Redirect logged in users directly to home dashboard */}
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
        />

        {/* Secured Shell Paths protected by route guards */}
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Index />
            </ProtectedLayout>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedLayout>
              <ExpensesPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/budget"
          element={
            <ProtectedLayout>
              <BudgetPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/investments"
          element={
            <ProtectedLayout>
              <InvestmentsPage />
            </ProtectedLayout>
          }
        />

        {/* Catch All Fallback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
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