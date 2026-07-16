import { NextResponse } from "next/server";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

/** Alertas de atención humana. Hoy sirve datos mock vía `db`. */
export async function GET() {
  if (!(await estaAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await db.alertas());
}
