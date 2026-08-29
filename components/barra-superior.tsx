"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, Home, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * La barra de arriba del panel.
 *
 * Tiene UNA sola cosa: el botón que abre el menú. Antes había un menú lateral
 * entero con seis secciones, y no tenía sentido — el panel es la lista de
 * chats, y todo lo demás es una herramienta que se usa cada tanto. Un cajón
 * con dos cosas adentro molesta menos que una barra lateral con seis.
 *
 * Se esconde adentro de un chat: ahí la barra la pone la propia pantalla del
 * chat, con la foto y el nombre de la persona. Dos barras apiladas se comerían
 * un cuarto del alto de un teléfono para no decir nada nuevo.
 */
export function BarraSuperior({
  alertasPendientes = 0,
}: {
  alertasPendientes?: number;
}) {
  const pathname = usePathname();
  if (/^\/conversaciones\/[^/]+$/.test(pathname)) return null;

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Abrir el menú"
              className="hover:bg-muted focus-visible:outline-ring relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          }
        >
          <Plus aria-hidden="true" className="size-5" />
          {/* El punto avisa que hay algo esperando sin tener que abrir. */}
          {alertasPendientes > 0 ? (
            <span className="bg-primary border-background absolute top-1 right-1 size-2.5 rounded-full border-2" />
          ) : null}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem render={<Link href="/resumen" />}>
            <Home aria-hidden="true" />
            Resumen
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/alertas" />}>
            <BellRing aria-hidden="true" />
            Alertas
            {alertasPendientes > 0 ? (
              <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 text-xs font-medium tabular-nums">
                {alertasPendientes}
              </span>
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="truncate text-base font-semibold tracking-tight">
        Marle Nails
      </span>
    </header>
  );
}
