import { ShoppingCart, TriangleAlert } from "lucide-react";
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
import { db } from "@/lib/data";
import type { CheckoutAbandonado, MotivoCheckout } from "@/lib/data/types";
import { fechaRelativa, formatearUSD } from "@/lib/format";
import { Seccion } from "@/components/seccion";

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

function MotivoBadge({ motivo }: { motivo: MotivoCheckout }) {
  const { etiqueta, Icono, variant, className } = MOTIVO_CONFIG[motivo];
  return (
    <Badge variant={variant} className={className}>
      <Icono aria-hidden="true" />
      {etiqueta}
    </Badge>
  );
}

/**
 * En el teléfono, una tarjeta por checkout: lo que importa para decidir a
 * quién escribirle primero es CUÁNTO quedó sin cobrar y POR QUÉ, así que el
 * monto va grande (y en la serif, como toda cifra importante) y el motivo al
 * lado. El resto —teléfono, canal, cuándo— acompaña abajo.
 */
function TarjetaCheckout({ checkout }: { checkout: CheckoutAbandonado }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] leading-tight font-semibold">
              {checkout.nombre}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {checkout.telefono}
            </span>
          </div>
          <span className="font-heading shrink-0 text-xl leading-tight font-semibold tabular-nums">
            {checkout.monto !== undefined ? formatearUSD(checkout.monto) : "—"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <MotivoBadge motivo={checkout.motivo} />
          <CanalBadge canal={checkout.canal} />
          <span className="text-muted-foreground ml-auto text-xs">
            {fechaRelativa(checkout.fecha)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CheckoutsPage() {
  const checkouts = await db.checkouts();

  // Más recientes primero: lo último que pasó es lo primero a recuperar.
  const ordenados = [...checkouts].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
  const total = ordenados.reduce((suma, c) => suma + (c.monto ?? 0), 0);

  return (
    <Seccion>
      <SectionHeader titulo="Checkouts">
        <Badge variant="secondary">{formatearUSD(total)} sin cobrar</Badge>
      </SectionHeader>

      {/* --- Teléfono: tarjetas ------------------------------------------ */}
      <div className="flex flex-col gap-3 lg:hidden">
        {ordenados.map((checkout) => (
          <TarjetaCheckout key={checkout.id} checkout={checkout} />
        ))}
      </div>

      {/* --- Escritorio: la tabla. En tablet vertical quedaba justa y
          recortaba la última columna, así que hasta lg van tarjetas. --- */}
      <div className="hidden flex-col gap-3 lg:flex">
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
              {ordenados.map((checkout) => (
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
                    <MotivoBadge motivo={checkout.motivo} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {checkout.monto !== undefined
                      ? formatearUSD(checkout.monto)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* TODO(conexión real): Stripe — eventos invoice.payment_failed y
          checkout.session.expired alimentan esta lista. */}
      <p className="text-muted-foreground text-xs">
        Cuando se conecte el sistema de pagos, esta lista se va a llenar sola
        con cada pago que falle o quede abandonado.
      </p>
    </Seccion>
  );
}
