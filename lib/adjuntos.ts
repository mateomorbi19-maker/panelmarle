/**
 * Qué archivos se pueden mandar y cuánto pueden pesar.
 *
 * Vive aparte de `chatwoot.ts` a propósito: estas reglas las necesitan LOS DOS
 * lados — el navegador, para avisar antes de subir 12 MB al pedo, y el
 * servidor, que es el que manda de verdad y no puede confiar en lo que dijo el
 * navegador. Si estuvieran en `chatwoot.ts`, importarlas desde un componente
 * se llevaría puesto el token de Chatwoot al bundle del navegador.
 */

/**
 * Lo que se puede mandar y cuánto puede pesar.
 *
 * Los topes salen de Meta, no nuestros: WhatsApp acepta hasta 5 MB en imágenes
 * y 16 MB en audio y video; Instagram es parecido. Se cortan acá antes de
 * subirlos para no hacerla esperar por algo que va a rebotar igual.
 */
export const TIPOS_ADJUNTO = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
] as const;

export const PESO_MAXIMO: Record<string, number> = {
  image: 5 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  application: 16 * 1024 * 1024,
};

export function familiaDe(tipoMime: string): string {
  return (tipoMime.split("/")[0] || "").toLowerCase();
}

/**
 * El tipo sin los parámetros.
 *
 * Las grabaciones del navegador vienen como `audio/webm;codecs=opus`, y
 * comparar eso contra la lista de tipos permitidos daba siempre falso: un
 * audio grabado desde el panel se rechazaba a sí mismo.
 */
export function tipoBase(tipoMime: string): string {
  return (tipoMime.split(";")[0] || "").trim().toLowerCase();
}

/**
 * En qué formato grabar, de mejor a peor para Meta.
 *
 * OJO: WhatsApp NO acepta `audio/webm`. Acepta ogg (opus), mp4/aac, mpeg y
 * amr. Como cada navegador soporta cosas distintas —Safari da mp4, Chrome
 * suele dar solo webm— se elige el mejor disponible y puede tocar el que
 * WhatsApp rechaza. Ese caso ahora se ve: el mensaje queda marcado como "no
 * se pudo entregar" con el motivo (Fase 2).
 */
export const FORMATOS_GRABACION = [
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

/** null si está todo bien; si no, el motivo en palabras de Marle. */
export function problemaConElArchivo(
  nombre: string,
  tipoMime: string,
  tamano: number
): string | null {
  const base = tipoBase(tipoMime);
  if (!TIPOS_ADJUNTO.includes(base as (typeof TIPOS_ADJUNTO)[number])) {
    return `"${nombre}" es de un tipo que WhatsApp e Instagram no aceptan (${base || "desconocido"}). Se pueden mandar fotos, audios, videos y PDF.`;
  }
  const tope = PESO_MAXIMO[familiaDe(base)] ?? 16 * 1024 * 1024;
  if (tamano > tope) {
    return `"${nombre}" pesa ${(tamano / 1024 / 1024).toFixed(1)} MB y el máximo para ese tipo de archivo es ${Math.round(tope / 1024 / 1024)} MB.`;
  }
  if (tamano === 0) return `"${nombre}" está vacío.`;
  return null;
}
