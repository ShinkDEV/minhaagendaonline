import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import NewAppointment from "./pages/NewAppointment";
import AppointmentDetail from "./pages/AppointmentDetail";
import Clientes from "./pages/Clientes";
import ClientDetail from "./pages/ClientDetail";
import Servicos from "./pages/Servicos";
import Financeiro from "./pages/Financeiro";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SuperAdmin from "./pages/SuperAdmin";
import MyCommissions from "./pages/MyCommissions";
import CommissionsReport from "./pages/CommissionsReport";
import AcceptInvite from "./pages/AcceptInvite";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import TrialRegister from "./pages/TrialRegister";
import NotFound from "./pages/NotFound";

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
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/trial-register/:code" element={<TrialRegister />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Super admin can access their panel AND all regular routes
  if (isSuperAdmin) {
    return (
      <Routes>
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/appointments/new" element={<NewAppointment />} />
        <Route path="/clients" element={<Clientes />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/services" element={<Servicos />} />
        <Route path="/financial" element={<Financeiro />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/commissions" element={<CommissionsReport />} />
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
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/appointments/:id" element={<AppointmentDetail />} />
      
      {/* Professional routes */}
      <Route path="/my-commissions" element={<MyCommissions />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route path="/profile" element={<Profile />} />
      
      {/* Admin-only routes */}
      <Route path="/appointments/new" element={<AdminRoute><NewAppointment /></AdminRoute>} />
      <Route path="/clients" element={<AdminRoute><Clientes /></AdminRoute>} />
      <Route path="/clients/:id" element={<AdminRoute><ClientDetail /></AdminRoute>} />
      <Route path="/clientes" element={<Navigate to="/clients" replace />} />
      <Route path="/services" element={<AdminRoute><Servicos /></AdminRoute>} />
      <Route path="/servicos" element={<Navigate to="/services" replace />} />
      <Route path="/financial" element={<AdminRoute><Financeiro /></AdminRoute>} />
      <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
      <Route path="/commissions" element={<AdminRoute><CommissionsReport /></AdminRoute>} />
      <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
      <Route path="/upgrade" element={<AdminRoute><Upgrade /></AdminRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
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
