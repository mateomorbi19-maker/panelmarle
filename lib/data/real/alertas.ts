import { MOTIVO_DERIVACION } from "@/lib/agente";
import { enlacesConversacion } from "@/lib/enlaces";
import type { Alerta } from "../types";
import { getConversacionesReales } from "./conversaciones";
import { consultarSupabase, escaladoVigente } from "./supabase";

/**
 * Alertas REALES: tabla `escalated_conversations`, que escribe el propio agente
 * cuando decide pasarle una conversación a una persona (nodo "Marcar escalado").
 *
 * Una alerta está PENDIENTE mientras la derivación sigue silenciando al agente.
 * Deja de estarlo de dos maneras: porque se resolvió (`active = false`, que es
 * lo que hace el comando "borrar"), o porque pasaron 24 h y el agente volvió a
 * responder solo. Las dos cuentan como atendida, porque en las dos el lead ya
 * no está esperando.
 *
 * SOLO las derivaciones del agente. Desde el 29/08/2026 esa misma tabla guarda
 * también los apagados que hace Marle desde el panel para contestar ella, y
 * esos no son alertas: son conversaciones que YA está atendiendo. Meterlas acá
 * llenaría la pantalla de pendientes falsos.
 */

interface FilaEscalada {
  session_id: string;
  reason: string | null;
  escalated_at: string;
  active: boolean;
  permanente: boolean | null;
}

/** Los motivos que guarda el agente, dichos en palabras de Marle. */
const MOTIVOS: Record<string, string> = {
  frase_derivacion: "El agente le pasó la conversación a una persona",
};

export async function getAlertasReales(): Promise<Alerta[]> {
  const [historial, conversaciones] = await Promise.all([
    consultarSupabase<FilaEscalada[]>(
      "escalated_conversations?select=session_id,reason,escalated_at,active,permanente" +
        `&reason=eq.${MOTIVO_DERIVACION}&order=escalated_at.desc&limit=50`
    ),
    getConversacionesReales(),
  ]);

  const porSesion = new Map(conversaciones.map((c) => [c.sessionId, c]));

  return historial.map((fila) => {
    const conversacion = porSesion.get(fila.session_id);
    const [enlace] = conversacion ? enlacesConversacion(conversacion) : [];

    return {
      id: `${fila.session_id}·${fila.escalated_at}`,
      // Sin conversación registrada (una derivación anterior a la ingesta) solo
      // tenemos la clave de sesión, que es el teléfono. Se muestra eso antes
      // que inventar un nombre.
      nombre: conversacion?.nombre ?? fila.session_id,
      telefono: conversacion?.telefono ?? fila.session_id,
      motivo:
        MOTIVOS[fila.reason ?? ""] ??
        fila.reason ??
        "El agente derivó esta conversación",
      fecha: fila.escalated_at,
      conversacionId: conversacion?.chatwootConversationId
        ? String(conversacion.chatwootConversationId)
        : undefined,
      atendida: !escaladoVigente(
        fila.escalated_at,
        fila.active,
        fila.permanente ?? false
      ),
      canal: conversacion?.canal,
      conversacionPanelId: conversacion?.id,
      href: enlace?.href,
    };
  });
}
