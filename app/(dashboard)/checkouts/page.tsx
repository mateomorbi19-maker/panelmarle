import { ShoppingCart, TriangleAlert } from "lucide-react";
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
import { db } from "@/lib/data";
import type { MotivoCheckout } from "@/lib/data/types";
import { fechaRelativa, formatearUSD } from "@/lib/format";

export const metadata = { title: "Checkouts abandonados" };

/**
 * Presentación de cada motivo de checkout sin completar.
 * Como siempre: ícono + texto, nunca solo color.
 */
const MOTIVO_CONFIG: Record<
  MotivoCheckout,
  {
    etiqueta: string;
    Icono: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    variant: "outline" | "secondary";
    className?: string;
  }
> = {
  error_pago: {
    etiqueta: "Error de pago",
    Icono: TriangleAlert,
    variant: "outline",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  abandono: {
    etiqueta: "Abandono",
    Icono: ShoppingCart,
    variant: "secondary",
  },
};

export default async function CheckoutsPage() {
  const checkouts = await db.checkouts();

  // Más recientes primero: lo último que pasó es lo primero a recuperar.
  const ordenados = [...checkouts].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
  const total = ordenados.reduce((suma, c) => suma + (c.monto ?? 0), 0);

  return (
    <>
      <SectionHeader
        titulo="Checkouts abandonados"
        descripcion="Personas que no completaron el pago de la Academia"
      >
        <Badge variant="secondary">{formatearUSD(total)} sin cobrar</Badge>
      </SectionHeader>

      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenados.map((checkout) => {
              const motivo = MOTIVO_CONFIG[checkout.motivo];
              const { Icono } = motivo;
              return (
                <TableRow key={checkout.id}>
                  <TableCell className="font-medium">
                    {checkout.nombre}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                    {checkout.telefono}
                  </TableCell>
                  <TableCell>
                    <CanalBadge canal={checkout.canal} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fechaRelativa(checkout.fecha)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={motivo.variant} className={motivo.className}>
                      <Icono aria-hidden="true" />
                      {motivo.etiqueta}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {checkout.monto !== undefined
                      ? formatearUSD(checkout.monto)
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>

        {/* TODO(conexión real): Stripe — eventos invoice.payment_failed y
            checkout.session.expired alimentan esta lista. */}
        <p className="text-muted-foreground text-xs">
          Cuando se conecte el sistema de pagos, esta lista se va a llenar sola
          con cada pago que falle o quede abandonado.
        </p>
      </div>
    </>
  );
}
