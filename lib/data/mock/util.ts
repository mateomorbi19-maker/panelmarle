/**
 * Helpers de fechas relativas para los datos mock.
 *
 * Se calculan respecto de "ahora" EN CADA LLAMADA (y los repos mock
 * reconstruyen sus datos por request), así la demo siempre se ve fresca
 * —alertas de hace horas, ingresos de los últimos meses— aunque el servidor
 * lleve días corriendo.
 */

const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

export function haceHoras(horas: number): string {
  return new Date(Date.now() - horas * HORA_MS).toISOString();
}

export function haceDias(dias: number): string {
  return new Date(Date.now() - dias * DIA_MS).toISOString();
}

/**
 * Resta meses calendario SIN desbordar fin de mes: un 31 de julio,
 * haceMeses(3) da 30 de abril (no 1 de mayo), así la distribución mensual
 * de los mocks no se corre de mes.
 */
export function haceMeses(meses: number): string {
  const d = new Date();
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() - meses);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, ultimoDia));
  return d.toISOString();
}
