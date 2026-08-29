import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BellRing, ExternalLink, Megaphone } from "lucide-react";
import { AutoRefrescar } from "@/components/auto-refrescar";
import { AvatarContacto } from "@/components/conversaciones/avatar-contacto";
import { PantallaChat } from "@/components/conversaciones/pantalla-chat";
import { Transcripcion } from "@/components/conversaciones/transcripcion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { textoMotivo } from "@/lib/agente";
import { db } from "@/lib/data";
import { enlacesConversacion } from "@/lib/enlaces";
import { fechaRelativa } from "@/lib/format";
import { identidad } from "@/lib/identidad";
import { estadoVentana } from "@/lib/ventana";

export const metadata: Metadata = {
  title: "Chat",
};

/**
 * La pantalla de un chat.
 *
 * Armada como una app de mensajería: la pantalla mide el alto de la ventana,
 * la conversación tiene su propio scroll y el cuadro para escribir queda
 * afuera de ese scroll (ver `PantallaChat`). La barra general del panel se
 * esconde acá (ver `BarraSuperior`) para no apilar dos barras en un teléfono.
 */
export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversacion = await db.conversacion(id);
  if (!conversacion) notFound();

  const [mensajes, agente] = await Promise.all([
    db.mensajes(conversacion.id),
    db.agenteGlobal(),
  ]);
  const enlaces = enlacesConversacion(conversacion);

  // La ventana se calcula en el SERVIDOR y viaja ya resuelta: si la calculara
  // el navegador, el primer render y la hidratación darían textos distintos.
  const ventana = estadoVentana(conversacion.ultimoMensajeLeadAt);

  // A dónde mandarla cuando por acá no se puede: en Instagram al hilo directo
  // en la app; en WhatsApp no hay equivalente (ese número vive en la API de
  // Meta, no en un teléfono), así que va a Chatwoot.
  const alternativo =
    conversacion.canal === "instagram"
      ? (enlaces.find((e) => e.destino === "Instagram") ?? enlaces[0])
      : enlaces[0];

  const enlaceAlternativo = alternativo
    ? {
        href: alternativo.href,
        etiqueta:
          alternativo.destino === "Instagram"
            ? "Abrir en Instagram"
            : "Abrir en Chatwoot",
      }
    : undefined;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AutoRefrescar segundos={20} />

      {/* --- La barra del chat ------------------------------------------- */}
      <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-2">
        <Link
          href="/"
          aria-label="Volver a los chats"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>

        <AvatarContacto conversacion={conversacion} tamano="barra" />

        <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold">
          {identidad(conversacion)}
        </h1>

        {enlaceAlternativo ? (
          <a
            href={enlaceAlternativo.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={enlaceAlternativo.etiqueta}
            title={enlaceAlternativo.etiqueta}
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2"
          >
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        ) : null}
      </header>

      {/*
        El aviso va FUERA del scroll, pegado a la barra. Adentro no servía de
        nada: el chat abre por el final, así que un aviso al principio de la
        conversación no lo veía nadie.
      */}
      {conversacion.necesitaHumano ? (
        <div className="shrink-0 px-3 pt-3">
          <Alert variant="destructive">
            <BellRing aria-hidden="true" />
            <AlertTitle>Esta conversación te está esperando</AlertTitle>
            <AlertDescription>
              {textoMotivo(conversacion.motivoDerivacion)}
              {conversacion.derivadaAt
                ? ` · ${fechaRelativa(conversacion.derivadaAt)}`
                : ""}
              .{" "}
              {conversacion.apagadoPermanente
                ? "El agente está apagado acá y no vuelve solo."
                : "El agente no le responde hasta que pasen 24 horas."}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <PantallaChat
        conversacion={conversacion}
        mensajes={mensajes}
        ventana={ventana}
        enlaceAlternativo={enlaceAlternativo}
        agenteGlobalEncendido={agente.encendido}
      >
        {conversacion.origenCampania ? (
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
            <Megaphone aria-hidden="true" className="size-3.5" />
            Vino de {conversacion.origenCampania}
          </p>
        ) : null}

        <Transcripcion mensajes={mensajes} />
      </PantallaChat>
    </div>
  );
}
