import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Mobile Header with Logo */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border md:hidden">
          <div className="px-4 h-14 flex items-center justify-center">
            <img src={logo} alt="Minha Agenda Online" className="h-8 object-contain" />
          </div>
        </header>
        
        {/* Desktop Title Header */}
        {title && (
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border hidden md:block">
            <div className="px-4 md:px-6 h-14 flex items-center">
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
          </header>
        )}
        
        <main className="flex-1 px-3 md:px-6 py-3 md:py-4 overflow-x-hidden">
          {children}
        </main>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
