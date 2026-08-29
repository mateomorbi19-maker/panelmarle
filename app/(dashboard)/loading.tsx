import { Skeleton } from "@/components/ui/skeleton";

/** Espera de la lista de chats: buscador, filtros y renglones. */
export default function ChatsLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 border-b px-4 pt-3 pb-2">
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="flex gap-2 overflow-hidden">
          {[64, 88, 84, 148, 128].map((ancho, i) => (
            <Skeleton
              key={i}
              className="h-8 shrink-0 rounded-full"
              style={{ width: ancho }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-4 py-2.5">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-full max-w-64" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
