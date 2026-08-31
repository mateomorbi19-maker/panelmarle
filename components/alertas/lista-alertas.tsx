"use client";

import Link from "next/link";
import { BellOff, BellRing, Check, ExternalLink } from "lucide-react";
import { CanalBadge } from "@/components/canal-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Canal } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Alertas: conversaciones que están esperando a una PERSONA.
 *
 * La tarjeta se lee en el orden en que se decide: quién es y hace cuánto
 * espera → por qué el agente la derivó → qué hacer (Atender, que es LA
 * acción, o abrir el chat acá).
 *
 * El color no pinta la tarjeta entera a propósito: una campanita en borgoña,
 * el motivo en texto y el estado dicho con palabras alcanzan y no gritan. Una
 * pantalla llena de tarjetas rojas deja de significar "urgente" en una tarde.
 */
export interface AlertaItem {
  id: string;
  nombre: string;
  telefono: string;
  motivo: string;
  fecha: string;
  conversacionId?: string;
  conversacionPanelId?: string;
  href?: string;
  canal?: Canal;
}

function TarjetaAlerta({
  alerta,
  atendida,
}: {
  alerta: AlertaItem;
  atendida: boolean;
}) {
  return (
    <Card size="sm" className={cn(atendida && "opacity-70")}>
      <CardContent className="flex flex-col gap-2.5">
        {/* Quién, por dónde y hace cuánto. */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              atendida
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            {atendida ? (
              <Check className="size-4" />
            ) : (
              <BellRing className="size-4" />
            )}
          </span>

          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] leading-tight font-semibold">
              {alerta.nombre}
            </span>
            <span className="text-muted-foreground truncate text-xs tabular-nums">
              {alerta.telefono}
            </span>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-muted-foreground text-xs">
              {alerta.fecha}
            </span>
            {alerta.canal ? <CanalBadge canal={alerta.canal} /> : null}
          </div>
        </div>

        {/* Por qué el agente la derivó. */}
        <p className="text-sm leading-snug">
          {alerta.motivo}
          <span className="text-muted-foreground">
            {atendida ? " · ya atendida" : " · esperando respuesta"}
          </span>
        </p>

        {/* Qué hacer con ella. */}
        {!atendida || alerta.conversacionPanelId ? (
          <div className="flex flex-wrap items-center gap-2">
            {!atendida && alerta.href ? (
              <Button
                render={
                  <a
                    href={alerta.href}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                Atender
                <ExternalLink data-icon="inline-end" aria-hidden="true" />
              </Button>
            ) : null}
            {alerta.conversacionPanelId ? (
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href={`/conversaciones/${alerta.conversacionPanelId}`} />
                }
              >
                Ver el chat
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ListaAlertas({
  pendientes,
  atendidas,
}: {
  pendientes: AlertaItem[];
  atendidas: AlertaItem[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">
          Pendientes
        </h2>
        {pendientes.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellOff aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Sin alertas pendientes</EmptyTitle>
              <EmptyDescription>
                El agente está manejando todas las conversaciones.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.map((alerta) => (
              <TarjetaAlerta key={alerta.id} alerta={alerta} atendida={false} />
            ))}
          </div>
        )}
      </section>

      {atendidas.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">
            Atendidas
          </h2>
          <div className="flex flex-col gap-3">
            {atendidas.map((alerta) => (
              <TarjetaAlerta key={alerta.id} alerta={alerta} atendida={true} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
