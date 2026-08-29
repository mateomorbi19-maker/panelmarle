import { redirect } from "next/navigation";
import { BarraSuperior } from "@/components/barra-superior";
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
 * Ya no hay menú lateral. El panel ES la lista de chats: un cajón con las dos
 * herramientas que se usan cada tanto (Resumen y Alertas) ocupa menos y se
 * entiende mejor que una barra con seis secciones.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard de sesión: sin cookie válida no se ve ninguna sección del panel.
  if (!(await estaAutenticado())) redirect("/login");

  const [alertas, agente] = await Promise.all([db.alertas(), db.agenteGlobal()]);
  const alertasPendientes = alertas.filter((a) => !a.atendida).length;

  return (
    <div className="bg-background flex min-h-svh w-full flex-col">
      <BarraSuperior
        alertasPendientes={alertasPendientes}
        agenteEncendido={agente.encendido}
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
