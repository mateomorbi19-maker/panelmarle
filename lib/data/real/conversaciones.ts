import { MOTIVO_DERIVACION } from "../../agente";
import type {
  Canal,
  Conversacion,
  EstadoConversacion,
  EstadoEntrega,
  Mensaje,
  RolMensaje,
} from "../types";
import { consultarSupabase, escaladoVigente } from "./supabase";

/**
 * Conversaciones REALES: tablas `conversaciones` y `mensajes` de Supabase.
 *
 * Quién las llena: el workflow n8n "Panel — Ingesta de mensajes"
 * (id eEtsvvg0wW6k5dZI), que escucha un SEGUNDO webhook de Chatwoot y llama a
 * la función `registrar_mensaje(jsonb)`. Acá solo LEEMOS.
 *
 * Igual que `real/integrantes.ts`: fetch pelado contra la REST API en vez de
 * sumar @supabase/supabase-js por unas pocas consultas de lectura.
 */

const CANALES: readonly string[] = ["whatsapp", "instagram"];
const ROLES: readonly string[] = ["lead", "agente", "humano", "negocio", "sistema"];
const ESTADOS: readonly string[] = ["bot", "derivada", "atendida", "cerrada"];
const ESTADOS_ENTREGA: readonly string[] = [
  "progress",
  "sent",
  "delivered",
  "read",
  "failed",
];

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface FilaConversacion {
  id: string;
  canal: string | null;
  session_id: string;
  nombre: string | null;
  telefono: string | null;
  ig_username: string | null;
  avatar_url: string | null;
  manychat_subscriber_id: string | null;
  chatwoot_conversation_id: number | string | null;
  chatwoot_account_id: number | string | null;
  origen_campania: string | null;
  estado: string | null;
  ultimo_mensaje_at: string | null;
  ultimo_mensaje_texto: string | null;
  ultimo_mensaje_rol: string | null;
  mensajes_count: number;
  created_at: string;
  ultimo_mensaje_lead_at: string | null;
  mensajes_fallidos: number | null;
}

interface FilaMensaje {
  id: number | string;
  rol: string;
  texto: string | null;
  adjunto_url: string | null;
  adjunto_tipo: string | null;
  externo_id: string | null;
  estado: string | null;
  error_externo: string | null;
  created_at: string;
}

interface FilaEscalada {
  session_id: string;
  reason: string | null;
  escalated_at: string;
  permanente: boolean | null;
}

/**
 * Se lee de la VISTA `conversaciones_panel`, no de la tabla: trae ya resueltos
 * el último mensaje de la clienta (de ahí sale la ventana de 24 h) y cuántos
 * mensajes no se pudieron entregar. Sacarlos por separado serían 300 consultas
 * sueltas en la lista, y sin ellos no se puede contestar desde ahí.
 */
const VISTA = "conversaciones_panel";
const COLUMNAS_CONVERSACION =
  "id,canal,session_id,nombre,telefono,ig_username,avatar_url,manychat_subscriber_id," +
  "chatwoot_conversation_id,chatwoot_account_id,origen_campania,estado," +
  "ultimo_mensaje_at,ultimo_mensaje_texto,ultimo_mensaje_rol,mensajes_count,created_at," +
  "ultimo_mensaje_lead_at,mensajes_fallidos";

function comoCanal(v: string | null): Canal {
  return v && CANALES.includes(v) ? (v as Canal) : "whatsapp";
}
function comoRol(v: string | null): RolMensaje {
  return v && ROLES.includes(v) ? (v as RolMensaje) : "sistema";
}
function comoEstado(v: string | null): EstadoConversacion {
  return v && ESTADOS.includes(v) ? (v as EstadoConversacion) : "bot";
}
function comoEstadoEntrega(v: string | null): EstadoEntrega | undefined {
  return v && ESTADOS_ENTREGA.includes(v) ? (v as EstadoEntrega) : undefined;
}
function comoNumero(v: number | string | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Las conversaciones donde el agente está callado, por clave de sesión.
 * Incluye tanto las que derivó él como las que Marle apagó a mano: el motivo
 * las distingue después.
 */
async function escaladasVigentes(
  filtroSesion?: string
): Promise<Map<string, FilaEscalada>> {
  const filtro = filtroSesion
    ? `&session_id=eq.${encodeURIComponent(filtroSesion)}`
    : "";
  const filas = await consultarSupabase<FilaEscalada[]>(
    `escalated_conversations?select=session_id,reason,escalated_at,permanente&active=is.true${filtro}`
  );
  const vigentes = new Map<string, FilaEscalada>();
  for (const fila of filas) {
    if (escaladoVigente(fila.escalated_at, true, fila.permanente ?? false)) {
      vigentes.set(fila.session_id, fila);
    }
  }
  return vigentes;
}

function mapear(
  fila: FilaConversacion,
  escaladas: Map<string, FilaEscalada>
): Conversacion {
  const escalada = escaladas.get(fila.session_id);
  // Callado por los dos motivos; en rojo SOLO cuando lo decidió el agente.
  const apagado = Boolean(escalada);
  const derivoElAgente = escalada?.reason === MOTIVO_DERIVACION;
  return {
    id: fila.id,
    canal: comoCanal(fila.canal),
    sessionId: fila.session_id,
    nombre: fila.nombre?.trim() || fila.telefono || fila.session_id,
    telefono: fila.telefono ?? undefined,
    igUsername: fila.ig_username ?? undefined,
    avatarUrl: fila.avatar_url ?? undefined,
    manychatSubscriberId: fila.manychat_subscriber_id ?? undefined,
    chatwootConversationId: comoNumero(fila.chatwoot_conversation_id),
    chatwootAccountId: comoNumero(fila.chatwoot_account_id),
    origenCampania: fila.origen_campania ?? undefined,
    estado: comoEstado(fila.estado),
    ultimoMensajeAt: fila.ultimo_mensaje_at ?? undefined,
    ultimoMensajeTexto: fila.ultimo_mensaje_texto ?? undefined,
    ultimoMensajeRol: fila.ultimo_mensaje_rol
      ? comoRol(fila.ultimo_mensaje_rol)
      : undefined,
    mensajesCount: fila.mensajes_count ?? 0,
    creadaAt: fila.created_at,
    necesitaHumano: apagado && derivoElAgente,
    motivoDerivacion: escalada?.reason ?? undefined,
    derivadaAt: escalada?.escalated_at,
    agenteApagado: apagado,
    apagadoPermanente: Boolean(escalada?.permanente),
    ultimoMensajeLeadAt: fila.ultimo_mensaje_lead_at ?? undefined,
    mensajesFallidos: fila.mensajes_fallidos ?? 0,
  };
}

export async function getConversacionesReales(): Promise<Conversacion[]> {
  const [filas, escaladas] = await Promise.all([
    consultarSupabase<FilaConversacion[]>(
      `${VISTA}?select=${COLUMNAS_CONVERSACION}&order=ultimo_mensaje_at.desc.nullslast&limit=300`
    ),
    escaladasVigentes(),
  ]);
  return filas.map((fila) => mapear(fila, escaladas));
}

export async function getConversacionReal(
  id: string
): Promise<Conversacion | null> {
  // El id viene de la URL: si no es un uuid, no llegamos a preguntarle a nadie.
  if (!ES_UUID.test(id)) return null;

  const filas = await consultarSupabase<FilaConversacion[]>(
    `${VISTA}?select=${COLUMNAS_CONVERSACION}&id=eq.${id}&limit=1`
  );
  const fila = filas[0];
  if (!fila) return null;

  return mapear(fila, await escaladasVigentes(fila.session_id));
}

/**
 * Los últimos 500 mensajes de una conversación, del más viejo al más nuevo.
 * Se piden en orden inverso para que el corte se lleve lo ANTIGUO y no lo
 * último, que es lo que a Marle le importa ver.
 */
export async function getMensajesReales(
  conversacionId: string
): Promise<Mensaje[]> {
  if (!ES_UUID.test(conversacionId)) return [];

  const filas = await consultarSupabase<FilaMensaje[]>(
    `mensajes?select=id,rol,texto,adjunto_url,adjunto_tipo,externo_id,estado,error_externo,created_at` +
      `&conversacion_id=eq.${conversacionId}&order=created_at.desc&limit=500`
  );

  return filas
    .map((fila) => ({
      id: String(fila.id),
      rol: comoRol(fila.rol),
      texto: fila.texto ?? undefined,
      adjuntoUrl: fila.adjunto_url ?? undefined,
      adjuntoTipo: fila.adjunto_tipo ?? undefined,
      fecha: fila.created_at,
      externoId: fila.externo_id ?? undefined,
      estado: comoEstadoEntrega(fila.estado),
      errorExterno: fila.error_externo ?? undefined,
    }))
    .reverse();
}
