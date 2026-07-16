import { cookies } from "next/headers";

/**
 * Autenticación demo del panel: un único usuario ("Marle"), SIN contraseña.
 * Alcanza con escribir el usuario y tocar "Ingresar".
 *
 * TODO(conexión real): reemplazar por sesiones firmadas (JWT o tokens en base
 * de datos) y credenciales reales cuando el panel tenga datos sensibles.
 */

export const SESSION_COOKIE = "panel_session";
const SESSION_VALUE = "marle-demo";

const USUARIO_DEMO = "marle";

export function usuarioValido(usuario: string): boolean {
  return usuario.trim().toLowerCase() === USUARIO_DEMO;
}

export async function crearSesion(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    // Demo sin datos sensibles: la cookie NO es "secure" para que funcione
    // igual por http o https (según cómo quede expuesto en Easypanel).
    secure: false,
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function estaAutenticado(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
