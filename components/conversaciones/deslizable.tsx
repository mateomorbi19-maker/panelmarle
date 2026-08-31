"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Una fila que se corre con el dedo y deja ver un botón atrás.
 *
 * Es el gesto de cualquier app de mensajería: se desliza de derecha a izquierda
 * y aparece la acción. Existe para que apagar el agente en un chat no obligue a
 * entrar, buscar los tres puntos y volver — tres toques para algo que Marle
 * hace todo el tiempo, muchas veces seguidas.
 *
 * DETALLES QUE NO SON CAPRICHO:
 *
 * 1. El gesto se DECIDE en los primeros píxeles. Si el dedo va más para abajo
 *    que para el costado, se suelta y la lista scrollea como siempre. Sin esto
 *    la lista se traba: cualquier scroll medio torcido corría una fila.
 *
 * 2. `touch-action: pan-y` deja el scroll vertical en manos del navegador (que
 *    lo hace bien, a 60 fps) y nos entrega solo lo horizontal.
 *
 * 3. Después de arrastrar NO se navega. La fila entera es un enlace al chat: si
 *    el click siguiera su curso, deslizar abriría la conversación.
 */

/** Cuánto se corre la fila cuando queda abierta. */
const ANCHO = 104;
/** Cuánto hay que arrastrar para que quede abierta (o para que se cierre). */
const UMBRAL_ABRIR = 40;
/** A partir de acá se decide si el gesto es horizontal o vertical. */
const UMBRAL_GESTO = 8;
/** Cuánto se puede estirar más allá del tope, para que no se sienta un muro. */
const ELASTICO = 0.25;
/** Cuánto dura, después de soltar, el click que hay que ignorar. */
const GRACIA_CLICK = 400;

type Direccion = "sin-decidir" | "horizontal" | "vertical";

export interface AccionDeslizada {
  etiqueta: string;
  icono: React.ReactNode;
  /** peligro = rojo (apagar) · exito = verde (activar). */
  tono: "peligro" | "exito";
  /**
   * Lo que hace el botón, dicho entero ("Apagar el agente en el chat de X").
   * La etiqueta visible es de una palabra por el ancho que hay; sola, leída
   * por un lector de pantalla, no dice apagar QUÉ ni de QUIÉN.
   */
  descripcion: string;
  onAccion: () => void;
  /** Se está guardando: el botón se atenúa y no se puede tocar dos veces. */
  pendiente?: boolean;
}

export function Deslizable({
  abierta,
  onAbrir,
  onCerrar,
  accion,
  children,
}: {
  abierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  accion: AccionDeslizada;
  children: React.ReactNode;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const direccion = useRef<Direccion>("sin-decidir");
  /**
   * Cuándo terminó el último arrastre.
   *
   * Es una MARCA DE TIEMPO y no un booleano por dos razones. Con el dedo,
   * arrastrar no dispara `click`, así que un booleano quedaría prendido para
   * siempre y se comería el próximo Enter del teclado. Y con el mouse sí lo
   * dispara: ahí hay que tragarse ese click y NADA más, porque si no la fila
   * se cerraba en el mismo gesto con que se acababa de abrir.
   */
  const finArrastre = useRef(0);
  const [desplazamiento, setDesplazamiento] = useState<number | null>(null);

  const arrastrando = desplazamiento !== null;
  const x = desplazamiento ?? (abierta ? -ANCHO : 0);

  // Abierta y tocás en cualquier otro lado: se cierra. Como en el teléfono.
  useEffect(() => {
    if (!abierta) return;
    function alTocarAfuera(e: PointerEvent) {
      if (contenedor.current?.contains(e.target as Node)) return;
      onCerrar();
    }
    document.addEventListener("pointerdown", alTocarAfuera);
    return () => document.removeEventListener("pointerdown", alTocarAfuera);
  }, [abierta, onCerrar]);

  function alApretar(e: React.PointerEvent<HTMLDivElement>) {
    // Botón derecho o rueda del mouse: no es un gesto de arrastre.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    inicio.current = { x: e.clientX, y: e.clientY };
    direccion.current = "sin-decidir";
  }

  function alMover(e: React.PointerEvent<HTMLDivElement>) {
    const desde = inicio.current;
    if (!desde) return;

    const dx = e.clientX - desde.x;
    const dy = e.clientY - desde.y;

    if (direccion.current === "sin-decidir") {
      if (Math.abs(dx) < UMBRAL_GESTO && Math.abs(dy) < UMBRAL_GESTO) return;
      direccion.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      // Con la captura, el dedo puede salirse de la fila sin que se corte el
      // gesto a la mitad.
      if (direccion.current === "horizontal") {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
    if (direccion.current !== "horizontal") return;

    const base = abierta ? -ANCHO : 0;
    let siguiente = base + dx;
    // Ni se corre para el otro lado ni se pasa del tope: más allá tira poco,
    // así se siente que hay un final sin que sea un golpe seco.
    if (siguiente > 0) siguiente = siguiente * ELASTICO;
    if (siguiente < -ANCHO) siguiente = -ANCHO + (siguiente + ANCHO) * ELASTICO;
    setDesplazamiento(siguiente);
  }

  function alSoltar() {
    const actual = desplazamiento;
    inicio.current = null;
    setDesplazamiento(null);

    if (direccion.current !== "horizontal" || actual === null) {
      direccion.current = "sin-decidir";
      return;
    }
    direccion.current = "sin-decidir";
    finArrastre.current = performance.now();

    if (abierta) {
      // Estando abierta, arrastrar para la derecha la cierra.
      if (actual >= -ANCHO + UMBRAL_ABRIR) onCerrar();
    } else if (actual <= -UMBRAL_ABRIR) {
      onAbrir();
    }
  }

  // Se dispara DESPUÉS de pointerup. Es el último lugar donde se puede frenar
  // la navegación al chat.
  function alHacerClick(e: React.MouseEvent<HTMLDivElement>) {
    // Este click es la cola del arrastre, no un toque: se lo traga y ya. Si acá
    // se cerrara, con el mouse abrir y cerrar serían el mismo gesto.
    if (performance.now() - finArrastre.current < GRACIA_CLICK) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!abierta) return;
    // Abierta, un toque en la fila la cierra: es la salida sin consecuencias.
    e.preventDefault();
    e.stopPropagation();
    onCerrar();
  }

  return (
    <div ref={contenedor} className="relative overflow-hidden">
      {/*
        La acción vive ATRÁS y no se mueve: lo que se corre es la fila. Así el
        botón aparece "desde abajo", que es como se ve en cualquier teléfono.
      */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: ANCHO }}
        aria-hidden={!abierta}
      >
        <button
          type="button"
          // Cerrada, el botón está tapado: si quedara en el orden del tabulador,
          // el teclado y el lector de pantalla irían a parar a algo invisible.
          tabIndex={abierta ? 0 : -1}
          disabled={!abierta || accion.pendiente}
          onClick={accion.onAccion}
          aria-label={accion.descripcion}
          title={accion.descripcion}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-opacity",
            // El texto va del color del FONDO del tema: casi blanco en claro,
            // casi negro en oscuro. Es el único que se lee bien sobre el rojo y
            // sobre el verde en los dos temas.
            accion.tono === "peligro"
              ? "bg-destructive text-background"
              : "bg-exito text-background",
            accion.pendiente && "opacity-60"
          )}
        >
          {accion.icono}
          {accion.etiqueta}
        </button>
      </div>

      <div
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onLostPointerCapture={alSoltar}
        onClickCapture={alHacerClick}
        // La fila es un enlace y adentro hay una foto: sin esto, arrastrar con
        // el mouse arranca el "arrastrar y soltar" del navegador y el gesto se
        // corta a la mitad.
        onDragStart={(e) => e.preventDefault()}
        style={{ transform: `translate3d(${x}px, 0, 0)`, touchAction: "pan-y" }}
        className={cn(
          // Opaca a propósito: si dejara pasar el fondo, se vería el botón
          // rojo por debajo de la fila.
          "bg-background relative",
          !arrastrando && "transition-transform duration-200 ease-out"
        )}
      >
        {children}
      </div>
    </div>
  );
}
