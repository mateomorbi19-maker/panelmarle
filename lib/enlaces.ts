import type { Conversacion } from "@/lib/data/types";

/**
 * A dónde lleva el botón "Ir a la conversación".
 *
 * Desde el 29/08/2026 se contesta DESDE el panel, así que este enlace dejó de
 * ser el único camino. Sigue haciendo falta para dos cosas: mandar audios o
 * fotos (el panel todavía manda solo texto) y, sobre todo, cuando se cerró la
 * ventana de 24 h de Meta y el envío por acá no es posible.
 *
 * Desde el 27/08/2026 Instagram entra por su propio inbox de Chatwoot, así que
 * los dos canales llevan al MISMO lugar y ella contesta todo desde ahí. Se
 * mantienen dos enlaces secundarios para Instagram:
 *
 *   ig.me     → el hilo directo en la app. Necesita el usuario de la clienta y
 *               que Marle esté logueada con su cuenta en ese dispositivo.
 *   ManyChat  → solo si la conversación viene de ahí (por ahora, ninguna).
 *
 * Se arma en el server para no depender de variables NEXT_PUBLIC_ inyectadas
 * en el bundle: al cliente le llega una URL ya lista.
 */
export interface EnlaceConversacion {
  href: string;
  etiqueta: string;
  /** Dónde va a caer: se muestra al lado del botón para que no haya sorpresas. */
  destino: string;
  principal: boolean;
}

function baseChatwoot(): string | null {
  const base = (process.env.CHATWOOT_URL ?? "").replace(/\/+$/, "");
  return base || null;
}

export function enlacesConversacion(
  conversacion: Conversacion
): EnlaceConversacion[] {
  const enlaces: EnlaceConversacion[] = [];

  // Los dos canales pasan por Chatwoot: ese es el enlace principal siempre que
  // tengamos el id de la conversación.
  const base = baseChatwoot();
  const cuenta =
    conversacion.chatwootAccountId ?? Number(process.env.CHATWOOT_ACCOUNT_ID);
  const chat = conversacion.chatwootConversationId;
  if (base && Number.isFinite(cuenta) && chat) {
    enlaces.push({
      href: `${base}/app/accounts/${cuenta}/conversations/${chat}`,
      etiqueta: "Ir a la conversación",
      destino: "Chatwoot",
      principal: true,
    });
  }

  if (conversacion.canal === "whatsapp") return enlaces;

  const cuentaManychat = process.env.MANYCHAT_ACCOUNT_ID;
  if (cuentaManychat && conversacion.manychatSubscriberId) {
    enlaces.push({
      href: `https://app.manychat.com/fb${cuentaManychat}/chat/${conversacion.manychatSubscriberId}`,
      etiqueta: "Abrir en ManyChat",
      destino: "ManyChat",
      principal: enlaces.length === 0,
    });
  }

  if (conversacion.igUsername) {
    enlaces.push({
      href: `https://ig.me/m/${conversacion.igUsername}`,
      etiqueta: "Abrir en Instagram",
      destino: "Instagram",
      principal: enlaces.length === 0,
    });
  }

  return enlaces;
}
