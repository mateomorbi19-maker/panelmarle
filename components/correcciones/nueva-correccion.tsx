"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mic, SendHorizontal, Square } from "lucide-react";
import { toast } from "sonner";
import { Burbuja } from "@/components/conversaciones/transcripcion";
import { Button } from "@/components/ui/button";
import { contarElegidos } from "@/lib/correcciones";
import type { Canal, Mensaje } from "@/lib/data/types";
import { useDictado } from "@/lib/dictado";
import { cn } from "@/lib/utils";

/**
 * La pantalla donde se escribe la corrección.
 *
 * Se abre después de elegir los mensajes: arriba quedan a la vista los que
 * Marle marcó —para no tener que acordarse de cuáles eran— y abajo el lugar
 * para contar qué estuvo mal.
 *
 * Se puede escribir o dictar. Dictar es lo que va a usar el 90% de las veces:
 * está en el teléfono, con una mano, y explicar "le dijo 47 dólares y son 39"
 * hablando lleva tres segundos y escribiéndolo, medio minuto. Ver `useDictado`.
 *
 * Va como pantalla completa y no como un cuadro flotante: en un teléfono, con
 * el teclado abierto, un modal deja el campo tapado o de 40 px de alto.
 */

/** Igual que el tope del route handler. Se avisa acá para no viajar al pedo. */
const LARGO_MAXIMO = 4000;

function reloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function NuevaCorreccion({
  conversacionId,
  contacto,
  canal,
  mensajes,
  onVolver,
  onGuardada,
}: {
  conversacionId: string;
  /** Con quién era el chat, para poder decirlo en la lista de correcciones. */
  contacto: string;
  canal: Canal;
  /** Los mensajes marcados, en el orden en que aparecen en el chat. */
  mensajes: Mensaje[];
  /** Volver a elegir mensajes, sin perder lo escrito. */
  onVolver: () => void;
  onGuardada: () => void;
}) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);

  // Cada pedazo que el dictado da por cerrado se pega al final. Así se puede
  // dictar, corregir una palabra a mano y seguir dictando.
  const agregar = useCallback((fragmento: string) => {
    setDescripcion((actual) => {
      const base = actual.trimEnd();
      return base ? `${base} ${fragmento}` : fragmento;
    });
  }, []);

  const dictado = useDictado(agregar);

  useEffect(() => {
    if (dictado.error) toast.error(dictado.error);
  }, [dictado.error]);

  // Escape cierra, como cualquier pantalla que se abre encima de otra.
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") onVolver();
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onVolver]);

  // El campo crece con lo que se escribe, hasta un tope.
  useEffect(() => {
    const caja = campo.current;
    if (!caja) return;
    caja.style.height = "auto";
    caja.style.height = `${Math.min(caja.scrollHeight, 200)}px`;
  }, [descripcion]);

  const texto = descripcion.trim();
  const restantes = LARGO_MAXIMO - descripcion.length;
  // Mientras dicta NO se manda: `parar()` cierra la última frase un instante
  // después, y enviar en el medio se comería justo lo último que dijo.
  const puedeEnviar =
    texto.length > 0 && restantes >= 0 && !enviando && !dictado.grabando;

  async function enviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/correcciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversacionId,
          contacto,
          canal,
          descripcion: texto,
          // El texto del mensaje viaja COPIADO: la corrección tiene que seguir
          // diciendo qué dijo el agente aunque después se borre el chat.
          mensajes: mensajes.map((m) => ({
            mensajeId: m.id,
            rol: m.rol,
            texto: m.texto,
            fecha: m.fecha,
          })),
        }),
      });
      const datos = await res.json();

      if (!res.ok) {
        toast.error(datos?.error ?? "No se pudo guardar la corrección.");
        return;
      }

      toast.success("Corrección anotada. Queda en el menú, en Correcciones.");
      onGuardada();
      router.refresh();
    } catch {
      toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="bg-background fixed inset-0 z-50 flex h-dvh flex-col">
      {/* --- La barra ---------------------------------------------------- */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver a elegir los mensajes"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-[15px] font-semibold">Corrección</h1>
          <p className="text-muted-foreground truncate text-xs">
            {contacto} · {contarElegidos(mensajes.length)}
          </p>
        </div>
      </header>

      {/* --- Lo que se marcó, y qué estuvo mal --------------------------- */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-3 py-4">
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground px-1 text-xs font-medium">
            Lo que dijo el agente
          </h2>
          <div className="bg-muted/40 flex flex-col gap-2 rounded-xl border p-2">
            {mensajes.length === 0 ? (
              <p className="text-muted-foreground p-2 text-sm">
                No marcaste ningún mensaje. Se guarda igual, con lo que escribas.
              </p>
            ) : (
              mensajes.map((mensaje) => (
                <Burbuja key={mensaje.id} mensaje={mensaje} />
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <label
            htmlFor="que-paso"
            className="px-1 text-sm font-medium"
          >
            ¿Qué estuvo mal?
          </label>
          <textarea
            ref={campo}
            id="que-paso"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            disabled={enviando}
            // Sin foco automático a propósito: el teclado abriéndose solo tapa
            // el botón de dictar, que es justo por donde se entra a esto. Ya se
            // sacó una vez del chat por lo mismo.
            placeholder="Ej.: le dijo que la Academia sale 47 y hoy está 39."
            className="bg-muted focus-visible:outline-ring max-h-52 min-h-28 w-full resize-none rounded-2xl px-4 py-3 text-[15px] leading-6 outline-none focus-visible:outline-2 disabled:opacity-50"
          />

          {/* Lo que se está escuchando, mientras se escucha. */}
          {dictado.grabando && dictado.parcial ? (
            <p className="text-muted-foreground px-4 text-sm italic">
              {dictado.parcial}
            </p>
          ) : null}

          {restantes < 200 ? (
            <p
              className={cn(
                "px-1 text-xs tabular-nums",
                restantes < 0 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {restantes < 0
                ? `Te pasaste por ${-restantes} caracteres.`
                : `Quedan ${restantes} caracteres.`}
            </p>
          ) : null}
        </section>
      </div>

      {/* --- Dictar y mandar --------------------------------------------- */}
      <div className="bg-background flex shrink-0 items-center gap-2 border-t px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {dictado.grabando ? (
          <>
            <div className="bg-muted flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full px-4">
              <span className="bg-destructive size-2.5 shrink-0 animate-pulse rounded-full" />
              <span className="text-sm tabular-nums">
                {reloj(dictado.segundos)}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                Escuchando…
              </span>
            </div>
            <Button
              size="icon"
              className="size-11 shrink-0 rounded-full"
              onClick={dictado.parar}
              aria-label="Terminar de dictar"
            >
              <Square aria-hidden="true" className="size-4 fill-current" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground h-11 shrink-0 gap-2 rounded-full px-4"
              onClick={dictado.empezar}
              disabled={!dictado.soportado || enviando}
              // Firefox no sabe dictar y no hay nada que hacerle: mejor decirlo
              // que ofrecer un botón que no anda.
              title={
                dictado.soportado
                  ? "Dictar la corrección"
                  : "Este navegador no sabe dictar. Escribila a mano."
              }
            >
              <Mic aria-hidden="true" className="size-5" />
              Dictar
            </Button>

            <span className="min-w-0 flex-1" />

            <Button
              className="h-11 shrink-0 gap-2 rounded-full px-5"
              disabled={!puedeEnviar}
              onClick={() => void enviar()}
            >
              {enviando ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <SendHorizontal aria-hidden="true" className="size-4" />
              )}
              Enviar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
