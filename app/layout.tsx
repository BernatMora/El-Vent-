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
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) { console.log('SW registrat', reg.scope) })
                  .catch(function(err) { console.warn('SW error', err) })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
