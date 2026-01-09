import { Calendar, Users, Scissors, LayoutDashboard, Settings, DollarSign, ChevronLeft, Crown, Percent, Gem, Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Scissors, label: 'Serviços', path: '/services' },
  { icon: Package, label: 'Estoque', path: '/stock' },
  { icon: Percent, label: 'Comissões', path: '/commissions' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

const superAdminNavItems = [
  { icon: Crown, label: 'Super Admin', path: '/super-admin' },
];

const professionalNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: DollarSign, label: 'Comissões', path: '/my-commissions' },
  { icon: Settings, label: 'Perfil', path: '/profile' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = (isAdmin || isSuperAdmin) ? adminNavItems : professionalNavItems;

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen bg-card border-r border-border sticky top-0 transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn(
        "h-16 flex items-center border-b border-border px-3 transition-all duration-300",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <img src={logo} alt="Minha Agenda Online" className="h-10 object-contain" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 transition-transform duration-300 hover:scale-110"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-300",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      <nav className="flex-1 py-4 flex flex-col">
        <ul className="space-y-1 px-2 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn(
                    "text-sm font-medium whitespace-nowrap transition-all duration-300",
                    collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                  )}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Upgrade Section - Admin only */}
        {(isAdmin || isSuperAdmin) && (
          <div className="px-2 mt-4 pt-4 border-t border-border">
            <button
              onClick={() => navigate('/upgrade')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                location.pathname === '/upgrade'
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                  : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? 'Upgrade' : undefined}
            >
              <Gem className="h-5 w-5 shrink-0" />
              <span className={cn(
                "text-sm font-semibold whitespace-nowrap transition-all duration-300",
                collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
              )}>
                Upgrade
              </span>
            </button>
          </div>
        )}

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <div className="mt-4 pt-4 border-t border-border px-2">
            <ul className="space-y-1">
              {superAdminNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className={cn(
                        "text-sm font-medium whitespace-nowrap transition-all duration-300",
                        collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                      )}>
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
