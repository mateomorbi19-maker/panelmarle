/**
 * Acceso de LECTURA a Supabase, compartido por los repositorios reales.
 *
 * Fetch pelado contra la REST API en vez de sumar @supabase/supabase-js: son
 * consultas de lectura simples y la dependencia pesaría en el Docker.
 */

export function credencialesSupabase(): { base: string; key: string } {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY ?? "";
  if (!base || !key) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY. Sin eso el panel no puede leer los datos reales."
    );
  }
  return { base, key };
}

export async function consultarSupabase<T>(recurso: string): Promise<T> {
  const { base, key } = credencialesSupabase();
  const res = await fetch(`${base}/rest/v1/${recurso}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    // El panel es de monitoreo: siempre datos frescos, nunca una copia cacheada.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Supabase respondió ${res.status} al leer ${recurso}: ${(await res.text()).slice(0, 200)}`
    );
  }
  return (await res.json()) as T;
}

/**
 * Llama a una función de Postgres (RPC). Es el único camino de ESCRITURA del
 * panel: nunca hace INSERT ni UPDATE directo. Las reglas viven en la base, así
 * el panel y n8n no pueden discrepar sobre qué significa "el agente está
 * apagado".
 */
export async function llamarRpcSupabase<T>(
  funcion: string,
  argumentos: Record<string, unknown>
): Promise<T> {
  const { base, key } = credencialesSupabase();
  const res = await fetch(`${base}/rest/v1/rpc/${funcion}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(argumentos),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Supabase respondió ${res.status} al llamar ${funcion}: ${(await res.text()).slice(0, 200)}`
    );
  }
  return (await res.json()) as T;
}

/**
 * Una derivación del AGENTE deja de silenciarlo pasadas 24 h: es el mismo TTL
 * que usa `is_escalated(session_id, 24)`, la función que n8n consulta en CADA
 * mensaje. Si el panel no lo respetara, mostraría en rojo conversaciones que
 * el agente ya retomó por su cuenta.
 */
export const TTL_ESCALADO_MS = 24 * 60 * 60 * 1000;

/**
 * ¿El agente sigue callado en esta conversación?
 *
 * `permanente` lo pone el panel cuando Marle lo apaga a mano: ese apagado NO
 * vence, dura hasta que ella lo prenda. Tiene que leerse igual que en la base
 * (ver la función `is_escalated`), porque si el panel dijera "encendido" y el
 * agente estuviera callado, Marle creería que alguien está atendiendo.
 */
export function escaladoVigente(
  escalatedAt: string,
  activa: boolean,
  permanente = false
): boolean {
  if (!activa) return false;
  if (permanente) return true;
  return Date.now() - new Date(escalatedAt).getTime() < TTL_ESCALADO_MS;
}
