/**
 * Capa de datos del Panel Marle Nails — ÚNICO punto de acceso a los datos.
 *
 * Las páginas y los route handlers SIEMPRE leen de `db`, nunca de los mocks
 * directo. Hoy `db` apunta a los repositorios mock; el día que se conecte a
 * las fuentes reales, SOLO se cambia este archivo:
 *
 *   contactos   → tabla de leads en Supabase (el agente ya los registra)
 *   integrantes → Stripe (suscripciones) / Skool "New Paid Member"
 *   checkouts   → webhooks de Stripe (invoice.payment_failed, checkout.session.expired)
 *   alertas     → tabla escalated_conversations en Supabase (ya existe)
 *
 * TODO(conexión real): reemplazar estos handlers por implementaciones que lean
 * de Supabase / Stripe / Chatwoot. NADA más del código debería cambiar.
 */
import { getAlertas } from "./mock/alertas";
import { getCheckouts } from "./mock/checkouts";
import { getContactos } from "./mock/contactos";
import { getIntegrantes } from "./mock/integrantes";

export const db = {
  contactos: getContactos,
  integrantes: getIntegrantes,
  checkouts: getCheckouts,
  alertas: getAlertas,
};

export type * from "./types";
