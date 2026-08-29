"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BotOff } from "lucide-react";
import { toast } from "sonner";
import { CuadroRespuesta } from "@/components/conversaciones/cuadro-respuesta";
import { Burbuja } from "@/components/conversaciones/transcripcion";
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
 */

/** Cuánto se puede despegar del fondo y seguir considerándose "abajo". */
const MARGEN_ABAJO = 80;

interface Pendiente {
  externoId: string;
  mensaje: Mensaje;
}

export function PantallaChat({
  conversacion,
  mensajes,
  ventana,
  enlaceAlternativo,
  children,
}: {
  conversacion: Conversacion;
  mensajes: Mensaje[];
  ventana: EstadoVentana;
  enlaceAlternativo?: { href: string; etiqueta: string };
  /** El aviso, la campaña y la transcripción, ya dibujados en el servidor. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [cambiandoAgente, setCambiandoAgente] = useState(false);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const pegadoAbajo = useRef(true);

  const irAlFondo = useCallback(() => {
    const caja = scroller.current;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }, []);

  // Un chat se abre por lo último. Y se mantiene ahí mientras el contenido
  // crezca: las fotos y los reels reportan su alto DESPUÉS de montar, así que
  // sin esto el chat abría a mitad de camino.
  useEffect(() => {
    const caja = scroller.current;
    if (!caja) return;

    irAlFondo();

    const observador = new ResizeObserver(() => {
      if (pegadoAbajo.current) irAlFondo();
    });
    // Se observa el contenido, no la caja: lo que cambia de alto es lo de
    // adentro (una imagen que carga, un mensaje nuevo).
    for (const hijo of Array.from(caja.children)) observador.observe(hijo);
    return () => observador.disconnect();
  }, [irAlFondo]);

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

  const apagado = conversacion.agenteApagado;

  return (
    <>
      {/* --- La conversación: su propio scroll -------------------------- */}
      <div
        ref={scroller}
        onScroll={alScrollear}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pt-3 pb-2"
      >
        {children}

        {sinConfirmar.map((p) => (
          <Burbuja key={p.externoId} mensaje={p.mensaje} pendiente />
        ))}
      </div>

      {/* --- El cuadro de escribir: FUERA del scroll -------------------- */}
      <div className="bg-background flex shrink-0 flex-col gap-1.5 border-t px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {/*
          El estado del agente se maneja desde el menú de los tres puntos. Acá
          solo queda un aviso, y SOLO cuando está apagado: prendido es lo
          normal y no hace falta decirlo, pero apagado no vence solo y es lo
          que no se puede olvidar.
        */}
        {apagado ? (
          <p className="text-muted-foreground flex items-center gap-1.5 px-1 text-[11px] leading-tight">
            <BotOff aria-hidden="true" className="size-3.5 shrink-0" />
            Agente apagado. Lo que se diga acá queda guardado igual.
          </p>
        ) : null}

        <CuadroRespuesta
          conversacionId={conversacion.id}
          canal={conversacion.canal}
          nombre={identidad(conversacion)}
          ventana={ventana}
          agenteApagado={apagado}
          enlaceAlternativo={enlaceAlternativo}
          onEnviado={alEnviar}
          onCambiarAgente={(encendido) => void cambiarAgente(encendido)}
          cambiandoAgente={cambiandoAgente}
        />
      </div>
    </>
  );
}
