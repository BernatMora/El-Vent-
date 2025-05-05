import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Els Vents de Sant Pere Pescador",
  description: "Aplicació per consultar les condicions de vent per kitesurf a Sant Pere Pescador",
  other: {
    // Metadatos para evitar caché
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ca">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
        <Script id="no-cache-script" strategy="beforeInteractive">
          {`
            // Función para forzar la recarga de la página sin caché
            function forceRefresh() {
              // Limpiar caché del navegador para esta página
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  names.forEach(function(name) {
                    caches.delete(name);
                  });
                });
              }
              
              // Verificar si han pasado más de 5 minutos desde la última carga
              const lastLoad = localStorage.getItem('lastPageLoad');
              const now = Date.now();
              
              if (!lastLoad || (now - parseInt(lastLoad)) > 300000) { // 5 minutos
                localStorage.setItem('lastPageLoad', now.toString());
                
                // Si hay un parámetro de refresh en la URL, no recargar para evitar bucles
                if (!window.location.href.includes('refresh=')) {
                  console.log('Forzando recarga sin caché...');
                  window.location.href = window.location.href.split('?')[0] + '?refresh=' + now;
                }
              }
            }
            
            // Ejecutar al cargar la página
            document.addEventListener('DOMContentLoaded', forceRefresh);
            
            // Limpiar localStorage si es necesario
            if (localStorage.getItem('clearCache')) {
              localStorage.clear();
              sessionStorage.clear();
            }
          `}
        </Script>
      </body>
    </html>
  )
}
