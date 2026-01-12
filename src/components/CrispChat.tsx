import { useEffect } from 'react';

// Declare Crisp on window
declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

interface CrispChatProps {
  websiteId: string;
}

export function initCrisp(websiteId: string) {
  if (typeof window !== 'undefined' && !window.$crisp) {
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

export function CrispChat({ websiteId }: CrispChatProps) {
  useEffect(() => {
    initCrisp(websiteId);
  }, [websiteId]);

  return null;
}
