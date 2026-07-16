"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/** Punto de la serie: mes corto en español ya formateado por el server. */
export interface PuntoIngresos {
  mes: string;
  ingresos: number;
}

/**
 * Barras de nuevas integrantes por mes (serie única → chart-1, rosé de marca,
 * según la asignación fija documentada en globals.css). El server arma los
 * últimos 6 meses (incluidos los de 0) y los pasa por props.
 */
const config = {
  ingresos: {
    label: "Nuevas integrantes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function GraficoIngresos({ datos }: { datos: PuntoIngresos[] }) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart accessibilityLayer data={datos}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="ingresos"
          fill="var(--color-ingresos)"
          radius={4}
          maxBarSize={40}
        />
      </BarChart>
    </ChartContainer>
  );
}
