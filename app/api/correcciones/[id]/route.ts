import { NextResponse, type NextRequest } from "next/server";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

/**
 * Dar por arreglada una corrección, reabrirla o borrarla.
 *
 * Marcarla como resuelta NO la borra: queda abajo, en "Ya arregladas", porque
 * saber qué se tocó del prompt y cuándo es la mitad del valor de tenerlas
 * anotadas. Borrar es para lo que se anotó por error.
 */
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/correcciones/[id]">
) {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const cuerpo = (await req.json().catch(() => null)) as {
    estado?: unknown;
  } | null;

  if (cuerpo?.estado !== "pendiente" && cuerpo?.estado !== "resuelta") {
    return NextResponse.json(
      { error: "Falta decir si queda pendiente o resuelta." },
      { status: 400 }
    );
  }

  try {
    const correccion = await db.cambiarEstadoCorreccion(id, cuerpo.estado);
    return NextResponse.json({ ok: true, correccion });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar la corrección.",
      },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/correcciones/[id]">
) {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await db.borrarCorreccion(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo borrar la corrección.",
      },
      { status: 502 }
    );
  }
}
