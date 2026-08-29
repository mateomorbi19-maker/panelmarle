import { NextResponse, type NextRequest } from "next/server";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

/** En qué anda el agente en general. */
export async function GET() {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await db.agenteGlobal());
}

/**
 * Prender y apagar el agente en TODOS los chats.
 *
 * Apagado no se vence solo: queda callado hasta que lo prendan. Los mensajes
 * se siguen recibiendo y guardando, y su memoria se sigue alimentando, así que
 * al prenderlo retoma sabiendo lo que pasó mientras estuvo callado.
 */
export async function POST(req: NextRequest) {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
    const estado = await db.cambiarAgenteGlobal(cuerpo.encendido);
    return NextResponse.json({ ok: true, ...estado });
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
