import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton de Contactos: encabezado + barra de búsqueda + tabla. */
export default function ContactosLoading() {
  return (
    <>
      {/* Encabezado de la sección */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Barra de búsqueda + contador */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-full sm:max-w-xs" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Tabla: encabezado + filas */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
