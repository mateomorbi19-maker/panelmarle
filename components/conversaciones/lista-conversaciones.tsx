"use client";

import { startTransition, useOptimistic, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BellRing,
  Bot,
  BotOff,
  MessagesSquare,
  Reply,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AvatarContacto } from "@/components/conversaciones/avatar-contacto";
import { CuadroRespuesta } from "@/components/conversaciones/cuadro-respuesta";
import { Deslizable } from "@/components/conversaciones/deslizable";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Canal, RolMensaje } from "@/lib/data/types";
import type { EstadoVentana } from "@/lib/ventana";
import { cn } from "@/lib/utils";

/**
 * La lista de chats: la pantalla principal del panel.
 *
 * Está pensada para un teléfono, que es donde Marle la va a usar. Se copia el
 * gesto de cualquier app de mensajería: los chats de arriba abajo, cada uno en
 * un renglón que se toca entero, y los filtros en una fila que se corre con el
 * dedo.
 *
 * Regla de oro acá: CADA CHAT ENTRA EN DOS LÍNEAS. Una para quién es y cuándo,
 * otra para lo último que se dijo. Nada se parte en tres renglones ni se pisa
 * con lo de al lado.
 *
 * Y se desliza: corriendo una fila de derecha a izquierda aparece el botón para
 * apagar —o prender— el agente en ESE chat, sin tener que entrar. Antes eso
 * eran tres toques (entrar, tres puntos, interruptor) para algo que se hace
 * muchas veces seguidas. Ver `Deslizable`.
 */

/** Fila ya serializada en el server: fechas y enlaces vienen resueltos. */
export interface ConversacionFila {
  id: string;
  /** Ya resuelto: @usuario en Instagram, nombre o teléfono en WhatsApp. */
  identidad: string;
  canal: Canal;
  nombre?: string;
  telefono?: string;
  igUsername?: string;
  sessionId: string;
  avatarUrl?: string;
  preview: string;
  previewRol?: RolMensaje;
  /** Hora o día del último mensaje, ya resuelto en el server. */
  cuando: string;
  necesitaHumano: boolean;
  /**
   * El agente no contesta en esta conversación. Se muestra SIEMPRE, porque un
   * apagado manual no se vence solo: sin verlo en la lista, una conversación
   * podría quedar muda para siempre sin que nadie se entere.
   */
  agenteApagado: boolean;
  /** Mensajes de los últimos 7 días que el canal no pudo entregar. */
  fallidos: number;
  /** Estado de la ventana de 24 h, resuelto en el server. */
  ventana: EstadoVentana;
  /** A dónde mandarla cuando la ventana está cerrada. */
  enlaceAlternativo?: { href: string; etiqueta: string };
}

type Filtro =
  | "todos"
  | "instagram"
  | "whatsapp"
  | "pendientes"
  | "agente_apagado"
  | "fallidos";

/** El orden importa: es el que se recorre con el dedo. */
const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "instagram", etiqueta: "Instagram" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
  { valor: "pendientes", etiqueta: "Necesita respuesta" },
  { valor: "agente_apagado", etiqueta: "Agente apagado" },
  { valor: "fallidos", etiqueta: "No se entregaron" },
];

/** Quién dijo lo último, en corto. */
const PREFIJO: Record<string, string> = {
  lead: "",
  agente: "Agente: ",
  humano: "Marle: ",
  negocio: "Marle Nails: ",
  sistema: "",
};

/** El nombre del filtro, para poder decirlo en el estado vacío. */
function etiquetaFiltro(valor: Filtro): string {
  return FILTROS.find((f) => f.valor === valor)?.etiqueta ?? "";
}

function Fila({
  fila,
  abierta,
  onAlternar,
  onCerrar,
  deslizada,
  onDeslizar,
  onCerrarDeslizada,
  onCambiarAgente,
}: {
  fila: ConversacionFila;
  abierta: boolean;
  /** El botón: abre esta fila, o la cierra si ya estaba abierta. */
  onAlternar: () => void;
  /**
   * Cerrar SOLO esta fila, y solo si sigue siendo la abierta.
   *
   * No es lo mismo que `onAlternar` y por eso son dos. El envío tarda 1-3 s y
   * el callback sobrevive: si en el medio Marle abre otra conversación, un
   * toggle volvería a abrir ESTA encima de la otra y se llevaría el cursor —
   * con el riesgo de que termine escribiéndole a quien no era.
   */
  onCerrar: () => void;
  /** Está corrida y se ve el botón de prender/apagar el agente. */
  deslizada: boolean;
  onDeslizar: () => void;
  onCerrarDeslizada: () => void;
  onCambiarAgente: () => void;
}) {
  const atencion = fila.necesitaHumano || fila.fallidos > 0;
  const apagado = fila.agenteApagado;

  return (
    <li className="border-border/60 border-b">
      <Deslizable
        abierta={deslizada}
        onAbrir={onDeslizar}
        onCerrar={onCerrarDeslizada}
        accion={{
          // El color dice QUÉ VA A PASAR, no en qué estado está: verde el que
          // prende, rojo el que apaga. Es el mismo criterio del interruptor.
          etiqueta: apagado ? "Activar" : "Apagar",
          tono: apagado ? "exito" : "peligro",
          icono: apagado ? (
            <Bot aria-hidden="true" className="size-5" />
          ) : (
            <BotOff aria-hidden="true" className="size-5" />
          ),
          onAccion: onCambiarAgente,
          descripcion: apagado
            ? `Prender el agente en el chat de ${fila.identidad}`
            : `Apagar el agente en el chat de ${fila.identidad}`,
        }}
      >
        {/*
          El tinte va acá adentro y no en el <li>: lo que se desliza tiene que
          ser opaco para tapar el botón, así que el color de la fila viaja con
          ella. Afuera se perdería apenas se corre.
        */}
        <div
          className={cn(
            fila.necesitaHumano && "bg-primary/[0.04]",
            fila.fallidos > 0 && "bg-destructive/[0.04]"
          )}
        >
          <div className="flex items-center gap-2 px-4 py-2.5">
            <Link
              href={`/conversaciones/${fila.id}`}
              className="focus-visible:outline-ring flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <AvatarContacto conversacion={fila} />

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                {/* Línea 1: quién es · cuándo. Una sola línea, siempre. */}
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[15px] leading-tight",
                      atencion ? "font-semibold" : "font-medium"
                    )}
                  >
                    {fila.identidad}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {fila.cuando}
                  </span>
                </span>

                {/* Línea 2: lo último que se dijo · en qué anda. */}
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground min-w-0 flex-1 truncate text-[13px] leading-tight">
                    {PREFIJO[fila.previewRol ?? "negocio"] ?? ""}
                    {fila.preview || "(sin texto)"}
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    {fila.fallidos > 0 ? (
                      <span title="No se pudo entregar">
                        <AlertTriangle
                          aria-hidden="true"
                          className="text-destructive size-3.5"
                        />
                        <span className="sr-only">
                          {fila.fallidos === 1
                            ? "Un mensaje no llegó"
                            : `${fila.fallidos} mensajes no llegaron`}
                        </span>
                      </span>
                    ) : null}
                    {fila.necesitaHumano ? (
                      <span title="Necesita respuesta">
                        <BellRing
                          aria-hidden="true"
                          className="text-primary size-3.5"
                        />
                        <span className="sr-only">Necesita respuesta</span>
                      </span>
                    ) : apagado ? (
                      <span title="El agente está apagado">
                        <BotOff
                          aria-hidden="true"
                          className="text-muted-foreground size-3.5"
                        />
                        <span className="sr-only">El agente está apagado</span>
                      </span>
                    ) : null}
                  </span>
                </span>
              </span>
            </Link>

            {/*
              Contestar sin entrar al chat. Solo de tablet para arriba: en un
              teléfono el gesto natural es tocar el chat y contestar adentro, y
              un botón más por renglón sería ruido en la pantalla que más se
              mira.
            */}
            <button
              type="button"
              onClick={onAlternar}
              aria-expanded={abierta}
              aria-label={
                abierta
                  ? "Cerrar la respuesta"
                  : `Responderle a ${fila.identidad}`
              }
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring hidden size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 sm:flex"
            >
              {abierta ? (
                <X aria-hidden="true" className="size-4" />
              ) : (
                <Reply aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>

          {abierta ? (
            <div className="flex flex-col gap-2 px-4 pt-1 pb-3">
              <CuadroRespuesta
                conversacionId={fila.id}
                canal={fila.canal}
                nombre={fila.identidad}
                ventana={fila.ventana}
                agenteApagado={fila.agenteApagado}
                enlaceAlternativo={fila.enlaceAlternativo}
                onEnviado={onCerrar}
                autoFoco
              />
            </div>
          ) : null}
        </div>
      </Deslizable>
    </li>
  );
}

export function ListaConversaciones({
  filas,
  agenteGlobalEncendido = true,
}: {
  filas: ConversacionFila[];
  /**
   * El interruptor GENERAL. No bloquea el gesto —prender un chat suelto es un
   * cambio real y queda guardado— pero cambia lo que hay que avisar: con el
   * general apagado, prenderlo acá todavía no hace que nadie conteste.
   */
  agenteGlobalEncendido?: boolean;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  // Una sola fila corrida por vez: dos botones rojos abiertos al mismo tiempo
  // son dos maneras de tocar el que no era.
  const [deslizada, setDeslizada] = useState<string | null>(null);

  // El ícono del agente cambia APENAS se toca, sin esperar al servidor. Cuando
  // llega el dato real React descarta el valor optimista solo; si el servidor
  // dice que no, vuelve como estaba.
  const [vistas, marcarAgente] = useOptimistic(
    filas,
    (actuales, cambio: { id: string; apagado: boolean }) =>
      actuales.map((f) =>
        f.id === cambio.id ? { ...f, agenteApagado: cambio.apagado } : f
      )
  );

  async function guardarAgente(fila: ConversacionFila, encendido: boolean) {
    try {
      const res = await fetch(`/api/conversaciones/${fila.id}/agente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encendido }),
      });
      const datos = await res.json();

      if (!res.ok) {
        toast.error(datos?.error ?? "No se pudo cambiar el estado del agente.");
        // No sabemos de qué lado quedó: mejor volver a preguntar que dejar la
        // lista mostrando algo que no es.
        router.refresh();
        return;
      }

      toast.success(
        encendido
          ? `El agente vuelve a contestar en el chat de ${fila.identidad}.` +
              // Prenderlo acá con el general apagado es un cambio real pero
              // todavía no se nota: hay que decirlo o parece que no anduvo.
              (agenteGlobalEncendido
                ? ""
                : " Ojo: el interruptor general sigue apagado.")
          : `El agente quedó apagado en el chat de ${fila.identidad}.`
      );
      router.refresh();
    } catch {
      toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
      router.refresh();
    }
  }

  function alternarAgente(fila: ConversacionFila) {
    const encendido = fila.agenteApagado;
    // La fila vuelve a su lugar en el acto: lo que confirma que pasó algo es el
    // ícono del renglón, no que el botón se quede abierto.
    setDeslizada(null);
    startTransition(async () => {
      marcarAgente({ id: fila.id, apagado: !encendido });
      await guardarAgente(fila, encendido);
    });
  }

  function pasaFiltro(fila: ConversacionFila, cual: Filtro): boolean {
    if (cual === "instagram") return fila.canal === "instagram";
    if (cual === "whatsapp") return fila.canal === "whatsapp";
    if (cual === "pendientes") return fila.necesitaHumano;
    if (cual === "agente_apagado") return fila.agenteApagado;
    if (cual === "fallidos") return fila.fallidos > 0;
    return true;
  }

  const visibles = vistas.filter((fila) => pasaFiltro(fila, filtro));

  const cuentas = Object.fromEntries(
    FILTROS.map(({ valor }) => [
      valor,
      vistas.filter((f) => pasaFiltro(f, valor)).length,
    ])
  ) as Record<Filtro, number>;

  return (
    <div className="flex flex-col">
      {/*
        Los filtros, fijos arriba mientras se baja por los chats.

        Acá había también un buscador y se sacó: en el teléfono, tocarlo hacía
        que el sistema ofreciera el correo guardado y pidiera la huella, y no
        se pudo dejar quieto. Sin él la pantalla queda además más limpia, que
        es lo que se buscaba. Si vuelve, tiene que volver de una forma que no
        despierte al gestor de contraseñas.
      */}
      <div className="bg-background sticky top-14 z-20 border-b px-4 py-2">
        {/* Se corre con el dedo, como las etiquetas de WhatsApp. */}
        <div className="-mx-4 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {FILTROS.map(({ valor, etiqueta }) => {
              const activo = filtro === valor;
              const cuenta = cuentas[valor];
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  aria-pressed={activo}
                  className={cn(
                    "focus-visible:outline-ring shrink-0 rounded-full border px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                    activo
                      ? "bg-primary text-primary-foreground border-transparent font-medium"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {etiqueta}
                  {valor !== "todos" && cuenta > 0 ? ` ${cuenta}` : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Los chats */}
      {visibles.length === 0 ? (
        <Empty className="m-4 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessagesSquare aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {filtro !== "todos" ? "Nada por acá" : "Todavía no hay chats"}
            </EmptyTitle>
            <EmptyDescription>
              {/* Decir "no hay chats" con la lista llena sería mentir: lo que
                  pasa es que el filtro no deja pasar ninguno, y hay que decir
                  CUÁL. */}
              {filtro !== "todos"
                ? `No hay chats en “${etiquetaFiltro(filtro)}”.`
                : "Cuando entre un mensaje por WhatsApp o Instagram, aparece acá."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col">
          {visibles.map((fila) => (
            <Fila
              key={fila.id}
              fila={fila}
              abierta={respondiendo === fila.id}
              onAlternar={() =>
                setRespondiendo((actual) =>
                  actual === fila.id ? null : fila.id
                )
              }
              onCerrar={() =>
                setRespondiendo((actual) =>
                  actual === fila.id ? null : actual
                )
              }
              deslizada={deslizada === fila.id}
              onDeslizar={() => setDeslizada(fila.id)}
              onCerrarDeslizada={() =>
                setDeslizada((actual) => (actual === fila.id ? null : actual))
              }
              onCambiarAgente={() => alternarAgente(fila)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
