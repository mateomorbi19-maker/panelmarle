import { consultarSupabase, llamarRpcSupabase } from "./supabase";
import type { AgenteGlobal } from "../types";

/**
 * El interruptor GENERAL del agente.
 *
 * Vive en una tabla de una sola fila que lee `is_escalated()` —la función que
 * el agente consulta ANTES de contestar cada mensaje—, así que apagarlo lo
 * calla en todos los chats al instante y sin tocar n8n. Los mensajes se
 * siguen recibiendo y guardando, y su memoria se sigue alimentando: cuando
 * Marle lo prende, retoma sabiendo lo que pasó mientras estuvo callado.
 */

interface FilaAjustes {
  encendido: boolean;
  cambiado_at: string;
}

export async function getAgenteGlobalReal(): Promise<AgenteGlobal> {
  const filas = await consultarSupabase<FilaAjustes[]>(
    "ajustes_agente?select=encendido,cambiado_at&limit=1"
  );
  const fila = filas[0];
  // Sin fila, se asume PRENDIDO: ante la duda el negocio sigue contestando.
  // Un agente mudo por un problema de datos sería mucho peor.
  return {
    encendido: fila?.encendido ?? true,
    cambiadoAt: fila?.cambiado_at,
  };
}

export async function cambiarAgenteGlobalReal(
  encendido: boolean
): Promise<AgenteGlobal> {
  const filas = await llamarRpcSupabase<FilaAjustes[]>(
    "cambiar_agente_global",
    { p_encendido: encendido, p_quien: "panel" }
  );
  const fila = filas[0];
  return {
    encendido: fila?.encendido ?? encendido,
    cambiadoAt: fila?.cambiado_at,
  };
}
