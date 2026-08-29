import type { Canal } from "@/lib/data/types";

/**
 * Lo mínimo para saber cómo se llama alguien.
 *
 * Es un tipo propio y no un `Pick<Conversacion>` porque lo usan tanto la
 * conversación entera como la fila ya serializada de la lista, y en esa el
 * nombre puede no venir.
 */
export interface Identificable {
  canal: Canal;
  nombre?: string;
  telefono?: string;
  igUsername?: string;
  sessionId: string;
}

/**
 * Cómo se llama cada persona en la lista de chats.
 *
 * Una sola línea, siempre. En Instagram los nombres que manda Meta son
 * títulos de perfil enteros —"𝒥𝓊𝓁𝒾𝒶𝓃𝒶 🎀 Manicura Rusa/ Pedicure/ Gel
 * Overlay/ Poly Gel"— que ocupaban tres renglones y hacían ilegible la lista.
 * Por eso ahí se muestra SOLO el @usuario, que además es como Marle las
 * identifica cuando le escribe.
 *
 * En WhatsApp manda el nombre si la persona está agendada; si no, el número.
 */

/** ¿Esto es un nombre de verdad, o el teléfono repetido? */
function esNombreDePersona(valor: string, telefono?: string): boolean {
  const limpio = valor.trim();
  if (!limpio) return false;
  if (telefono && limpio === telefono.trim()) return false;
  // "+54 9 223 585 8400" no es un nombre, es el número otra vez.
  return !/^\+?[\d\s().-]+$/.test(limpio);
}

/**
 * El teléfono, tal cual.
 *
 * Se intentó agruparlo ("+549 223 585 8400") y estaba MAL: la regla de "los
 * últimos 10 dígitos son el número local" solo vale en algunos países. Cuba
 * (+5355512345) quedaba con un espacio suelto adelante y España
 * (+34612345678) se partía como "+3 461 234 5678", inventando un código de
 * país que no existe.
 *
 * Agrupar bien necesita la tabla de planes de numeración de cada país
 * (libphonenumber). Hasta que eso haga falta de verdad, se muestra el número
 * como vino: es feo pero SIEMPRE es correcto, y entra igual en una línea.
 */
export function telefonoLegible(crudo?: string): string {
  return (crudo ?? "").trim();
}

/** El nombre que se muestra: una línea, sin adornos. */
export function identidad(conversacion: Identificable): string {
  if (conversacion.canal === "instagram") {
    if (conversacion.igUsername) return `@${conversacion.igUsername}`;
    // Sin usuario de Instagram, el nombre es lo único que hay.
    return conversacion.nombre?.trim() || conversacion.sessionId;
  }

  if (esNombreDePersona(conversacion.nombre ?? "", conversacion.telefono)) {
    return (conversacion.nombre ?? "").trim();
  }
  return telefonoLegible(conversacion.telefono) || conversacion.sessionId;
}

/**
 * La inicial que va en el círculo cuando no hay foto.
 *
 * Busca la PRIMERA letra de todo el nombre, no solo la del principio: en
 * Instagram sobran los nombres que arrancan con emoji, con guión bajo o con
 * letras "estilizadas" (𝙼𝚊𝚛𝚕𝚎). Con solo mirar el primer carácter, casi todos
 * caían al ícono de persona y el círculo no distinguía a nadie.
 *
 * Si de verdad no hay ninguna letra (un teléfono, un nombre de puros emojis),
 * devuelve "" y el avatar muestra el ícono de persona, que es lo honesto.
 */
export function inicial(conversacion: Identificable): string {
  const texto = identidad(conversacion)
    // NFKD convierte 𝙼 en M, á en a + tilde.
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
  const letra = texto.match(/[a-z]/i);
  return letra ? letra[0].toUpperCase() : "";
}
