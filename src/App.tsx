import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TrialExpiredGuard } from "@/components/TrialExpiredGuard";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import NewAppointment from "./pages/NewAppointment";
import AppointmentDetail from "./pages/AppointmentDetail";
import Clientes from "./pages/Clientes";
import ClientDetail from "./pages/ClientDetail";
import Servicos from "./pages/Servicos";
import Profissionais from "./pages/Profissionais";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SuperAdmin from "./pages/SuperAdmin";
import MyCommissions from "./pages/MyCommissions";
import AcceptInvite from "./pages/AcceptInvite";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import TrialRegister from "./pages/TrialRegister";
import NotFound from "./pages/NotFound";
import HelpCenter from "./pages/HelpCenter";
import LandingPage from "./pages/LandingPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PaymentSuccess from "./pages/PaymentSuccess";
import ResetPassword from "./pages/ResetPassword";


const queryClient = new QueryClient();

// Component to protect admin-only routes
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, isSuperAdmin, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/site" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/trial-register/:code" element={<TrialRegister />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Super admin can access their panel AND all regular routes
  if (isSuperAdmin) {
    return (
      <Routes>
        {/* Public routes */}
        <Route path="/site" element={<LandingPage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/help" element={<HelpCenter />} />
        
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/appointments/new" element={<NewAppointment />} />
        <Route path="/clients" element={<Clientes />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/services" element={<Servicos />} />
        <Route path="/professionals" element={<Profissionais />} />
        <Route path="/financial" element={<Financeiro />} />
        <Route path="/stock" element={<Estoque />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/commissions" element={<Navigate to="/financial" replace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/my-commissions" element={<MyCommissions />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Routes for salon users (admins and professionals)
  return (
    <TrialExpiredGuard>
      <Routes>
        {/* Public routes */}
        <Route path="/site" element={<LandingPage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        
        {/* Professional routes */}
        <Route path="/my-commissions" element={<MyCommissions />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Shared routes - professionals can also create appointments */}
        <Route path="/appointments/new" element={<NewAppointment />} />
        
        {/* Admin-only routes */}
        <Route path="/clients" element={<AdminRoute><Clientes /></AdminRoute>} />
        <Route path="/clients/:id" element={<AdminRoute><ClientDetail /></AdminRoute>} />
        <Route path="/clientes" element={<Navigate to="/clients" replace />} />
        <Route path="/services" element={<AdminRoute><Servicos /></AdminRoute>} />
        <Route path="/servicos" element={<Navigate to="/services" replace />} />
        <Route path="/professionals" element={<AdminRoute><Profissionais /></AdminRoute>} />
        <Route path="/financial" element={<AdminRoute><Financeiro /></AdminRoute>} />
        <Route path="/stock" element={<AdminRoute><Estoque /></AdminRoute>} />
        <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="/commissions" element={<Navigate to="/financial" replace />} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/upgrade" element={<Upgrade />} />
        
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TrialExpiredGuard>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
