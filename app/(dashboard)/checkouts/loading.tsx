import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton de la página de checkouts: encabezado + tabla. */
export default function CheckoutsLoading() {
  return (
    <>
      {/* Encabezado: título + descripción + badge del total */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-5 w-36 rounded-4xl" />
      </div>

      {/* Tabla: fila de encabezados + filas de datos */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </>
  );
}
