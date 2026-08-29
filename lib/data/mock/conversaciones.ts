import type { Conversacion, Mensaje } from "../types";
import { haceDias, haceHoras } from "./util";

/**
 * Conversaciones mock: 5 chats (3 de WhatsApp, 2 de Instagram), uno de ellos
 * derivado a una persona. Sirven para que la demo se vea completa cuando no
 * hay credenciales de Supabase.
 *
 * Los ids son uuids de verdad para que el detalle funcione igual que con datos
 * reales, y los textos imitan el estilo real del agente (frases cortas, una por
 * mensaje, ruteo online/presencial antes de nombrar nada).
 */

const IDS = {
  yanet: "aa000000-0000-4000-8000-000000000001",
  dayana: "aa000000-0000-4000-8000-000000000002",
  marisol: "aa000000-0000-4000-8000-000000000003",
  claudia: "aa000000-0000-4000-8000-000000000004",
  ines: "aa000000-0000-4000-8000-000000000005",
} as const;

function construirConversaciones(): Conversacion[] {
  return [
    {
      id: IDS.yanet,
      canal: "whatsapp",
      sessionId: "+5352345678",
      nombre: "Yanet Morales",
      telefono: "+53 5 234 5678",
      chatwootConversationId: 1284,
      chatwootAccountId: 1,
      estado: "derivada",
      ultimoMensajeAt: haceHoras(2),
      // De acá sale la ventana de 24 h: sin esto la demo nunca deja escribir.
      ultimoMensajeLeadAt: haceHoras(2),
      ultimoMensajeTexto: "déjame que esto lo vea el equipo directamente",
      ultimoMensajeRol: "negocio",
      mensajesCount: 6,
      creadaAt: haceHoras(3),
      necesitaHumano: true,
      agenteApagado: true,
      apagadoPermanente: false,
      mensajesFallidos: 0,
      motivoDerivacion: "frase_derivacion",
      derivadaAt: haceHoras(2),
    },
    {
      id: IDS.dayana,
      canal: "instagram",
      sessionId: "ig:849201",
      nombre: "Dayana Ruiz",
      igUsername: "dayana.nails",
      manychatSubscriberId: "849201",
      origenCampania: "video-esmaltado-sep",
      estado: "bot",
      ultimoMensajeAt: haceHoras(5),
      // De acá sale la ventana de 24 h: sin esto la demo nunca deja escribir.
      ultimoMensajeLeadAt: haceHoras(5),
      ultimoMensajeTexto: "¿y cuánto sale la Academia?",
      ultimoMensajeRol: "lead",
      mensajesCount: 4,
      creadaAt: haceHoras(6),
      necesitaHumano: false,
      agenteApagado: false,
      apagadoPermanente: false,
      mensajesFallidos: 0,
    },
    {
      id: IDS.marisol,
      canal: "whatsapp",
      sessionId: "+5218134567892",
      nombre: "Marisol Fuentes",
      telefono: "+52 1 81 3456 7892",
      chatwootConversationId: 1279,
      chatwootAccountId: 1,
      estado: "bot",
      ultimoMensajeAt: haceDias(1),
      // De acá sale la ventana de 24 h: sin esto la demo nunca deja escribir.
      ultimoMensajeLeadAt: haceDias(1),
      ultimoMensajeTexto: "perfecto, ahí lo miro y te cuento",
      ultimoMensajeRol: "lead",
      mensajesCount: 9,
      creadaAt: haceDias(1),
      necesitaHumano: false,
      agenteApagado: false,
      apagadoPermanente: false,
      mensajesFallidos: 0,
    },
    {
      id: IDS.claudia,
      canal: "instagram",
      sessionId: "ig:773410",
      nombre: "Claudia Beltrán",
      igUsername: "clau.beltran",
      manychatSubscriberId: "773410",
      origenCampania: "video-uñas-desde-cero",
      estado: "bot",
      ultimoMensajeAt: haceDias(2),
      // De acá sale la ventana de 24 h: sin esto la demo nunca deja escribir.
      ultimoMensajeLeadAt: haceDias(2),
      ultimoMensajeTexto: "¿Estás buscando información sobre una formación online o presencial?",
      ultimoMensajeRol: "negocio",
      mensajesCount: 3,
      creadaAt: haceDias(2),
      necesitaHumano: false,
      agenteApagado: false,
      apagadoPermanente: false,
      mensajesFallidos: 0,
    },
    {
      id: IDS.ines,
      canal: "whatsapp",
      sessionId: "+5492616789012",
      nombre: "Inés Romero",
      telefono: "+54 9 261 678-9012",
      chatwootConversationId: 1266,
      chatwootAccountId: 1,
      estado: "atendida",
      ultimoMensajeAt: haceDias(4),
      // De acá sale la ventana de 24 h: sin esto la demo nunca deja escribir.
      ultimoMensajeLeadAt: haceDias(4),
      ultimoMensajeTexto: "gracias!! ya me anoté 🥰",
      ultimoMensajeRol: "lead",
      mensajesCount: 12,
      creadaAt: haceDias(5),
      necesitaHumano: false,
      agenteApagado: false,
      apagadoPermanente: false,
      mensajesFallidos: 0,
    },
  ];
}

/**
 * Los mensajes que SALEN llevan estado de entrega, igual que los reales. Sin
 * esto la demo no mostraría los tildes ni un mensaje rechazado, que es
 * justamente lo que hay que poder ver de un vistazo.
 */
function mensaje(
  id: string,
  rol: Mensaje["rol"],
  texto: string,
  fecha: string,
  estado?: Mensaje["estado"],
  errorExterno?: string
): Mensaje {
  const sale = rol !== "lead" && rol !== "sistema";
  return {
    id,
    rol,
    texto,
    fecha,
    estado: estado ?? (sale ? "read" : undefined),
    errorExterno,
  };
}

function construirMensajes(): Record<string, Mensaje[]> {
  return {
    [IDS.yanet]: [
      mensaje("y1", "lead", "buenas, vi lo de las uñas", haceHoras(3)),
      mensaje("y2", "negocio", "¡Hola! 😊 Un gusto saludarte", haceHoras(3)),
      mensaje("y3", "negocio", "¿Estás buscando información sobre una formación online o presencial?", haceHoras(3)),
      mensaje("y4", "lead", "online, pero ya pagué el mes pasado y no me llegó nada", haceHoras(2)),
      mensaje("y5", "lead", "necesito hablar con alguien de verdad", haceHoras(2)),
      mensaje("y6", "negocio", "déjame que esto lo vea el equipo directamente, en un ratico te contestan", haceHoras(2)),
    ],
    [IDS.dayana]: [
      mensaje("d1", "negocio", "¡Hola! Vi tu comentario en el video 😊", haceHoras(6)),
      mensaje("d2", "lead", "info porfa", haceHoras(6)),
      mensaje("d3", "negocio", "¿Estás buscando información sobre una formación online o presencial?", haceHoras(5)),
      mensaje("d4", "lead", "¿y cuánto sale la Academia?", haceHoras(5)),
    ],
    [IDS.marisol]: [
      mensaje("m1", "lead", "hola! quiero aprender uñas desde cero", haceDias(1)),
      mensaje("m2", "negocio", "¡Hola! 😊 Un gusto saludarte", haceDias(1)),
      mensaje("m3", "negocio", "¿Estás buscando información sobre una formación online o presencial?", haceDias(1)),
      mensaje("m4", "lead", "online, vivo lejos y no puedo viajar", haceDias(1)),
      mensaje("m5", "negocio", "¡Claro que sí! Se puede aprender perfectamente a distancia", haceDias(1)),
      mensaje("m6", "lead", "y sirve si nunca hice uñas?", haceDias(1)),
      mensaje("m7", "negocio", "Sí, se empieza desde lo más básico", haceDias(1)),
      mensaje("m8", "negocio", "https://www.skool.com/creo-en-ti-marle/about", haceDias(1)),
      mensaje("m9", "lead", "perfecto, ahí lo miro y te cuento", haceDias(1)),
    ],
    [IDS.claudia]: [
      mensaje("c1", "negocio", "¡Hola! Vi tu comentario en el video 😊", haceDias(2), "failed", "(#131047) Message failed to send because more than 24 hours have passed"),
      mensaje("c2", "lead", "hola", haceDias(2)),
      mensaje("c3", "negocio", "¿Estás buscando información sobre una formación online o presencial?", haceDias(2)),
    ],
    [IDS.ines]: [
      mensaje("i1", "lead", "hola, me pasaron tu contacto", haceDias(5)),
      mensaje("i2", "negocio", "¡Hola! 😊 Un gusto saludarte", haceDias(5)),
      mensaje("i3", "negocio", "¿Estás buscando información sobre una formación online o presencial?", haceDias(5)),
      mensaje("i4", "lead", "presencial", haceDias(5)),
      mensaje("i5", "negocio", "Los cursos presenciales se arman a medida", haceDias(5)),
      mensaje("i6", "lead", "ah, y online qué hay?", haceDias(4)),
      mensaje("i7", "negocio", "Online existe la Academia, con clases en vivo y comunidad", haceDias(4)),
      mensaje("i8", "negocio", "Y también la Mentoría Personalizada, uno a uno con Marle", haceDias(4)),
      mensaje("i9", "lead", "la Academia me sirve", haceDias(4)),
      mensaje("i10", "negocio", "¡Genial! Te dejo el acceso", haceDias(4)),
      mensaje("i11", "negocio", "https://www.skool.com/creo-en-ti-marle/about", haceDias(4)),
      mensaje("i12", "lead", "gracias!! ya me anoté 🥰", haceDias(4)),
    ],
  };
}

export async function getConversaciones(): Promise<Conversacion[]> {
  return construirConversaciones();
}

export async function getConversacion(
  id: string
): Promise<Conversacion | null> {
  return construirConversaciones().find((c) => c.id === id) ?? null;
}

export async function getMensajes(conversacionId: string): Promise<Mensaje[]> {
  return construirMensajes()[conversacionId] ?? [];
}
