"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  GraduationCap,
  Home,
  MessagesSquare,
  MoreHorizontal,
  ShoppingCart,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * La navegación de abajo, solo en el teléfono.
 *
 * Antes todo vivía en el menú "+" de arriba a la izquierda: dos toques para
 * cualquier sección y cero pistas de dónde estabas parada. Esto pone lo que se
 * usa a diario a la altura del pulgar, como en cualquier app de mensajería:
 *
 *   Chats · Resumen · Alertas · Más
 *
 * "Más" NO es un cajón de sastre creativo: junta exactamente las secciones
 * reales que se usan cada tanto (Correcciones, Integrantes, Contactos,
 * Checkouts). Meter los ocho destinos en la barra los haría a todos enanos.
 *
 * Se esconde adentro de un chat —ahí abajo está el cuadro de escribir, que
 * importa más— y en pantallas sm+ desaparece: en tablet/escritorio navega el
 * menú "+" de la barra de arriba, y dos navegaciones a la vez son ruido.
 */

const PRINCIPALES: { href: string; etiqueta: string; Icono: LucideIcon }[] = [
  { href: "/", etiqueta: "Chats", Icono: MessagesSquare },
  { href: "/resumen", etiqueta: "Resumen", Icono: Home },
  { href: "/alertas", etiqueta: "Alertas", Icono: BellRing },
];

const SECUNDARIAS: { href: string; etiqueta: string; Icono: LucideIcon; detalle: string }[] = [
  { href: "/correcciones", etiqueta: "Correcciones", Icono: Wrench, detalle: "Lo que hay que arreglarle al agente" },
  { href: "/integrantes", etiqueta: "Integrantes", Icono: GraduationCap, detalle: "Las que pagaron la Academia" },
  { href: "/contactos", etiqueta: "Contactos", Icono: Users, detalle: "Todas las que pasaron por el chat" },
  { href: "/checkouts", etiqueta: "Checkouts", Icono: ShoppingCart, detalle: "Pagos que quedaron por la mitad" },
];

export function NavInferior({
  alertasPendientes = 0,
  correccionesPendientes = 0,
}: {
  alertasPendientes?: number;
  correccionesPendientes?: number;
}) {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);

  // Adentro de un chat la barra molesta: abajo está el cuadro de escribir.
  if (/^\/conversaciones\/[^/]+$/.test(pathname)) return null;

  const enSecundaria = SECUNDARIAS.some((d) => pathname === d.href);

  return (
    <>
      {/*
        El hueco que la barra fija le come a la página. Va EN el flujo para que
        lo último de cada lista pueda scrollear por encima de la barra y no
        quede tapado justo el renglón que se quería leer.
      */}
      <div
        aria-hidden="true"
        className="h-[calc(3.75rem+env(safe-area-inset-bottom))] shrink-0 sm:hidden"
      />

      <nav
        aria-label="Secciones del panel"
        className="border-border/70 bg-background/95 supports-[backdrop-filter]:bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <div className="mx-auto flex h-15 max-w-md items-stretch">
          {PRINCIPALES.map(({ href, etiqueta, Icono }) => {
            const activa = pathname === href;
            const cuenta = href === "/alertas" ? alertasPendientes : 0;
            return (
              <Link
                key={href}
                href={href}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "focus-visible:outline-ring flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
                  activa
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative">
                  <Icono
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={activa ? 2.4 : 2}
                  />
                  {cuenta > 0 ? (
                    <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
                      {cuenta > 9 ? "9+" : cuenta}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    activa && "font-semibold"
                  )}
                >
                  {etiqueta}
                </span>
              </Link>
            );
          })}

          <Sheet open={masAbierto} onOpenChange={setMasAbierto}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Más secciones"
                  className={cn(
                    "focus-visible:outline-ring flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
                    enSecundaria
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                />
              }
            >
              <span className="relative">
                <MoreHorizontal
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={enSecundaria ? 2.4 : 2}
                />
                {/* El punto avisa que adentro hay algo esperando. */}
                {correccionesPendientes > 0 ? (
                  <span className="bg-primary border-background absolute -top-0.5 -right-1 size-2.5 rounded-full border-2" />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-none",
                  enSecundaria && "font-semibold"
                )}
              >
                Más
              </span>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <SheetHeader className="pb-0">
                <SheetTitle className="font-heading text-lg">
                  Herramientas
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Las secciones del panel que se usan cada tanto.
                </SheetDescription>
              </SheetHeader>

              <ul className="flex flex-col px-2">
                {SECUNDARIAS.map(({ href, etiqueta, Icono, detalle }) => {
                  const activa = pathname === href;
                  const cuenta =
                    href === "/correcciones" ? correccionesPendientes : 0;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        // El sheet no sabe de navegaciones: sin esto quedaba
                        // abierto tapando la sección a la que se acababa de ir.
                        onClick={() => setMasAbierto(false)}
                        aria-current={activa ? "page" : undefined}
                        className={cn(
                          "hover:bg-muted focus-visible:outline-ring flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition-colors focus-visible:outline-2",
                          activa && "bg-accent"
                        )}
                      >
                        <span className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                          <Icono aria-hidden="true" className="size-4" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm font-medium">{etiqueta}</span>
                          <span className="text-muted-foreground truncate text-xs">
                            {detalle}
                          </span>
                        </span>
                        {cuenta > 0 ? (
                          <span className="bg-primary text-primary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                            {cuenta}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
