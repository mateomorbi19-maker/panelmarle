"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

/**
 * Interruptor de encendido/apagado.
 *
 * Verde prendido, gris apagado. La bolita se desliza con una transición, así
 * que NUNCA hay que desmontarlo para mostrar que está cambiando: si el
 * interruptor desaparece y vuelve, uno no sabe si lo prendió o lo apagó. Para
 * el "estoy guardando" se usa `data-pendiente`, que solo lo atenúa.
 */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Verde cuando está prendido: es el color con el que todo el mundo
        // lee "esto está andando", y de un vistazo no hay que pensarlo.
        // Apagado queda gris, como cualquier interruptor.
        "peer border-input bg-input data-checked:bg-exito data-checked:border-exito focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[pendiente=true]:opacity-70",
        className
      )}
      {...props}
    />
  );
}

function SwitchThumb({ className, ...props }: SwitchPrimitive.Thumb.Props) {
  return (
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "bg-background pointer-events-none block size-5 translate-x-0.5 rounded-full shadow-sm transition-transform data-checked:translate-x-[1.125rem]",
        className
      )}
      {...props}
    />
  );
}

export { Switch, SwitchThumb };
