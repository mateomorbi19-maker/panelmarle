import type {
  Correccion,
  CorreccionNueva,
  EstadoCorreccion,
} from "../types";
import { haceDias, haceHoras } from "./util";

/**
 * Correcciones mock, para la demo sin credenciales de Supabase.
 *
 * A diferencia del resto de los mocks, este SE PUEDE ESCRIBIR: se guarda en
 * memoria del proceso. Sin eso, en la demo se podía anotar una corrección y
 * la pantalla quedaba vacía, que parece un error y no lo es.
 *
 * OJO: en memoria quiere decir en memoria. Se pierde al reiniciar el servidor,
 * y con varias instancias cada una tendría las suyas. Es una demo: los datos de
 * verdad viven en Supabase (ver `real/correcciones.ts`).
 */

const SEMILLA: Correccion[] = [
  {
    id: "corr-demo-01",
    conversacionId: "aa000000-0000-4000-8000-000000000002",
    contacto: "@dayana.nails",
    canal: "instagram",
    descripcion:
      "Le dijo que la Academia sale 47 dólares y hoy está 39. Revisar el precio de la fase de promo.",
    mensajes: [
      {
        mensajeId: "m-demo-01",
        rol: "agente",
        texto: "La Academia sale 47 dólares por mes 💗",
        fecha: haceHoras(5),
      },
    ],
    estado: "pendiente",
    creadaAt: haceHoras(4),
  },
  {
    id: "corr-demo-02",
    conversacionId: "aa000000-0000-4000-8000-000000000003",
    contacto: "Marisol Fuentes",
    canal: "whatsapp",
    descripcion:
      "Le mandó el link de Skool en el segundo mensaje, sin que ella preguntara nada todavía.",
    mensajes: [
      {
        mensajeId: "m-demo-02",
        rol: "agente",
        texto: "Te dejo el link para que entres a la comunidad 👇",
        fecha: haceDias(1),
      },
    ],
    estado: "pendiente",
    creadaAt: haceDias(1),
  },
  {
    id: "corr-demo-03",
    conversacionId: "aa000000-0000-4000-8000-000000000005",
    contacto: "Inés Sotomayor",
    canal: "whatsapp",
    descripcion:
      "Dijo que la parte online era una sola cuando son DOS. Ya está arreglado en el prompt.",
    mensajes: [
      {
        mensajeId: "m-demo-03",
        rol: "agente",
        texto: "Lo online es una sola formación",
        fecha: haceDias(4),
      },
    ],
    estado: "resuelta",
    creadaAt: haceDias(3),
    resueltaAt: haceDias(2),
  },
];

/**
 * Se siembra UNA vez y después se conserva lo que anote quien mire la demo. Si
 * se reconstruyera en cada llamada —como hacen los otros mocks para que las
 * fechas queden frescas— lo recién anotado desaparecería al recargar.
 *
 * VA EN `globalThis` Y NO EN UN `let` DEL MÓDULO, y eso no es paranoia: Next
 * arma un bundle por ruta, así que el mismo archivo termina cargado más de una
 * vez y cada copia tendría SU propio arreglo. Se verificó: anotando una
 * corrección desde el chat, el route handler pasaba a tener 5 y la pantalla
 * /correcciones seguía viendo 3. Guardado acá, todas las copias miran el mismo
 * lugar. (Lo mismo hace falta para sobrevivir al recargado en caliente del
 * modo dev.)
 */
const almacen = globalThis as typeof globalThis & {
  __correccionesMock?: Correccion[];
};

function todas(): Correccion[] {
  almacen.__correccionesMock ??= [...SEMILLA];
  return almacen.__correccionesMock;
}

export async function getCorrecciones(): Promise<Correccion[]> {
  return [...todas()].sort(
    (a, b) => new Date(b.creadaAt).getTime() - new Date(a.creadaAt).getTime()
  );
}

export async function crearCorreccion(
  entrada: CorreccionNueva
): Promise<Correccion> {
  const nueva: Correccion = {
    id: `corr-${crypto.randomUUID()}`,
    conversacionId: entrada.conversacionId,
    contacto: entrada.contacto,
    canal: entrada.canal,
    descripcion: entrada.descripcion,
    mensajes: entrada.mensajes,
    estado: "pendiente",
    creadaAt: new Date().toISOString(),
  };
  todas().unshift(nueva);
  return nueva;
}

export async function cambiarEstadoCorreccion(
  id: string,
  estado: EstadoCorreccion
): Promise<Correccion> {
  const correccion = todas().find((c) => c.id === id);
  if (!correccion) throw new Error("Esa corrección no existe.");
  correccion.estado = estado;
  correccion.resueltaAt =
    estado === "resuelta" ? new Date().toISOString() : undefined;
  return correccion;
}

export async function borrarCorreccion(id: string): Promise<void> {
  const lista = todas();
  const i = lista.findIndex((c) => c.id === id);
  if (i >= 0) lista.splice(i, 1);
}
