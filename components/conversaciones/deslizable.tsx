"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Una fila que se corre con el dedo y deja ver un botón atrás.
 *
 * Es el gesto de cualquier app de mensajería: se desliza de derecha a izquierda
 * y aparece la acción. Existe para que apagar el agente en un chat no obligue a
 * entrar, buscar los tres puntos y volver — tres toques para algo que Marle
 * hace todo el tiempo, muchas veces seguidas.
 *
 * POR QUÉ ESTÁ ESCRITO ASÍ (primera versión: en el teléfono se veía asomar un
 * pedacito del botón y la fila volvía sola a su lugar):
 *
 * 1. LA POSICIÓN VIVE EN UN `ref`, NO EN EL ESTADO DE REACT. `pointermove`
 *    llega 60-120 veces por segundo y React lo trata como evento "continuo":
 *    puede agrupar o demorar esas actualizaciones. Al soltar, el `pointerup`
 *    leía una posición vieja —o directamente `null`— y decidía "no llegó",
 *    devolviendo la fila a su lugar aunque el dedo hubiera ido hasta el final.
 *    Con un ref, lo que decide es SIEMPRE el último valor real.
 *
 * 2. MIENTRAS SE ARRASTRA SE PINTA A MANO (`el.style.transform`), sin pasar por
 *    React. Un re-render por cada movimiento del dedo se siente pegajoso, y una
 *    fila que no sigue al dedo hace que uno la empuje más corto y más rápido —
 *    justo el gesto que antes no abría nada.
 *
 * 3. DECIDE TAMBIÉN LA VELOCIDAD, no solo la distancia. En un teléfono nadie
 *    arrastra despacio 100 px: se tira un manotazo corto y rápido. Con umbral
 *    de distancia solo, ese manotazo no alcanzaba nunca y el gesto parecía roto.
 *
 * 4. EL GESTO SE DECIDE EN LOS PRIMEROS 8 px comparando lo horizontal contra lo
 *    vertical, y `touch-action: pan-y` deja el scroll vertical en manos del
 *    navegador. Sin eso, cualquier scroll medio torcido corría una fila.
 *
 * 5. SI EL NAVEGADOR CORTA EL GESTO (`pointercancel`, que en el teléfono pasa
 *    cuando el sistema se queda con el toque) NO se descarta lo hecho: se
 *    decide con lo que se alcanzó a arrastrar. Descartarlo era otra forma de
 *    que la fila volviera sola.
 */

/** Cuánto se corre la fila cuando queda abierta. */
const ANCHO = 104;
/** Arrastre suficiente para que quede abierta (o para que se cierre). */
const UMBRAL_ABRIR = 28;
/**
 * Un manotazo alcanza aunque sea corto: 0,35 px por milisegundo son unos
 * 350 px/s, bien por debajo de un gesto normal de teléfono (500-2000 px/s) y
 * bien por arriba de un dedo que se apoya y duda.
 */
const VELOCIDAD_MANOTAZO = 0.35;
/** A partir de acá se decide si el gesto es horizontal o vertical. */
const UMBRAL_GESTO = 8;
/** Cuánto se puede estirar más allá del tope, para que no se sienta un muro. */
const ELASTICO = 0.25;
/**
 * Cuánto dura, después de soltar, el click que hay que ignorar.
 *
 * El click que hay que tragarse llega en el mismo suspiro que el `pointerup`
 * (mismo cuadro), así que con esto sobra. Estaba en 400 ms y era demasiado: si
 * cerrabas una fila y tocabas el chat enseguida, el toque se perdía.
 */
const GRACIA_CLICK = 250;
/** Lo que tarda la fila en acomodarse cuando se la suelta. */
const TRANSICION = "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)";

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
  const contenido = useRef<HTMLDivElement>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const direccion = useRef<Direccion>("sin-decidir");
  /** Dónde está la fila AHORA. Esto es lo que manda, no el estado de React. */
  const posicion = useRef(0);
  /** Último movimiento, para saber a qué velocidad venía el dedo. */
  const ultimo = useRef({ x: 0, t: 0 });
  const velocidad = useRef(0);
  /**
   * Cuándo terminó el último arrastre.
   *
   * Es una MARCA DE TIEMPO y no un booleano por dos razones. Con el dedo,
   * arrastrar no dispara `click`, así que un booleano quedaría prendido para
   * siempre y se comería el próximo Enter del teclado. Y con el mouse sí lo
   * dispara: ahí hay que tragarse ese click y NADA más, porque si no la fila
   * se cerraba en el mismo gesto con que se acababa de abrir.
   *
   * Arranca en -Infinity y NO en 0. `performance.now()` cuenta desde que empezó
   * a cargar la página: con 0, durante el primer cuarto de segundo la cuenta
   * daba "recién arrastraste" y se tragaba TODOS los toques. O sea: abrías el
   * panel, tocabas un chat enseguida y no pasaba nada.
   */
  const finArrastre = useRef(Number.NEGATIVE_INFINITY);

  function pintar(x: number, suave: boolean) {
    const el = contenido.current;
    if (!el) return;
    el.style.transition = suave ? TRANSICION : "none";
    el.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  // El estado de verdad lo tiene el padre (una fila abierta por vez). Cuando
  // cambia —porque se abrió otra, o porque se guardó el cambio— la fila se
  // acomoda sola.
  useEffect(() => {
    posicion.current = abierta ? -ANCHO : 0;
    pintar(posicion.current, true);
  }, [abierta]);

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
    ultimo.current = { x: e.clientX, t: e.timeStamp };
    velocidad.current = 0;
  }

  function alMover(e: React.PointerEvent<HTMLDivElement>) {
    const desde = inicio.current;
    if (!desde) return;

    const dx = e.clientX - desde.x;
    const dy = e.clientY - desde.y;

    if (direccion.current === "sin-decidir") {
      if (Math.abs(dx) < UMBRAL_GESTO && Math.abs(dy) < UMBRAL_GESTO) return;
      direccion.current =
        Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      // Con la captura, el dedo puede salirse de la fila sin que se corte el
      // gesto a la mitad.
      if (direccion.current === "horizontal") {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
    if (direccion.current !== "horizontal") return;

    // Velocidad instantánea, en px por milisegundo. Negativa = va a la
    // izquierda, o sea abriendo.
    const dt = e.timeStamp - ultimo.current.t;
    if (dt > 0) velocidad.current = (e.clientX - ultimo.current.x) / dt;
    ultimo.current = { x: e.clientX, t: e.timeStamp };

    const base = abierta ? -ANCHO : 0;
    let siguiente = base + dx;
    // Ni se corre para el otro lado ni se pasa del tope: más allá tira poco,
    // así se siente que hay un final sin que sea un golpe seco.
    if (siguiente > 0) siguiente = siguiente * ELASTICO;
    if (siguiente < -ANCHO) siguiente = -ANCHO + (siguiente + ANCHO) * ELASTICO;

    posicion.current = siguiente;
    pintar(siguiente, false);
  }

  function alSoltar() {
    if (direccion.current !== "horizontal") {
      inicio.current = null;
      direccion.current = "sin-decidir";
      return;
    }

    inicio.current = null;
    direccion.current = "sin-decidir";
    finArrastre.current = performance.now();

    const x = posicion.current;
    const v = velocidad.current;

    // Abre si llegó lo suficiente O si venía rápido para la izquierda. Lo
    // segundo es lo que hace que el manotazo corto de un teléfono funcione.
    const quedaAbierta = abierta
      ? !(x >= -ANCHO + UMBRAL_ABRIR || v >= VELOCIDAD_MANOTAZO)
      : x <= -UMBRAL_ABRIR || v <= -VELOCIDAD_MANOTAZO;

    // Se pinta ACÁ y no solo desde el efecto: si el estado no cambia (se
    // arrastró un poco y se soltó) el efecto no vuelve a correr y la fila
    // quedaría a mitad de camino.
    posicion.current = quedaAbierta ? -ANCHO : 0;
    pintar(posicion.current, true);

    if (quedaAbierta !== abierta) {
      if (quedaAbierta) onAbrir();
      else onCerrar();
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
        ref={contenido}
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        // Si el navegador se queda con el gesto, se decide igual con lo que se
        // alcanzó a arrastrar en vez de tirarlo todo.
        onPointerCancel={alSoltar}
        onClickCapture={alHacerClick}
        // La fila es un enlace y adentro hay una foto: sin esto, arrastrar con
        // el mouse arranca el "arrastrar y soltar" del navegador y el gesto se
        // corta a la mitad.
        onDragStart={(e) => e.preventDefault()}
        // El transform NO se declara acá: lo escribe `pintar()` a mano. Si
        // React lo manejara, lo pisaría en cada re-render y el arrastre daría
        // saltos.
        style={{ touchAction: "pan-y", willChange: "transform" }}
        // Opaca a propósito: si dejara pasar el fondo, se vería el botón rojo
        // por debajo de la fila.
        className="bg-background relative"
      >
        {children}
      </div>
    </div>
  );
}
