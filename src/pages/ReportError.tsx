import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircleWarning, Loader2 } from 'lucide-react';

// Declare Crisp on window
declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

function initCrisp(websiteId: string) {
  if (typeof window !== 'undefined' && websiteId) {
    // Reset Crisp if already loaded
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:show']);
      window.$crisp.push(['do', 'chat:open']);
      return;
    }

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    script.onload = () => {
      // Open chat automatically when loaded
      if (window.$crisp) {
        window.$crisp.push(['do', 'chat:open']);
      }
    };
    document.head.appendChild(script);
  }
}

function hideCrisp() {
  if (typeof window !== 'undefined' && window.$crisp) {
    window.$crisp.push(['do', 'chat:hide']);
  }
}

export default function ReportError() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCrispConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-crisp-config');
        
        if (error) {
          console.error('Error loading Crisp config:', error);
          setError('Erro ao carregar o chat de suporte');
          setLoading(false);
          return;
        }

        if (data?.websiteId) {
          initCrisp(data.websiteId);
          setLoading(false);
        } else {
          setError('Configuração do chat não encontrada');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing Crisp:', err);
        setError('Erro ao inicializar o chat');
        setLoading(false);
      }
    };

    loadCrispConfig();

    // Hide Crisp when leaving the page
    return () => {
      hideCrisp();
    };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportar Erro</h1>
          <p className="text-muted-foreground">
            Fale conosco através do chat para reportar problemas ou tirar dúvidas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleWarning className="h-5 w-5" />
              Chat de Suporte
            </CardTitle>
            <CardDescription>
              Use o chat no canto inferior direito para falar com nossa equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando chat...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <MessageCircleWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{error}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircleWarning className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="font-medium">Chat ativo!</p>
                <p className="text-sm mt-1">
                  Clique no ícone de chat no canto inferior direito da tela
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
