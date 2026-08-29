import type { EstadoEntrega } from "@/lib/data/types";

/**
 * Cómo se le cuenta a Marle qué pasó con un mensaje que salió.
 *
 * Lo importante que resuelve este archivo: Meta devuelve los errores en inglés
 * y con un número de código adelante — "(#131047) Message failed to send
 * because more than 24 hours have passed…". Eso no le sirve a nadie. Acá se
 * traducen los que pasan de verdad, y lo que no reconocemos se muestra tal
 * cual antes que esconderlo: un motivo feo es mejor que ningún motivo.
 */

export const ETIQUETA_ENTREGA: Record<EstadoEntrega, string> = {
  progress: "Enviando",
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
  failed: "No se pudo entregar",
};

/** Los que vimos en producción, por código de Meta. */
const POR_CODIGO: { patron: RegExp; texto: string }[] = [
  {
    patron: /#?131047|more than 24 hours/i,
    texto:
      "Pasaron más de 24 horas desde el último mensaje de ella, así que Meta no dejó entregarlo.",
  },
  {
    patron: /#?131026|undeliverable/i,
    texto:
      "Meta no pudo entregarlo: puede que ese número no tenga WhatsApp o lo tenga bloqueado.",
  },
  {
    patron: /#?131051|unsupported message type/i,
    texto: "El canal no acepta ese tipo de mensaje.",
  },
  {
    patron: /#?133010|not registered/i,
    texto: "Ese número no está registrado en WhatsApp.",
  },
  {
    patron: /#?613|rate limit|too many/i,
    texto: "Se mandaron demasiados mensajes seguidos y Meta frenó el envío.",
  },
  {
    patron: /re-?engagement|outside.*window|24-?hour window/i,
    texto:
      "La ventana de 24 horas está cerrada: hay que esperar a que ella escriba.",
  },
  {
    patron: /user not available|person is not available|cannot message/i,
    texto:
      "Instagram no dejó entregarlo: puede que la cuenta ya no exista o tenga los mensajes cerrados.",
  },
];

/**
 * @param errorExterno lo que devolvió Meta, crudo.
 * @returns una explicación en castellano, o el texto original si no lo
 *          reconocemos. Nunca `undefined` cuando hubo un error: quedarse sin
 *          motivo es peor que un motivo en inglés.
 */
export function motivoDeFalla(errorExterno?: string): string {
  const crudo = (errorExterno ?? "").trim();
  if (!crudo) {
    return "El canal lo rechazó y no dijo por qué. Probá abrirlo en Chatwoot para ver el detalle.";
  }
  const conocido = POR_CODIGO.find((c) => c.patron.test(crudo));
  return conocido ? conocido.texto : crudo;
}
