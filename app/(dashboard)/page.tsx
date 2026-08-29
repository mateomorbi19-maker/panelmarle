import type { Metadata } from "next";
import { AutoRefrescar } from "@/components/auto-refrescar";
import {
  ListaConversaciones,
  type ConversacionFila,
} from "@/components/conversaciones/lista-conversaciones";
import { db } from "@/lib/data";
import type { Conversacion } from "@/lib/data/types";
import { enlacesConversacion } from "@/lib/enlaces";
import { cuandoEnLista } from "@/lib/format";
import { identidad } from "@/lib/identidad";
import { estadoVentana } from "@/lib/ventana";

export const metadata: Metadata = {
  title: "Chats",
};

/**
 * El inicio del panel son LOS CHATS.
 *
 * Todo lo demás (resumen, integrantes, checkouts) es una herramienta que vive
 * en el menú. Marle abre esto en el teléfono para ver quién le escribió, y eso
 * tiene que estar primero, sin nada arriba que haya que saltear.
 */

/**
 * Orden, de más urgente a menos:
 *   1. las que el agente derivó y nadie atendió,
 *   2. las que tienen un mensaje que NO se pudo entregar,
 *   3. el resto, por actividad más reciente.
 *
 * Las dos primeras son cosas que hay que hacer; si quedaran mezcladas con las
 * demás se pierden justo cuando más apuran.
 */
function porUrgenciaYActividad(a: Conversacion, b: Conversacion): number {
  if (a.necesitaHumano !== b.necesitaHumano) return a.necesitaHumano ? -1 : 1;
  const fallaA = a.mensajesFallidos > 0;
  const fallaB = b.mensajesFallidos > 0;
  if (fallaA !== fallaB) return fallaA ? -1 : 1;
  const fa = a.ultimoMensajeAt ?? a.creadaAt;
  const fb = b.ultimoMensajeAt ?? b.creadaAt;
  return new Date(fb).getTime() - new Date(fa).getTime();
}

function serializar(conversacion: Conversacion): ConversacionFila {
  const enlaces = enlacesConversacion(conversacion);
  const [principal] = enlaces;

  // La ventana se resuelve en el SERVIDOR para que el primer dibujo y la
  // hidratación digan lo mismo.
  const ventana = estadoVentana(conversacion.ultimoMensajeLeadAt);

  // Con la ventana cerrada no se puede enviar, así que se ofrece el lugar
  // donde sí se puede: en Instagram el hilo directo, en WhatsApp Chatwoot.
  const alternativo =
    conversacion.canal === "instagram"
      ? (enlaces.find((e) => e.destino === "Instagram") ?? principal)
      : principal;

  return {
    id: conversacion.id,
    identidad: identidad(conversacion),
    canal: conversacion.canal,
    nombre: conversacion.nombre,
    telefono: conversacion.telefono,
    igUsername: conversacion.igUsername,
    sessionId: conversacion.sessionId,
    avatarUrl: conversacion.avatarUrl,
    preview: conversacion.ultimoMensajeTexto ?? "",
    previewRol: conversacion.ultimoMensajeRol,
    cuando: cuandoEnLista(
      conversacion.ultimoMensajeAt ?? conversacion.creadaAt
    ),
    necesitaHumano: conversacion.necesitaHumano,
    agenteApagado: conversacion.agenteApagado,
    fallidos: conversacion.mensajesFallidos,
    ventana,
    enlaceAlternativo: alternativo
      ? {
          href: alternativo.href,
          etiqueta:
            alternativo.destino === "Instagram"
              ? "Abrir en Instagram"
              : "Abrir en Chatwoot",
        }
      : undefined,
  };
}

export default async function ChatsPage() {
  const conversaciones = await db.conversaciones();
  const filas = [...conversaciones].sort(porUrgenciaYActividad).map(serializar);

  return (
    <>
      <AutoRefrescar segundos={20} />
      <ListaConversaciones filas={filas} />
    </>
  );
}
