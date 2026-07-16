import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton de la vista de integrantes: encabezado + tabla. */
export default function LoadingIntegrantes() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </>
  );
}
