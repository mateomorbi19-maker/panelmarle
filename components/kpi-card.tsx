import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Tarjeta de KPI para el inicio del panel: título, valor grande y detalle. */
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
    <Card className={cn("gap-2", className)}>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icono className="size-4" aria-hidden="true" />
          {titulo}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{valor}</CardTitle>
        {detalle ? (
          <p className="text-muted-foreground text-sm">{detalle}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
