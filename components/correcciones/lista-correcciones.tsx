"use client";

import { startTransition, useOptimistic, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MessageSquare, RotateCcw, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
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
import type { Canal, EstadoCorreccion } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Todo lo que hay que arreglarle al agente, junto.
 *
 * Es una lista de tareas, no un archivo: lo que importa es lo que sigue
 * pendiente. Lo ya arreglado queda abajo y atenuado, porque saber QUÉ se tocó
 * del prompt y cuándo vale casi tanto como la lista de pendientes — pero no
 * tiene que competir por la atención.
 */

/** Corrección ya serializada en el server: las fechas vienen resueltas. */
export interface CorreccionItem {
  id: string;
  conversacionId?: string;
  contacto?: string;
  canal?: Canal;
  descripcion: string;
  /** Los mensajes marcados, con el texto tal como estaba. */
  mensajes: { id: string; texto: string; hora: string }[];
  estado: EstadoCorreccion;
  /** "hace 3 h", ya formateado. */
  cuando: string;
}

function Tarjeta({
  correccion,
  onCambiarEstado,
  onBorrar,
}: {
  correccion: CorreccionItem;
  onCambiarEstado: (estado: EstadoCorreccion) => void;
  onBorrar: () => void;
}) {
  const resuelta = correccion.estado === "resuelta";
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);

  return (
    <Card size="sm" className={cn(resuelta && "opacity-70")}>
      <CardContent className="flex flex-col gap-3">
        {/* Quién y cuándo */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate font-medium">
            {correccion.contacto ?? "Chat sin identificar"}
          </span>
          {correccion.canal ? <CanalBadge canal={correccion.canal} /> : null}
          <span className="text-muted-foreground ml-auto shrink-0 text-xs">
            {correccion.cuando}
          </span>
        </div>

        {/*
          Lo que dijo el agente, tal como estaba cuando se anotó. Es una COPIA:
          por eso se sigue leyendo aunque el chat ya no exista.
        */}
        {correccion.mensajes.length > 0 ? (
          <ul className="border-border/70 flex flex-col gap-1.5 border-l-2 pl-3">
            {correccion.mensajes.map((mensaje) => (
              <li key={mensaje.id} className="flex flex-col">
                <span className="text-[13px] leading-snug whitespace-pre-wrap">
                  {mensaje.texto}
                </span>
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {mensaje.hora}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Qué estuvo mal */}
        <p className="text-sm whitespace-pre-wrap">{correccion.descripcion}</p>

        {/* Qué hacer con ella */}
        <div className="flex flex-wrap items-center gap-2">
          {correccion.conversacionId ? (
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link href={`/conversaciones/${correccion.conversacionId}`} />
              }
            >
              <MessageSquare data-icon="inline-start" aria-hidden="true" />
              Ver el chat
            </Button>
          ) : null}

          {resuelta ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCambiarEstado("pendiente")}
            >
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              Reabrir
            </Button>
          ) : (
            <Button size="sm" onClick={() => onCambiarEstado("resuelta")}>
              <Check data-icon="inline-start" aria-hidden="true" />
              Ya está arreglado
            </Button>
          )}

          {/*
            Borrar no se deshace, así que pide una confirmación en el lugar. Un
            cuadro de diálogo para esto sería más ruidoso que el propio borrado.
          */}
          {confirmandoBorrar ? (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">¿Seguro?</span>
              <Button variant="destructive" size="sm" onClick={onBorrar}>
                Borrar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmandoBorrar(false)}
              >
                No
              </Button>
            </span>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive ml-auto"
              onClick={() => setConfirmandoBorrar(true)}
              aria-label="Borrar la corrección"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type Cambio =
  | { tipo: "estado"; id: string; estado: EstadoCorreccion }
  | { tipo: "borrar"; id: string };

export function ListaCorrecciones({
  correcciones,
}: {
  correcciones: CorreccionItem[];
}) {
  const router = useRouter();

  // La tarjeta se mueve APENAS se toca. Cuando llega el dato de verdad React
  // suelta el valor optimista solo; si el servidor dice que no, vuelve.
  const [vistas, aplicar] = useOptimistic(
    correcciones,
    (actuales, cambio: Cambio) =>
      cambio.tipo === "borrar"
        ? actuales.filter((c) => c.id !== cambio.id)
        : actuales.map((c) =>
            c.id === cambio.id ? { ...c, estado: cambio.estado } : c
          )
  );

  async function cambiarEstado(item: CorreccionItem, estado: EstadoCorreccion) {
    startTransition(async () => {
      aplicar({ tipo: "estado", id: item.id, estado });
      try {
        const res = await fetch(`/api/correcciones/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado }),
        });
        const datos = await res.json();
        if (!res.ok) {
          toast.error(datos?.error ?? "No se pudo cambiar la corrección.");
        } else if (estado === "resuelta") {
          toast.success("Corrección marcada como arreglada.");
        }
      } catch {
        toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
      }
      router.refresh();
    });
  }

  async function borrar(item: CorreccionItem) {
    startTransition(async () => {
      aplicar({ tipo: "borrar", id: item.id });
      try {
        const res = await fetch(`/api/correcciones/${item.id}`, {
          method: "DELETE",
        });
        const datos = await res.json();
        if (!res.ok) {
          toast.error(datos?.error ?? "No se pudo borrar la corrección.");
        }
      } catch {
        toast.error("No se pudo hablar con el servidor. Fijate la conexión.");
      }
      router.refresh();
    });
  }

  const pendientes = vistas.filter((c) => c.estado === "pendiente");
  const resueltas = vistas.filter((c) => c.estado === "resuelta");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">
          Por arreglar
        </h2>
        {pendientes.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wrench aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No hay nada por arreglar</EmptyTitle>
              <EmptyDescription>
                Cuando veas que el agente contestó algo que no era, entrá al
                chat, tocá los tres puntos y elegí “Corrección”.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.map((correccion) => (
              <Tarjeta
                key={correccion.id}
                correccion={correccion}
                onCambiarEstado={(estado) => void cambiarEstado(correccion, estado)}
                onBorrar={() => void borrar(correccion)}
              />
            ))}
          </div>
        )}
      </section>

      {resueltas.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">
            Ya arregladas
          </h2>
          <div className="flex flex-col gap-3">
            {resueltas.map((correccion) => (
              <Tarjeta
                key={correccion.id}
                correccion={correccion}
                onCambiarEstado={(estado) => void cambiarEstado(correccion, estado)}
                onBorrar={() => void borrar(correccion)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
