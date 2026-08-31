import { NextResponse, type NextRequest } from "next/server";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";
import type { Canal, MensajeCorregido, RolMensaje } from "@/lib/data/types";

/**
 * Las correcciones del agente: lo que hay que arreglarle.
 *
 * Marle las anota desde adentro de un chat (marca los mensajes que estuvieron
 * mal y escribe o dicta qué pasó) y después se leen todas juntas en la sección
 * Correcciones.
 */

/** Tope de la descripción. Es una nota para arreglar el prompt, no un ensayo. */
const LARGO_MAXIMO = 4000;
/** Cuántos mensajes se pueden marcar de una. Más que esto no es una corrección. */
const MENSAJES_MAXIMO = 30;
/** Cuánto texto de cada mensaje se copia. Los del agente son cortos. */
const TEXTO_MAXIMO = 4096;

const CANALES: readonly string[] = ["whatsapp", "instagram"];
const ROLES: readonly string[] = [
  "lead",
  "agente",
  "humano",
  "negocio",
  "sistema",
];

/**
 * Los mensajes llegan del navegador, así que se revisan uno por uno: nada de
 * confiar en la forma. Lo que no se entiende se descarta en vez de guardarse
 * a medias.
 */
function limpiarMensajes(crudo: unknown): MensajeCorregido[] {
  if (!Array.isArray(crudo)) return [];
  return crudo.slice(0, MENSAJES_MAXIMO).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const m = item as Record<string, unknown>;
    const mensajeId = String(m.mensajeId ?? m.id ?? "").slice(0, 64);
    if (!mensajeId) return [];
    const rol =
      typeof m.rol === "string" && ROLES.includes(m.rol)
        ? (m.rol as RolMensaje)
        : "agente";
    const texto =
      typeof m.texto === "string" && m.texto.trim()
        ? m.texto.slice(0, TEXTO_MAXIMO)
        : undefined;
    const fecha = typeof m.fecha === "string" ? m.fecha : "";
    return [{ mensajeId, rol, texto, fecha }];
  });
}

export async function GET() {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await db.correcciones());
}

export async function POST(req: NextRequest) {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cuerpo = (await req.json().catch(() => null)) as {
    conversacionId?: unknown;
    contacto?: unknown;
    canal?: unknown;
    descripcion?: unknown;
    mensajes?: unknown;
  } | null;

  const descripcion =
    typeof cuerpo?.descripcion === "string" ? cuerpo.descripcion.trim() : "";

  // Sin descripción no hay corrección: los mensajes solos no dicen QUÉ estuvo
  // mal, y dentro de dos semanas nadie se va a acordar.
  if (!descripcion) {
    return NextResponse.json(
      { error: "Contá qué estuvo mal antes de guardarla." },
      { status: 400 }
    );
  }
  if (descripcion.length > LARGO_MAXIMO) {
    return NextResponse.json(
      { error: `La descripción no puede pasar de ${LARGO_MAXIMO} caracteres.` },
      { status: 400 }
    );
  }

  const canal =
    typeof cuerpo?.canal === "string" && CANALES.includes(cuerpo.canal)
      ? (cuerpo.canal as Canal)
      : undefined;

  try {
    const correccion = await db.crearCorreccion({
      conversacionId:
        typeof cuerpo?.conversacionId === "string" && cuerpo.conversacionId
          ? cuerpo.conversacionId
          : undefined,
      contacto:
        typeof cuerpo?.contacto === "string" && cuerpo.contacto.trim()
          ? cuerpo.contacto.trim().slice(0, 200)
          : undefined,
      canal,
      descripcion,
      mensajes: limpiarMensajes(cuerpo?.mensajes),
    });
    return NextResponse.json({ ok: true, correccion }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la corrección.",
      },
      { status: 502 }
    );
  }
}
