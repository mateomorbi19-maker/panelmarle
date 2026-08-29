"use client"; // Los error boundaries tienen que ser Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { MessagesSquare, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
import { Seccion } from "@/components/seccion";
import { Button } from "@/components/ui/button";

/**
 * Red de seguridad del panel.
 *
 * OJO con lo que dice este cartel. Antes afirmaba "puede ser una caída
 * momentánea de la base de datos" ante CUALQUIER error, y el 29/08/2026 eso
 * mandó a buscar un problema que no existía: la base estaba perfecta y lo que
 * había pasado era que el panel se recompiló con la pantalla abierta, así que
 * el navegador seguía pidiendo archivos de la versión anterior. **Un cartel de
 * error no tiene que adivinar la causa.**
 *
 * Por eso ahora hay DOS botones y no uno: "Reintentar" vuelve a pedir los
 * datos (sirve si fue la conexión), y "Recargar" trae el panel entero de nuevo
 * (es lo único que arregla el caso de la versión vieja en el navegador).
 *
 * Y lleva un enlace a los chats: adentro de un chat la barra general está
 * escondida, así que sin esto un error dejaba la pantalla SIN NINGUNA salida —
 * ni menú, ni flecha para volver.
 *
 * OJO (Next 16): la prop para reintentar se llama `unstable_retry`, NO `reset`
 * como en versiones anteriores.
 */
export default function ErrorPanel({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[panel] error en el segmento del dashboard:", error);
  }, [error]);

  return (
    <Seccion>
      <div className="flex flex-col items-start gap-4 rounded-lg border p-5">
        <div className="flex items-center gap-2">
          <TriangleAlert
            aria-hidden="true"
            className="text-destructive size-5 shrink-0"
          />
          <h2 className="text-base font-semibold">
            No pudimos cargar esta sección
          </h2>
        </div>

        <p className="text-muted-foreground text-sm">
          No se perdió nada: los chats y los mensajes siguen guardados. Puede
          ser la conexión, o que el panel se haya actualizado mientras lo tenías
          abierto.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => unstable_retry()}>
            <RotateCcw aria-hidden="true" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden="true" />
            Recargar el panel
          </Button>
          <Button variant="ghost" render={<Link href="/" />}>
            <MessagesSquare aria-hidden="true" />
            Ir a los chats
          </Button>
        </div>

        {error.digest ? (
          <p className="text-muted-foreground font-mono text-xs break-all">
            Referencia: {error.digest}
          </p>
        ) : null}
      </div>
    </Seccion>
  );
}
