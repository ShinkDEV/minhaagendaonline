import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
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
    <div className="min-h-screen bg-background pb-20">
      {title && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 h-14 flex items-center">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
        </header>
      )}
      <main className="px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
