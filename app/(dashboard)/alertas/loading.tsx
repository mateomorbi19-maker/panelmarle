import { Skeleton } from "@/components/ui/skeleton";
import { Seccion } from "@/components/seccion";

/** Skeleton de la página de alertas: header + subtítulo + tarjetas. */
export default function AlertasLoading() {
  return (
    <Seccion>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-5 w-24 rounded-4xl" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </Seccion>
  );
}
