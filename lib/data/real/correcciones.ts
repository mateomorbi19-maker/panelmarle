import type {
  Canal,
  Correccion,
  CorreccionNueva,
  EstadoCorreccion,
  MensajeCorregido,
  RolMensaje,
} from "../types";
import { consultarSupabase, llamarRpcSupabase } from "./supabase";

/**
 * Correcciones REALES: tabla `correcciones` de Supabase.
 *
 * A diferencia de todo lo demás del panel, ESTA tabla la escribe únicamente el
 * panel: no la toca n8n ni el agente. Aun así las escrituras van por función
 * (`guardar_correccion`, `cambiar_estado_correccion`, `borrar_correccion`) y no
 * por INSERT directo, para no romper la regla de `real/supabase.ts` — el panel
 * no escribe tablas, llama funciones.
 *
 * El SQL de la tabla y las funciones está en `supabase/correcciones.sql`.
 */

const CANALES: readonly string[] = ["whatsapp", "instagram"];
const ROLES: readonly string[] = [
  "lead",
  "agente",
  "humano",
  "negocio",
  "sistema",
];

const ES_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface FilaCorreccion {
  id: string;
  conversacion_id: string | null;
  contacto: string | null;
  canal: string | null;
  descripcion: string;
  mensajes: unknown;
  estado: string;
  created_at: string;
  resuelta_at: string | null;
}

const COLUMNAS =
  "id,conversacion_id,contacto,canal,descripcion,mensajes,estado,created_at,resuelta_at";

/**
 * El jsonb viene tal cual se guardó, así que se lo trata como desconocido: una
 * fila vieja o escrita a mano no puede tumbar la pantalla entera.
 */
function comoMensajes(valor: unknown): MensajeCorregido[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((crudo) => {
    if (!crudo || typeof crudo !== "object") return [];
    const m = crudo as Record<string, unknown>;
    const rol = typeof m.rol === "string" && ROLES.includes(m.rol) ? m.rol : "agente";
    return [
      {
        mensajeId: String(m.id ?? m.mensajeId ?? ""),
        rol: rol as RolMensaje,
        texto: typeof m.texto === "string" ? m.texto : undefined,
        fecha: typeof m.fecha === "string" ? m.fecha : "",
      },
    ];
  });
}

function mapear(fila: FilaCorreccion): Correccion {
  return {
    id: fila.id,
    conversacionId: fila.conversacion_id ?? undefined,
    contacto: fila.contacto ?? undefined,
    canal:
      fila.canal && CANALES.includes(fila.canal)
        ? (fila.canal as Canal)
        : undefined,
    descripcion: fila.descripcion,
    mensajes: comoMensajes(fila.mensajes),
    estado: fila.estado === "resuelta" ? "resuelta" : "pendiente",
    creadaAt: fila.created_at,
    resueltaAt: fila.resuelta_at ?? undefined,
  };
}

export async function getCorreccionesReales(): Promise<Correccion[]> {
  const filas = await consultarSupabase<FilaCorreccion[]>(
    `correcciones?select=${COLUMNAS}&order=created_at.desc&limit=300`
  );
  return filas.map(mapear);
}

export async function crearCorreccionReal(
  entrada: CorreccionNueva
): Promise<Correccion> {
  const filas = await llamarRpcSupabase<FilaCorreccion[]>(
    "guardar_correccion",
    {
      p: {
        conversacion_id: entrada.conversacionId ?? null,
        contacto: entrada.contacto ?? null,
        canal: entrada.canal ?? null,
        descripcion: entrada.descripcion,
        // Se guarda con la forma de la tabla (`id`, no `mensajeId`): lo que se
        // lea de la base tiene que poder leerse sin saber cómo lo escribió el
        // panel.
        mensajes: entrada.mensajes.map((m) => ({
          id: m.mensajeId,
          rol: m.rol,
          texto: m.texto ?? null,
          fecha: m.fecha,
        })),
      },
    }
  );
  const fila = filas[0];
  if (!fila) throw new Error("Supabase no devolvió la corrección guardada.");
  return mapear(fila);
}

export async function cambiarEstadoCorreccionReal(
  id: string,
  estado: EstadoCorreccion
): Promise<Correccion> {
  if (!ES_UUID.test(id)) throw new Error("Esa corrección no existe.");
  const filas = await llamarRpcSupabase<FilaCorreccion[]>(
    "cambiar_estado_correccion",
    { p_id: id, p_estado: estado }
  );
  const fila = filas[0];
  if (!fila) throw new Error("Esa corrección no existe.");
  return mapear(fila);
}

/**
 * Borrar es idempotente: si ya no estaba, no es un error. Lo que Marle quería
 * —que no esté— pasa igual, y hacerla mirar un cartel rojo por eso sobra.
 */
export async function borrarCorreccionReal(id: string): Promise<void> {
  if (!ES_UUID.test(id)) throw new Error("Esa corrección no existe.");
  // La función devuelve la fila borrada, no `void`: PostgREST contesta 204 sin
  // cuerpo cuando una función no devuelve nada, y `llamarRpcSupabase` hace
  // siempre `res.json()`.
  await llamarRpcSupabase<FilaCorreccion[]>("borrar_correccion", { p_id: id });
}
