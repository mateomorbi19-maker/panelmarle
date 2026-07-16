import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { estaAutenticado } from "@/lib/auth";
import { db } from "@/lib/data";

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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 !h-4" />
          <span className="text-sm font-medium">Panel Marle Nails</span>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
