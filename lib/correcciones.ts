import type { RolMensaje } from "@/lib/data/types";

/**
 * Qué mensajes se pueden marcar en una corrección.
 *
 * Los del agente, claro. Y también los `negocio`, que NO es un descuido: así
 * llega todo lo que sale de la cuenta SIN firma, y hoy sigue siendo la mitad
 * de lo que manda el agente (las firmas existen desde el 29/08/2026, y por el
 * puente de Chatwoot no siempre llegan). Dejarlos afuera haría que en muchos
 * chats no se pudiera marcar nada y la función pareciera rota.
 *
 * Los `humano` quedan afuera: esos los escribió Marle desde el panel, y no
 * tiene sentido anotarle una corrección al agente por algo que dijo ella.
 */
const CORREGIBLES: readonly RolMensaje[] = ["agente", "negocio"];

export function esCorregible(rol: RolMensaje): boolean {
  return CORREGIBLES.includes(rol);
}

/** Cómo se cuenta lo elegido, sin que quede "1 mensajes". */
export function contarElegidos(cantidad: number): string {
  return cantidad === 1 ? "1 mensaje elegido" : `${cantidad} mensajes elegidos`;
}
