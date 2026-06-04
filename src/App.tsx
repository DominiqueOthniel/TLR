import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trucks from "./pages/Trucks";
import Trips from "./pages/Trips";
import Expenses from "./pages/Expenses";
import AcquisitionCosts from "./pages/AcquisitionCosts";
import Invoices from "./pages/Invoices";
import Drivers from "./pages/Drivers";
import ThirdParties from "./pages/ThirdParties";
import ParcelShipping from "./pages/ParcelShipping";
import Caisse from "./pages/Caisse";
import Credits from "./pages/Credits";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
