"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/**
 * Dona de contactos por canal (WhatsApp vs Instagram).
 *
 * Colores FIJOS del sistema: los tokens --color-whatsapp / --color-instagram
 * (los mismos que usa CanalBadge) van directo en el `fill` de cada porción.
 * La config solo aporta las etiquetas de leyenda y tooltip — la identidad
 * nunca es solo color: siempre acompaña el nombre del canal.
 */
const config = {
  contactos: { label: "Contactos" },
  whatsapp: { label: "WhatsApp" },
  instagram: { label: "Instagram" },
} satisfies ChartConfig;

export function GraficoCanales({
  whatsapp,
  instagram,
}: {
  whatsapp: number;
  instagram: number;
}) {
  const total = whatsapp + instagram;
  const datos = [
    { canal: "whatsapp", contactos: whatsapp, fill: "var(--color-whatsapp)" },
    { canal: "instagram", contactos: instagram, fill: "var(--color-instagram)" },
  ];

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square max-h-64 w-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="canal" />}
        />
        <Pie
          data={datos}
          dataKey="contactos"
          nameKey="canal"
          innerRadius={60}
          paddingAngle={2}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold tabular-nums"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 22}
                      className="fill-muted-foreground"
                    >
                      contactos
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="canal" />} />
      </PieChart>
    </ChartContainer>
  );
}
