import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { BarraSuperior } from "@/components/barra-superior";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

/**
 * El armazón del panel.
 *
 * Pensado para un teléfono: la barra de arriba queda FIJA mientras se baja por
 * los chats, como en cualquier app de mensajería, y el contenido va sin
 * relleno propio para que la lista pueda ir de borde a borde. Cada sección
 * pone su propio margen (`<Seccion>`); la lista de chats a propósito no lo
 * pone.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard de sesión: sin cookie válida no se ve ninguna sección del panel.
  if (!(await estaAutenticado())) redirect("/login");

  const alertas = await db.alertas();
  const alertasPendientes = alertas.filter((a) => !a.atendida).length;

  return (
    <SidebarProvider>
      <AppSidebar alertasPendientes={alertasPendientes} />
      <SidebarInset>
        <BarraSuperior />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
