/**
 * Formateo de fechas y montos para el panel (español, pensado para tablas).
 * Se usa en Server Components: el server formatea, el cliente solo muestra.
 */

const MES_CORTO = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const DIA_MS = 24 * 60 * 60 * 1000;

/** "16 jul 2026" */
export function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

/** Relativo corto para actividad reciente: "hace 3 h", "hace 2 días", o fecha. */
export function fechaRelativa(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const horas = Math.floor(ms / (60 * 60 * 1000));
  if (horas < 1) return "hace minutos";
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(ms / DIA_MS);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return formatearFecha(iso);
}

/** Tiempo transcurrido desde una fecha: "5 días", "3 semanas", "1 año y 2 meses". */
export function tiempoDesde(iso: string): string {
  const desde = new Date(iso);
  const ahora = new Date();
  const dias = Math.floor((ahora.getTime() - desde.getTime()) / DIA_MS);
  if (dias < 1) return "hoy";
  if (dias === 1) return "1 día";
  if (dias < 14) return `${dias} días`;

  // Meses CALENDARIO reales (dividir por 30.44 días subestima y muestra un
  // mes de menos en fechas que son exactamente N meses atrás).
  let meses =
    (ahora.getFullYear() - desde.getFullYear()) * 12 +
    (ahora.getMonth() - desde.getMonth());
  if (ahora.getDate() < desde.getDate()) meses--;

  if (meses < 2) return `${Math.floor(dias / 7)} semanas`;
  if (meses < 12) return `${meses} meses`;
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const base = anios === 1 ? "1 año" : `${anios} años`;
  if (resto === 0) return base;
  return `${base} y ${resto === 1 ? "1 mes" : `${resto} meses`}`;
}

/** "US$ 47" / "US$ 338" */
export function formatearUSD(monto: number): string {
  return `US$ ${monto.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}
