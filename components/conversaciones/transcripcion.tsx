import {
  AlertTriangle,
  Check,
  CheckCheck,
  Clock,
  Paperclip,
} from "lucide-react";
import type { Mensaje, RolMensaje } from "@/lib/data/types";
import { ETIQUETA_ENTREGA, motivoDeFalla } from "@/lib/entrega";
import { diaDeChat, horaCorta } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * El chat completo, en burbujas. Server Component: acá se resuelven las fechas
 * con la zona horaria del panel, así el cliente solo muestra.
 *
 * Quién habla:
 *   lead              → la clienta, a la izquierda.
 *   agente / humano   → a la derecha, diferenciados.
 *   negocio           → a la derecha, sin firmar: salió de la cuenta y todavía
 *                       no se puede saber si lo escribió el agente o Marle.
 *   sistema           → una nota centrada, no es parte de la charla.
 */

const AUTOR: Record<RolMensaje, string> = {
  lead: "",
  agente: "Agente",
  humano: "Marle",
  negocio: "Marle Nails",
  sistema: "",
};

const URL_SUELTA = /(https?:\/\/[^\s]+)/g;
// Para PREGUNTAR se usa otra regex sin la /g: `test()` sobre una global va
// moviendo `lastIndex` y devuelve false una de cada dos veces.
const ES_URL = /^https?:\/\//;

/**
 * Convierte los links en enlaces reales sin tocar el HTML a mano: todo sale
 * como nodos de React, así que un mensaje de una clienta no puede inyectar
 * nada.
 */
function conEnlaces(texto: string) {
  return texto.split(URL_SUELTA).map((parte, i) =>
    ES_URL.test(parte) ? (
      <a
        key={i}
        href={parte}
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2"
      >
        {parte}
      </a>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}

/**
 * Un archivo dentro de una burbuja.
 *
 * Se muestra el archivo EN SÍ y no un link: si una clienta manda una foto de
 * sus uñas o un audio contando su problema, Marle tiene que verlo o
 * escucharlo sin salir del panel. Un enlace que hay que abrir en otra pestaña
 * hace que no se mire.
 *
 * Los tipos NO son los obvios. En producción, lo único que hay hoy es
 * `ig_reel` y `ig_post`: reels y publicaciones de Instagram que las clientas
 * comparten al chat. Se verificó qué son de verdad pidiendo las URLs:
 * ig_post viene como image/jpeg, e ig_reel como application/octet-stream (un
 * video servido sin declarar el tipo). Por eso el reel lleva además un enlace
 * abajo: si el navegador no se anima a reproducirlo, igual se puede abrir.
 *
 * Limitación conocida: la ingesta guarda solo el PRIMER archivo de cada
 * mensaje. En los DMs casi siempre va uno por mensaje, así que se dejó así
 * antes que armar una tabla aparte para un caso que no pasa.
 */
function Adjunto({ url, tipo }: { url: string; tipo?: string }) {
  if (tipo === "image" || tipo === "ig_post") {
    return (
      <a href={url} target="_blank" rel="noreferrer noopener" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Imagen del mensaje"
          className="max-h-72 w-auto rounded-lg object-contain"
          loading="lazy"
        />
      </a>
    );
  }

  if (tipo === "audio") {
    return (
      <audio controls preload="none" src={url} className="w-full max-w-[20rem]">
        <a href={url} target="_blank" rel="noreferrer noopener">
          Escuchar el audio
        </a>
      </audio>
    );
  }

  if (tipo === "video" || tipo === "ig_reel") {
    return (
      <span className="flex flex-col gap-1">
        <video
          controls
          preload="metadata"
          src={url}
          className="max-h-72 w-auto rounded-lg"
        />
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-muted-foreground text-xs underline underline-offset-2"
        >
          {tipo === "ig_reel" ? "Abrir el reel" : "Abrir el video"}
        </a>
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center gap-1.5 text-sm underline underline-offset-2"
    >
      <Paperclip aria-hidden="true" className="size-3.5" />
      Abrir el archivo
    </a>
  );
}

/**
 * Una burbuja del chat.
 *
 * `pendiente` es para los mensajes que Marle acaba de mandar desde el panel y
 * todavía no volvieron por el webhook de Chatwoot: se muestran en el acto,
 * apagados, y se reemplazan por el real cuando la ingesta lo guarda.
 */
export function Burbuja({
  mensaje,
  pendiente = false,
}: {
  mensaje: Mensaje;
  pendiente?: boolean;
}) {
  const esClienta = mensaje.rol === "lead";
  // Un mensaje que no llegó no puede parecerse a uno que sí. Es LA razón de
  // ser de la Fase 2: antes esto se veía igual que un mensaje entregado.
  const fallo = !pendiente && !esClienta && mensaje.estado === "failed";
  // El estado de entrega es de lo que SALE. Los mensajes de la clienta también
  // traen estado en Chatwoot, pero ponerles tildes no querría decir nada:
  // WhatsApp tampoco marca lo que uno recibe.
  const estadoVisible = !pendiente && !esClienta ? mensaje.estado : undefined;

  if (mensaje.rol === "sistema") {
    return (
      <p className="text-muted-foreground my-1 text-center text-xs">
        {mensaje.texto} · {horaCorta(mensaje.fecha)}
      </p>
    );
  }

  return (
    <div className={cn("flex", esClienta ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "flex max-w-[min(34rem,85%)] flex-col gap-1 rounded-2xl px-3.5 py-2",
          esClienta
            ? "bg-muted rounded-bl-sm"
            : mensaje.rol === "humano"
              ? "bg-primary/20 text-foreground rounded-br-sm ring-1 ring-primary/30"
              : "bg-primary/10 text-foreground rounded-br-sm ring-1 ring-primary/15",
          pendiente && "opacity-60",
          fallo && "bg-destructive/5 ring-destructive/30"
        )}
      >
        {!esClienta && AUTOR[mensaje.rol] ? (
          <span className="text-muted-foreground text-[11px] font-medium">
            {AUTOR[mensaje.rol]}
          </span>
        ) : null}

        {mensaje.texto ? (
          <p className="text-sm whitespace-pre-wrap break-words">
            {conEnlaces(mensaje.texto)}
          </p>
        ) : null}

        {fallo ? (
          <p className="border-destructive/30 bg-destructive/10 text-destructive mt-1 rounded-md border px-2 py-1 text-xs">
            {motivoDeFalla(mensaje.errorExterno)}
          </p>
        ) : null}

        {mensaje.adjuntoUrl ? (
          <Adjunto url={mensaje.adjuntoUrl} tipo={mensaje.adjuntoTipo} />
        ) : null}

        <span
          className={cn(
            "text-muted-foreground flex items-center gap-1 self-end text-[11px] tabular-nums",
            fallo && "text-destructive"
          )}
          title={estadoVisible ? ETIQUETA_ENTREGA[estadoVisible] : undefined}
        >
          {pendiente ? "enviando…" : horaCorta(mensaje.fecha)}
          {estadoVisible ? (
            <>
              {estadoVisible === "failed" ? (
                <AlertTriangle aria-hidden="true" className="size-3" />
              ) : estadoVisible === "progress" ? (
                <Clock aria-hidden="true" className="size-3" />
              ) : estadoVisible === "sent" ? (
                <Check aria-hidden="true" className="size-3" />
              ) : (
                <CheckCheck
                  aria-hidden="true"
                  className={cn(
                    "size-3",
                    estadoVisible === "read" && "text-primary"
                  )}
                />
              )}
              <span className="sr-only">{ETIQUETA_ENTREGA[estadoVisible]}</span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function Transcripcion({ mensajes }: { mensajes: Mensaje[] }) {
  if (mensajes.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        Esta conversación todavía no tiene mensajes registrados. La ingesta
        guarda desde que se conectó: lo anterior está en Chatwoot.
      </p>
    );
  }

  // El corte de día se resuelve ANTES de dibujar: comparando cada mensaje con
  // el anterior de la lista, sin ir arrastrando una variable a medida que se
  // renderiza. El primero siempre lleva separador, que es lo que se quiere.
  const dias = mensajes.map((mensaje) => diaDeChat(mensaje.fecha));

  return (
    <div className="flex flex-col gap-2">
      {mensajes.map((mensaje, i) => {
        const separador = dias[i] !== dias[i - 1] ? dias[i] : null;

        return (
          <div key={mensaje.id} className="flex flex-col gap-2">
            {separador ? (
              <div className="my-2 flex items-center gap-3">
                <span className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs first-letter:uppercase">
                  {separador}
                </span>
                <span className="bg-border h-px flex-1" />
              </div>
            ) : null}
            <Burbuja mensaje={mensaje} />
          </div>
        );
      })}
    </div>
  );
}
