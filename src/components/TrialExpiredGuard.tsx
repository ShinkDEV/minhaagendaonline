import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface TrialExpiredGuardProps {
  children: React.ReactNode;
}

// Routes that are always accessible even when trial expired
const ALLOWED_ROUTES = [
  '/upgrade',
  '/profile',
  '/site',
  '/terms',
  '/privacy',
  '/reset-password',
  '/report-error',
];

export function TrialExpiredGuard({ children }: TrialExpiredGuardProps) {
  const { trialExpired, trialCancelled, salonPlan, loading } = useAuth();
  const location = useLocation();

  // Still loading auth state
  if (loading) {
    return null;
  }

  // Check if current route is allowed
  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  // If trial expired or cancelled AND user doesn't have a paid plan, block access
  const shouldBlock = (trialExpired || trialCancelled) && !salonPlan;

  if (shouldBlock && !isAllowedRoute) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
