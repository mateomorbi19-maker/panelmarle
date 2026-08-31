"use client";

import { Check } from "lucide-react";
import { Burbuja } from "@/components/conversaciones/transcripcion";
import { esCorregible } from "@/lib/correcciones";
import type { Mensaje } from "@/lib/data/types";
import { diaDeChat } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * El chat, pero para elegir qué estuvo mal.
 *
 * Es la misma transcripción de siempre con un circulito a la izquierda de cada
 * mensaje del agente. Lo que no se puede marcar —lo que escribió la clienta, lo
 * que escribió Marle— se atenúa en vez de esconderse: sin el ida y vuelta
 * alrededor, una respuesta suelta no se entiende, y hay que poder LEER la
 * conversación mientras se elige.
 *
 * POR QUÉ NO ES UN <button>. La burbuja son `div`s (imágenes, audios, avisos de
 * entrega), y meter eso adentro de un botón es HTML inválido. Con
 * `role="checkbox"` + `aria-checked` + teclado la fila se comporta igual para
 * el mouse, el dedo y un lector de pantalla, y encima describe mejor lo que es:
 * se pueden marcar varios, no es un botón que se aprieta.
 */
export function SeleccionMensajes({
  mensajes,
  elegidos,
  onAlternar,
}: {
  mensajes: Mensaje[];
  elegidos: Set<string>;
  onAlternar: (id: string) => void;
}) {
  // El corte de día se resuelve ANTES de dibujar, igual que en la
  // transcripción normal: comparando cada mensaje con el anterior.
  const dias = mensajes.map((mensaje) => diaDeChat(mensaje.fecha));

  return (
    <div className="flex flex-col gap-2">
      {mensajes.map((mensaje, i) => {
        const separador = dias[i] !== dias[i - 1] ? dias[i] : null;
        const marcable = esCorregible(mensaje.rol);
        const elegido = elegidos.has(mensaje.id);

        return (
          <div key={mensaje.id} className="flex flex-col gap-2">
            {separador ? (
              <div className="my-2 flex items-center gap-3">
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs first-letter:uppercase">
                  {separador}
                </span>
                <span className="bg-border h-px flex-1" />
              </div>
            ) : null}

            {marcable ? (
              <div
                role="checkbox"
                aria-checked={elegido}
                aria-label={`Marcar: ${mensaje.texto?.slice(0, 80) || "mensaje sin texto"}`}
                tabIndex={0}
                onClick={() => onAlternar(mensaje.id)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  // Espacio scrollea la página si no se lo frena.
                  e.preventDefault();
                  onAlternar(mensaje.id);
                }}
                className={cn(
                  "focus-visible:outline-ring flex cursor-pointer items-center gap-2 rounded-2xl py-0.5 pr-0.5 pl-1 transition-colors focus-visible:outline-2",
                  elegido && "bg-primary/10"
                )}
              >
                {/*
                  El círculo va a la IZQUIERDA de todo, no pegado a la burbuja:
                  los mensajes del agente están alineados a la derecha, así que
                  todos los círculos quedan en la misma columna y se van
                  marcando bajando el dedo por el borde.
                */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    elegido
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  )}
                >
                  {elegido ? <Check className="size-3.5" /> : null}
                </span>

                <div className="min-w-0 flex-1">
                  <Burbuja mensaje={mensaje} />
                </div>
              </div>
            ) : (
              // Se sigue leyendo, pero se ve que no es de las que se marcan.
              <div className="pointer-events-none pl-7 opacity-45">
                <Burbuja mensaje={mensaje} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
