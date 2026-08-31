import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleOff, Star, TriangleAlert } from "lucide-react";
import { CanalBadge } from "@/components/canal-badge";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db, type EstadoMembresia, type Integrante } from "@/lib/data";
import { formatearFecha, tiempoDesde } from "@/lib/format";
import { Seccion } from "@/components/seccion";

export const metadata: Metadata = {
  title: "Integrantes",
};

/** Presentación de cada estado de membresía: ícono + texto, nunca solo color. */
const ESTADO_MEMBRESIA: Record<
  EstadoMembresia,
  {
    etiqueta: string;
    Icono: LucideIcon;
    variant: "outline" | "destructive";
    className?: string;
  }
> = {
  activa: {
    etiqueta: "Activa",
    Icono: CircleCheck,
    variant: "outline",
    className: "border-exito/25 bg-exito/10 text-exito",
  },
  cancelada: {
    etiqueta: "Cancelada",
    Icono: CircleOff,
    variant: "outline",
    className: "text-muted-foreground",
  },
  pago_fallido: {
    etiqueta: "Pago fallido",
    Icono: TriangleAlert,
    variant: "destructive",
  },
};

function EstadoBadge({ estado }: { estado: EstadoMembresia }) {
  const { etiqueta, Icono, variant, className } = ESTADO_MEMBRESIA[estado];
  return (
    <Badge variant={variant} className={className}>
      <Icono aria-hidden="true" />
      {etiqueta}
    </Badge>
  );
}

function PlanBadge({ plan }: { plan: Integrante["plan"] }) {
  if (plan === "anual") {
    return (
      <Badge variant="secondary">
        <Star aria-hidden="true" />
        Anual
      </Badge>
    );
  }
  if (plan === "mensual") return <Badge variant="outline">Mensual</Badge>;
  // Skool no manda el plan: un guion honesto antes que afirmar "Mensual"
  // sobre lo que la persona paga.
  return <span className="text-muted-foreground">—</span>;
}

/**
 * En el teléfono, una tarjeta por integrante en vez de la tabla: la tabla de
 * seis columnas dejaba la mitad escondida detrás de un scroll horizontal que
 * nadie descubría. Son LOS MISMOS datos, apilados por importancia: quién y en
 * qué estado, después el plan y el canal, y al pie desde cuándo.
 */
function TarjetaIntegrante({ integrante }: { integrante: Integrante }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] leading-tight font-semibold">
              {integrante.nombre}
            </span>
            {integrante.email ? (
              <span className="text-muted-foreground truncate text-xs">
                {integrante.email}
              </span>
            ) : null}
          </div>
          <span className="shrink-0">
            <EstadoBadge estado={integrante.estadoMembresia} />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <PlanBadge plan={integrante.plan} />
          {integrante.canal ? <CanalBadge canal={integrante.canal} /> : null}
        </div>

        <p className="text-muted-foreground text-xs tabular-nums">
          Ingresó el {formatearFecha(integrante.fechaIngreso)} ·{" "}
          <span className="text-foreground font-medium">
            {tiempoDesde(integrante.fechaIngreso)}
          </span>{" "}
          dentro
        </p>
      </CardContent>
    </Card>
  );
}

export default async function IntegrantesPage() {
  const integrantes = await db.integrantes();

  // Las más nuevas arriba: orden por fecha de ingreso descendente.
  const ordenadas = [...integrantes].sort(
    (a, b) =>
      new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
  );
  const activas = ordenadas.filter(
    (i) => i.estadoMembresia === "activa"
  ).length;

  return (
    <Seccion>
      <SectionHeader titulo="Integrantes">
        <Badge variant="secondary">{activas} activas</Badge>
      </SectionHeader>

      {/* --- Teléfono: tarjetas ------------------------------------------ */}
      <div className="flex flex-col gap-3 lg:hidden">
        {ordenadas.map((integrante) => (
          <TarjetaIntegrante key={integrante.id} integrante={integrante} />
        ))}
      </div>

      {/* --- Escritorio: la tabla. En tablet vertical quedaba justa y
          recortaba la última columna, así que hasta lg van tarjetas. --- */}
      <div className="hidden flex-col gap-3 lg:flex">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integrante</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Fecha de ingreso</TableHead>
                <TableHead>Tiempo dentro</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenadas.map((integrante) => (
                <TableRow key={integrante.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{integrante.nombre}</span>
                      {integrante.email ? (
                        <span className="text-muted-foreground text-xs">
                          {integrante.email}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {integrante.canal ? (
                      <CanalBadge canal={integrante.canal} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatearFecha(integrante.fechaIngreso)}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {tiempoDesde(integrante.fechaIngreso)}
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={integrante.plan} />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={integrante.estadoMembresia} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        El tiempo dentro se calcula desde la fecha de ingreso. Cuando se
        conecte Stripe/Skool, esta lista se va a alimentar sola con cada pago
        nuevo.
      </p>
    </Seccion>
  );
}
