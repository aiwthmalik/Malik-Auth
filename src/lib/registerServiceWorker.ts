export function registerServiceWorker(): void {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(
              new CustomEvent('sw-update', { detail: { registration } })
            );
          }
        });
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });

  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(
      new CustomEvent('pwa-installable', { detail: { prompt: () => deferredPrompt?.prompt() } })
    );
  });

  window.addEventListener('online', () => {
    window.dispatchEvent(new CustomEvent('connection-change', { detail: { online: true } }));
  });

  window.addEventListener('offline', () => {
    window.dispatchEvent(new CustomEvent('connection-change', { detail: { online: false } }));
  });
}
