import { NextResponse } from "next/server";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

/** Conversaciones de WhatsApp e Instagram, con la marca de las derivadas. */
export async function GET() {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await db.conversaciones());
}
