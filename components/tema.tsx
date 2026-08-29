"use client";

import { ThemeProvider } from "next-themes";

/**
 * El tema del panel: el del sistema, o oscuro a la fuerza.
 *
 * `attribute="class"` porque el modo oscuro del panel está definido por clase
 * (`.dark` en globals.css), no por media query. `disableTransitionOnChange`
 * evita que al cambiar de tema todo el panel haga un fundido raro.
 */
export function ProveedorDeTema({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
