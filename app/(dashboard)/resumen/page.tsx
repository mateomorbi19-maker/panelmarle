import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  GraduationCap,
  ShoppingCart,
  Users,
} from "lucide-react";
import { GraficoCanales } from "@/components/inicio/grafico-canales";
import { GraficoIngresos } from "@/components/inicio/grafico-ingresos";
import { KpiCard } from "@/components/kpi-card";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { db } from "@/lib/data";
import { fechaRelativa, formatearUSD } from "@/lib/format";
import { Seccion } from "@/components/seccion";

export const metadata: Metadata = {
  title: "Resumen",
};

const MES_CORTO = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const DIA_MS = 24 * 60 * 60 * 1000;

/** Resumen general del negocio: KPIs, gráficos y últimas alertas. */
export default async function InicioPage() {
  const [contactos, integrantes, checkouts, alertas] = await Promise.all([
    db.contactos(),
    db.integrantes(),
    db.checkouts(),
    db.alertas(),
  ]);

  // --- KPIs ---
  const calientes = contactos.filter((c) => c.estado === "caliente").length;
  const activas = integrantes.filter(
    (i) => i.estadoMembresia === "activa"
  ).length;
  const nuevas30 = integrantes.filter(
    (i) => Date.now() - new Date(i.fechaIngreso).getTime() <= 30 * DIA_MS
  ).length;
  const montoSinCobrar = checkouts.reduce(
    (suma, c) => suma + (c.monto ?? 0),
    0
  );
  const pendientes = alertas.filter((a) => !a.atendida);
  const atendidas = alertas.length - pendientes.length;

  // --- Dona: contactos por canal ---
  const porWhatsapp = contactos.filter((c) => c.canal === "whatsapp").length;
  const porInstagram = contactos.length - porWhatsapp;

  // --- Barras: nuevas integrantes por mes, últimos 6 meses (con meses en 0) ---
  const ahora = new Date();
  const ingresosPorMes = Array.from({ length: 6 }, (_, i) => {
    const mes = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - i), 1);
    const ingresos = integrantes.filter((p) => {
      const f = new Date(p.fechaIngreso);
      return (
        f.getFullYear() === mes.getFullYear() && f.getMonth() === mes.getMonth()
      );
    }).length;
    return { mes: MES_CORTO[mes.getMonth()], ingresos };
  });

  // --- Últimas 4 alertas pendientes, con la fecha ya formateada en el server ---
  const ultimasAlertas = [...pendientes]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      nombre: a.nombre,
      motivo: a.motivo,
      cuando: fechaRelativa(a.fecha),
    }));

  return (
    <Seccion>
      <SectionHeader
        titulo="Resumen"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Contactos totales"
          valor={contactos.length}
          detalle={`${calientes} calientes ahora`}
          icono={Users}
        />
        <KpiCard
          titulo="Integrantes activas"
          valor={activas}
          detalle={`${nuevas30} nuevas en los últimos 30 días`}
          icono={GraduationCap}
        />
        <KpiCard
          titulo="Checkouts abandonados"
          valor={checkouts.length}
          detalle={`${formatearUSD(montoSinCobrar)} sin cobrar`}
          icono={ShoppingCart}
        />
        <KpiCard
          titulo="Alertas pendientes"
          valor={pendientes.length}
          detalle={`${atendidas} ya atendidas`}
          icono={BellRing}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contactos por canal</CardTitle>
            <CardDescription>WhatsApp vs Instagram</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoCanales whatsapp={porWhatsapp} instagram={porInstagram} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nuevas integrantes por mes</CardTitle>
            <CardDescription>
              Ingresos a la Academia, últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoIngresos datos={ingresosPorMes} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas alertas pendientes</CardTitle>
          <CardDescription>
            Leads que esperan atención de una persona
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ultimasAlertas.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyTitle>Sin alertas pendientes</EmptyTitle>
                <EmptyDescription>
                  El agente no escaló ninguna conversación por ahora.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col divide-y">
              {ultimasAlertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{alerta.nombre}</span>
                    <span className="text-muted-foreground text-sm">
                      {alerta.motivo}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {alerta.cuando}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" render={<Link href="/alertas" />}>
            Ver todas las alertas
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </Seccion>
  );
}
