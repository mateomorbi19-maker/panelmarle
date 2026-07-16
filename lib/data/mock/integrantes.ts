import type { Integrante } from "../types";
import { haceDias, haceMeses } from "./util";

/**
 * Integrantes mock: 15 personas que pagaron la Academia, con ingresos
 * repartidos en los últimos ~13 meses. Las 4 más recientes coinciden con los
 * contactos "ganados" del chat del agente.
 */
// Se reconstruye en cada llamada para que las fechas relativas queden frescas
// aunque el servidor lleve días corriendo.
function construirIntegrantes(): Integrante[] {
  return [
  { id: "m-01", nombre: "Dayana Estupiñán", email: "dayana.estupinan@gmail.com", telefono: "+1 786 555-0118", canal: "whatsapp", fechaIngreso: haceMeses(13), estadoMembresia: "activa", plan: "anual" },
  { id: "m-02", nombre: "Rosa María Quintana", email: "rosam.quintana@gmail.com", telefono: "+53 5 345 6789", canal: "whatsapp", fechaIngreso: haceMeses(12), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-03", nombre: "Camila Herrera", email: "cami.herrera@hotmail.com", telefono: "+54 9 11 1234-5670", canal: "instagram", fechaIngreso: haceMeses(11), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-04", nombre: "Lisandra Peña", email: "lisandra.pena@gmail.com", telefono: "+1 305 555-0174", canal: "whatsapp", fechaIngreso: haceMeses(10), estadoMembresia: "activa", plan: "anual" },
  { id: "m-05", nombre: "Gabriela Mendoza", email: "gabym.mendoza@gmail.com", telefono: "+52 1 55 2345 6781", canal: "instagram", fechaIngreso: haceMeses(9), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-06", nombre: "Norma Iglesias", email: "norma.iglesias@yahoo.com", telefono: "+34 634 567 890", canal: "whatsapp", fechaIngreso: haceMeses(8), estadoMembresia: "cancelada", plan: "mensual" },
  { id: "m-07", nombre: "Yudith Blanco", email: "yudith.blanco@gmail.com", telefono: "+1 813 555-0129", canal: "whatsapp", fechaIngreso: haceMeses(7), estadoMembresia: "activa", plan: "anual" },
  { id: "m-08", nombre: "Marisol Guzmán", email: "marisol.guzman@gmail.com", telefono: "+51 998 765 432", canal: "instagram", fechaIngreso: haceMeses(6), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-09", nombre: "Antonella Suárez", email: "anto.suarez@gmail.com", telefono: "+54 9 351 234-5671", canal: "instagram", fechaIngreso: haceMeses(5), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-10", nombre: "Ivette Carrillo", email: "ivette.carrillo@gmail.com", telefono: "+52 1 81 3456 7892", canal: "whatsapp", fechaIngreso: haceMeses(4), estadoMembresia: "pago_fallido", plan: "mensual" },
  { id: "m-11", nombre: "Paula Vega", email: "pau.vega@gmail.com", telefono: "+56 9 8765 4321", canal: "whatsapp", fechaIngreso: haceMeses(3), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-12", nombre: "Josefina Duarte", email: "jose.duarte@gmail.com", telefono: "+54 9 11 8901-2357", canal: "instagram", fechaIngreso: haceDias(61), estadoMembresia: "activa", plan: "anual" },
  { id: "m-13", nombre: "Yenifer Paredes", email: "yeni.paredes@gmail.com", telefono: "+57 315 678 9012", canal: "whatsapp", fechaIngreso: haceDias(45), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-14", nombre: "Katherine Núñez", email: "kathe.nunez@gmail.com", telefono: "+1 954 555-0163", canal: "instagram", fechaIngreso: haceDias(21), estadoMembresia: "activa", plan: "mensual" },
  { id: "m-15", nombre: "Daniela Torres", email: "dani.torres@gmail.com", telefono: "+54 9 11 7890-1246", canal: "whatsapp", fechaIngreso: haceDias(5), estadoMembresia: "activa", plan: "mensual" },
  ];
}

export async function getIntegrantes(): Promise<Integrante[]> {
  return construirIntegrantes();
}
