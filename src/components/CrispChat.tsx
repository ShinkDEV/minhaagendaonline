import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Declare Crisp on window
declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

export function initCrisp(websiteId: string) {
  if (typeof window !== 'undefined' && !window.$crisp && websiteId) {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);
  }
}

export function openCrispChat() {
  if (typeof window !== 'undefined' && window.$crisp) {
    window.$crisp.push(['do', 'chat:open']);
  }
}

export function CrispChat() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const loadCrispConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-crisp-config');
        
        if (error) {
          console.error('Error loading Crisp config:', error);
          return;
        }

        if (data?.websiteId) {
          initCrisp(data.websiteId);
          setInitialized(true);
        }
      } catch (err) {
        console.error('Error initializing Crisp:', err);
      }
    };

    loadCrispConfig();
  }, [initialized]);

  return null;
}
