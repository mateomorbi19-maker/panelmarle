import type { CheckoutAbandonado } from "../types";
import { haceDias, haceHoras } from "./util";

/**
 * Checkouts abandonados mock: 10 pagos que no se completaron.
 * Montos reales del negocio: USD 47 (plan mensual) y USD 338 (anual con 40% off).
 * Varios nombres coinciden con contactos "calientes"/"perdidos" del chat.
 */
// Se reconstruye en cada llamada para que las fechas relativas queden frescas
// aunque el servidor lleve días corriendo.
function construirCheckouts(): CheckoutAbandonado[] {
  return [
  { id: "k-01", nombre: "Verónica Campos", telefono: "+1 786 555-0192", canal: "whatsapp", fecha: haceHoras(7), motivo: "abandono", monto: 47 },
  { id: "k-02", nombre: "Martina López", telefono: "+54 9 11 5678-9023", canal: "whatsapp", fecha: haceDias(1), motivo: "abandono", monto: 47 },
  { id: "k-03", nombre: "Fernanda Ibarra", telefono: "+52 1 81 6789 0124", canal: "instagram", fecha: haceDias(2), motivo: "error_pago", monto: 47 },
  { id: "k-04", nombre: "Ivette Carrillo", telefono: "+52 1 81 3456 7892", canal: "whatsapp", fecha: haceDias(3), motivo: "error_pago", monto: 47 },
  { id: "k-05", nombre: "Julieta Gómez", telefono: "+54 9 11 6789-0135", canal: "whatsapp", fecha: haceDias(4), motivo: "abandono", monto: 47 },
  { id: "k-06", nombre: "Alejandra Cruz", telefono: "+57 310 456 7890", canal: "instagram", fecha: haceDias(5), motivo: "abandono", monto: 338 },
  { id: "k-07", nombre: "Rocío Benítez", telefono: "+54 9 11 9012-3468", canal: "whatsapp", fecha: haceDias(14), motivo: "abandono", monto: 47 },
  { id: "k-08", nombre: "Micaela Pereyra", telefono: "+54 9 351 612-3579", canal: "instagram", fecha: haceDias(19), motivo: "error_pago", monto: 47 },
  { id: "k-09", nombre: "Agustina Silva", telefono: "+54 9 11 6123-4680", canal: "whatsapp", fecha: haceDias(24), motivo: "abandono", monto: 47 },
  { id: "k-10", nombre: "Elena Rodríguez", telefono: "+34 623 456 789", canal: "instagram", fecha: haceDias(33), motivo: "error_pago", monto: 338 },
  ];
}

export async function getCheckouts(): Promise<CheckoutAbandonado[]> {
  return construirCheckouts();
}
