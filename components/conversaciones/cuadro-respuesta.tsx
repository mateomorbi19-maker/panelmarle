"use client";

import {
  startTransition,
  useEffect,
  useId,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Loader2,
  Lock,
  Mic,
  MoreHorizontal,
  Paperclip,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch, SwitchThumb } from "@/components/ui/switch";
import {
  FORMATOS_GRABACION,
  problemaConElArchivo,
  TIPOS_ADJUNTO,
} from "@/lib/adjuntos";
import type { Canal } from "@/lib/data/types";
import type { EstadoVentana } from "@/lib/ventana";
import { cn } from "@/lib/utils";

/**
 * El cuadro para escribirle a una clienta.
 *
 * Una sola barra, como en cualquier app de mensajería:
 *
 *   (⋯)  [ escribí un mensaje… ]  (🎤 / ➤)
 *
 * El botón de los tres puntos vive en SU PROPIO círculo, separado de la barra,
 * para que no se toque sin querer al ir a escribir. Adentro están las dos
 * cosas que antes ocupaban lugar fijo en pantalla: adjuntar un archivo y el
 * interruptor del agente.
 *
 * A la derecha hay uno solo: micrófono cuando no hay nada escrito, flecha de
 * enviar cuando sí. Nunca los dos, así no hay dónde equivocarse.
 *
 * Vive aparte de la pantalla del chat porque también lo usa la lista de
 * conversaciones, y las reglas de qué se puede mandar tienen que ser LAS
 * MISMAS en los dos lados.
 */

/** Cuánto texto acepta cada canal. Igual que en el route handler. */
const LIMITE: Record<string, number> = { instagram: 1000, whatsapp: 4096 };

function reloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CuadroRespuesta({
  conversacionId,
  canal,
  nombre,
  ventana,
  agenteApagado,
  enlaceAlternativo,
  onEnviado,
  onCambiarAgente,
  cambiandoAgente = false,
  agenteGlobalEncendido = true,
  autoFoco = false,
}: {
  conversacionId: string;
  canal: Canal;
  nombre: string;
  ventana: EstadoVentana;
  agenteApagado: boolean;
  enlaceAlternativo?: { href: string; etiqueta: string };
  /** Avisa que salió, con el id que le dio Chatwoot y el archivo si lo había. */
  onEnviado?: (
    externoId: string,
    texto: string,
    creadoAt?: string,
    adjunto?: { url?: string; tipo?: string }
  ) => void;
  /** Si viene, el menú muestra el interruptor del agente. */
  onCambiarAgente?: (encendido: boolean) => void;
  cambiandoAgente?: boolean;
  /**
   * El interruptor GENERAL. Apagado manda sobre todo: el de este chat no
   * cambia nada, así que se muestra apagado y no se puede tocar. Dejar que se
   * prenda sería mentirle a Marle sobre si alguien le está contestando.
   */
  agenteGlobalEncendido?: boolean;
  autoFoco?: boolean;
}) {
  const router = useRouter();
  const idAgente = useId();
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const selector = useRef<HTMLInputElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);

  // El interruptor del chat: la bolita se mueve apenas se toca y React
  // descarta el valor optimista cuando llega el de verdad.
  const agenteReal = agenteGlobalEncendido && !agenteApagado;
  const [agenteVisible, setAgenteVisible] = useOptimistic(agenteReal);

  const limite = LIMITE[canal] ?? 4096;
  const restantes = limite - texto.length;
  const hayAlgoQueMandar = texto.trim().length > 0 || archivo !== null;
  const puedeEnviar =
    ventana.abierta && hayAlgoQueMandar && restantes >= 0 && !enviando;

  // La barra crece con lo que se escribe, hasta un tope, y vuelve a una línea
  // cuando se vacía. Sin esto quedaba un renglón fijo y no se veía lo escrito.
  useEffect(() => {
    const caja = campo.current;
    if (!caja) return;
    caja.style.height = "auto";
    caja.style.height = `${Math.min(caja.scrollHeight, 128)}px`;
  }, [texto]);

  // El cronómetro de la grabación.
  useEffect(() => {
    if (!grabando) return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [grabando]);

  // Si se sale del chat con el micrófono abierto, hay que soltarlo: si no,
  // el teléfono queda con la lucecita de "grabando" prendida.
  useEffect(() => {
    return () => {
      const rec = grabadora.current;
      if (rec && rec.state !== "inactive") rec.stop();
      rec?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function elegirArchivo(elegido: File | null) {
    if (!elegido) {
      setArchivo(null);
      return;
    }
    // Se avisa ACÁ, antes de subir: hacerla esperar por 12 MB para después
    // decirle que no se puede es una falta de respeto. El servidor lo vuelve a
    // chequear igual, porque esto se puede saltear.
    const problema = problemaConElArchivo(
      elegido.name,
      elegido.type,
      elegido.size
    );
    if (problema) {
      toast.error(problema);
      // Se limpia el input igual: si no, elegir OTRA VEZ el mismo archivo no
      // dispara onChange y parece que el botón dejó de andar.
      if (selector.current) selector.current.value = "";
      return;
    }
    setArchivo(elegido);
  }

  function limpiarArchivo() {
    setArchivo(null);
    if (selector.current) selector.current.value = "";
  }

  // --- Grabar un audio -----------------------------------------------------
  async function empezarGrabacion() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Este navegador no deja grabar audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const formato = FORMATOS_GRABACION.find((f) =>
        MediaRecorder.isTypeSupported(f)
      );
      const rec = new MediaRecorder(
        stream,
        formato ? { mimeType: formato } : undefined
      );
      trozos.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) trozos.current.push(e.data);
      };
      grabadora.current = rec;
      rec.start();
      setSegundos(0);
      setGrabando(true);
    } catch {
      toast.error(
        "No pude usar el micrófono. Fijate que el navegador tenga permiso."
      );
    }
  }

  /** Corta la grabación. Devuelve el audio, o null si se descarta. */
  function cortarGrabacion(guardar: boolean): Promise<File | null> {
    return new Promise((resolver) => {
      const rec = grabadora.current;
      setGrabando(false);
      if (!rec || rec.state === "inactive") {
        resolver(null);
        return;
      }
      rec.onstop = () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        grabadora.current = null;
        if (!guardar || trozos.current.length === 0) {
          trozos.current = [];
          resolver(null);
          return;
        }
        const tipo = rec.mimeType || "audio/webm";
        const blob = new Blob(trozos.current, { type: tipo });
        trozos.current = [];
        const extension = tipo.includes("mp4")
          ? "m4a"
          : tipo.includes("ogg")
            ? "ogg"
            : "webm";
        resolver(new File([blob], `audio-${Date.now()}.${extension}`, { type: tipo }));
      };
      rec.stop();
    });
  }

  async function enviarGrabacion() {
    const audio = await cortarGrabacion(true);
    if (!audio) {
      toast.error("La grabación quedó vacía.");
      return;
    }
    const problema = problemaConElArchivo(audio.name, audio.type, audio.size);
    if (problema) {
      toast.error(problema);
      return;
    }
    await enviar(audio);
  }

  // --- Enviar --------------------------------------------------------------
  async function enviar(archivoDirecto?: File) {
    const adjunto = archivoDirecto ?? archivo;
    const cuerpo = texto.trim();
    if (!adjunto && !cuerpo) return;
    if (!ventana.abierta || enviando) return;

    setEnviando(true);
    try {
      // Con archivo va como multipart; sin archivo, JSON pelado. El route
      // handler acepta las dos formas.
      let peticion: RequestInit;
      if (adjunto) {
        const formulario = new FormData();
        formulario.append("texto", cuerpo);
        formulario.append("archivo", adjunto, adjunto.name);
        peticion = { method: "POST", body: formulario };
      } else {
        peticion = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: cuerpo }),
        };
      }

      const res = await fetch(
        `/api/conversaciones/${conversacionId}/responder`,
        peticion
      );
      const datos = await res.json();

      if (!res.ok) {
        toast.error(datos?.error ?? "No se pudo enviar el mensaje.");
        // La pantalla quedó mostrando algo que ya no es cierto: o el agente se
        // apagó igual, o la ventana de 24 h se cerró mientras ella escribía.
        if (datos?.agenteApagado || datos?.ventanaCerrada) router.refresh();
        return;
      }

      setTexto("");
      limpiarArchivo();
      onEnviado?.(
        String(datos.mensaje.id),
        cuerpo,
        datos.mensaje.creadoAt ?? undefined,
        datos.mensaje.adjuntoUrl
          ? { url: datos.mensaje.adjuntoUrl, tipo: datos.mensaje.adjuntoTipo }
          : undefined
      );

      toast.success(
        agenteApagado
          ? `Mensaje enviado a ${nombre}.`
          : `Mensaje enviado. El agente quedó apagado en el chat de ${nombre}.`
      );
      router.refresh();
    } catch {
      toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
    } finally {
      setEnviando(false);
    }
  }

  // --- Ventana cerrada: no se manda y se ofrece el camino que sí funciona ---
  if (!ventana.abierta) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Lock aria-hidden="true" className="size-4 shrink-0" />
          No se le puede escribir por acá
        </p>
        <p className="text-muted-foreground text-sm">
          {ventana.nuncaEscribio
            ? `${nombre} todavía no escribió nada.`
            : `Pasaron más de 24 horas desde su último mensaje (${ventana.detalle}).`}
          <span className="hidden sm:inline">
            {" "}
            Meta solo deja responder dentro de las 24 horas siguientes al
            mensaje de la clienta. Va a poder de nuevo apenas ella escriba.
          </span>
        </p>
        {enlaceAlternativo ? (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            render={
              <a
                href={enlaceAlternativo.href}
                target="_blank"
                rel="noreferrer noopener"
              />
            }
          >
            {enlaceAlternativo.etiqueta}
            <ExternalLink data-icon="inline-end" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    );
  }

  // --- Grabando: la barra se convierte en el control de la grabación -------
  if (grabando) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-11 shrink-0 rounded-full"
          onClick={() => void cortarGrabacion(false)}
          aria-label="Descartar la grabación"
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </Button>

        <div className="bg-muted flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full px-4">
          <span className="bg-destructive size-2.5 shrink-0 animate-pulse rounded-full" />
          <span className="text-sm tabular-nums">{reloj(segundos)}</span>
          <span className="text-muted-foreground truncate text-xs">
            Grabando…
          </span>
        </div>

        <Button
          size="icon"
          className="size-11 shrink-0 rounded-full"
          onClick={() => void enviarGrabacion()}
          disabled={enviando}
          aria-label="Enviar el audio"
        >
          {enviando ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <SendHorizontal aria-hidden="true" className="size-5" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={selector}
        type="file"
        accept={TIPOS_ADJUNTO.join(",")}
        className="hidden"
        onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
      />

      {archivo ? (
        <div className="bg-muted/50 flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Paperclip aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{archivo.name}</span>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {(archivo.size / 1024).toFixed(0)} KB
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarArchivo}
            disabled={enviando}
            aria-label={`Sacar ${archivo.name}`}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        {/* --- Los tres puntos, en su propio círculo ------------------- */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Más opciones"
                className="bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground focus-visible:outline-ring flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              />
            }
          >
            <MoreHorizontal aria-hidden="true" className="size-5" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" side="top" className="w-60">
            <DropdownMenuItem onClick={() => selector.current?.click()}>
              <Paperclip aria-hidden="true" />
              Adjuntar archivo
            </DropdownMenuItem>

            {onCambiarAgente ? (
              <>
                <DropdownMenuSeparator />
                {/*
                  Va como fila suelta y NO como ítem del menú a propósito: si
                  fuera un ítem, el clic contaría dos veces (el del interruptor
                  y el del ítem) y el agente se prendería y apagaría de una.
                  Además así el menú no se cierra y se ve cómo quedó.
                */}
                <div className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1.5">
                  <label htmlFor={idAgente} className="flex-1 cursor-pointer text-sm">
                    Agente
                    <span className="text-muted-foreground block text-xs">
                      {!agenteGlobalEncendido
                        ? "Apagado en todo el panel"
                        : agenteVisible
                          ? "Contesta este chat"
                          : "Apagado en este chat"}
                    </span>
                  </label>
                  {/*
                    Igual que el general: NUNCA se desmonta mientras guarda.
                    Un interruptor que desaparece y vuelve deja la duda de si
                    uno lo prendió o lo apagó.
                  */}
                  <Switch
                    id={idAgente}
                    checked={agenteVisible}
                    disabled={!agenteGlobalEncendido}
                    data-pendiente={
                      cambiandoAgente || agenteVisible !== agenteReal
                    }
                    onCheckedChange={(nuevo) => {
                      startTransition(() => {
                        setAgenteVisible(nuevo);
                        onCambiarAgente(nuevo);
                      });
                    }}
                  >
                    <SwitchThumb />
                  </Switch>
                </div>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* --- La barra de escritura ---------------------------------- */}
        <div className="bg-muted flex min-h-11 min-w-0 flex-1 items-center rounded-3xl px-4 py-2">
          <textarea
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.shiftKey) return;
              // Los teclados con predicción mandan Enter para confirmar una
              // palabra: eso no es "enviar".
              if (e.nativeEvent.isComposing) return;
              // Y en un teclado táctil NO existe Shift+Enter. Si Enter
              // enviara, sería imposible escribir un segundo renglón y
              // cualquier toque reflejo le mandaría un mensaje real, sin
              // vuelta atrás, a una clienta.
              if (!window.matchMedia("(pointer: fine)").matches) return;
              e.preventDefault();
              void enviar();
            }}
            rows={1}
            disabled={enviando}
            autoFocus={autoFoco}
            placeholder={
              archivo ? "Agregale un comentario…" : "Escribí un mensaje…"
            }
            aria-label={`Mensaje para ${nombre}`}
            className="max-h-32 min-h-6 w-full resize-none bg-transparent text-[15px] leading-6 outline-none disabled:opacity-50"
          />
        </div>

        {/* --- Micrófono, o enviar cuando hay algo escrito ------------- */}
        {hayAlgoQueMandar ? (
          <Button
            size="icon"
            className="size-11 shrink-0 rounded-full"
            disabled={!puedeEnviar}
            onClick={() => void enviar()}
            aria-label="Enviar el mensaje"
          >
            {enviando ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <SendHorizontal aria-hidden="true" className="size-5" />
            )}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground size-11 shrink-0 rounded-full"
            onClick={() => void empezarGrabacion()}
            disabled={enviando}
            aria-label="Grabar un audio"
          >
            <Mic aria-hidden="true" className="size-5" />
          </Button>
        )}
      </div>

      {restantes < 200 ? (
        <p
          className={cn(
            "px-1 text-xs tabular-nums",
            restantes < 0 ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {restantes < 0
            ? `Te pasaste por ${-restantes} caracteres: ${canal} no acepta más de ${limite}.`
            : `Quedan ${restantes} caracteres.`}
        </p>
      ) : null}
    </div>
  );
}
