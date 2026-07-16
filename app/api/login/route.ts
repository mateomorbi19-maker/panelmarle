import { NextResponse } from "next/server";
import { crearSesion, usuarioValido } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { usuario?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la solicitud inválido" },
      { status: 400 },
    );
  }

  if (!usuarioValido(body.usuario ?? "")) {
    return NextResponse.json(
      { ok: false, error: "El usuario debe ser Marle" },
      { status: 401 },
    );
  }

  await crearSesion();
  return NextResponse.json({ ok: true });
}
