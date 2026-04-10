import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
}

export const metadata: Metadata = {
  title: 'Els Vents de Sant Pere Pescador',
  description: 'Prediccions meteorològiques amb Intel·ligència Artificial per kitesurf a Sant Pere Pescador',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'El Vent',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ca" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // One-time nuclear cleanup: force unregister old SW, clear caches, re-register
                var CURRENT_SW_VERSION = 'v4-20260410';
                if (localStorage.getItem('sw-version') !== CURRENT_SW_VERSION) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    var tasks = regs.map(function(r) { return r.unregister(); });
                    return Promise.all(tasks);
                  }).then(function() {
                    return caches.keys();
                  }).then(function(names) {
                    return Promise.all(names.map(function(n) { return caches.delete(n); }));
                  }).then(function() {
                    localStorage.setItem('sw-version', CURRENT_SW_VERSION);
                    window.location.reload();
                  });
                } else {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('SW registrat', reg.scope);
                      reg.update();
                      setInterval(function() { reg.update(); }, 60 * 1000);

                      reg.addEventListener('updatefound', function() {
                        var newWorker = reg.installing;
                        if (!newWorker) return;
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage('SKIP_WAITING');
                          }
                        });
                      });

                      var refreshing = false;
                      navigator.serviceWorker.addEventListener('controllerchange', function() {
                        if (!refreshing) {
                          refreshing = true;
                          window.location.reload();
                        }
                      });
                    })
                    .catch(function(err) { console.warn('SW error', err) })
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
