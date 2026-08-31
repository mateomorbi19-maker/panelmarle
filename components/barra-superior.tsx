"use client";

import { startTransition, useOptimistic } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BellRing,
  GraduationCap,
  Home,
  Monitor,
  Moon,
  ShoppingCart,
  Sun,
  Plus,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Marca } from "@/components/marca";
import { Switch, SwitchThumb } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * La barra de arriba del panel.
 *
 * A la izquierda la marca (que además vuelve a los chats) y, de tablet para
 * arriba, el "+" con todas las secciones; a la derecha el interruptor GENERAL
 * del agente y los ajustes. En el teléfono el "+" no está: navega la barra de
 * abajo (`NavInferior`), y dos menús con lo mismo confunden más de lo que
 * ayudan.
 *
 * Se esconde adentro de un chat: ahí la barra la pone la propia pantalla del
 * chat, con la foto y el nombre de la persona. Dos barras apiladas se comerían
 * un cuarto del alto de un teléfono para no decir nada nuevo.
 */
export function BarraSuperior({
  alertasPendientes = 0,
  correccionesPendientes = 0,
  agenteEncendido,
}: {
  alertasPendientes?: number;
  /** Errores del agente anotados y todavía sin arreglar. */
  correccionesPendientes?: number;
  agenteEncendido: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // La bolita se mueve APENAS se toca, sin esperar al servidor. Cuando llega
  // el dato real, React descarta el valor optimista solo. Si el servidor dice
  // que no, vuelve a su lugar: nunca queda mostrando algo que no es.
  const [encendido, setEncendido] = useOptimistic(agenteEncendido);
  const pendiente = encendido !== agenteEncendido;

  if (/^\/conversaciones\/[^/]+$/.test(pathname)) return null;

  async function cambiarAgente(nuevo: boolean) {
    try {
      const res = await fetch("/api/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encendido: nuevo }),
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
        nuevo
          ? "El agente vuelve a contestar."
          : "El agente quedó apagado en todos los chats."
      );
      router.refresh();
    } catch {
      toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
      router.refresh();
    }
  }

  function alTocar(nuevo: boolean) {
    // Dentro de una transición: React mantiene el valor optimista hasta que
    // llega el dato de verdad, y recién ahí lo suelta.
    startTransition(async () => {
      setEncendido(nuevo);
      await cambiarAgente(nuevo);
    });
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur">
      {/* --- Izquierda: la marca y, en pantallas grandes, el menú ------- */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Abrir el menú"
              className="hover:bg-muted focus-visible:outline-ring relative hidden size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex"
            />
          }
        >
          <Plus aria-hidden="true" className="size-5" />
          {/* El punto avisa que hay algo esperando sin tener que abrir. */}
          {alertasPendientes > 0 || correccionesPendientes > 0 ? (
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
          {/*
            Lo que hay que arreglarle al agente. Va acá y no adentro de un chat
            porque se leen todas juntas: son la lista de cambios pendientes del
            prompt, no algo de una conversación en particular.
          */}
          <DropdownMenuItem render={<Link href="/correcciones" />}>
            <Wrench aria-hidden="true" />
            Correcciones
            {correccionesPendientes > 0 ? (
              <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 text-xs font-medium tabular-nums">
                {correccionesPendientes}
              </span>
            ) : null}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Las de cada tanto. En el teléfono viven en "Más". */}
          <DropdownMenuItem render={<Link href="/integrantes" />}>
            <GraduationCap aria-hidden="true" />
            Integrantes
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/contactos" />}>
            <Users aria-hidden="true" />
            Contactos
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/checkouts" />}>
            <ShoppingCart aria-hidden="true" />
            Checkouts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/*
        La marca es el botón de volver a los chats — el mismo lugar donde en
        cualquier app se toca el logo para volver al principio.
      */}
      <Link
        href="/"
        aria-label="Volver a los chats"
        className="hover:bg-muted focus-visible:outline-ring -mx-1 flex min-w-0 flex-1 items-center rounded-lg px-1 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Marca />
      </Link>

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
              "text-xs font-medium transition-colors",
              encendido ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Agente
          </span>
          {/*
            El interruptor NUNCA se desmonta mientras guarda: si desapareciera
            para dar lugar a un spinner, al volver no se sabría si quedó
            prendido o apagado. Mientras espera solo se atenúa.
          */}
          <Switch
            checked={encendido}
            data-pendiente={pendiente}
            onCheckedChange={alTocar}
            aria-label={
              encendido
                ? "Apagar el agente en todos los chats"
                : "Prender el agente"
            }
          >
            <SwitchThumb />
          </Switch>
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
            <DropdownMenuRadioGroup
              // No hace falta esperar a "montado": el menú se dibuja recién
              // al abrirlo, o sea siempre después de hidratar, y para
              // entonces el tema ya se sabe.
              value={theme ?? "system"}
              onValueChange={(valor) => setTheme(valor)}
            >
              {/*
                El título va ADENTRO del grupo a propósito: base-ui tira un
                error si un GroupLabel queda suelto, y con eso el menú entero
                dejaba de abrirse.
              */}
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuRadioItem value="system">
                <Monitor aria-hidden="true" />
                System
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">
                <Sun aria-hidden="true" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon aria-hidden="true" />
                Dark
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
