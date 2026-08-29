/**
 * Por qué el agente está callado en una conversación.
 *
 * Los dos motivos silencian al agente igual, pero significan cosas MUY
 * distintas para Marle, y por eso el panel los muestra distinto:
 *
 *   frase_derivacion → lo decidió el agente y nadie atendió todavía.
 *                      Va en rojo: esa conversación la está esperando.
 *   panel_humano     → lo apagó ella para contestar.
 *                      No va en rojo: ya la está atendiendo.
 *
 * Confundirlos haría que una conversación recién contestada apareciera como
 * pendiente, que es justo el ruido que el panel tiene que sacar del medio.
 */

export const MOTIVO_DERIVACION = "frase_derivacion";
export const MOTIVO_PANEL = "panel_humano";

/** Cómo se le explica cada motivo a Marle. */
export const MOTIVOS: Record<string, string> = {
  [MOTIVO_DERIVACION]: "El agente decidió pasarle la conversación a una persona",
  [MOTIVO_PANEL]: "Lo apagaste vos para contestar",
};

export function textoMotivo(motivo: string | undefined): string {
  return (
    MOTIVOS[motivo ?? ""] ?? "El agente derivó esta conversación a una persona"
  );
}
