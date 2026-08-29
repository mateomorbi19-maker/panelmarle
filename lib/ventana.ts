/**
 * La ventana de 24 horas de Meta.
 *
 * WhatsApp e Instagram solo dejan escribirle a una persona dentro de las 24 h
 * posteriores a SU último mensaje. Pasado ese plazo Meta rechaza el envío: en
 * WhatsApp solo entran plantillas aprobadas, en Instagram directamente nada.
 *
 * Esto no es una regla nuestra que podamos ablandar — es del lado de Meta. Por
 * eso el panel lo calcula ANTES de que Marle escriba, y no la deja mandar algo
 * que sabemos que va a rebotar.
 */

export const VENTANA_MS = 24 * 60 * 60 * 1000;

export interface EstadoVentana {
  /** Se puede enviar: hay un mensaje de la clienta de hace menos de 24 h. */
  abierta: boolean;
  /** Milisegundos que faltan para que se cierre. 0 si ya está cerrada. */
  restanteMs: number;
  /** Texto listo para mostrar, ej. "quedan 3 h" o "se cerró hace 2 días". */
  detalle: string;
  /**
   * Nunca escribió, contra "escribió pero ya pasaron 24 h". Las dos cierran la
   * ventana, pero se le explican distinto a Marle, y deducirlo mirando el texto
   * de `detalle` sería frágil.
   */
  nuncaEscribio: boolean;
}

function enPalabras(ms: number): string {
  const minutos = Math.floor(ms / 60000);
  if (minutos < 60) return `${Math.max(minutos, 1)} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "1 día" : `${dias} días`;
}

/**
 * @param ultimoMensajeLeadAt ISO del último mensaje de la clienta, si hubo.
 * @param ahora inyectable para poder testear sin depender del reloj.
 */
export function estadoVentana(
  ultimoMensajeLeadAt: string | undefined,
  ahora: number = Date.now()
): EstadoVentana {
  if (!ultimoMensajeLeadAt) {
    return {
      abierta: false,
      restanteMs: 0,
      detalle: "esta persona todavía no escribió",
      nuncaEscribio: true,
    };
  }

  const desde = new Date(ultimoMensajeLeadAt).getTime();
  if (!Number.isFinite(desde)) {
    return {
      abierta: false,
      restanteMs: 0,
      detalle: "sin fecha del último mensaje",
      nuncaEscribio: true,
    };
  }

  const transcurrido = ahora - desde;
  const restante = VENTANA_MS - transcurrido;

  if (restante <= 0) {
    return {
      abierta: false,
      restanteMs: 0,
      detalle: `se cerró hace ${enPalabras(-restante)}`,
      nuncaEscribio: false,
    };
  }

  return {
    abierta: true,
    restanteMs: restante,
    detalle: `quedan ${enPalabras(restante)}`,
    nuncaEscribio: false,
  };
}
