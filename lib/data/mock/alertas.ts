import type { Alerta } from "../types";
import { haceDias, haceHoras } from "./util";

/**
 * Alertas mock: 6 leads que necesitan atención humana (4 pendientes, 2 ya
 * atendidas).
 *
 * Las primeras cinco apuntan a las conversaciones mock (mismos uuids que
 * `mock/conversaciones.ts`) para que en la demo el botón de abrir el chat
 * exista de verdad. Sin `conversacionPanelId` la sección quedaba sin ningún
 * botón y no había forma de llegar a la conversación.
 */
const CHATS_MOCK = [
  "aa000000-0000-4000-8000-000000000001",
  "aa000000-0000-4000-8000-000000000002",
  "aa000000-0000-4000-8000-000000000003",
  "aa000000-0000-4000-8000-000000000004",
  "aa000000-0000-4000-8000-000000000005",
];
// Se reconstruye en cada llamada para que las fechas relativas queden frescas
// aunque el servidor lleve días corriendo.
function construirAlertas(): Alerta[] {
  return [
  { id: "a-01", nombre: "Yanet Morales", telefono: "+53 5 234 5678", motivo: "Pidió hablar con una persona", fecha: haceHoras(3), conversacionId: "1284", atendida: false },
  { id: "a-02", nombre: "Ivette Carrillo", telefono: "+52 1 81 3456 7892", motivo: "Problema con el pago de su membresía", fecha: haceHoras(6), conversacionId: "1279", atendida: false },
  { id: "a-03", nombre: "Rosa María Quintana", telefono: "+53 5 345 6789", motivo: "Solicita reembolso de un pago realizado", fecha: haceDias(1), conversacionId: "1261", atendida: false },
  { id: "a-04", nombre: "Ailén Romero", telefono: "+54 9 261 678-9012", motivo: "Reclamo por demora en la respuesta", fecha: haceDias(1), conversacionId: "1266", atendida: false },
  { id: "a-05", nombre: "Sofía Martínez", telefono: "+34 612 345 678", motivo: "Duda que el agente no pudo resolver", fecha: haceDias(3), conversacionId: "1240", atendida: true },
  { id: "a-06", nombre: "Micaela Pereyra", telefono: "+54 9 351 612-3579", motivo: "Enojo / reclamo agresivo", fecha: haceDias(6), conversacionId: "1228", atendida: true },
  ];
}

export async function getAlertas(): Promise<Alerta[]> {
  return construirAlertas().map((alerta, i) => ({
    ...alerta,
    canal: i % 3 === 2 ? ("instagram" as const) : ("whatsapp" as const),
    conversacionPanelId: CHATS_MOCK[i],
  }));
}
