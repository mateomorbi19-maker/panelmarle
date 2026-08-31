"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BotOff, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { NuevaCorreccion } from "@/components/correcciones/nueva-correccion";
import { SeleccionMensajes } from "@/components/correcciones/seleccion-mensajes";
import { CuadroRespuesta } from "@/components/conversaciones/cuadro-respuesta";
import { Burbuja } from "@/components/conversaciones/transcripcion";
import { Button } from "@/components/ui/button";
import { contarElegidos, esCorregible } from "@/lib/correcciones";
import type { Conversacion, Mensaje } from "@/lib/data/types";
import { identidad } from "@/lib/identidad";
import type { EstadoVentana } from "@/lib/ventana";

/**
 * La pantalla de un chat: la conversación que scrollea y, abajo, el cuadro
 * para escribir.
 *
 * POR QUÉ ESTO EXISTE Y NO ES SOLO CSS. La primera versión dejaba el cuadro
 * `sticky bottom-0` dentro del scroll del documento, y NO funcionaba: en una
 * columna flex de alto automático, `flex-1` no reparte nada porque no hay
 * espacio libre que repartir — el contenedor mide lo que mide su contenido. El
 * bloque del sticky terminaba midiendo casi lo mismo que el cuadro, así que su
 * recorrido era de unos pocos píxeles y se comportaba como estático. Andaba
 * solo en chats cortos, justo cuando no hacía falta.
 *
 * La forma correcta, y la que usa cualquier app de mensajería: la pantalla
 * mide el alto de la ventana, la conversación tiene SU PROPIO scroll, y el
 * cuadro de escribir queda afuera de ese scroll. Así no puede irse a ningún
 * lado.
 *
 * Además se queda pegado abajo: si Marle está mirando lo último, un mensaje
 * nuevo —o una foto que recién termina de cargar y empuja todo— la deja donde
 * estaba. Si subió a leer algo viejo, NO se la mueve.
 *
 * LOS TRES MODOS. Normal es contestar. "Eligiendo" y "redactando" son las dos
 * mitades de anotar una corrección: primero se marcan los mensajes donde el
 * agente se equivocó, después se cuenta qué pasó. Se entra desde los tres
 * puntos y se sale con Cancelar; nada de esto le llega a la clienta.
 */

/** Cuánto se puede despegar del fondo y seguir considerándose "abajo". */
const MARGEN_ABAJO = 80;

type Modo = "normal" | "eligiendo" | "redactando";

interface Pendiente {
  externoId: string;
  mensaje: Mensaje;
}

export function PantallaChat({
  conversacion,
  mensajes,
  ventana,
  enlaceAlternativo,
  agenteGlobalEncendido,
  children,
}: {
  conversacion: Conversacion;
  mensajes: Mensaje[];
  ventana: EstadoVentana;
  enlaceAlternativo?: { href: string; etiqueta: string };
  /** El interruptor general. Apagado manda sobre el de este chat. */
  agenteGlobalEncendido: boolean;
  /** El aviso, la campaña y la transcripción, ya dibujados en el servidor. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [cambiandoAgente, setCambiandoAgente] = useState(false);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [modo, setModo] = useState<Modo>("normal");
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement>(null);
  const pegadoAbajo = useRef(true);

  const irAlFondo = useCallback(() => {
    const caja = scroller.current;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }, []);

  // Un chat se abre por lo último. Y se mantiene ahí mientras el contenido
  // crezca: las fotos y los reels reportan su alto DESPUÉS de montar, así que
  // sin esto el chat abría a mitad de camino.
  //
  // Depende de `modo` A PROPÓSITO. Al marcar una corrección la transcripción se
  // reemplaza entera por la versión con circulitos, y al volver se reemplaza de
  // nuevo: si el observador siguiera mirando los nodos de antes estaría vigilando
  // cosas que ya no están en la pantalla, y el chat quedaba tildado a mitad de
  // camino en vez de mostrar lo último. Volviendo a correr, cada cambio de modo
  // deja el chat como recién abierto.
  useEffect(() => {
    const caja = scroller.current;
    if (!caja) return;

    pegadoAbajo.current = true;
    // En dos tiempos: primero ya, y de nuevo cuando el navegador terminó de
    // medir lo que se acaba de montar. Sin el segundo, al salir de una
    // corrección el chat quedaba unos cientos de píxeles más arriba.
    irAlFondo();
    const cuadro = requestAnimationFrame(irAlFondo);

    const observador = new ResizeObserver(() => {
      if (pegadoAbajo.current) irAlFondo();
    });
    // Se observa el contenido, no la caja: lo que cambia de alto es lo de
    // adentro (una imagen que carga, un mensaje nuevo).
    for (const hijo of Array.from(caja.children)) observador.observe(hijo);
    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
    };
  }, [irAlFondo, modo]);

  function alScrollear() {
    const caja = scroller.current;
    if (!caja) return;
    const distancia = caja.scrollHeight - caja.scrollTop - caja.clientHeight;
    pegadoAbajo.current = distancia <= MARGEN_ABAJO;
  }

  // En cuanto la ingesta guarda el mensaje, la burbuja provisoria sobra. Se
  // reconoce por el id de Chatwoot, no comparando textos: si Marle manda dos
  // veces lo mismo, cada una tiene su id y ninguna se pisa.
  const sinConfirmar = pendientes.filter(
    (p) => !mensajes.some((m) => m.externoId === p.externoId)
  );

  function alEnviar(
    externoId: string,
    texto: string,
    creadoAt?: string,
    adjunto?: { url?: string; tipo?: string }
  ) {
    pegadoAbajo.current = true;
    setPendientes((previos) => [
      // De paso se sueltan las que ya confirmó la ingesta, para que la lista no
      // crezca sin fin mientras Marle contesta varios mensajes seguidos.
      ...previos.filter(
        (p) => !mensajes.some((m) => m.externoId === p.externoId)
      ),
      {
        externoId,
        mensaje: {
          id: `pendiente-${externoId}`,
          rol: "humano",
          texto,
          fecha: creadoAt ?? new Date().toISOString(),
          externoId,
          // Sin esto, mandar una foto sin comentario dejaba una burbuja vacía
          // hasta que volviera por el webhook.
          adjuntoUrl: adjunto?.url,
          adjuntoTipo: adjunto?.tipo,
        },
      },
    ]);
    // El mensaje recién puesto tiene que quedar a la vista.
    requestAnimationFrame(irAlFondo);
  }

  async function cambiarAgente(encendido: boolean) {
    setCambiandoAgente(true);
    try {
      const res = await fetch(`/api/conversaciones/${conversacion.id}/agente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encendido }),
      });
      const datos = await res.json();

      if (!res.ok) {
        toast.error(datos?.error ?? "No se pudo cambiar el estado del agente.");
        // No sabemos de qué lado quedó: mejor volver a preguntar que mostrar
        // un interruptor que miente.
        router.refresh();
        return;
      }

      toast.success(
        encendido
          ? "El agente vuelve a contestar en este chat."
          : "El agente quedó apagado en este chat."
      );
      router.refresh();
    } catch {
      toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
    } finally {
      setCambiandoAgente(false);
    }
  }

  // --- Marcar una corrección -----------------------------------------------

  function empezarCorreccion() {
    // Con el chat sin ninguna respuesta del agente no hay nada que marcar, y
    // dejarla entrar a una pantalla donde no se puede tocar nada es peor que
    // decírselo.
    if (!mensajes.some((m) => esCorregible(m.rol))) {
      toast.error("Todavía no hay ninguna respuesta del agente para marcar.");
      return;
    }
    setElegidos(new Set());
    setModo("eligiendo");
  }

  function alternarElegido(id: string) {
    setElegidos((actuales) => {
      const siguiente = new Set(actuales);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function salirDeCorreccion() {
    setModo("normal");
    setElegidos(new Set());
  }

  // En el orden del chat, no en el que se fueron tocando: la corrección se lee
  // como se leyó la conversación.
  const marcados = useMemo(
    () => mensajes.filter((m) => elegidos.has(m.id)),
    [mensajes, elegidos]
  );

  const corrigiendo = modo !== "normal";

  return (
    <>
      {/* --- La conversación: su propio scroll -------------------------- */}
      <div
        ref={scroller}
        onScroll={alScrollear}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pt-3 pb-2"
      >
        {corrigiendo ? (
          /*
            Marcando, la transcripción se vuelve a dibujar acá en el navegador
            en vez de usar la del servidor (`children`): los circulitos tienen
            que responder al toque, y eso un Server Component no lo puede
            hacer. Son los MISMOS mensajes y las mismas burbujas.
          */
          <SeleccionMensajes
            mensajes={mensajes}
            elegidos={elegidos}
            onAlternar={alternarElegido}
          />
        ) : (
          <>
            {children}

            {sinConfirmar.map((p) => (
              <Burbuja key={p.externoId} mensaje={p.mensaje} pendiente />
            ))}
          </>
        )}
      </div>

      {/* --- Abajo: escribir, o elegir qué estuvo mal ------------------- */}
      {modo === "normal" ? (
        <div className="bg-background flex shrink-0 flex-col gap-1.5 border-t px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {/*
            El estado del agente se maneja desde el menú de los tres puntos. Acá
            solo queda un aviso, y SOLO cuando está apagado: prendido es lo
            normal y no hace falta decirlo, pero apagado no vence solo y es lo
            que no se puede olvidar.
          */}
          {!agenteGlobalEncendido || conversacion.agenteApagado ? (
            <p className="text-muted-foreground flex items-center gap-1.5 px-1 text-[11px] leading-tight">
              <BotOff aria-hidden="true" className="size-3.5 shrink-0" />
              {!agenteGlobalEncendido
                ? "Agente apagado en todo el panel. Se prende desde la pantalla de chats."
                : "Agente apagado. Lo que se diga acá queda guardado igual."}
            </p>
          ) : null}

          <CuadroRespuesta
            conversacionId={conversacion.id}
            canal={conversacion.canal}
            nombre={identidad(conversacion)}
            ventana={ventana}
            agenteApagado={conversacion.agenteApagado}
            enlaceAlternativo={enlaceAlternativo}
            onEnviado={alEnviar}
            onCambiarAgente={(encendido) => void cambiarAgente(encendido)}
            onCorregir={empezarCorreccion}
            cambiandoAgente={cambiandoAgente}
            agenteGlobalEncendido={agenteGlobalEncendido}
          />
        </div>
      ) : (
        <div className="bg-background flex shrink-0 items-center gap-2 border-t px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={salirDeCorreccion}
            aria-label="Cancelar la corrección"
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2"
          >
            <X aria-hidden="true" className="size-5" />
          </button>

          <p className="min-w-0 flex-1 text-[13px] leading-tight">
            {elegidos.size === 0 ? (
              <span className="text-muted-foreground">
                Tocá los mensajes donde el agente se equivocó.
              </span>
            ) : (
              <span className="font-medium">
                {contarElegidos(elegidos.size)}
              </span>
            )}
          </p>

          <Button
            className="h-11 shrink-0 gap-2 rounded-full px-5"
            disabled={elegidos.size === 0}
            onClick={() => setModo("redactando")}
          >
            <Wrench aria-hidden="true" className="size-4" />
            Siguiente
          </Button>
        </div>
      )}

      {modo === "redactando" ? (
        <NuevaCorreccion
          conversacionId={conversacion.id}
          contacto={identidad(conversacion)}
          canal={conversacion.canal}
          mensajes={marcados}
          // Volver es volver a ELEGIR, no salir: si Marle se dio cuenta de que
          // le faltó un mensaje, tiene que poder sumarlo sin escribir de nuevo.
          onVolver={() => setModo("eligiendo")}
          onGuardada={salirDeCorreccion}
        />
      ) : null}
    </>
  );
}
