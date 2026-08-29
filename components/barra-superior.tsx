"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * La barra de arriba del panel.
 *
 * Se esconde adentro de un chat: ahí la barra la pone la propia pantalla del
 * chat, con la foto y el nombre de la persona. Dos barras apiladas se comerían
 * un cuarto del alto de un teléfono para no decir nada nuevo.
 */
export function BarraSuperior() {
  const pathname = usePathname();
  if (/^\/conversaciones\/[^/]+$/.test(pathname)) return null;

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <span className="truncate text-base font-semibold tracking-tight">
        Marle Nails
      </span>
    </header>
  );
}
