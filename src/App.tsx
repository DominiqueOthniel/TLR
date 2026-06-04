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

function PageLoader() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(191,30,46,0.22),transparent_32%),linear-gradient(135deg,#07122f_0%,#0f224d_52%,#5d1020_100%)]">
      <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-amber-400/20" />
      <div className="relative flex w-[min(90vw,360px)] flex-col items-center rounded-3xl border border-white/15 bg-white/10 px-8 py-9 text-center shadow-2xl shadow-black/30">
        <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white shadow-xl">
          <img src="/tlr-logo.jpeg" alt="SIA-TLR" className="h-full w-full object-contain p-2" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">
          SIA-TLR
        </p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-2/3 rounded-full bg-amber-200/80" />
        </div>
      </div>
    </div>
  );
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
          <Suspense fallback={<PageLoader />}>
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
