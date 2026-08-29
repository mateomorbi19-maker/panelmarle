"use client";

import Link from "next/link";
import { BellOff, BellRing, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/**
 * Alerta ya serializada en el server: la fecha viene formateada con
 * fechaRelativa y los enlaces vienen armados (`href` apunta a Chatwoot o a
 * ManyChat según el canal; `conversacionPanelId` abre el chat completo acá).
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
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{alerta.nombre}</span>
            {atendida ? (
              <Badge variant="outline">
                <Check aria-hidden="true" />
                Atendida
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/10 text-primary"
              >
                <BellRing aria-hidden="true" />
                Pendiente
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground text-sm tabular-nums">
            {alerta.telefono}
          </span>
          <p className="text-sm">{alerta.motivo}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-muted-foreground text-xs">{alerta.fecha}</span>
          {!atendida && alerta.href ? (
            <Button
              variant="default"
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
        <h2 className="text-sm font-medium text-muted-foreground">
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
          <h2 className="text-sm font-medium text-muted-foreground">
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
