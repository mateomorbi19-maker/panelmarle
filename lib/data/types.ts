/**
 * Tipos de dominio del Panel Marle Nails.
 *
 * IMPORTANTE: estas interfaces espejan la forma que van a tener las fuentes
 * reales (Supabase / Stripe / Chatwoot) para que el pasaje de mock → real no
 * requiera tocar las vistas. Ver el mapeo completo en el README.
 */

export type Canal = "whatsapp" | "instagram";

export type EstadoContacto =
  | "nuevo"
  | "en_conversacion"
  | "caliente"
  | "ganado"
  | "perdido";

/** Lead que pasó por el chat del agente. ← futura tabla de leads en Supabase. */
export interface Contacto {
  id: string;
  nombre: string;
  /** Formato internacional, ej. "+54 9 11 2345-6789". */
  telefono: string;
  canal: Canal;
  /** ISO 8601. */
  fechaPrimerContacto: string;
  /** ISO 8601 — último mensaje registrado (para ordenar por actividad). */
  ultimoMensaje?: string;
  estado: EstadoContacto;
}

export type EstadoMembresia = "activa" | "cancelada" | "pago_fallido";
export type PlanMembresia = "mensual" | "anual";

/** Persona que pagó la Academia. ← futuro Stripe / Skool "New Paid Member". */
export interface Integrante {
  id: string;
  nombre: string;
  /** Así identifica Stripe/Skool a la persona que paga. */
  email?: string;
  telefono?: string;
  canal?: Canal;
  /** ISO 8601. El "tiempo dentro" NO se guarda: se calcula desde esta fecha. */
  fechaIngreso: string;
  estadoMembresia: EstadoMembresia;
  plan: PlanMembresia;
}

export type MotivoCheckout = "error_pago" | "abandono";

/** Checkout que no se completó. ← futuros webhooks de Stripe. */
export interface CheckoutAbandonado {
  id: string;
  nombre: string;
  telefono: string;
  canal: Canal;
  /** ISO 8601. */
  fecha: string;
  motivo: MotivoCheckout;
  /** Monto en USD del checkout que quedó sin completar. */
  monto?: number;
}

/** Lead que necesita atención humana. ← tabla escalated_conversations + Chatwoot. */
export interface Alerta {
  id: string;
  nombre: string;
  telefono: string;
  /** Ej.: "Pidió hablar con una persona", "Reclamo", "Reembolso de un pago hecho". */
  motivo: string;
  /** ISO 8601. */
  fecha: string;
  /** Id de la conversación en Chatwoot (para el futuro botón "Atender"). */
  conversacionId?: string;
  atendida: boolean;
}
