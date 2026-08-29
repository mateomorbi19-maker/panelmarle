import { NextResponse, type NextRequest } from "next/server";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

/**
 * Prender y apagar el agente en una conversación.
 *
 * Apagado quiere decir apagado hasta que lo prendan: no se vence solo. La
 * derivación que hace el agente por su cuenta sigue caducando a las 24 h como
 * siempre — son dos cosas distintas y la base las distingue por el motivo.
 *
 * Mientras está apagado, la conversación NO se pierde: la ingesta le sigue
 * escribiendo la memoria al agente en las dos direcciones, así que cuando
 * Marle lo prende retoma sabiendo todo lo que se dijo.
 */
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/conversaciones/[id]/agente">
) {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conversacion = await db.conversacion(id);
  if (!conversacion) {
    return NextResponse.json(
      { error: "Esa conversación no existe" },
      { status: 404 }
    );
  }

  const cuerpo = (await req.json().catch(() => null)) as {
    encendido?: unknown;
  } | null;

  if (typeof cuerpo?.encendido !== "boolean") {
    return NextResponse.json(
      { error: "Falta decir si el agente queda encendido o apagado." },
      { status: 400 }
    );
  }

  try {
    if (cuerpo.encendido) {
      await db.prenderAgente(conversacion);
    } else {
      // true: apagar con el botón NO es haber contestado. Si el agente había
      // derivado, esa alerta sigue viva y tiene que seguir viéndose.
      await db.apagarAgente(conversacion, true);
    }
    return NextResponse.json({ ok: true, encendido: cuerpo.encendido });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar el estado del agente.",
      },
      { status: 502 }
    );
  }
}
