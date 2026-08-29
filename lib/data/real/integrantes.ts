import type { Canal, EstadoMembresia, Integrante, PlanMembresia } from "../types";

/**
 * Integrantes REALES: tabla `academia_integrantes` de Supabase.
 *
 * Quién la llena: el Zap de Skool "New Paid Member" → webhook de n8n
 * (workflow 1bAFQytRBWWsxfbs) → INSERT ... ON CONFLICT (email) DO UPDATE.
 * O sea que acá solo LEEMOS; la escritura vive en n8n.
 *
 * OJO con lo que Skool NO manda: `telefono` y `plan` vienen NULL. El teléfono
 * requiere que Marle agregue la pregunta de membresía "¿Cuál es tu WhatsApp?"
 * en Skool y se mapee en el Zap; el plan no lo expone el trigger. Por eso el
 * tipo los deja opcionales y la vista muestra "—": preferimos un guion honesto
 * antes que rellenar con un valor por defecto que seria un dato inventado.
 *
 * Usamos fetch pelado contra la REST API en vez de @supabase/supabase-js para
 * no sumar una dependencia (y peso al Docker) por una sola consulta de lectura.
 */

interface FilaIntegrante {
  id: number | string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  canal: string | null;
  fecha_ingreso: string;
  plan: string | null;
  estado_membresia: string | null;
}

const CANALES: readonly string[] = ["whatsapp", "instagram"];
const ESTADOS: readonly string[] = ["activa", "cancelada", "pago_fallido"];
const PLANES: readonly string[] = ["mensual", "anual"];

/** Solo acepta valores que el tipo contempla; cualquier otra cosa → undefined. */
function comoCanal(v: string | null): Canal | undefined {
  return v && CANALES.includes(v) ? (v as Canal) : undefined;
}
function comoPlan(v: string | null): PlanMembresia | undefined {
  return v && PLANES.includes(v) ? (v as PlanMembresia) : undefined;
}
function comoEstado(v: string | null): EstadoMembresia {
  return v && ESTADOS.includes(v) ? (v as EstadoMembresia) : "activa";
}

export async function getIntegrantesReales(): Promise<Integrante[]> {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY ?? "";
  if (!base || !key) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY. Sin eso el panel no puede leer los integrantes reales."
    );
  }

  const url = `${base}/rest/v1/academia_integrantes?select=id,nombre,email,telefono,canal,fecha_ingreso,plan,estado_membresia&order=fecha_ingreso.desc`;

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    // El panel es de monitoreo: siempre datos frescos, nunca una copia cacheada.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Supabase respondió ${res.status} al leer academia_integrantes: ${(await res.text()).slice(0, 200)}`
    );
  }

  const filas = (await res.json()) as FilaIntegrante[];

  return filas.map((f) => ({
    id: String(f.id),
    nombre: f.nombre?.trim() || "(sin nombre)",
    email: f.email ?? undefined,
    telefono: f.telefono ?? undefined,
    canal: comoCanal(f.canal),
    fechaIngreso: f.fecha_ingreso,
    estadoMembresia: comoEstado(f.estado_membresia),
    plan: comoPlan(f.plan),
  }));
}
