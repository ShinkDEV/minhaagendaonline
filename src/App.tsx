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
import Servicos from "./pages/Servicos";
import Financeiro from "./pages/Financeiro";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, isSuperAdmin } = useAuth();

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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Redirect super_admin to their panel
  if (isSuperAdmin) {
    return (
      <Routes>
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/appointments/new" element={<NewAppointment />} />
      <Route path="/appointments/:id" element={<AppointmentDetail />} />
      <Route path="/clients" element={<Clientes />} />
      <Route path="/clientes" element={<Navigate to="/clients" replace />} />
      <Route path="/services" element={<Servicos />} />
      <Route path="/servicos" element={<Navigate to="/services" replace />} />
      <Route path="/financial" element={<Financeiro />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
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
