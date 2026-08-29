import { Skeleton } from "@/components/ui/skeleton";
import { Seccion } from "@/components/seccion";

/** Skeleton del Inicio: espeja encabezado, 4 KPIs, 2 gráficos y la card de alertas. */
export default function InicioLoading() {
  return (
    <Seccion>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      <Skeleton className="h-72 rounded-xl" />
    </Seccion>
  );
}
