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

/**
 * Zona horaria en la que se leen las conversaciones.
 *
 * Va explícita porque el server corre en UTC dentro de Docker: sin esto, un
 * mensaje de las 6 de la tarde se mostraría a las 9 de la noche. Es la misma
 * zona que usa el agente en n8n para su ventana de 15 s. Si Marle trabaja en
 * otra, se cambia acá y en el nodo `datos_txt1` del workflow.
 */
export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

/** "14:32" en la zona horaria del panel. */
export function horaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ZONA_HORARIA,
  }).format(new Date(iso));
}

/** Separador de días dentro de un chat: "Hoy", "Ayer" o "martes 26 de agosto". */
export function diaDeChat(iso: string): string {
  const enZona = (fecha: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: ZONA_HORARIA,
    }).format(fecha);

  const ahora = new Date();
  const dia = enZona(new Date(iso));
  if (dia === enZona(ahora)) return "Hoy";
  if (dia === enZona(new Date(ahora.getTime() - DIA_MS))) return "Ayer";

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ZONA_HORARIA,
  }).format(new Date(iso));
}

/**
 * La hora que va en la lista de chats, como en cualquier app de mensajería:
 * la hora si es de hoy, "ayer", el día de la semana si es de esta semana, y
 * la fecha corta si es más viejo.
 *
 * Tiene que entrar SIEMPRE en el ancho de un teléfono sin empujar el nombre,
 * por eso es lo más corto posible.
 */
export function cuandoEnLista(iso: string): string {
  const enZona = (fecha: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: ZONA_HORARIA,
    }).format(fecha);

  const ahora = new Date();
  const fecha = new Date(iso);
  const dia = enZona(fecha);

  if (dia === enZona(ahora)) return horaCorta(iso);
  if (dia === enZona(new Date(ahora.getTime() - DIA_MS))) return "ayer";

  // Días de CALENDARIO, no milisegundos divididos. Con milisegundos, un
  // mensaje de hace 6 días y 20 horas daba "6" y podía terminar mostrando el
  // nombre del día de HOY, que es exactamente lo que confunde.
  const dias = Math.round(
    (Date.parse(enZona(ahora)) - Date.parse(dia)) / DIA_MS
  );
  if (dias < 7) {
    const nombre = new Intl.DateTimeFormat("es-AR", {
      weekday: "short",
      timeZone: ZONA_HORARIA,
    }).format(fecha);
    // "mié." -> "mié"
    return nombre.replace(/\.$/, "");
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: ZONA_HORARIA,
  }).format(fecha);
}
