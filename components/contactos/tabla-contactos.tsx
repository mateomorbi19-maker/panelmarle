"use client";

import { useState } from "react";
import {
  Check,
  Flame,
  MessagesSquare,
  Search,
  SearchX,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { CanalBadge } from "@/components/canal-badge";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Canal, EstadoContacto } from "@/lib/data/types";

/** Fila ya serializada en el server: la fecha llega formateada como texto. */
export interface ContactoFila {
  id: string;
  nombre: string;
  telefono: string;
  canal: Canal;
  estado: EstadoContacto;
  /** formatearFecha(fechaPrimerContacto), resuelta en el server. */
  fechaFormateada: string;
}

/** Badges de estado: siempre ícono + texto (la identidad nunca es solo color). */
const ESTADOS: Record<
  EstadoContacto,
  {
    etiqueta: string;
    Icono: LucideIcon;
    variant: "secondary" | "outline";
    className?: string;
  }
> = {
  nuevo: {
    etiqueta: "Nuevo",
    Icono: UserPlus,
    variant: "secondary",
  },
  en_conversacion: {
    etiqueta: "En conversación",
    Icono: MessagesSquare,
    variant: "outline",
  },
  caliente: {
    etiqueta: "Caliente",
    Icono: Flame,
    variant: "outline",
    className: "border-primary/25 bg-primary/10 text-primary",
  },
  ganado: {
    etiqueta: "Ganado",
    Icono: Check,
    variant: "outline",
    className: "border-exito/25 bg-exito/10 text-exito",
  },
  perdido: {
    etiqueta: "Perdido",
    Icono: UserMinus,
    variant: "outline",
    className: "text-muted-foreground",
  },
};

function EstadoBadge({ estado }: { estado: EstadoContacto }) {
  const { etiqueta, Icono, variant, className } = ESTADOS[estado];
  return (
    <Badge variant={variant} className={className}>
      <Icono aria-hidden="true" />
      {etiqueta}
    </Badge>
  );
}

/** Para comparar teléfonos sin que molesten los espacios ni los guiones. */
function normalizarTelefono(valor: string): string {
  return valor.replace(/[\s-]/g, "").toLowerCase();
}

/**
 * Tabla de contactos con búsqueda client-side por nombre o teléfono.
 * Recibe las filas ya serializadas/formateadas desde el Server Component.
 */
export function TablaContactos({ filas }: { filas: ContactoFila[] }) {
  const [busqueda, setBusqueda] = useState("");

  const consulta = busqueda.trim().toLowerCase();
  const consultaTelefono = normalizarTelefono(consulta);
  const visibles = consulta
    ? filas.filter(
        (fila) =>
          fila.nombre.toLowerCase().includes(consulta) ||
          normalizarTelefono(fila.telefono).includes(consultaTelefono)
      )
    : filas;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          {/*
            Mismo blindaje que se le puso al buscador de chats antes de
            sacarlo: sin esto, en el teléfono el sistema ofrece el correo
            guardado y pide la huella al tocar el campo.
          */}
          <Input
            type="search"
            name="buscar-contacto"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="search"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            aria-label="Buscar contactos por nombre o teléfono"
            className="pl-8"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          Mostrando {visibles.length} de {filas.length} contactos
        </p>
      </div>

      {visibles.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              Ningún contacto coincide con “{busqueda.trim()}”. Probá con otro
              nombre o teléfono.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
        {/*
          En el teléfono, renglones apilados: la tabla de cinco columnas
          escondía estado y fecha detrás de un scroll lateral. Son los mismos
          datos y la misma búsqueda; solo cambia cómo se apilan.
        */}
        <ul className="divide-border/70 divide-y rounded-xl border lg:hidden">
          {visibles.map((fila) => (
            <li key={fila.id} className="flex flex-col gap-1.5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] leading-tight font-semibold">
                    {fila.nombre}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {fila.telefono}
                  </span>
                </div>
                <span className="shrink-0">
                  <EstadoBadge estado={fila.estado} />
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CanalBadge canal={fila.canal} />
                <span className="text-muted-foreground ml-auto text-xs">
                  Desde el {fila.fechaFormateada}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-lg border lg:block">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Primer contacto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((fila) => (
              <TableRow key={fila.id}>
                <TableCell className="font-medium">{fila.nombre}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                  {fila.telefono}
                </TableCell>
                <TableCell>
                  <CanalBadge canal={fila.canal} />
                </TableCell>
                <TableCell>{fila.fechaFormateada}</TableCell>
                <TableCell>
                  <EstadoBadge estado={fila.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
        </>
      )}
    </div>
  );
}
