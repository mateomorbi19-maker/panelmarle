import { Skeleton } from "@/components/ui/skeleton";
import { Seccion } from "@/components/seccion";

/** Skeleton de Correcciones: header + tarjetas. */
export default function CorreccionesLoading() {
  return (
    <Seccion>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-5 w-28 rounded-4xl" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </Seccion>
  );
}
