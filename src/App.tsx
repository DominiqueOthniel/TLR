import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Trucks = lazy(() => import("./pages/Trucks"));
const Trips = lazy(() => import("./pages/Trips"));
const Expenses = lazy(() => import("./pages/Expenses"));
const AcquisitionCosts = lazy(() => import("./pages/AcquisitionCosts"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Drivers = lazy(() => import("./pages/Drivers"));
const ThirdParties = lazy(() => import("./pages/ThirdParties"));
const ParcelShipping = lazy(() => import("./pages/ParcelShipping"));
const Caisse = lazy(() => import("./pages/Caisse"));
const Credits = lazy(() => import("./pages/Credits"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProtectedAppShell() {
  return (
    <ProtectedRoute>
      <AppProvider>
        <Layout>
          <Outlet />
        </Layout>
      </AppProvider>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedAppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/camions" element={<Trucks />} />
                <Route path="/trajets" element={<Trips />} />
                <Route path="/depenses" element={<Expenses />} />
                <Route path="/frais-acquisition" element={<AcquisitionCosts />} />
                <Route path="/factures" element={<Invoices />} />
                <Route path="/chauffeurs" element={<Drivers />} />
                <Route path="/tiers" element={<ThirdParties />} />
                <Route path="/envoi-colis" element={<ParcelShipping />} />
                <Route path="/banque" element={<Navigate to="/caisse" replace />} />
                <Route path="/caisse" element={<Caisse />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/historique" element={<AuditLogs />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
