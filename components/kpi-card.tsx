import type { LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de KPI del resumen: título chico, cifra grande en la serif, detalle.
 *
 * Compacta A PROPÓSITO: antes cada KPI medía casi 150 px y los cuatro se
 * comían la primera pantalla entera del teléfono. Ahora van de a dos por fila
 * y las CUATRO cifras se comparan de un vistazo, que es para lo que existen.
 */
export function KpiCard({
  titulo,
  valor,
  detalle,
  icono: Icono,
  className,
}: {
  titulo: string;
  valor: string | number;
  detalle?: string;
  icono: LucideIcon;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("gap-0", className)}>
      <CardHeader className="gap-1.5">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <span className="bg-secondary text-secondary-foreground flex size-6 shrink-0 items-center justify-center rounded-full">
            <Icono className="size-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 truncate">{titulo}</span>
        </p>
        {/* La cifra en serif: es dato Y es identidad, como en los mockups. */}
        <p className="font-heading text-[1.75rem] leading-none font-semibold tabular-nums">
          {valor}
        </p>
        {detalle ? (
          <p className="text-muted-foreground text-xs leading-snug">{detalle}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
