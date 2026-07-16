import type { Contacto } from "../types";
import { haceDias, haceHoras } from "./util";

/**
 * Contactos mock: 25 leads que pasaron por el chat del agente.
 * Coherencia con el resto de la demo: las 4 "ganadas" son integrantes recientes
 * de la Academia, y varias "calientes"/"perdidas" aparecen en checkouts.
 */
// Se reconstruye en cada llamada para que las fechas relativas queden frescas
// aunque el servidor lleve días corriendo.
function construirContactos(): Contacto[] {
  return [
  // ── Nuevas (recién llegan al chat) ──
  { id: "c-01", nombre: "Valentina Ríos", telefono: "+54 9 11 2345-6789", canal: "whatsapp", fechaPrimerContacto: haceHoras(2), ultimoMensaje: haceHoras(1), estado: "nuevo" },
  { id: "c-02", nombre: "Milagros Benítez", telefono: "+54 9 223 456-7890", canal: "instagram", fechaPrimerContacto: haceHoras(5), ultimoMensaje: haceHoras(4), estado: "nuevo" },
  { id: "c-03", nombre: "Xiomara Delgado", telefono: "+1 305 555-0147", canal: "whatsapp", fechaPrimerContacto: haceDias(1), ultimoMensaje: haceHoras(20), estado: "nuevo" },
  { id: "c-04", nombre: "Yanet Morales", telefono: "+53 5 234 5678", canal: "whatsapp", fechaPrimerContacto: haceDias(1), ultimoMensaje: haceHoras(3), estado: "nuevo" },
  { id: "c-05", nombre: "Florencia Acosta", telefono: "+54 9 341 567-8901", canal: "instagram", fechaPrimerContacto: haceDias(2), ultimoMensaje: haceDias(2), estado: "nuevo" },

  // ── En conversación con el agente ──
  { id: "c-06", nombre: "Lucía Fernández", telefono: "+51 987 654 321", canal: "whatsapp", fechaPrimerContacto: haceDias(3), ultimoMensaje: haceHoras(6), estado: "en_conversacion" },
  { id: "c-07", nombre: "Brenda Molina", telefono: "+54 9 11 3456-7801", canal: "instagram", fechaPrimerContacto: haceDias(4), ultimoMensaje: haceHoras(9), estado: "en_conversacion" },
  { id: "c-08", nombre: "Itzel Ramírez", telefono: "+52 1 33 4567 8902", canal: "whatsapp", fechaPrimerContacto: haceDias(5), ultimoMensaje: haceDias(1), estado: "en_conversacion" },
  { id: "c-09", nombre: "Sofía Martínez", telefono: "+34 612 345 678", canal: "instagram", fechaPrimerContacto: haceDias(6), ultimoMensaje: haceDias(2), estado: "en_conversacion" },
  { id: "c-10", nombre: "Ailén Romero", telefono: "+54 9 261 678-9012", canal: "whatsapp", fechaPrimerContacto: haceDias(7), ultimoMensaje: haceDias(1), estado: "en_conversacion" },
  { id: "c-11", nombre: "Yamila Castro", telefono: "+54 9 11 4567-8912", canal: "instagram", fechaPrimerContacto: haceDias(8), ultimoMensaje: haceDias(3), estado: "en_conversacion" },
  { id: "c-12", nombre: "Nayeli Flores", telefono: "+52 1 55 5678 9013", canal: "whatsapp", fechaPrimerContacto: haceDias(9), ultimoMensaje: haceDias(2), estado: "en_conversacion" },

  // ── Calientes (mostraron interés de compra; varias con checkout sin cerrar) ──
  { id: "c-13", nombre: "Martina López", telefono: "+54 9 11 5678-9023", canal: "whatsapp", fechaPrimerContacto: haceDias(3), ultimoMensaje: haceHoras(12), estado: "caliente" },
  { id: "c-14", nombre: "Fernanda Ibarra", telefono: "+52 1 81 6789 0124", canal: "instagram", fechaPrimerContacto: haceDias(4), ultimoMensaje: haceDias(1), estado: "caliente" },
  { id: "c-15", nombre: "Julieta Gómez", telefono: "+54 9 11 6789-0135", canal: "whatsapp", fechaPrimerContacto: haceDias(5), ultimoMensaje: haceDias(2), estado: "caliente" },
  { id: "c-16", nombre: "Alejandra Cruz", telefono: "+57 310 456 7890", canal: "instagram", fechaPrimerContacto: haceDias(6), ultimoMensaje: haceDias(1), estado: "caliente" },
  { id: "c-17", nombre: "Verónica Campos", telefono: "+1 786 555-0192", canal: "whatsapp", fechaPrimerContacto: haceDias(2), ultimoMensaje: haceHoras(8), estado: "caliente" },

  // ── Ganadas (compraron la Academia → también figuran en Integrantes) ──
  { id: "c-18", nombre: "Daniela Torres", telefono: "+54 9 11 7890-1246", canal: "whatsapp", fechaPrimerContacto: haceDias(12), ultimoMensaje: haceDias(5), estado: "ganado" },
  { id: "c-19", nombre: "Katherine Núñez", telefono: "+1 954 555-0163", canal: "instagram", fechaPrimerContacto: haceDias(30), ultimoMensaje: haceDias(21), estado: "ganado" },
  { id: "c-20", nombre: "Yenifer Paredes", telefono: "+57 315 678 9012", canal: "whatsapp", fechaPrimerContacto: haceDias(50), ultimoMensaje: haceDias(45), estado: "ganado" },
  { id: "c-21", nombre: "Josefina Duarte", telefono: "+54 9 11 8901-2357", canal: "instagram", fechaPrimerContacto: haceDias(70), ultimoMensaje: haceDias(61), estado: "ganado" },

  // ── Perdidas (dejaron de responder o desistieron) ──
  { id: "c-22", nombre: "Rocío Benítez", telefono: "+54 9 11 9012-3468", canal: "whatsapp", fechaPrimerContacto: haceDias(15), ultimoMensaje: haceDias(13), estado: "perdido" },
  { id: "c-23", nombre: "Micaela Pereyra", telefono: "+54 9 351 612-3579", canal: "instagram", fechaPrimerContacto: haceDias(20), ultimoMensaje: haceDias(17), estado: "perdido" },
  { id: "c-24", nombre: "Agustina Silva", telefono: "+54 9 11 6123-4680", canal: "whatsapp", fechaPrimerContacto: haceDias(25), ultimoMensaje: haceDias(22), estado: "perdido" },
  { id: "c-25", nombre: "Elena Rodríguez", telefono: "+34 623 456 789", canal: "instagram", fechaPrimerContacto: haceDias(35), ultimoMensaje: haceDias(31), estado: "perdido" },
  ];
}

export async function getContactos(): Promise<Contacto[]> {
  return construirContactos();
}
