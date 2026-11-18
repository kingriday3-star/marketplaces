import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up any legacy conflicting manual SW registration so VitePWA's Workbox SW handles updates reliably
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      if (reg.active?.scriptURL?.endsWith('/sw.js')) {
        reg.unregister().catch(() => {});
      }
    });
  }).catch(() => {});
}

// Global capture for direct Android WebAPK / Chrome install prompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    (window as unknown as { deferredPWAInstallPrompt: unknown }).deferredPWAInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa:can-install'));
  });
}

createRoot(document.getElementById('root')!).render(<App />);
