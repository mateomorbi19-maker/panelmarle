"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir los datos del Server Component cada N segundos.
 *
 * El panel mira conversaciones que están pasando ahora, así que tiene que
 * moverse solo. No hace falta websocket: es monitoreo, no un chat, y un
 * `router.refresh()` cada 20 s alcanza y cuesta una consulta.
 *
 * Se pausa cuando la pestaña no está visible para no pedir de gusto mientras
 * Marle está en otra cosa, y refresca al volver.
 */
export function AutoRefrescar({ segundos = 20 }: { segundos?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);

    function alVolver() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [router, segundos]);

  return null;
}
