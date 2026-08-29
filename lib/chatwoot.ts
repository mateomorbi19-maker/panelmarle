import {
  familiaDe,
  problemaConElArchivo,
  tipoBase,
  TIPOS_ADJUNTO,
} from "@/lib/adjuntos";

export { familiaDe, problemaConElArchivo, tipoBase, TIPOS_ADJUNTO };

/**
 * Envío de mensajes a través de Chatwoot.
 *
 * El panel NO le habla a Meta: le habla a Chatwoot, que ya tiene resueltas las
 * dos salidas (WhatsApp Cloud API e Instagram) y es por donde contesta el
 * agente. Un solo camino para todo lo que sale, así el historial queda
 * completo y en orden en un único lugar.
 *
 * Corre SIEMPRE en el servidor: el token de Chatwoot no puede llegar al
 * navegador.
 */

/**
 * Con qué se firma cada mensaje saliente, para saber después quién lo escribió.
 * Chatwoot conserva `content_attributes` y lo devuelve tal cual en el webhook
 * (verificado el 29/08/2026), y el normalizador de la ingesta lo lee para
 * guardar el mensaje como de Marle y no del agente.
 *
 * Tiene que coincidir con lo que espera `scripts/normalizar-mensaje.js`.
 */
export const ORIGEN_PANEL = "panel";

export interface CredencialesChatwoot {
  base: string;
  token: string;
  cuenta: number;
}

export function credencialesChatwoot(): CredencialesChatwoot {
  const base = (process.env.CHATWOOT_URL ?? "").replace(/\/+$/, "");
  const token = process.env.CHATWOOT_API_TOKEN ?? "";
  const cuenta = Number(process.env.CHATWOOT_ACCOUNT_ID);

  if (!base || !token || !Number.isFinite(cuenta)) {
    throw new Error(
      "Faltan CHATWOOT_URL, CHATWOOT_API_TOKEN y/o CHATWOOT_ACCOUNT_ID. Sin eso el panel no puede enviar mensajes."
    );
  }
  return { base, token, cuenta };
}

export interface MensajeEnviado {
  /** Id del mensaje en Chatwoot: con esto la ingesta lo deduplica después. */
  id: number;
  contenido: string;
  creadoAt?: string;
  /**
   * Lo que Chatwoot dice del mensaje reción creado: `progress`, `sent`,
   * `delivered`, `read` o `failed`.
   *
   * OJO con lo que este dato significa y lo que NO. Chatwoot guarda el mensaje
   * y lo despacha al canal en un trabajo aparte, así que un 200 acá quiere
   * decir "Chatwoot lo tomó", no "Meta lo entregó". Cuando falla al toque
   * (ventana vencida, cuenta bloqueada) suele venir ya en `failed` y eso sí lo
   * podemos avisar. El resto de los rechazos llegan después, por el evento
   * `message_updated` que la ingesta todavía descarta.
   */
  estado?: string;
  /** El motivo que devolvió Meta, cuando lo hay. */
  errorExterno?: string;
  /** Si el mensaje llevaba un archivo, dónde quedó y de qué tipo es. */
  adjuntoUrl?: string;
  adjuntoTipo?: string;
}

/** Interpreta lo que devolvio Chatwoot. Igual para texto y para adjuntos. */
async function interpretarRespuesta(
  res: Response,
  textoEnviado: string
): Promise<MensajeEnviado> {
  const cuerpo = await res.text();

  if (!res.ok) {
    throw new Error(
      `Chatwoot respondió ${res.status} al enviar el mensaje: ${cuerpo.slice(0, 300)}`
    );
  }

  let datos: {
    id?: number;
    content?: string;
    created_at?: number | string;
    status?: string;
    content_attributes?: { external_error?: string };
    attachments?: { data_url?: string; file_type?: string }[];
  };
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    throw new Error(
      `Chatwoot devolvió algo que no es JSON: ${cuerpo.slice(0, 200)}`
    );
  }

  if (!datos.id) {
    throw new Error(
      `Chatwoot aceptó el pedido pero no devolvió el id del mensaje: ${cuerpo.slice(0, 200)}`
    );
  }

  const errorExterno = datos.content_attributes?.external_error;

  // Cuando el rechazo es inmediato, Chatwoot ya lo devuelve marcado. Es la
  // única falla de entrega que hoy podemos avisar en el momento, así que se
  // trata como error y no como envío exitoso.
  if (datos.status === "failed") {
    throw new Error(
      errorExterno
        ? `El canal rechazó el mensaje: ${errorExterno}`
        : "El canal rechazó el mensaje sin dar un motivo."
    );
  }

  const adjunto = (datos.attachments ?? [])[0];

  return {
    id: datos.id,
    contenido: datos.content ?? textoEnviado,
    creadoAt:
      typeof datos.created_at === "number"
        ? new Date(datos.created_at * 1000).toISOString()
        : (datos.created_at ?? undefined),
    estado: datos.status,
    errorExterno,
    adjuntoUrl: adjunto?.data_url,
    adjuntoTipo: adjunto?.file_type,
  };
}

function urlMensajes(conversacionChatwootId: number, cuentaId?: number): string {
  const { base, cuenta } = credencialesChatwoot();
  return `${base}/api/v1/accounts/${cuentaId ?? cuenta}/conversations/${conversacionChatwootId}/messages`;
}

/**
 * Postea un mensaje de texto en una conversación de Chatwoot.
 *
 * No escribe en Supabase a propósito: el webhook de Chatwoot le avisa a la
 * ingesta y esa es la que guarda. Una sola fuente de verdad — si escribiéramos
 * también acá, un mensaje podría quedar guardado dos veces o quedar guardado
 * sin haber salido.
 */
export async function enviarMensajeChatwoot({
  conversacionChatwootId,
  cuentaId,
  texto,
}: {
  conversacionChatwootId: number;
  cuentaId?: number;
  texto: string;
}): Promise<MensajeEnviado> {
  const { token } = credencialesChatwoot();

  const res = await fetch(urlMensajes(conversacionChatwootId, cuentaId), {
    method: "POST",
    headers: { api_access_token: token, "Content-Type": "application/json" },
    body: JSON.stringify({
      content: texto,
      message_type: "outgoing",
      content_attributes: { origen: ORIGEN_PANEL },
    }),
    cache: "no-store",
  });

  return interpretarRespuesta(res, texto);
}

/**
 * Manda una foto, un audio, un video o un PDF.
 *
 * Va como multipart, que es lo que Chatwoot espera para archivos. La firma
 * `content_attributes` viaja como texto JSON y SOBREVIVE igual que en los
 * mensajes de texto (verificado el 29/08/2026), así que un adjunto mandado
 * desde el panel también se guarda como de Marle y no del agente.
 *
 * El texto es opcional: se puede mandar una foto sola, o una foto con un
 * comentario, que es como se manda en la vida real.
 */
export async function enviarAdjuntoChatwoot({
  conversacionChatwootId,
  cuentaId,
  texto,
  archivo,
}: {
  conversacionChatwootId: number;
  cuentaId?: number;
  texto?: string;
  archivo: File;
}): Promise<MensajeEnviado> {
  const { token } = credencialesChatwoot();

  const formulario = new FormData();
  if (texto) formulario.append("content", texto);
  formulario.append("message_type", "outgoing");
  formulario.append(
    "content_attributes",
    JSON.stringify({ origen: ORIGEN_PANEL })
  );
  formulario.append("attachments[]", archivo, archivo.name);

  const res = await fetch(urlMensajes(conversacionChatwootId, cuentaId), {
    method: "POST",
    // Sin Content-Type a mano: fetch le pone el boundary del multipart, y
    // ponerlo nosotros rompe la subida.
    headers: { api_access_token: token },
    body: formulario,
    cache: "no-store",
  });

  return interpretarRespuesta(res, texto ?? "");
}
