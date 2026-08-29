"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BellRing,
  Home,
  Loader2,
  Monitor,
  Moon,
  Plus,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch, SwitchThumb } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * La barra de arriba del panel.
 *
 * A la izquierda el "+" con las herramientas; a la derecha el interruptor
 * GENERAL del agente y los ajustes.
 *
 * Se esconde adentro de un chat: ahí la barra la pone la propia pantalla del
 * chat, con la foto y el nombre de la persona. Dos barras apiladas se comerían
 * un cuarto del alto de un teléfono para no decir nada nuevo.
 */
export function BarraSuperior({
  alertasPendientes = 0,
  agenteEncendido,
}: {
  alertasPendientes?: number;
  agenteEncendido: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [cambiando, setCambiando] = useState(false);

  if (/^\/conversaciones\/[^/]+$/.test(pathname)) return null;

  async function cambiarAgente(encendido: boolean) {
    setCambiando(true);
    try {
      const res = await fetch("/api/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encendido }),
      });
      const datos = await res.json();

      if (!res.ok) {
        toast.error(datos?.error ?? "No se pudo cambiar el estado del agente.");
        // No sabemos de qué lado quedó: mejor preguntar de nuevo que mostrar
        // un interruptor que miente.
        router.refresh();
        return;
      }

      toast.success(
        encendido
          ? "El agente vuelve a contestar."
          : "El agente quedó apagado en todos los chats."
      );
      router.refresh();
    } catch {
      toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
    } finally {
      setCambiando(false);
    }
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur">
      {/* --- Izquierda: las herramientas ------------------------------- */}
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

      <span className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
        Marle Nails
      </span>

      {/* --- Derecha: el agente y los ajustes --------------------------- */}
      <div className="flex shrink-0 items-center gap-2">
        {/*
          El interruptor GENERAL. Apagado calla al agente en todos los chats,
          al instante y hasta que lo prendan. Lleva la palabra al lado a
          propósito: un interruptor pelado, sin decir de qué es, se toca sin
          saber lo que se está apagando.
        */}
        <label className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium",
              agenteEncendido ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Agente
          </span>
          {cambiando ? (
            <Loader2
              aria-hidden="true"
              className="text-muted-foreground size-5 animate-spin"
            />
          ) : (
            <Switch
              checked={agenteEncendido}
              onCheckedChange={(encendido) => void cambiarAgente(encendido)}
              aria-label={
                agenteEncendido
                  ? "Apagar el agente en todos los chats"
                  : "Prender el agente"
              }
            >
              <SwitchThumb />
            </Switch>
          )}
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Ajustes"
                className="hover:bg-muted focus-visible:outline-ring flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              />
            }
          >
            <Settings aria-hidden="true" className="size-5" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Tema</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              // No hace falta esperar a "montado": el menú se dibuja recién
              // al abrirlo, o sea siempre después de hidratar, y para
              // entonces el tema ya se sabe.
              value={theme ?? "system"}
              onValueChange={(valor) => setTheme(valor)}
            >
              <DropdownMenuRadioItem value="system">
                <Monitor aria-hidden="true" />
                El del sistema
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon aria-hidden="true" />
                Oscuro
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
