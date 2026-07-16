import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Guard de sesión a nivel request (Next 16: proxy reemplaza a middleware).
 *
 * El guard del layout de (dashboard) NO se re-ejecuta en navegaciones cliente
 * entre secciones hermanas del panel; este proxy sí corre en CADA request, así
 * que una sesión muerta (logout en otra pestaña, cookie vencida) corta la
 * navegación al instante. El chequeo del layout queda como defensa en
 * profundidad.
 *
 * OJO: el proxy no puede depender de módulos compartidos, por eso duplica las
 * constantes de lib/auth.ts — si cambian allá, cambiarlas acá también.
 * TODO(conexión real): validar una sesión firmada en lugar del valor fijo.
 */
const SESSION_COOKIE = "panel_session";
const SESSION_VALUE = "marle-demo";

export function proxy(request: NextRequest) {
  const conSesion =
    request.cookies.get(SESSION_COOKIE)?.value === SESSION_VALUE;
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    // Con sesión, /login no tiene sentido: directo al panel.
    return conSesion
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!conSesion) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Todas las rutas de páginas, excepto /login (manejada arriba), las /api
  // (se protegen solas con 401) y los assets estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
