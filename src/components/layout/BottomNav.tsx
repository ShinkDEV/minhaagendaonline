import { Calendar, Users, LayoutDashboard, Settings, DollarSign, Wallet, BarChart3, HelpCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Items visible to admins (salon owners)
const adminNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Wallet, label: 'Financeiro', path: '/financial' },
  { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  { icon: Settings, label: 'Config', path: '/settings' },
];

// Items visible to professionals (limited access)
const professionalNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: DollarSign, label: 'Comissões', path: '/my-commissions' },
  { icon: Settings, label: 'Perfil', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const navItems = isAdmin ? adminNavItems : professionalNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors touch-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}