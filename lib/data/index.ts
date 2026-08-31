/**
 * Capa de datos del Panel Marle Nails — ÚNICO punto de acceso a los datos.
 *
 * Las páginas y los route handlers SIEMPRE leen de `db`, nunca de los mocks
 * directo. Estado del pasaje mock → real:
 *
 *   conversaciones → ✅ REAL (27/08/2026): tablas `conversaciones` y `mensajes`
 *                    de Supabase, que llena el workflow n8n "Panel — Ingesta de
 *                    mensajes" desde un segundo webhook de Chatwoot.
 *   integrantes   → ✅ REAL (26/07/2026): tabla `academia_integrantes` de Supabase,
 *                   que llena el Zap de Skool "New Paid Member" vía webhook de n8n.
 *   contactos     → MOCK. Se va a derivar de `conversaciones`.
 *   checkouts     → MOCK. Futuro: webhooks de Stripe (invoice.payment_failed,
 *                   checkout.session.expired) — todavía no existen.
 *   alertas       → ✅ REAL (27/08/2026): tabla escalated_conversations, que
 *                   escribe el propio agente al derivar a una persona.
 *   correcciones  → ✅ REAL (31/08/2026): tabla `correcciones`, la ÚNICA que
 *                   escribe el panel y nadie más. SQL en supabase/correcciones.sql.
 *
 * Al conectar el resto, se cambia SOLO este archivo.
 */
import { getAlertas } from "./mock/alertas";
import { getCheckouts } from "./mock/checkouts";
import { getContactos } from "./mock/contactos";
import {
  borrarCorreccion,
  cambiarEstadoCorreccion,
  crearCorreccion,
  getCorrecciones,
} from "./mock/correcciones";
import {
  getConversacion,
  getConversaciones,
  getMensajes,
} from "./mock/conversaciones";
import { getIntegrantes } from "./mock/integrantes";
import { getAlertasReales } from "./real/alertas";
import {
  getConversacionReal,
  getConversacionesReales,
  getMensajesReales,
} from "./real/conversaciones";
import { getIntegrantesReales } from "./real/integrantes";
import { apagarAgenteReal, prenderAgenteReal } from "./real/acciones";
import {
  borrarCorreccionReal,
  cambiarEstadoCorreccionReal,
  crearCorreccionReal,
  getCorreccionesReales,
} from "./real/correcciones";
import {
  cambiarAgenteGlobalReal,
  getAgenteGlobalReal,
} from "./real/ajustes";
import type { AgenteGlobal, Conversacion } from "./types";

/**
 * Con credenciales de Supabase lee los datos REALES; sin ellas usa los mocks,
 * así la demo sigue andando en cualquier máquina y el build de Docker no
 * necesita env.
 *
 * Si las credenciales ESTÁN pero la lectura falla, se deja explotar a
 * propósito (lo agarra `app/(dashboard)/error.tsx`): mostrar conversaciones
 * inventadas como si fueran las de sus clientas es peor que una pantalla de
 * error, porque nadie se daría cuenta.
 */
const hayCredencialesSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
);

/**
 * En modo demo (sin credenciales) no se apaga ni se prende nada: no hay a qué
 * agente apagarle. Falla fuerte y claro en vez de simular que funcionó, que
 * sería peor — Marle creería que el agente está callado y no lo estaría.
 */
async function soloDemo(): Promise<never> {
  throw new Error(
    "El panel está en modo demo (sin credenciales de Supabase): no puede prender ni apagar el agente."
  );
}

export const db = {
  contactos: getContactos,
  integrantes: hayCredencialesSupabase ? getIntegrantesReales : getIntegrantes,
  checkouts: getCheckouts,
  alertas: hayCredencialesSupabase ? getAlertasReales : getAlertas,
  conversaciones: hayCredencialesSupabase
    ? getConversacionesReales
    : getConversaciones,
  conversacion: hayCredencialesSupabase ? getConversacionReal : getConversacion,
  mensajes: hayCredencialesSupabase ? getMensajesReales : getMensajes,
  apagarAgente: hayCredencialesSupabase
    ? apagarAgenteReal
    : (soloDemo as (c: Conversacion, preservar?: boolean) => Promise<void>),
  prenderAgente: hayCredencialesSupabase
    ? prenderAgenteReal
    : (soloDemo as (c: Conversacion) => Promise<void>),
  agenteGlobal: hayCredencialesSupabase
    ? getAgenteGlobalReal
    : // En la demo el interruptor se ve prendido y no hace nada: no hay agente
      // al que apagar.
      (async () => ({ encendido: true })) as () => Promise<AgenteGlobal>,
  cambiarAgenteGlobal: hayCredencialesSupabase
    ? cambiarAgenteGlobalReal
    : (soloDemo as (encendido: boolean) => Promise<AgenteGlobal>),
  /*
   * Las correcciones SÍ se pueden escribir en modo demo, al revés que el
   * agente: son notas del panel, no le tocan la boca a nadie. Se guardan en
   * memoria del proceso y se pierden al reiniciar, que para una demo alcanza
   * y sobra — y deja probar el flujo entero sin credenciales.
   */
  correcciones: hayCredencialesSupabase ? getCorreccionesReales : getCorrecciones,
  crearCorreccion: hayCredencialesSupabase
    ? crearCorreccionReal
    : crearCorreccion,
  cambiarEstadoCorreccion: hayCredencialesSupabase
    ? cambiarEstadoCorreccionReal
    : cambiarEstadoCorreccion,
  borrarCorreccion: hayCredencialesSupabase
    ? borrarCorreccionReal
    : borrarCorreccion,
};

export type * from "./types";
