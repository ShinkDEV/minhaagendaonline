import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

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
        {title && (
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
            <div className="px-4 md:px-6 h-14 flex items-center">
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
          </header>
        )}
        <main className="flex-1 px-4 md:px-6 py-4">
          {children}
        </main>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
