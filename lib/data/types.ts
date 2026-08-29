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
  /**
   * Opcional a propósito: el trigger "New Paid Member" de Skool NO manda el
   * plan. Cuando no se sabe, la vista muestra "—" en vez de asumir "mensual",
   * que sería un dato inventado sobre lo que la persona está pagando.
   */
  plan?: PlanMembresia;
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
  /** Id de la conversación en Chatwoot. */
  conversacionId?: string;
  atendida: boolean;
  canal?: Canal;
  /** Id de la conversación en el panel, para abrir el chat completo. */
  conversacionPanelId?: string;
  /** URL ya armada del botón "Atender": Chatwoot o ManyChat según el canal. */
  href?: string;
}

/**
 * Quién escribió un mensaje.
 *
 * Desde el 29/08/2026 los salientes vienen firmados: Chatwoot conserva
 * `content_attributes`, así que el agente firma `agente` y el panel firma
 * `panel` al postear, y la ingesta los separa.
 *
 * `negocio` sigue existiendo y NO es un descuido: es lo que llega SIN firma, o
 * sea Marle escribiendo derecho desde Chatwoot, más todo lo guardado antes de
 * que existieran las firmas. De esos no podemos afirmar quién fue, así que se
 * muestran como "Marle Nails" en vez de inventar un autor.
 */
export type RolMensaje = "lead" | "agente" | "humano" | "negocio" | "sistema";

/**
 * En qué anda un mensaje que salió, según lo que informa el canal.
 *
 * `progress` es "Chatwoot lo tomó y todavía no lo despachó". `failed` es el
 * único que importa de verdad: quiere decir que la clienta NO lo recibió.
 */
export type EstadoEntrega =
  | "progress"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type EstadoConversacion = "bot" | "derivada" | "atendida" | "cerrada";

/**
 * El interruptor general del agente.
 *
 * Apagado lo calla en TODOS los chats. No se confunde con el apagado de una
 * conversación suelta (`Conversacion.agenteApagado`): este manda sobre todo,
 * y mientras esté apagado el interruptor de un chat no cambia nada.
 */
export interface AgenteGlobal {
  encendido: boolean;
  /** ISO 8601 del último cambio. */
  cambiadoAt?: string;
}

/** Un chat completo con una persona. ← tabla `conversaciones` de Supabase. */
export interface Conversacion {
  id: string;
  canal: Canal;
  /** La MISMA clave que usa la memoria del agente: teléfono en WhatsApp. */
  sessionId: string;
  nombre: string;
  telefono?: string;
  igUsername?: string;
  /**
   * Foto de perfil, servida por Chatwoot. En Instagram la sincroniza él solo;
   * en WhatsApp NO existe — Meta no la comparte por la Cloud API — y ahí el
   * panel muestra la inicial.
   */
  avatarUrl?: string;
  manychatSubscriberId?: string;
  chatwootConversationId?: number;
  chatwootAccountId?: number;
  /** Campaña de CTA que originó el chat, si vino de un comentario. */
  origenCampania?: string;
  estado: EstadoConversacion;
  /** ISO 8601. */
  ultimoMensajeAt?: string;
  ultimoMensajeTexto?: string;
  ultimoMensajeRol?: RolMensaje;
  mensajesCount: number;
  /** ISO 8601. */
  creadaAt: string;
  /**
   * El AGENTE derivó y está esperando a una persona: eso es lo que pinta la
   * conversación en rojo. Respeta el mismo TTL de 24 h que consulta n8n en
   * cada mensaje, así que la alerta se apaga sola cuando el agente vuelve.
   *
   * OJO: no es lo mismo que `agenteApagado`. Marle contestando desde el panel
   * también calla al agente, pero esa conversación NO está pendiente — ya la
   * está atendiendo ella.
   */
  necesitaHumano: boolean;
  motivoDerivacion?: string;
  /** ISO 8601. */
  derivadaAt?: string;
  /**
   * El agente no va a contestar en esta conversación, sea porque derivó él o
   * porque Marle lo apagó desde el panel.
   */
  agenteApagado: boolean;
  /**
   * Lo apagó una persona, así que NO se prende solo a las 24 h: queda apagado
   * hasta que lo prendan desde el panel.
   */
  apagadoPermanente: boolean;
  /**
   * ISO 8601 del último mensaje de la CLIENTA. Con esto se calcula la ventana
   * de 24 h de Meta, que es lo que decide si se puede escribirle o no.
   */
  ultimoMensajeLeadAt?: string;
  /**
   * Mensajes de los últimos 7 días que el canal NO pudo entregar. Se mira en
   * la lista para que una falla no haya que ir a buscarla chat por chat.
   */
  mensajesFallidos: number;
}

/** Un mensaje suelto dentro de una conversación. ← tabla `mensajes`. */
export interface Mensaje {
  id: string;
  rol: RolMensaje;
  texto?: string;
  adjuntoUrl?: string;
  adjuntoTipo?: string;
  /** ISO 8601. */
  fecha: string;
  /**
   * Id del mensaje en Chatwoot. Cuando Marle escribe desde el panel, la
   * burbuja provisoria se queda con este id: así se la reemplaza por la real
   * en cuanto la ingesta la guarda, sin tener que adivinar comparando textos.
   */
  externoId?: string;
  /**
   * Qué pasó con el mensaje después de salir. Solo los salientes lo tienen.
   *
   * Es un dato que llega TARDE, y esa es toda la gracia: que Chatwoot acepte el
   * mensaje no quiere decir que Meta lo haya entregado. El rechazo aparece
   * acá, segundos o minutos después.
   */
  estado?: EstadoEntrega;
  /** El motivo crudo que devolvió Meta cuando falló. */
  errorExterno?: string;
}
