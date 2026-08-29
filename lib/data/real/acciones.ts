import { MOTIVO_PANEL } from "../../agente";
import type { Conversacion } from "../types";
import { llamarRpcSupabase } from "./supabase";

/**
 * Las ESCRITURAS del panel. Hasta acá solo leía.
 *
 * Las dos van contra funciones de Postgres y no contra las tablas: la regla de
 * "cuándo el agente está callado" tiene que ser UNA sola, porque la consulta
 * n8n en cada mensaje y la muestra el panel. Si el panel escribiera la tabla
 * por su cuenta, cualquier cambio en esa regla habría que acordarlo en dos
 * lugares y tarde o temprano dirían cosas distintas.
 */

/**
 * Calla al agente en una conversación.
 *
 * A diferencia de la derivación del agente (que se vence a las 24 h), este
 * apagado es PERMANENTE: dura hasta que lo prendan desde el panel. Un botón
 * que se desprende solo al día siguiente no es un botón.
 *
 * `preservarDerivacion` decide qué pasa con una alerta viva:
 *   - true  (apagar con el botón): la clienta SIGUE esperando, nadie le
 *            contestó todavía. La alerta tiene que quedar a la vista.
 *   - false (al responder): ya la atendió, la alerta se va.
 */
export async function apagarAgenteReal(
  conversacion: Conversacion,
  preservarDerivacion = false
): Promise<void> {
  await llamarRpcSupabase("apagar_agente", {
    p_session_id: conversacion.sessionId,
    p_conversation_id: conversacion.chatwootConversationId ?? null,
    p_account_id: conversacion.chatwootAccountId ?? null,
    p_channel: conversacion.canal,
    p_reason: MOTIVO_PANEL,
    p_preservar_derivacion: preservarDerivacion,
  });
}

/**
 * Devuelve la conversación al agente.
 *
 * Es la misma función que usa el comando "borrar" del chat, así que prender
 * desde el panel y prender desde el chat hacen exactamente lo mismo.
 */
export async function prenderAgenteReal(
  conversacion: Conversacion
): Promise<void> {
  await llamarRpcSupabase("unescalate", {
    p_session_id: conversacion.sessionId,
  });
}
