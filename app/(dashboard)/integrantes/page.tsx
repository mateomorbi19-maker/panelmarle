import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleOff, Star, TriangleAlert } from "lucide-react";
import { CanalBadge } from "@/components/canal-badge";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db, type EstadoMembresia } from "@/lib/data";
import { formatearFecha, tiempoDesde } from "@/lib/format";

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
    <>
      <SectionHeader
        titulo="Integrantes"
        descripcion="Personas que forman parte de la Academia"
      >
        <Badge variant="secondary">{activas} activas</Badge>
      </SectionHeader>

      <div className="flex flex-col gap-3">
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
              {ordenadas.map((integrante) => {
                const estado = ESTADO_MEMBRESIA[integrante.estadoMembresia];
                return (
                  <TableRow key={integrante.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {integrante.nombre}
                        </span>
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
                      {integrante.plan === "anual" ? (
                        <Badge variant="secondary">
                          <Star aria-hidden="true" />
                          Anual
                        </Badge>
                      ) : (
                        <Badge variant="outline">Mensual</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estado.variant} className={estado.className}>
                        <estado.Icono aria-hidden="true" />
                        {estado.etiqueta}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-muted-foreground text-xs">
          El tiempo dentro se calcula desde la fecha de ingreso. Cuando se
          conecte Stripe/Skool, esta lista se va a alimentar sola con cada pago
          nuevo.
        </p>
      </div>
    </>
  );
}
