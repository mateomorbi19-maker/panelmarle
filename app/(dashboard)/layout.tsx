import { redirect } from "next/navigation";
import { BarraSuperior } from "@/components/barra-superior";
import { NavInferior } from "@/components/nav-inferior";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

/**
 * El armazón del panel.
 *
 * Pensado para un teléfono: la barra de arriba queda FIJA mientras se baja por
 * los chats, y el contenido va sin relleno propio para que la lista pueda ir
 * de borde a borde. Cada sección pone su propio margen (`<Seccion>`); la lista
 * de chats a propósito no lo pone.
 *
 * Ya no hay menú lateral. El panel ES la lista de chats. En el teléfono se
 * navega por la barra de ABAJO (Chats · Resumen · Alertas · Más), a la altura
 * del pulgar; en tablet/escritorio, por el menú "+" de la barra de arriba.
 * Nunca los dos a la vez.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard de sesión: sin cookie válida no se ve ninguna sección del panel.
  if (!(await estaAutenticado())) redirect("/login");

  const [alertas, agente, correcciones] = await Promise.all([
    db.alertas(),
    db.agenteGlobal(),
    /*
     * Este número es SOLO el globito del menú, y por eso es lo único del panel
     * que se traga su propio error. El armazón envuelve todas las pantallas: si
     * la lectura de correcciones fallara (la tabla recién creada, un permiso
     * mal puesto), se llevaría puesta también la lista de chats, que es lo que
     * Marle viene a ver. Sin globito se sigue trabajando; sin chats, no.
     * La sección /correcciones sí falla fuerte: ahí el dato es el contenido.
     */
    db.correcciones().catch(() => []),
  ]);
  const alertasPendientes = alertas.filter((a) => !a.atendida).length;
  const correccionesPendientes = correcciones.filter(
    (c) => c.estado === "pendiente"
  ).length;

  return (
    <div className="bg-background flex min-h-svh w-full flex-col">
      <BarraSuperior
        alertasPendientes={alertasPendientes}
        correccionesPendientes={correccionesPendientes}
        agenteEncendido={agente.encendido}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <NavInferior
        alertasPendientes={alertasPendientes}
        correccionesPendientes={correccionesPendientes}
      />
    </div>
  );
}
