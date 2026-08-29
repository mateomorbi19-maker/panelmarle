import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Marle Nails",
    template: "%s — Marle Nails",
  },
  description:
    "Los chats de WhatsApp e Instagram de Marle Nails, y el agente que los contesta.",
};

/**
 * El panel se usa en un teléfono.
 *
 * `viewportFit: cover` deja que el contenido llegue hasta los bordes en los
 * teléfonos con muesca; las zonas seguras se respetan con `env(safe-area-*)`
 * donde hace falta. `maximumScale` NO se limita a propósito: bloquear el zoom
 * es una barrera de accesibilidad para quien necesita agrandar.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Que al abrir el teclado la pantalla se ACHIQUE en vez de que el teclado
  // se monte encima: si no, el botón de enviar queda tapado justo cuando se
  // lo va a usar.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        {/*
          Corrido para abajo de la barra fija (56 px): arriba del todo tapaba
          el nombre del chat y la flecha de volver, justo mientras aparecía el
          aviso de que el mensaje salió.
        */}
        <Toaster richColors position="top-center" offset="4.25rem" mobileOffset="4.25rem" />
      </body>
    </html>
  );
}
