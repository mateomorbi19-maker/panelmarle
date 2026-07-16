"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellRing,
  GraduationCap,
  Home,
  LogOut,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const SECCIONES = [
  { titulo: "Inicio", href: "/", icono: Home },
  { titulo: "Contactos", href: "/contactos", icono: Users },
  { titulo: "Integrantes", href: "/integrantes", icono: GraduationCap },
  { titulo: "Checkouts", href: "/checkouts", icono: ShoppingCart },
  { titulo: "Alertas", href: "/alertas", icono: BellRing },
] as const;

export function AppSidebar({
  alertasPendientes = 0,
}: {
  alertasPendientes?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [saliendo, setSaliendo] = React.useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              tooltip="Panel Marle Nails"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Panel Marle Nails</span>
                <span className="text-muted-foreground text-xs">
                  Monitoreo del agente
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Secciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECCIONES.map((seccion) => {
                const activo =
                  seccion.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(seccion.href);
                return (
                  <SidebarMenuItem key={seccion.href}>
                    <SidebarMenuButton
                      render={<Link href={seccion.href} />}
                      isActive={activo}
                      tooltip={seccion.titulo}
                    >
                      <seccion.icono aria-hidden="true" />
                      <span>{seccion.titulo}</span>
                    </SidebarMenuButton>
                    {seccion.href === "/alertas" && alertasPendientes > 0 ? (
                      <SidebarMenuBadge className="bg-primary text-primary-foreground rounded-full px-1.5">
                        {alertasPendientes}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 overflow-hidden rounded-lg p-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:p-0">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              M
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">Marle</span>
            <span className="text-muted-foreground truncate text-xs">
              Administradora
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={cerrarSesion}
            disabled={saliendo}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut aria-hidden="true" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
