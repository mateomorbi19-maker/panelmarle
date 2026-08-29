"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

/**
 * Interruptor de encendido/apagado.
 *
 * Se agregó para el botón del agente adentro del chat: un interruptor dice
 * "esto está prendido o apagado" de un vistazo, cosa que un botón con texto no
 * hace. Sigue el mismo estilo que el resto de los componentes del panel.
 */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer border-input bg-input data-checked:bg-primary data-checked:border-primary focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
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
